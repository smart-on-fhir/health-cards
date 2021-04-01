/* eslint-disable @typescript-eslint/no-explicit-any */
import { Command } from 'commander';
import fs from 'fs';
import got from 'got';
import jose, { JWK } from 'node-jose';
import pako from 'pako';
import QrCode, { QRCodeSegment } from 'qrcode';
import issuerPrivateKeys from './config/issuer.jwks.private.json';

const ISSUER_URL = process.env.ISSUER_URL || 'https://smarthealth.cards/examples/issuer';

interface BundleInfo {
  url: string;
  issuerIndex: number;
}

const exampleBundleInfo: BundleInfo[] = [
  {url: 'http://build.fhir.org/ig/dvci/vaccine-credential-ig/branches/main/Bundle-Scenario1Bundle.json', issuerIndex: 0},
  {url: 'http://build.fhir.org/ig/dvci/vaccine-credential-ig/branches/main/Bundle-Scenario2Bundle.json', issuerIndex: 2},
  {url: 'https://www.hl7.org/fhir/diagnosticreport-example-ghp.json', issuerIndex: 0}
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
  exp: number;
  vc: {
    type: string[];
    credentialSubject: {
      fhirVersion: string;
      fhirBundle: Record<string, unknown>;
    };
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

function createHealthCardJwsPayload(fhirBundle: Bundle, types: string[]): Record<string, unknown> {
  return {
    iss: ISSUER_URL,
    nbf: new Date().getTime() / 1000,
    vc: {
      '@context': ['https://www.w3.org/2018/credentials/v1'],
      type: [
        'VerifiableCredential',
        'https://smarthealth.cards#health-card',
        ...types
      ],
      credentialSubject: {
        fhirVersion: '4.0.1',
        fhirBundle,
      },
    },
  };
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

async function processExampleBundle(exampleBundleInfo: BundleInfo): Promise<{ fhirBundle: Bundle; payload: Record<string, unknown>; file: Record<string, any>; qrNumeric: string[]; qrSvgFiles: string[]; }> {
  let types = exampleBundleInfo.url.match("vaccine") ? [
    'https://smarthealth.cards#immunization',
    'https://smarthealth.cards#covid19',
  ] : [];

  const exampleBundleRetrieved = (await got(exampleBundleInfo.url).json()) as Bundle;
  const exampleBundleTrimmedForHealthCard = await trimBundleForHealthCard(exampleBundleRetrieved);
  const exampleJwsPayload = createHealthCardJwsPayload(exampleBundleTrimmedForHealthCard, types);
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

async function generate(options: { outdir: string }) {
  const exampleIndex: string[][] = [];
  const writeExamples = exampleBundleInfo.map(async (info, i) => {
    const exNum = i.toLocaleString('en-US', {
      minimumIntegerDigits: 2,
      useGrouping: false,
    });
    const outputPrefix = `example-${exNum}-`;
    const example = await processExampleBundle(info);
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

    const exampleEntry: string[] = [];

    exampleEntry.push(fileA);
    exampleEntry.push(fileB);
    exampleEntry.push(fileC);
    exampleEntry.push(fileD);
    exampleEntry.push(fileE);
    fileF.forEach(f => exampleEntry.push(f))
    fileG.forEach(f => exampleEntry.push(f))
    exampleIndex[i] = exampleEntry;
  });

  await Promise.all(writeExamples);
  fs.writeFileSync(
    `${options.outdir}/index.md`,
    '# Example Resources \n' +
    exampleIndex.map((e, i) => `## Example ${i}\n\n` + e.map((f) => `* [${f}](./${f})`).join('\n')).join('\n\n'),
  );
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
}
