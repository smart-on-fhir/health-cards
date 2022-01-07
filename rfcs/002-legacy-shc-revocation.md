- Feature Name: `legacy-shc-revocation`
- Start Date: 2022-01-06
- Status: Draft for comment
  
# Summary

Starting from specification v1.2.0, SMART Health Cards (SHC) can be revoked using a revocation ID `rid` encoded in their Verifiable Credential object. SHCs issued using an older specification version, or SHCs issued without a revocation ID can use the following scheme to calculate a dynamic identifier from their content. Issuers sets up their Card Revocation Lists (CRL) as specified in the SMART Health Card Framework (including support for revocation timestamps), using the method identifier `hash-fhir` encoded in the CRL's `method` field. Note that only one method can be used for each Issuer key (identified by an identifier `kid`), in other words, all SHCs issued under a `kid` SHALL use the same revocation method.

Verifiers validating a SHC without a `rid` value for which the issuer key lists a `crlVersion` SHALL download the CRL and use the specified method to calculate and check the revocation status of the SHC.

## FHIR Bundle digest

Method identifier: `hash-fhir`

To use this scheme, an Issuer needs to be able to recreate the FHIR bundle for the revoked SHCs. Given a FHIR bundle, the revocation ID `rid` is computed as the base64url encoding of the first 64 bits of the SHA-256 digest of the base64url encoding of the UTF-8 encoding of the canonicalized FHIR bundle following the rules of [RFC 8785](https://datatracker.ietf.org/doc/html/rfc8785), as illutrated by the following pseudocode.

```javascript
const revokedFhirBundle = ... // a JSON object
let canonicalized = canonicalize(revokedFhirBundle);
let preimage = base64url.encode(Buffer.from(canonicalized, 'utf-8'));
let digest = crypto.createHash('sha256').update(preimage).digest();
let truncatedDigest = digest.subarray(0, 8);
let rid = base64url.encode(truncatedDigest);
```

### Example

The `rid` value `JuTJHwXo2Yc` is calculated from the following FHIR bundle (taken from the [revoked FHIR bundle example](https://spec.smarthealth.cards/examples/example-03-a-fhirBundle.json))
```
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
```

### Deployment considerations

If this is not possible to recreate the exact FHIR bundle for a user (e.g., if the issuance system doesn't keep track of the issues SHCs), multiple FHIR bundle “candidates” can be created (e.g., using the various immunization events), from which multiple revocation IDs are calculated and added to the revocation list.

This mechanism could allow a sophisticated attacker to brute force the data needed to match a published CRL entry. For `n` bit of entropy contained in the bundle (which varies depending on the issuer), `2^n` hash calculations are needed to match a CRL digest. An issuer should be comfortable with the disclosure risk before using this method.
