import jose from 'node-jose';
import crypto from 'crypto';
import canonicalize from 'canonicalize';

// revoked FHIR bundle, from revoked example
import revokedFhirBundle from './fixtures/revoked-bundle.json';

// hash-fhir method

console.log('hash-fhir method');
let canonicalized = canonicalize(revokedFhirBundle);
if (!canonicalized) {
  throw "Can't canonicalize JSON data";
}
let preimage = jose.util.base64url.encode(Buffer.from(canonicalized, 'utf-8'));
let digest = crypto.createHash('sha256').update(preimage).digest();
let truncatedDigest = digest.subarray(0, 8);
let rid = jose.util.base64url.encode(truncatedDigest);
console.log("rid: " + rid);
