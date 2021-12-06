import jose from 'node-jose';
import crypto from 'crypto';
import canonicalize from 'canonicalize';

// revoked FHIR bundle, from revoked example
// TODO: get this from fixture once PR#205 is merged 
const revokedFhirBundle = `
{
  "resourceType": "Bundle",
  "type": "collection",
  "entry": [
    {
      "fullUrl": "resource:0",
      "resource": {
        "resourceType": "Patient",
        "name": [
          {
            "family": "Revoked",
            "given": [
              "Johnny"
            ]
          }
        ],
        "birthDate": "1960-04-22"
      }
    },
    {
      "fullUrl": "resource:1",
      "resource": {
        "resourceType": "Immunization",
        "status": "completed",
        "vaccineCode": {
          "coding": [
            {
              "system": "http://hl7.org/fhir/sid/cvx",
              "code": "207"
            }
          ]
        },
        "patient": {
          "reference": "resource:0"
        },
        "occurrenceDateTime": "2021-03-01",
        "performer": [
          {
            "actor": {
              "display": "ABC General Hospital"
            }
          }
        ],
        "lotNumber": "0000003"
      }
    },
    {
      "fullUrl": "resource:2",
      "resource": {
        "resourceType": "Immunization",
        "status": "completed",
        "vaccineCode": {
          "coding": [
            {
              "system": "http://hl7.org/fhir/sid/cvx",
              "code": "207"
            }
          ]
        },
        "patient": {
          "reference": "resource:0"
        },
        "occurrenceDateTime": "2021-03-29",
        "performer": [
          {
            "actor": {
              "display": "ABC General Hospital"
            }
          }
        ],
        "lotNumber": "0000009"
      }
    }
  ]
}
`;


// hash-fhir method

console.log('hash-fhir method');
let canonicalized = canonicalize(JSON.parse(revokedFhirBundle));
if (!canonicalized) {
  throw "Can't canonicalize JSON data";
}
let preimage = jose.util.base64url.encode(Buffer.from(canonicalized, 'utf-8'));
let digest = crypto.createHash('sha256').update(preimage).digest();
let truncatedDigest = digest.subarray(0, 8);
let rid = jose.util.base64url.encode(truncatedDigest);
console.log("rid: " + rid);

console.log('\n');

// hmac-patient

// patient resource from FHIR bundle above
const revokedPatient = `
{
  "fullUrl": "resource:0",
  "resource": {
    "resourceType": "Patient",
    "name": [
      {
        "family": "Revoked",
        "given": [
          "Johnny"
        ]
      }
    ],
    "birthDate": "1960-04-22"
  }
}
`;

// base64url encoding of the first 64 bits of the HMAC-SHA-256 output of the base64url encoding of the UTF-8 encoding of the minified FHIR patient resource, using the issuer revocation key.
console.log('hash-fhir method');
const secret = '2B_DhBnTyHCw-PEHs2KnYMtgjeEh5I0xq2tMHmLeurA';
console.log("base64url-encoded secret: " + secret);
canonicalized = canonicalize(JSON.parse(revokedPatient));
if (!canonicalized) {
  throw "Can't canonicalize JSON data";
}
preimage = jose.util.base64url.encode(Buffer.from(canonicalized, 'utf-8'));
digest = crypto.createHmac('sha256', jose.util.base64url.decode(secret)).update(preimage).digest();
truncatedDigest = digest.subarray(0, 8);
rid = jose.util.base64url.encode(truncatedDigest);
console.log("rid: " + rid);
