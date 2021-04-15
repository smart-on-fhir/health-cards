# Verifiable Clinical Information in FHIR

This document describes how clinical information, modeled in [FHIR][], can be presented in a form based on [W3C Verifiable Credentials][vc] (VC).

## Content Definition

Any time we want to present verifiable clinical information, we must first make some use-case-specific decisions:

1. Define a set of required and optional **FHIR content resources** (e.g., `Immunization` or `Observation`) that must be packaged and presented together
2. Decide how to bind these FHIR content resources to a person's external identity, via **FHIR identity resources** (e.g., `Patient`)

Once we make these decisions, we can construct a VC with a **credential subject** as follows:

* `credentialSubject` with these top level elements:
    * `fhirVersion`: a string representation of the semantic FHIR version the content is represented in (e.g. `1.0.*` for DSTU2, `4.0.*` for R4, where `*` is a number, not a literal asterisk)
    * `fhirBundle`: a FHIR `Bundle` resource of type "collection" that includes all required FHIR resources (content + identity resources)

Resulting payload for the `"credentialSubject"`:

```js
{
  "...",
  "fhirVersion": "4.0.1",
  "fhirBundle": {
    "resourceType": "Bundle",
    "type": "collection",
    "entry": [
      "..."
    ]
}
```

> Below we focus on the Health Card use case, but the same approach to forming VCs out of FHIR can be applied to other use cases, too.

## Modeling a "Health Card"

A "Health Card" is a VC that conveys results about one discrete topic -- **in this example, a COVID-19 immunization card**, encompassing details about doses given. Other cards could convey details of a RT-PCR test for COVID-19, a clinical diagnosis of COVID-19, TDAP vaccination, and so on.

According to the procedure above, we start with decisions about FHIR content resources and identity resources:

* Which **FHIR content resources** need to be conveyed in a package? For the immunization example, we'd need:
    * `Immunization` with details about a first dose (product, date of administration, and administering provider)
    * `Immunization` with details about a second dose (product, date of administration, and administering provider)

* What **FHIR identity resources** do we need to bind the FHIR content resources to an external identity system? We might eventually define use-case-specific requirements, but we want to start with on recommended set of data elements for inclusion using the FHIR `Patient` resource. Resources MAY include an overall "level of assurance" indicating whether these demographic elements have been verified.

    * Best practices
        * Verifiers should not store identity data conveyed via VC, and should delete data as soon as they are no longer needed for verification purposes
        * Verifiers should not expect all elements in the VC to exactly match their own records, but can still use elements conveyed in the VC.


## Mapping into the W3C VC Data Model

To create a structure matching the W3C Verifiable Credential [JSON-LD Syntax](https://www.w3.org/TR/vc-data-model/#json-ld) from a SMART Health Card JWS:

1. De-compress the JWS payload

2. Add to the `.vc` object:

   ```
   "@context": [
     "https://www.w3.org/2018/credentials/v1",
     {
       "@vocab": "https://smarthealth.cards#",
       "fhirBundle": {
         "@id": "https://smarthealth.cards#fhirBundle",
         "@type": "@json"
       }
     }
   ]
   ```

3. Prepend to the `.vc.type` array: `"VerifiableCredential"`

4. Process the payload according to [JWT Decoding Rules](https://www.w3.org/TR/vc-data-model/#jwt-decoding)

### Health Card Examples

* [Example VC payloads](https://smarthealth.cards/examples/)

[vc]: https://w3c.github.io/vc-data-model/
[fhir]: https://hl7.org/fhir


