# Changelog

## 0.0.8

Add discovery params to `.well-known/smart-configuration`, allowing SMART on FHIR servers to advertise Health Cards capabilities

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
