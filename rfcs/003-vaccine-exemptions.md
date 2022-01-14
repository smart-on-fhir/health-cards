- Feature Name: `vaccine-exemptions`
- Start Date: 2022-01-13
- Status: Draft for comment

# Summary

SMART Health Cards has focused on sharing "immutable clinical facts" like the record of a specific vaccine dose or lab result. Our data models have been designed to balance information content (i.e., details that a verifier needs in order to make a decision) with user privacy (i.e., to avoid over-sharing, and to avoid sharing sensitive information).

Beyond simply requiring proof of vaccination or lab results, some jurisdictions are developing policies that assign an "exemption" status to individuals who can't or shouldn't or otherwise won't receive a vaccine. There is interest in developing an interoperable way to share these exemption details with verifiers. This doc describes design considerations and provides a technical roadmap.

* :arrow_right: a key policy consideration for jurisdictions considering Vaccine Exemptions
* :bulb: a technical design recommendation for SMART Health Cards deployments that want to model Vaccine Exemptions

:warning: **Conveying "exemption status" is beyond the SMART Health Cards design intent.** On the other hand, conveying the clinical (or other relevant) facts behind an exemption raises significant privacy concern. If jurisdictions intend to move ahead in this space, VCI has developed a set of policy and technical considerations.

### Understanding exemptions

#### *Exempt* from vaccination vs "simply not vaccinated"?
Vaccination policies vary widely by jurisdiction. Exemption policies will vary even more widely. A key policy question is whether an "exempt" individual is treated differently from an otherwise-unvaccinated individual. For example, does a "vaccine exempt" individual have more lenient testing or quarantine requirements (compared with an otherwise-unvaccinated individual) upon arrival at a travel destination? In real-world travel use cases, the answer has been predominantly "no" (with a strong basis in public health and risk mitigation, when "exempt" does not imply lower-risk).

:arrow_right: For international travel, an interoperable approach to exemptions may not be needed.

#### Exempt *because of* an allergy vs behavioral problem vs participation in research...?

In jurisdictions designing exemption policies, there are various potential reasons for an exemption. A key policy question is whether an individual is treated differently based on the *nature* of the exemption. For example, a jurisdiction might provide exemptions for reasons as diverse as:

* Life-threatening allergic reaction to COVID vaccine
* Behavorial problems that make vaccination difficult
* Participation in a research trial where an experimental vaccine may have already been given
* Membership in a religious community that does not permit vaccination
* *(etc, etc)*

Current draft policies do not differentiate treatment by exemption reason, meaning that the only thing a verifier needs to know is "does this individual have some exemption".

:arrow_right: Within a jurisdiction, conveying an "is-exempt" status suffices (no specifics required).


### Preserving privacy: why treat exemptions differently?

The data associated with a COVID-19 vaccine or lab results are relatively well-understood and generally non-sensitive in the context of a global pandemic response. So for vaccine and lab result verification, SMART Health Cards mitigates the challenge of managing different policies in different jurisdictions by conveying the raw *inputs* to these policies (e.g., "negative COVID PCR test on 2021-10-08"), rather than high-level conclusions (e.g., "is save to travel until 2021-10-10"). Even so, VCI has been very careful to produce data models that minimize the information shared in a SMART Health Card vaccine or lab result. The flexibility gained by sharing "raw" inputs in non-privacy-sensitive domains like COVID-19 vaccines lab results is a good trade-off. 

When it comes to exemptions, the privacy analysis is much more challenging: some reasons for an exemption may be quite sensitive and outside the scope of information generally shared in the context of everyday life. Public health policy should not put individuals in a situation where they are asked to share information about their behavior problems, religious affiliation, research participation (etc) in the course of everyday life.

*Note: It doesn't help to use an "unpublished data dictionary" with opaque codes for the different exemption reasons; the community will (and should!) tear apart their QRs, compare them, and reverse engineer the data dictionary in short order.*

:bulb: SMART Health Cards should represent exemptions as a broad category, rather than naming the specific condition that is the cause for an exemption.

 
### Managing exemption policies that can change over time

One challenge of managing exemption policies is that they will evolve over time, and may evolve differently in different jurisdictions. A helpful approach here is to have specific policy identifiers (URLs) so policies can be versioned and can evolve over time.

:arrow_right: To promote reuse and streamline workflows, policies should be aggregated at the highest level possible. National-level exemption policies are a good near-term target in places where vaccine exemptions are an important part of the verification workflow.

Whatever the level of policy aggregation, an Exemption represented in a SMART Health Card should be able to point at the policy behind it.

:bulb: SMART Health Cards should represent exemptions by reference to a versioned or dated policy document that's openly published on the web in human-readable form.

Unlike vaccination and testing results (where the clinical data includes effective dates that a verifier can use in evaluating a person against published criteria such as a definition of "fully vaccinated" or "recently tested"), exemptions are by nature variable. Some are short-lived and some are long-lived, and you don't always know how long-lived -- e.g.

* "allergic to all COVID-19 vaccines" may change when new vaccines are introduced into the market
* "participating in a research study" may change when a participant withdraws, or when  the study ends

:arrow_right: To allow for policy revisions, any exemptions issued should be time-limited, and the duration should be based on the use case driving issuance (not based on or revealing the specific cause of the exemption). 


:bulb: SMART Health Cards should represent exemptions with an `exp`  ("expires at") timestamp, populated with a consistent issuer-supplied interval.

## Technical Recommendations


1. Model vaccine exemptions with an `exp` claim for some fixed time interval (e.g., a month from the time of issuance) to mitigate the effects of policy changes.
1. Model vaccine exemptions with a top-level `https://smarthealth.cards#exemption` type
2. Model vaccination exemptions with a FHIR `Condition` resource where `.category` is populated and `.code` is not.
3. Model `Condition.category` with a FHIR Coding that includes
    * `system`:  Public URL of a jurisdictional policy.
        * E.g. `https://travel.gc.ca/travel-covid/travel-restrictions/exemptions`
    * `code`: Fixed value independent of exemption *reason*
      * e.g., `vaccine-exemption`
    * `version`: Date of most recent update to the policy at time of issuance.
      * E.g. `2021-10-08`
5. Model `Condition.recordedDate` as an optional field)
5. Model `Condition.recorder.display` as an optional field

##### Example JWS Payload (annotated with comments)

```js
{
  "iss": "https://spec.smarthealth.cards/examples/issuer",
  "nbf": 1633642949,
  "exp": 1634247749,
  // ^^ This expiration time is one week later than
  // the issuance (nbf) time, so the credential lives
  // for a limited duration.
  "vc": {
    "type": [
      "https://smarthealth.cards#health-card",
      "https://smarthealth.cards#covid19",
      "https://smarthealth.cards#exemption"
    ],
    "credentialSubject": {
      "fhirVersion": "4.0.1",
      "fhirBundle": {
        "resourceType": "Bundle",
        "type": "collection",
        "entry": [
          {
            "fullUrl": "resource:0",
            "resource": {
              "resourceType": "Patient",
              "name": [
                {
                  "family": "Anyperson",
                  "given": [
                    "John",
                    "B."
                  ]
                }
              ],
              "birthDate": "1951-01-20"
            }
          },
          {
            "fullUrl": "resource:1",
            "resource": {
              "resourceType": "Condition",
              "category": [
                {
                  "coding": [
                    {
                      "system": "https://travel.gc.ca/travel-covid/travel-restrictions/exemptions",
                      // ^^ URL to a jurisdiction's public policy
                      "code": "vaccine-exemption",
                      // ^^ fixed value, independenty of the exemption reason
                      "version": "2021-10-06"
                      // ^^ from the policy web page's "last modified" date
                    }
                  ]
                }
              ],
              "subject": {
                "reference": "resource:0"
              },
              "recordedDate": "2021-06-20",
              // ^^ Optional date of initial recording, while
              // the top-level JWS `nbf` and `exp` are required
              "recorder": {
                "display": "Province of Quebec"
                // ^^ Optional, if conveying a recorder is important
              }
            }
          }
        ]
      }
    }
  }
}
```

##### Example QR:
![Example QR](https://hackmd.io/_uploads/Sk9WG404Y.png)
