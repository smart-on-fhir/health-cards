
# Modeling W3C Verifiable Credentials in FHIR

This document describes how healthcare data, modeled in [FHIR][], can be presented in the form of a [W3C Verifiable Credential][vc] (VC).

## Content Definition

Any time we want to present healthcare data in the form of a VC, we must first make some use-case-specific decisions:

1. Define a set of required and optional **FHIR content resources** (e.g., `Immunization` or `Observation`) that must be packaged and presented together
2. Decide how to bind these FHIR content resources to a person's external identity, via **FHIR identity resources** (e.g., `Patient`)

Once we make these decisions, we can construct a VC with a **credential subject** as follows:

* `credentialSubject` with these top level elements:
    * `fhirVersion`: a string representation of the semantic FHIR version the content is represented in (e.g. `1.0.*` for DSTU2, `4.0.*` for R4, where `*` is a number, not a literal asterisk)
    * `fhirBundle`: a FHIR `Bundle` resource of type "collection" that includes all required FHIR resources (content + identity resources)

Resulting payload structure:

```json
{
  "@context": ["https://www.w3.org/2018/credentials/v1"],
  ...
  "credentialSubject": {
    "fhirVersion": "4.0.1",
    "fhirBundle": {
      "resourceType": "Bundle",
      "type": "collection",
      "entry": [
        ...
      ]
    }
  }
}
```

> Below we focus on the Health Card use case, but the same approach to forming VCs out of FHIR can be applied to other use cases, too.

## Modeling a "Health Card"

A "Health Card" is a VC that conveys results about one discrete condition -- **in this case a single COVID-19 serology study**, encompassing IgG and IgM detection. Other cards could convey details of a RT-PCR test for COVID-19, a clinical diagnosis of COVID-19, TDAP vaccination, and so on.

According to the procedure above, we start with decisions about FHIR content resources and identity resources:

* Which **FHIR content resources** need to be conveyed in a package? For the diagnostic results, we need:
    * `Observation` with effectiveTime and a COVID-19 IgM result
    * `Observation` with effectiveTime and a COVID-19 IgG result
    * `DiagnosticReport` from COVID-19 testing, that conveys an overall conclusion (optional)

* What **FHIR identity resources** do we need to bind the FHIR content resources to an external identity system? We should support two presentation contexts:
    * For **Online Presentation**, we expect that the consumer will present the VC to an organization that has a pre-existing relationship with the consumer, so it's sufficient to bind the VC to a real-world name and verified phone number:
        * `Patient` with name and phone number
        * (possibly) `Patient` with alternate sets of attributes for other use-cases
    * For **In-person Presentation**, we expect that the consumer will present the VC at an in-person interaction alongside a physical photo ID, so it's sufficient to bind the VC to a facial image that matches the consumer's physical photo ID
        * `Patient` with name and a photo of sufficient size and quality

Since we need to support two presentation contexts, **we'll need to generate two VCs** (one per presentation context), so the consumer can share the appropriate VC for any given context.

### Health Card Examples

* [Example VC in expanded form](https://github.com/microsoft-healthcare-madison/did-siop-vc/blob/master/src/fixtures/vc.json)
* [JWT representation](https://github.com/microsoft-healthcare-madison/health-wallet-demo/blob/master/src/fixtures/vc-jwt-payload.json)

[vc]: https://w3c.github.io/vc-data-model/
[fhir]: https://hl7.org/fhir

