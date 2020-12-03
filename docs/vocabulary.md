# Health Wallet Vocab

## Verifiable Credential (VC) Types

* `https://healthwallet.cards#covid19`: A VC designed to convey COVID-19 details
* `https://healthwallet.cards#immunization`: A VC designed to convey any immunization details
* `https://healthwallet.cards#presentation-context-online`: A VC designed for online presentation
* `https://healthwallet.cards#presentation-context-in-person`: A VC designed for in-person presentation

## FHIR Extensions

* `https://healthwallet.cards#vc-attachment`: Extension that decorates a FHIR "key resource" to attach a VC

## Canonical URLs

*  `https://healthwallet.cards`: Canonical URL for the SMART Health Cards Implementation Guide overall. Discoverable within a FHIR Server's CapabilityStatement, at `.implementationGuide`. A server advertising support for this IG must also support the operations described below.
*  `https://healthwallet.cards/OperationDefinition/HealthWallet.connect`: Canonical URL for the `$HealthWallet.connect` operation. Discoverable within a FHIR Server's CapabilityStatement, at `.rest.resource.where(type='Patient').operation.definition`
*  `https://healthwallet.cards/OperationDefinition/HealthWallet.issueVc`: Canonical URL for the `$HealthWallet.issueVc` operation. Discoverable within a FHIR Server's CapabilityStatement, at `.rest.resource.where(type='Patient').operation.definition`

## FHIR Codings

The following codes are defined in the `https://healthwallet.cards` system:

* `no-did-bound`: Used for `OperationOutcome.issue.code` when the `Patient/:id/$HealthWallet.issueVc` operation fails because no DID is bound to the Patient record
* `covid19`: Used for tagging a FHIR "key resource" as containing a VC of type `https://healthwallet.cards#covid19`. For use in tagging a FHIR "key resource" (in `.meta.tag`) as containing a specific type of VC. This facilitates search across FHIR resources to find resources with attached VCs.
* `immunization`: Used for tagging a FHIR "key resource" as containing a VC of type `https://healthwallet.cards#immunization`. For use in tagging a FHIR "key resource" (in `.meta.tag`) as containing a specific type of VC. This facilitates search across FHIR resources to find resources with attached VCs.

