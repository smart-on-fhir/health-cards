---
title: "Code System: Identity Assurance Level"
---

Defining URL
:    `https://smarthealth.cards/ial`

Version
:    1.0

License
: <https://creativecommons.org/licenses/by/4.0/>

This code system defines levels of identity assurance, based on [NIST 800-63-3](https://pages.nist.gov/800-63-3/sp800-63-3.html#52--assurance-levels).

These codes may be used by Issuers of SMART Health Cards to record if/how a patient's identity was verified at the point of care. For example, if a patient showed their driver's license to verify their name and date of birth when getting a vaccination, this would correspond to `IAL1.4`.

The following codes are included in this code system:

|Code|Display|
|-|-|
|`IAL1`|Name and birth date were self-asserted.|
|`IAL1.2`|An unspecified ID was used to verify name and birth date.|
|`IAL1.4`|A government-issued photo ID was used to verify name and birth date.|
|`IAL2`|Either remote or in-person identity proofing is required. IAL2 requires identifying attributes to have been verified in person or remotely using, at a minimum, the procedures given in [NIST Special Publication 800-63A].|
|`IAL3`|In-person identity proofing is required. Identifying attributes must be verified by an authorized CSP representative through examination of physical documentation as described in [NIST Special Publication 800-63A].|

For `IAL1.4`, in the US, "government-issued photo ID" may include IDs such as a US state-issued driver's license, a US nationally-issued ID like a US passport, or a foreign passport.

[NIST Special Publication 800-63A]: https://pages.nist.gov/800-63-3/sp800-63a.html