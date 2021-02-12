/* eslint-disable @typescript-eslint/no-explicit-any */
import { Command } from 'commander';
import fs from 'fs';
import got from 'got';
import jose, { JWK } from 'node-jose';
import pako from 'pako';
import QrCode from 'qrcode';
import issuerPrivateKeys from './config/issuer.jwks.private.json';

const ISSUER_URL = process.env.ISSUER_URL || 'https://smarthealth.cards/examples/issuer';

const exampleBundleUrls = [
  'http://build.fhir.org/ig/dvci/vaccine-credential-ig/branches/main/Bundle-Scenario1Bundle.json',
  'http://build.fhir.org/ig/dvci/vaccine-credential-ig/branches/main/Bundle-Scenario2Bundle.json',
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
  iat: number;
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
    const body = deflate ? pako.deflate(bodyString) : bodyString;

    const signed = await jose.JWS.createSign({ format: 'compact', fields }, this.signingKey)
      .update(Buffer.from(body))
      .final();
    return (signed as unknown) as string;
  }
}

async function toHealthCardPayload(bundleIn: Bundle) {
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
      }
      if (r.coding) {
        delete r.text;
      }
      // Address bug in hosted examples
      if (r.system === 'https://phinvads.cdc.gov/vads/ViewCodeSystem.action?id=2.16.840.1.113883.12.292') {
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

async function createHealthCardFile(fhirBundle: Bundle): Promise<Record<string, any>> {
  const signer = new Signer({ signingKey: await JWK.asKey(issuerPrivateKeys.keys[0]) });
  const signed = await signer.signJws({
    iss: ISSUER_URL,
    iat: new Date().getTime() / 1000,
    vc: {
      '@context': ['https://www.w3.org/2018/credentials/v1'],
      type: [
        'VerifiableCredential',
        'https://smarthealth.cards#health-card',
        'https://smarthealth.cards#immunization',
        'https://smarthealth.cards#covid19',
      ],
      credentialSubject: {
        fhirVersion: '4.0.1',
        fhirBundle,
      },
    },
  });
  return {
    verifiableCredential: [signed],
  };
}

const SMALLEST_B64_CHAR_CODE = 45; // "-".charCodeAt(0) === 45
const toNumericQr = (jws: string): string =>
  jws
    .split('')
    .map((c) => c.charCodeAt(0) - SMALLEST_B64_CHAR_CODE)
    .flatMap((c) => [Math.floor(c / 10), c % 10])
    .join('');

async function processExampleBundle(exampleBundleUrl: string) {
  const exampleBundleRetrieved = (await got(exampleBundleUrl).json()) as Bundle;
  const exampleBundleHealthCardPayload = await toHealthCardPayload(exampleBundleRetrieved);
  const exampleBundleHealthCardFile = await createHealthCardFile(exampleBundleHealthCardPayload);
  const exampleBundleHealthCardNumericQr = toNumericQr(exampleBundleHealthCardFile.verifiableCredential[0]);

  const exampleQrCode: string = await new Promise((resolve, reject) =>
    QrCode.toString(
      [{ data: exampleBundleHealthCardNumericQr, mode: 'numeric' }],
      { type: 'svg' },
      function (err: any, result: string) {
        if (err) return reject(err);
        resolve(result as string);
      },
    ),
  );

  return {
    payload: exampleBundleHealthCardPayload,
    file: exampleBundleHealthCardFile,
    qrNumeric: exampleBundleHealthCardNumericQr,
    qrSvg: exampleQrCode,
  };
}

async function generate(options: { outdir: string }) {
  const exampleIndex: string[][] = [];
  const writeExamples = exampleBundleUrls.map(async (url, i) => {
    const exNum = i.toLocaleString('en-US', {
      minimumIntegerDigits: 2,
      useGrouping: false,
    });
    const outputPrefix = `example-${exNum}-`;
    const example = await processExampleBundle(url);
    const fileA = `${outputPrefix}a-payload.json`;
    const fileB = `${outputPrefix}b-jws.txt`;
    const fileC = `${outputPrefix}c.smart-health.card`;
    const fileD = `${outputPrefix}d-qr-code-numeric.txt`;
    const fileE = `${outputPrefix}e-qr-code.svg`;

    fs.writeFileSync(`${options.outdir}/${fileA}`, JSON.stringify(example.payload));
    fs.writeFileSync(`${options.outdir}/${fileB}`, example.file.verifiableCredential[0]);
    fs.writeFileSync(`${options.outdir}/${fileC}`, JSON.stringify(example.file, null, 2));
    fs.writeFileSync(`${options.outdir}/${fileD}`, example.qrNumeric);
    fs.writeFileSync(`${options.outdir}/${fileE}`, example.qrSvg);

    const exampleEntry: string[] = [];
    exampleEntry.push(fileA);
    exampleEntry.push(fileB);
    exampleEntry.push(fileC);
    exampleEntry.push(fileD);
    exampleEntry.push(fileE);
    exampleIndex.push(exampleEntry);
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
