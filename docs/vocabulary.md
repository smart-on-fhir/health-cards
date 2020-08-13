# Health Wallet Vocab

## Verifiable Credential (VC) Types

* `https://healthwallet.cards#covid19`: A VC designed to convey COVID-19 details
* `https://healthwallet.cards#immunization`: A VC designed to convey any immunization details
* `https://healthwallet.cards#presentation-context-online`: A VC designed for online presentation
* `https://healthwallet.cards#presentation-context-in-person`: A VC designed for in-person presentation

## FHIR Extensions

 * `https://healthwallet.cards#vc-attachment`: Extension that decorates a FHIR "key resource" to attach a VC

## FHIR Codings

The following codes are defined in the `https://healthwallet.cards` system, for use in tagging a FHIR "key resource" (in `.meta.tag`) as containing a specific type of VC. This facilitates search across FHIR resources to find resources with attached VCs.


* `covid19`: Used for tagging a FHIR "key resource" as containing a VC of type `https://healthwallet.cards#covid19`

* `immunization`: Used for tagging a FHIR "key resource" as containing a VC of type `https://healthwallet.cards#immunization`

* `no-did-bound`: Used for `OperationOutcome.issue.code` when the `Patient/:id/$HealthWallet.issueVc` operation fails because no DID is bound to the Patient record