# Related Projects FAQ (Draft)

## WHO "Smart Vaccination Certificates" RC1

On March 19th, 2021, the WHO released [Interim guidance for developing a Smart Vaccination Certificate](https://www.who.int/publications/m/item/interim-guidance-for-developing-a-smart-vaccination-certificate). Here are some key distinctions to keep in mind with respect to WHO RC1:

1. Project names

    * "**SMART**" in SMART Health Cards refers to the [SMART Health IT project](https://smarthealthit.org/about-smart-2/), and stands for "_Substitutable Medical Applications, Reusable Technologies_".
    * "**Smart**" in WHO's Smart Vaccination Certificates is unrelated to SMART Health IT or SMART on FHIR.

1. WHO RC1 has a wider scope than SMART Health Cards; WHO's scope includes continuity of care in addition to proof of vaccination.

1. WHO RC1 assumes there will be national-level infrastructure for centralizing records for a given country. SMART Health Cards is designed to operate without this sort of central infrastructure.

1. WHO RC1 does not yet define technical details for active implementation, such as the specific format for QR codes and other artifacts.

1. WHO RC1 defines a data model for what should be included in a proof of vaccination. SMART Health Cards provides a similar data model via the [SMART Health Cards: Vaccination & Testing Implementation Guide](http://build.fhir.org/ig/dvci/vaccine-credential-ig/branches/main/). The SMART IG aligns closely but not perfectly with WHO RC1 recommendations. Improving this alignment where possible is on the roadmap for the Vaccination & Testing Implementation Guide.
