/* eslint-disable @typescript-eslint/no-explicit-any */
import { Command } from 'commander';
import crypto from 'crypto';
import fs from 'fs';
import got from 'got';
import jose, { JWK } from 'node-jose';
import pako from 'pako';
import QrCode, { QRCodeSegment } from 'qrcode';
// this jwk set contains three keys:
//   0: an ECDSA key used to sign bundles 00, 02, and 03
//   1: an encryption key, unused
//   2: an ECDSA key with x5c field, used to sign bundle 01
import issuerPrivateKeys from './config/issuer.jwks.private.json';
import issuerRevocationHmacSecret from './config/issuer.hmac.private.json';  // should contain a "secret" of 256-bit of entropy to

const ISSUER_URL = process.env.ISSUER_URL || 'https://spec.smarthealth.cards/examples/issuer';

import CovidVaccinesFixture from './fixtures/covid-vaccines-bundle.json';
import DrFixture from './fixtures/dr-bundle.json';
import RevokedFixture from './fixtures/revoked-bundle.json'; // example of a card that will be revoked

interface BundleInfo {
  url?: string;
  fixture?: object,
  issuerIndex: number;
  types: string[];
  validityPeriodInSec?: number; // optional validity period to add to the nbf value to create an exp value
  title: string;
  description?: string;
}

// set of issuer indices (identifying kids) supporting the revocation feature, only one currently
const issuerSupportingRevocation = new Set([0]);

const exampleBundleInfo: BundleInfo[] = [
  {fixture: CovidVaccinesFixture, issuerIndex: 0, types: [
    'https://smarthealth.cards#immunization',
  ],
  title: "Three COVID-19 Vaccine Doses"},
  {fixture: CovidVaccinesFixture, issuerIndex: 2, types: [
    'https://smarthealth.cards#immunization',
  ],
  title: "Three COVID-19 Vaccine Doses",
  description: "Signed with an issuer key that includes `x5c` claim. Useful for testing code paths that rely on an X.509-based trust framework."
},
  {fixture: DrFixture, issuerIndex: 0, types: [],
    title: "Multi-QR Testing Payload",
    description: "Large payload with no particular clinical semantics. Useful for testing code paths where the JWS is too large to fit in a single QR."

  },
  {fixture: RevokedFixture, issuerIndex: 0, types: ['https://smarthealth.cards#immunization'], validityPeriodInSec: 60 * 60 * 24 * 365,
  title: "Revoked COVID-19 Credential",
  description: "Useful for testing code paths that evaluate the revocation status of a JWS."}
];

interface Bundle {
  id?: string;
  meta?: Record<string, unknown>;
  entry: {
    fullUrl: string;
    resource: {
      meta?: Record<string, unknown>;
      id?: string;
      [k: string]: unknown;
    };
  }[];
}

interface StringMap {
  [k: string]: string;
}

export interface HealthCard {
  iss: string;
  nbf: number;
  exp?: number;
  vc: {
    type: string[];
    credentialSubject: {
      fhirVersion: string;
      fhirBundle: Bundle;
    };
    rid?: string;
  };
}

export class Signer {
  public keyStore: jose.JWK.KeyStore;
  public signingKey: JWK.Key;

  constructor({ keyStore, signingKey }: { signingKey: JWK.Key; keyStore?: JWK.KeyStore }) {
    this.keyStore = keyStore || jose.JWK.createKeyStore();
    this.signingKey = signingKey;
  }

  async signJws(idTokenPayload: Record<string, unknown>, deflate = true): Promise<string> {
    const bodyString = JSON.stringify(idTokenPayload);

    const fields = deflate ? { zip: 'DEF' } : {};
    const body = deflate ? pako.deflateRaw(bodyString) : bodyString;

    const signed = await jose.JWS.createSign({ format: 'compact', fields }, this.signingKey)
      .update(Buffer.from(body))
      .final();
    return (signed as unknown) as string;
  }
}

async function trimBundleForHealthCard(bundleIn: Bundle) {
  const bundle: Bundle = JSON.parse(JSON.stringify(bundleIn)) as Bundle;
  delete bundle.id;
  delete bundle.meta;

  const resourceUrlMap: StringMap = bundle.entry
    .map((e, i) => [e.fullUrl.split('/').slice(-2).join('/'), `resource:${i}`])
    .reduce((acc: StringMap, [a, b]) => {
      acc[a] = b;
      return acc;
    }, {});

  delete bundle.id;
  bundle.entry.forEach((e) => {
    e.fullUrl = resourceUrlMap[e.fullUrl.split('/').slice(-2).join('/')];
    function clean(r: any, path: string[] = ['Resource']) {

      if (r.resourceType === 'Patient') {
        // TODO remove these `delete`s once sample bundles are aligned
        // with the "name + DOB" profiling guidance
        delete r.telecom;
        delete r.communication;
        delete r.address;
      }

      if (path.length === 1) {
        delete r.id;
        delete r.meta;
        delete r.text;
      }
      if (resourceUrlMap[r.reference]) {
        r.reference = resourceUrlMap[r.reference];
      } else if (r?.reference?.startsWith("Patient")) {
        //TODO remove this branch when DVCI bundles are fixed
        r.reference = 'resource:0'
      }
      if (r.coding) {
        delete r.text;
      }
      if (r.system === 'http://hl7.org/fhir/sid/cvx-TEMPORARY-CODE-SYSTEM') {
        r.system = 'http://hl7.org/fhir/sid/cvx';
      }
      if (r.system && r.code) {
        delete r.display;
      }
      if (Array.isArray(r)) {
        r.forEach((e) => clean(e, path));
      } else if (r !== null && typeof r === 'object') {
        Object.keys(r).forEach((k) => clean(r[k], [...path, k]));
      }
    }
    clean(e.resource);
  });

  return bundle;
}

function calculateRid(userId: string, keyIndex: number): string {
  // rid = base64url(hmac-sha-256(secret_key || <<kid>>, userId)[1..64]), as suggested by the spec
  const digest = crypto.createHmac('sha256', issuerRevocationHmacSecret.secret + issuerPrivateKeys.keys[keyIndex].kid).update(userId).digest();
  const truncatedHmacValue = digest.subarray(0, 8); // keep only 8 bytes (64 bits)
  const rid = jose.util.base64url.encode(truncatedHmacValue);
  return rid;
}

function createHealthCardJwsPayload(fhirBundle: Bundle, types: string[], userId: string, keyIndex: number = 0, validityPeriodInSec?: number): Record<string, unknown> {
  let payload:HealthCard = {
    iss: ISSUER_URL,
    nbf: new Date().getTime() / 1000,
    vc: {
      type: [
        'https://smarthealth.cards#health-card',
        ...types
      ],
      credentialSubject: {
        fhirVersion: '4.0.1',
        fhirBundle,
      },
    },
  };
  if (issuerSupportingRevocation.has(keyIndex)) {
    payload.vc.rid = calculateRid(userId, keyIndex);
  }
  if (validityPeriodInSec) {
    payload.exp = payload.nbf + validityPeriodInSec;
  }
  return payload as unknown as Record<string, unknown>;
}

const MAX_SINGLE_JWS_SIZE = 1195;
const MAX_CHUNK_SIZE = 1191;
const splitJwsIntoChunks = (jws: string): string[] => {
  if (jws.length <= MAX_SINGLE_JWS_SIZE) {
    return [jws];
  }

  // Try to split the chunks into roughly equal sizes.
  const chunkCount = Math.ceil(jws.length / MAX_CHUNK_SIZE);
  const chunkSize = Math.ceil(jws.length / chunkCount);
  const chunks = jws.match(new RegExp(`.{1,${chunkSize}}`, 'g'));
  return chunks || [];
}

async function createHealthCardFile(jwsPayload: Record<string, unknown>, keyIndex: number = 0): Promise<Record<string, any>> {
  const signer = new Signer({ signingKey: await JWK.asKey(issuerPrivateKeys.keys[keyIndex]) });
  const signed = await signer.signJws(jwsPayload);
  return {
    verifiableCredential: [signed],
  };
}

const SMALLEST_B64_CHAR_CODE = 45; // "-".charCodeAt(0) === 45
const toNumericQr = (jws: string, chunkIndex: number, totalChunks: number): QRCodeSegment[] => [
  { data: 'shc:/' + ((totalChunks > 1) ? `${chunkIndex + 1}/${totalChunks}/` : ``), mode: 'byte' },
  {
    data: jws
      .split('')
      .map((c) => c.charCodeAt(0) - SMALLEST_B64_CHAR_CODE)
      .flatMap((c) => [Math.floor(c / 10), c % 10])
      .join(''),
    mode: 'numeric',
  },
];

async function processExampleBundle(exampleBundleInfo: BundleInfo, userId:string): Promise<{ fhirBundle: Bundle; payload: Record<string, unknown>; file: Record<string, any>; qrNumeric: string[]; qrSvgFiles: string[]; }> {
  let types = exampleBundleInfo.types;

  const exampleBundleRetrieved = exampleBundleInfo.fixture as Bundle ?? (await got(exampleBundleInfo.url!).json()) as Bundle;
  const exampleBundleTrimmedForHealthCard = await trimBundleForHealthCard(exampleBundleRetrieved);
  const exampleJwsPayload = createHealthCardJwsPayload(exampleBundleTrimmedForHealthCard, types, userId, exampleBundleInfo.issuerIndex, exampleBundleInfo.validityPeriodInSec);
  const exampleBundleHealthCardFile = await createHealthCardFile(exampleJwsPayload, exampleBundleInfo.issuerIndex);

  const jws = exampleBundleHealthCardFile.verifiableCredential[0] as string;
  const jwsChunks = splitJwsIntoChunks(jws);
  const qrSet = jwsChunks.map((c, i, chunks) => toNumericQr(c, i, chunks.length));
  const exampleBundleHealthCardNumericQr = qrSet.map(qr => qr.map(({ data }) => data).join(''));

  const exampleQrCodes: string[] = await Promise.all(
    qrSet.map((qrSegments): Promise<string> => new Promise((resolve, reject) =>
      QrCode.toString(qrSegments, { type: 'svg', errorCorrectionLevel: 'low' }, function (err: any, result: string) {
        if (err) return reject(err);
        resolve(result as string);
      })
    )));

  return {
    fhirBundle: exampleBundleTrimmedForHealthCard,
    payload: exampleJwsPayload,
    file: exampleBundleHealthCardFile,
    qrNumeric: exampleBundleHealthCardNumericQr,
    qrSvgFiles: exampleQrCodes,
  };
}

const iToDoubleDigit = (i: number) => i.toLocaleString('en-US', {
  minimumIntegerDigits: 2,
  useGrouping: false,
});

interface ExampleOutput {
  source: BundleInfo,
  files: string[]
}

async function generate(options: { outdir: string }) {
  const exampleIndex: ExampleOutput[] = [];
  const writeExamples = exampleBundleInfo.map(async (info, i) => {
    const exNum = iToDoubleDigit(i);
    const outputPrefix = `example-${exNum}-`;
    const example = await processExampleBundle(info, `userid-${exNum}`);
    const fileA = `${outputPrefix}a-fhirBundle.json`;
    const fileB = `${outputPrefix}b-jws-payload-expanded.json`;
    const fileC = `${outputPrefix}c-jws-payload-minified.json`;
    const fileD = `${outputPrefix}d-jws.txt`;
    const fileE = `${outputPrefix}e-file.smart-health-card`;

    const fileF = example.qrNumeric.map((qr, i) => `${outputPrefix}f-qr-code-numeric-value-${i}.txt`);
    const fileG = example.qrSvgFiles.map((qr, i) => `${outputPrefix}g-qr-code-${i}.svg`);

    fs.writeFileSync(`${options.outdir}/${fileA}`, JSON.stringify(example.fhirBundle, null, 2));
    fs.writeFileSync(`${options.outdir}/${fileB}`, JSON.stringify(example.payload, null, 2));
    fs.writeFileSync(`${options.outdir}/${fileC}`, JSON.stringify(example.payload));
    fs.writeFileSync(`${options.outdir}/${fileD}`, example.file.verifiableCredential[0]);
    fs.writeFileSync(`${options.outdir}/${fileE}`, JSON.stringify(example.file, null, 2));
    example.qrNumeric.forEach((qr, i) => {
      fs.writeFileSync(`${options.outdir}/${fileF[i]}`, qr);
    });

    example.qrSvgFiles.forEach((qr, i) => {
      fs.writeFileSync(`${options.outdir}/${fileG[i]}`, qr);
    });

    const exampleEntry: ExampleOutput = {source: info, files: []};

    exampleEntry.files.push(fileA);
    exampleEntry.files.push(fileB);
    exampleEntry.files.push(fileC);
    exampleEntry.files.push(fileD);
    exampleEntry.files.push(fileE);
    fileF.forEach(f => exampleEntry.files.push(f))
    fileG.forEach(f => exampleEntry.files.push(f))
    exampleIndex[i] = exampleEntry;
  });

  await Promise.all(writeExamples);
  fs.writeFileSync(
    `${options.outdir}/index.md`,
    '# Example Resources \n' +
    exampleIndex.map((e, i) => `## Example ${i}: ${e.source.title}\n\n${e.source.description ?? ""}\n\n` + e.files.map((f) => `* [${f}](./${f})`).join('\n')).join('\n\n'),
  );
}

async function generateCrl() {
  // create a Card Revocation List (for the issuer of the revoked card example)
  const exampleIndex = 3;
  // revocation time (to be appended to some revocation IDs)
  const revocationTime = (new Date().getTime() / 1000).toFixed(0);

  // we revoke the userID of the first example card, along with some fake userIds
  const rids = ['userid-'+iToDoubleDigit(exampleIndex),'fake-userid-1','fake-userid-2','fake-userid-3'].map((id,i) => {
    let rid = calculateRid(id, exampleBundleInfo[exampleIndex].issuerIndex);
    // append a timestamp to every other entry
    return (i % 2) ? rid : rid + "." + revocationTime;
  });
  const crl = {
    kid: issuerPrivateKeys.keys[exampleBundleInfo[exampleIndex].issuerIndex].kid,
    method: "rid",
    ctr: 1, // make sure update to this value is reflected in the corresponding public key's crlVersion field (in issuer/.well-known/jwks.json)
    rids: rids
  }
  fs.writeFileSync(`issuer/.well-known/crl/${crl.kid}.json`, JSON.stringify(crl, null, 2));
}

const program = new Command();
program.option('-o, --outdir <outdir>', 'output directory');
program.parse(process.argv);

interface Options {
  outdir: string;
}

const options = program.opts() as Options;
console.log('Opts', options);

if (options.outdir) {
  generate(options);
  generateCrl();
}
