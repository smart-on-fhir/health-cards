# Changelog

## 0.0.3

* Update `.well-known` DID links and file URL to match latest spec

## 0.0.2

* Use `valueUri` (which exists in DSTU2+) for FHIR datatypes rather than `valueUrl` (which was introduced after DSTU2)
* Added `encryptForKeyId` parameter to `$HealthWallet.issueVc` operation, defaulting to absent == no encryption
* Updated example VC JWT representations to ensure that the `.vc.credentialSubject` contains all subject-specific claims
* Defined `OperationOutcome` payload for failed `$HealthWallet.issueVc` operations
