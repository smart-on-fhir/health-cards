---
title: "Code System: Identity Assurance Level (IAL)"
---

Defining URL
:    `https://smarthealth.cards/ial`

Version
:    1.0

License
: <https://creativecommons.org/licenses/by/4.0/>

This code system defines Identity Assurance Level (IAL)s based on [NIST 800-63-3](https://pages.nist.gov/800-63-3/sp800-63-3.html#52--assurance-levels).  These codes may be used by Issuers of SMART Health Cards To record if/how a patient's identity was verified at the point of vaccination (i.e. point of care).


The following codes are included in this code system:

|Code|Display|
|-|-|
|`IAL1`|Low-level identity assurance.  Name and birth date were self-asserted or some document or credential identity was provided not meeting IAL 2 definition.|
|`IAL2`|Either remote or in-person identity proofing is required. IAL2 requires identifying attributes to have been verified in person or remotely using, at a minimum, the procedures given in [NIST Special Publication 800-63A].|
|`IAL3`|In-person identity proofing is required. Identifying attributes must be verified by an authorized CSP representative through examination of physical documentation as described in [NIST Special Publication 800-63A].|

Resources
---------
* Digital Identity Guidelines - NIST Special Publication 800-63-3A: https://pages.nist.gov/800-63-3/sp800-63a.html
