- Feature Name: `legacy-shc-revocation`
- Start Date: 2021-12-03
- Status: Draft for comment
  
# Summary

Starting from specification v1.2.0, SMART Health Cards can be revoked using a revocation ID `rid` encoded in their Verifiable Credential object. Health Cards issued using an older specification version, or Health Cards issued without a revocation ID can use the following schemes to calculate a dynamic identifier from the Health Cards content. Issuers sets up their Card Revocation Lists as specified in the SMART Health Card Framework (including support for revocation time ranges), using the new specified method identifier.

# Revocation ID calculation methods

The following methods can be used by issuers to create their card revocation lists. Only one method can be used by issuer key (identified by an identifier `kid`), and the method identifier must be listed in the CRL's 'method' field. Adding a timestamp to revocation IDs and CRL updates work as specified in the core SHC framework.

Verifiers validating a SHC without a `rid` value for which the issuer key lists a `crlVersion` SHALL download the CRL and use the specified method to calculate and check the revocation status of the SHC.

## FHIR Bundle digest

Method identifier: `hash-fhir`

To use this scheme, an issuer needs to be able to recreate the FHIR bundle for the revoked Health Cards. Given a FHIR bundle, the revocation ID `rid` is computed as the base64url encoding of the first 64 bits of the SHA-256 digest of the base64url encoding of the UTF-8 encoding of the minified FHIR bundle; i.e., `rid = base64url(sha256(base64url(utf8(fhir)))[0..8])`.

### Example

The `rid` value `9q2bR-42Z30` is calculated from the following FHIR bundle (taken from the revoked FHIR bundle example (TODO: link from PR #205))
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

If this is not possible to recreate the exact FHIR bundle for a user (e.g., if the issuance system doesn't keep track of the issues health cards), multiple FHIR bundle “candidates” can be created (e.g., using the various immunization events), from which multiple revocation IDs are calculated and added to the revocation list.

This mechanism could allow a sophisticated attacker to brute force the data needed to match a published CRL entry. For `n` bit of entropy contained in the bundle (which varies depending on the issuer), `2^n` hash calculations are needed to match a CRL digest. An issuer should be comfortable with the disclosure risk before using this method.

## Patient resource digest

Method identifier: `hmac-patient`

To use this scheme, an issuer needs to be able to recreate the patient resource for the revoked Health Cards. The issuer creates a random 256-bit secret revocation key, that it privately shares with trusted verifiers. Given a FHIR patient resource, the revocation ID `rid` is computed as the base64url encoding of the first 64 bits of the HMAC-SHA-256 output of the base64url encoding of the UTF-8 encoding of the minified FHIR patient resource, using the issuer revocation secret; i.e., `rid = base64url(hmac-sha-256(secret, base64url(utf8(fhir)))[0..8])`.

Because of the low-entropy in a patient resources, publishing their hash digests is almost equivalent to publishing their content. Therefore, this method uses the HMAC message authentication code with SHA-256 and a secret key shared between the issuer and a set of trusted verifiers. This prevents brute-forcing the matching patient resources, but can only be used in closed systems where verifiers have a back-channel to the issuer.

### Example

The `rid` value `Xa1HLEWu4ao` is calculated using the HMAC-SHA-256 secret `2B_DhBnTyHCw-PEHs2KnYMtgjeEh5I0xq2tMHmLeurA` (that first needs to be base64url decoded) and the following patient FHIR resource:

```
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
```
