# Changelog

## 0.4.1

Added optional `x5c` in JWKS

## 0.3.1

Add optional `vcIndex` param on `$health-cards-issue` response's `resourceLink`

## 0.3.0

Rename `$HealthWallet.issueVc` to `$health-cards-issue`

## 0.2.0

Chunk-based QR representation of larger Health Cards (JWS > 1195 characters). Defines `shc:/<n>/<c>/` prefix, where `<n>` represents a chunk number and `<c>` represents the total chunk count.

## 0.1.1

Added `shc:/` prefix for QR representations.

## 0.1.0

Significant API overhaul to reduce scope and simplify dependencies. See [PR#64](https://github.com/smart-on-fhir/health-cards/pull/64) for details.

* Remove user DIDs from the picture. They were already optional, and in some of our most important flows unlikely to be available.

* Remove the need to bind an issuer to a holder ahead of time. SMART on FHIR clients can now call $HealthWallet.issueVc without having to call $HealthWallet.connect first

* Update $HealthWallet.issueVc response to use `valueString` (avoids the need for base64 encoding in the FHIR Parameters resource)

* Replace DID-based key discovery with hosted JSON Web Key. Establish the requirement that Issuers host `.well-known/jwks.json`

* Define requirements for keeping Health Cards' JWS representation small (small enough to fit in a QR code) -- including size limits and a method for splitting a Health Card into a Health Card Set when the size limit cannot be met

* Document process for embedding Health Cards in QR codes

* Update file extension and MIME type for representing Health Cards as downloadable files (`.smart-health-card` and `application/smart-health-card`)

* Remove SIOP flow For Verifier::Holder communications


## 0.0.12

Add optional `resourceLink` response parameter on `$HealthWallet.issueVc`

## 0.0.11

Change canonical domain to https://smarthealth.cards (from https://healthwallet.cards)


## 0.0.10

Add detail on how to recognize encryption keys, signing keys, and linked domains in a DID Document

## 0.0.9

Add discovery params to `.well-known/smart-configuration`, allowing SMART on FHIR servers to advertise Health Cards capabilities


## 0.0.8

* Clarify that `.fhir-backed-vc` files can contain JWS- or JWE-based VCs
* Update JWS signature algorithm to `ES256`

## 0.0.7

Simplify demographics recommendations with one uniform "minimum set"

## 0.0.6

Updated encryption to use `"alg": "ECDH-ES"` (with `"enc": "A256GCM"`)


## 0.0.5

Updated encryption to use `"enc": "A256GCM"`


## 0.0.4

* Added links to overview / intro video
* Updated SIOP request to identify requested credentials by type URL (`https://healthwallet.cards#covid19` instead of `health-wallet-covid19-card`)


## 0.0.3

* Update `.well-known` DID links and file URL to match latest spec

## 0.0.2

* Use `valueUri` (which exists in DSTU2+) for FHIR datatypes rather than `valueUrl` (which was introduced after DSTU2)
* Added `encryptForKeyId` parameter to `$HealthWallet.issueVc` operation, defaulting to absent == no encryption
* Updated example VC JWT representations to ensure that the `.vc.credentialSubject` contains all subject-specific claims
* Defined `OperationOutcome` payload for failed `$HealthWallet.issueVc` operations
