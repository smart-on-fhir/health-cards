# Health Wallet Vocab

## Verifiable Credential (VC) Types

* `https://smarthealth.cards#covid19`: A VC designed to convey COVID-19 details
* `https://smarthealth.cards#immunization`: A VC designed to convey any immunization details
* `https://smarthealth.cards#presentation-context-online`: A VC designed for online presentation
* `https://smarthealth.cards#presentation-context-in-person`: A VC designed for in-person presentation

## FHIR Extensions

* `https://smarthealth.cards#vc-attachment`: Extension that decorates a FHIR "key resource" to attach a VC


## FHIR Codings

The following codes are defined in the `https://smarthealth.cards` system:

* `did-not-connected`: Used for `OperationOutcome.issue.code` when the `Patient/:id/$HealthWallet.issueVc` operation fails because the supplied `holderDid` does not contain a user DID currently bound to the user's account (e.g., through successful completion of the `$HealthWallet.connect` flow)
* `covid19`: Used for tagging a FHIR "key resource" as containing a VC of type `https://smarthealth.cards#covid19`. For use in tagging a FHIR "key resource" (in `.meta.tag`) as containing a specific type of VC. This facilitates search across FHIR resources to find resources with attached VCs.
* `immunization`: Used for tagging a FHIR "key resource" as containing a VC of type `https://smarthealth.cards#immunization`. For use in tagging a FHIR "key resource" (in `.meta.tag`) as containing a specific type of VC. This facilitates search across FHIR resources to find resources with attached VCs.

