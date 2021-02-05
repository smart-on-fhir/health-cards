# Health Cards to Trust Framework Model Mapping

This document is written in language that should be clear to identity providers participating in the Decentralized Identity ecosystem.

## Health Cards

While Health-Cards utilizes [Verifiable Credentials](https://www.w3.org/TR/vc-data-model/) and [Decentralized Identifiers](https://w3c.github.io/did-core/), it is not a decentralized identity system. The overall approach is to wrap FHIR 4.0 data in a Verifiable Credential (VC) format [(JWS)](https://tools.ietf.org/html/rfc7515) which is signed by the issuer of the VC. This data will be ingestible by any Health-Cards compatible Healthcare Provider (HCP). The Verifiable Credential does not authenticate the holder utilizing the VC, but instead, patient matching is done with the FHIR 4.0 API compatible patient record wrapped in the VC. This method allows data transport and control by the patient with minimal impact on existing systems and processes.

## Trust Ecosystem

The Trust Framework (TF) developed by The Trust over IP Foundation is pictured below:

![ext-img](https://github.com/trustoverip/SC/blob/master/presentations/stack-diagrams/images/Trust%20over%20IP%20Stack%20-%20Diagrams.010.png?raw=true)

The intent of this guide is to map the [VCI project](www.vci.org) to the trust framework model. This should highlight how Health-Cards fit into the overarching Decentralized Identity Ecosystem. This will be done by version so that contributors can get started on future capabilities (beyond v0). Each of the eight sections of the Trust Framework will be addressed in each version of the Health-Cards specification.

## Trust Ecosystem Layers

In recognition of the fact that trust is strictly a human endeavor, the Trust Framework approach is to explicitly define how trust is established outside of the participating technologies and also how it is maintained within the technology. This approach ensures that all parties entering into an ecosystem understand what is expected of the participants as well as how to participate. When trust is the guiding principle for design and is part of the trade-space for technical decisions, the participants in those systems spend less time on rework and closing holes that allow trust to be exploited. Before mapping VCI to the Trust Framework, here is a short example of some design considerations that exist in each category (governance and technology) for each level.

### Layer 1: Root of Trust

Any cryptographic system requires a root of trust. The root of trust is the combination of trusted technology and trusted governance. For example, in a symmetric encryption system, technical trust is established by the ability to respond to messages encrypted using a trusted method. However, this system can only work if the management and protection of the symmetric keys is also trusted. All participants must agree to the processes and protocols that protect the symmetric keys from being compromised.

#### Technical

The technology of layer 1 of the Trust Framework is defined by the utility. A utility provides a deterministic mapping of public keys utilizing a Decentralized Identifier (DID) URL. Public utilities offer specifications for access in the form of [DID Methods](https://w3c.github.io/did-core/#methods) which have interoperability specifications in the [DID Registry](https://w3c.github.io/did-spec-registries/). Utilities may also be private and remain inaccessible publicly in order to cordon interoperability to a specific set of participants. Finally, the [Key Event Receipt Infrastructure (KERI)](www.keri.one) utility has properties of both public and private utilities.
Technical considerations for choosing a utility: 
- [ ] Scope of accessibility - Who needs to be able to issue or verify credentials? 
- [ ] Throughput requirements - How many documents per second (RPS) should the utility be able to handle? 
- [ ] Transaction fees - Is the underlying cost of transactions affordable? 
- [ ] Full public key support - Does the utility support Issue, Verify, Rotate, and Revoke (IVRR) actions for the public keys? 
- [ ] Privacy - Does the utility support privacy preserving query/response data?

#### Governance

The governance of layer 1 of the Trust Framework is defined by Utility Governance Framework. The Utility Governance Framework defines all the out-of-band activities of the utility. This includes the utility’s governance structure, membership, and processes as well as its economic structure. Public utilities must have full transparency in all these categories while private utilities must have transparency only with members. KERI, which is functionally a hybrid public/private approach utilizes a governance framework similar to the Hierarchical Deterministic (HD) key implementations that are in wide use today but obviates the need for a certificate authority.
Governance considerations for choosing a utility: 
- [ ] Degree of centralization - What is the controlling entity and how easy is it for a single individual / organization to compromise the data? 
- [ ] Value alignment - Does the controlling entity’s values align with the project or is it at least amoral? 
- [ ] Economy - Does the utility’s fee structure support both adoption of the project AND the sustainment of the utility for both technical approach and governance approach? Does the fee structure incentivize compliance with governance objectives? 
- [ ] Regulatory requirements - Does the utility comply with the project’s regulatory requirements as well as user expectations?

#### Intralayer Interactions

Solutions at the Root-of-trust Layer can vary from mostly technical enforcement via a trusted codebase (e.g., Bitcoin), to mostly governance enforcement via trusted procedures (e.g., Certificate Authorities). However, there is always a mix of the two modalities. When there is strong technical enforcement, there will be competition of technology which strengthens the ecosystem and when there is strong governance enforcement there will be competition of governance in the ecosystem. Therefore, a systems root-of-trust should match the enforcement methods used by the project to prevent decision fatigue or skillset mismatched between the project and its root-of-trust utility.

#### Interlayer Interactions

A single project could utilize multiple roots of trust or layered roots of trust. However, those choices tend to complicate the project at higher layers with exponential effect as they move up the stack. Therefore, the root-of-trust decision is critical to a project’s design choices at higher layers. Generally, the selection of the Root-of-Trust should not be decided until the scope of a project is well defined at the layer 3 ([Verifiable Credentials](#layer-3-verifiable-credentials)).

### Layer 2: Justifiable Parties

The entire point of a digital identity system is to ensure that only justifiable parties can participate in a system or access information. Systems that utilize identity, but do not control access are surveillance systems and are beyond the scope of this document. What parties are justified is a design choice that can be limited to one-to-one (_bidirectional_) or can one-to-many (_omnidirectional_). In trust systems, the initial key exchange must include an omnidirectional root-of-trust (Layer 1) so that the two parties may verify each other. However, once that trust is established, there is no reason to keep using the layer 1 utility to revalidate an already justified party. Therefore, best practice dictates that the justifiable parties create new keypairs specific to themselves and exchange public keys peer-to-peer. Doing so protects both sides from various key attacks and ensures that the utility need not be privy to any future communications between them (the utility itself is not a justified party). Layer 2 is where justifiable parties are established and maintained in the trust ecosystem.

#### Technical

The technology of layer 2 of the Trust Framework is defined by the DID-Comm, CHAPI, and OID-SOIP Peer-to-Peer Protocols. Any full stack implementation must address how the initial key exchange will take place and how subsequent interactions will be protected.
Technology considerations for choosing a DID-Comm Peer-to-Peer Protocol: 
- [ ] Strength of protocol - Is the cryptography [well implemented](https://csrc.nist.gov/Projects/Cryptographic-Standards-and-Guidelines)? 
- [ ] Privacy - Does the protocol prevent surreptitious participation without the consent of all justifiable parties? 
- [ ] Proof - Does the protocol render support non-repudiation of the justifiable parties? 
- [ ] Secrecy - What information can be observed or inferred from the operation of the protocol?

#### Governance

The governance of layer 2 of the Trust Framework is defined by Provider Governance Framework. The Provider Governance Framework, like the Utility Governance Framework, defines all out-of-band activities of the layer 2 provider. Both the technological function and governance of layer 2 need to be transparent to all justifiable parties in order to support trust.
Governance considerations for choosing a provider: 
- [ ] Justifiable Parties - Has the project identified all justifiable parties whom the DID Comm Peer-to-Peer Protocol used by the provider must protect? 
- [ ] Interoperability - Is the DID Comm Peer-to-Peer Protocol used by the provider interoperable with the project’s target ecosystem? 
- [ ] Directionality - Does the DID Comm Peer-to-Peer Protocol used by the provider support both omnidirectional and bidirectional cryptographic relationships? 
- [ ] Economy - Does the DID Comm Peer-to-Peer Protocol used by the provider have sufficient economic or open-source support to maintain the protocol?

#### Intralayer Interactions

Solutions at the Provider Layer can vary from a fully integrated application in which a Peer-to-Peer Protocol is an internal function, to hand carried physical credentials where a Peer-to-Peer Protocol is completely procedural. In the former case, the application must be completely transparent or utilize open standards and libraries. In the latter case, justifiable parties must be established by some means other than cryptographic verification.

#### Interlayer Interactions

A Peer-to-Peer Protocol is the most fungible layer in that it has the least impact on other layers. However, it has the largest impact on the overall security and privacy of the implementation. a Peer-to-Peer Protocol must be designed to ensure only justifiable parties are included in peer-to-peer communications or there can be no trust in the rest of the system.

### Layer 3: Verifiable Credentials

The Verifiable Credentials (VC) layer is the heart of decentralized identity and the raison d’être for the other three layers. The VC layer is where an identifier is imbued with the subject attributes that make an identity. It is wholly expected then that design choices at this layer are critical to project success. However, it may come as a surprise to some that design choices at this layer also impact the entire trust ecosystem’s success. Bad choices at the VC layer can undermine the root of trust by introducing misinformation or undermine layer 2 by recording and retransmitting credential data or undermine layer 4 by failing to adhere to best practices of interoperability which give the user true portability and enable the universal trust ecosystem. These are the reasons that credential issuers need good identity proofing practices, governance authorities need strong privacy incentives, and application developers need standard open-source libraries with good default choices and a solid understanding of the Trust Framework.

**For a deeper comparison of options regarding Data Exchange Protocols, see the VC implementation guide sections [10.1 Benefits of JWTs](https://w3c.github.io/vc-imp-guide/#benefits-of-jwts) and [10.2 Benefits of JSON-LD and LD-Proofs](https://w3c.github.io/vc-imp-guide/#benefits-of-jwts) to see which option is right for your system.**

#### Technical

The technology of layer 3 of the Trust Framework is defined by the Data Exchange Protocols. For VCs not implementing JSON-LD, the data schema and exchange protocols must be agreed upon by the issuer and verifier prior to holder presentation. The utilization of JSON-LD formats allows more flexibility for verifiers to accept various types of credentials or combining multiple credentials in one presentation without prior coordination. This capability decouples issuers and verifiers in a way that enables the organic growth of the decentralized identity ecosystem as credentials become useful beyond the issuer’s intent (e.g., utilization of a utility bill to prove residency). In both cases (JSON-LD and non) the key property that must be adhered to in order to maintain trust at layer 3 is the separation of the Issuer and the Verifier so that there is no requirement for communication between them within the technology stack. Systems which chose to implement in that fashion do not need VCs and would not benefit from decentralized identity or the Trust Framework.

Technology considerations for choosing a Data Exchange Protocol: 
- [ ] Extensibility - Does extensibility of the Data Exchange Protocol matter to the system? 
- [ ] Unintended Use - Should the Data Exchange Protocol enable use of the credential in ways that are unintended by the issuer? 
- [ ] Adoption - Does the Data Exchange Protocol have sufficient interoperability at layer 4 (Trust Applications) to support the intended scope of adoption?

#### Governance

The governance of layer 3 of the Trust Framework is defined by the Credential Governance Framework. The core business of the Credential Governance Framework is to provide issuers and verifiers with the information they need for technical implementation of the credential. In some cases, this may require a tight coupling with layer 4 (Trust Applications). This is the case when VC @context values are not provided. However, when the additional governance work is done to provide good @context many important privacy benefits are enabled.

- [ ] Registration - How will the credential be registered so all the intended participants can participate?
- [ ] Version Control - How will version control be communicated to layer 4 (Trust Applications)?
- [ ] Cross Boundary Control - Does the layer 3 governance body’s configuration control authority extend to layer 4 (Trust Applications)?
- [ ] Privacy - Is the ability to maintain privacy via the use of Zero Knowledge Proofs or linked data presentations important to the system?

#### Intralayer Interactions

The interactions between governance and technology at layer 3 is bifurcated around the selected Data Exchange Protocols. For example, the use of JWTs as the Data Exchange Protocol greatly simplifies layer 3 governance and increases speed to market, but then complicates layer 4 governance, inhibits privacy preserving minimization, and decreases interoperability. Conversely, the use of JSON-LD (specifically with LD protocols) has the opposite effect by increasing the need for Layer 3 governance, but also ensuring better Layer 4 interoperability. Therefore, identity ecosystem interoperability is achieved with JSON-LD with LD protocols, and JWT is reserved for smaller boutique implementations where Layers 3 & 4 are tightly coupled, versioning in minimal, and speed is critical.

#### Interlayer Interactions

The VC Layer impacts layer 4 and is impacted by layer 1. The primary decision that impacts layer 4 is the specific Data Exchange Protocol, while the layer 1 impact on the VC (in some cases) is the registration of the VC data schema.

### Layer 4: Trust Applications

The purpose of the Trust Application layer of the Trust Framework is to abstract away the cryptographic complexities of the underlying layers and calculate the answer to the Internet’s universal question: “Can I trust this information?”
This portion of the ecosystem in no easier to define than website design or systems architectures. Both of which have a similar problem set of distilling information complexities into a digestible and intuitive user experience. Implementations at layer 4 can simply depend on the governance of the underlying levels and focus on normal DevOps for governance. However, if the underlying layers are not well governed or tightly coupled, the Trust Application developer could face vendor/protocol lock-in at each layer and remain unable to innovate or move forward without vertical integration activities across the Trust Framework.

#### Technical

The technology of layer 4 Trust Applications is generally provided by the same libraries / protocols that enable lower layers along with good application design practices. In this way, the application design process for Trust Applications is largely about making good choices for the system regarding layers 1-3. Once this is done, Trust Application design and development is identical to any other application development process.

#### Governance

Generally, the governance of a Trust application should resemble good software development processes. If the development is vertical (crossing multiple layers), the governance of layer 4 inherits all the issues and concerns of those layers which must be integrated.

#### Intralayer Interactions

The relationship of governance and technology at Layer 4 should mirror standard application development processes unless vertical development is required. See the Governance section preceding this one.

#### Interlayer Interactions

Layer 4 is the integration of layers 1-3 for effect and the interactions are direct.

# Health-Card to Trust Framework Model Mapping
## Version 0 (Minimum Viable Product)
### Layer 1:
#### Technical

Layer 1 technology for this version of VCI consists of one or more URLs at which a verifier can access validated public keys for authorized issuers protected by domain certificates.
Considerations: 
- [x] Scope of accessibility - Who needs to be able to issue or verify credentials? 
- [x] Throughput requirements - How many documents per second (RPS) should the utility be able to handle? 
- [x] Transaction fees - Is the underlying cost of transactions affordable? 
- [ ] Full public key support - Does the utility support Issue, Verify, Rotate, and Revoke (IVRR) actions for the public keys? - [ ] Privacy - Does the utility support privacy preserving query/response data?

Fulfillment: - Only HCPs participating in the VCI standard need to be able to issue credentials.
- Verification can be done by anyone who has the technology to validate a JWT. 
- Issuers will be verified utilizing HTTPS certificates from a trusted access control list (ACL) which will be publicly facing. 
- Throughput can scale indefinitely due to the root-of-trust being web based. 
- There are no transaction fees at layer 1 for this version. 
- This version of VCI does not support revocation of credentials. 
- This version of VCI does not support additional privacy controls on verifiable presentations.

#### Governance
Governance will be done out-of-band utilizing known relationships to assert issuer control over signing keys.
Considerations: 
- [x] Degree of centralization - What is the controlling entity and how easy is it for a single individual / organization to compromise the data? 
- [x] Value alignment - Does the controlling entity’s values align with the project or is it at least amoral? 
- [ ] Economy - Does the utility’s fee structure support both adoption of the project AND the sustainment of the utility for both technical approach and governance approach? Does the fee structure incentivize compliance with governance objectives? 
- [x] Regulatory requirements - Does the utility comply with the project’s regulatory requirements as well as user expectations?

Fulfillment: 
- The controlling entity for the URL will be insert info. 
- It is relatively simple for an organization or individual interrupt the verification process, but difficult for that person to remain unidentified. 
- The controlling entities values align with the project goals. 
- The utility has no fee structure. 
- The utility meets regulatory requirements.

### Layer 2: Credential Transport
#### Technical
Credential transport will be completed by physical transport of the patient record by the patient on a VCI compatible device or application.
Considerations: 
- [x] Strength of protocol - Is the cryptography well implemented? 
- [ ] Privacy - Does the protocol prevent surreptitious participation without the consent of all justifiable parties? 
- [ ] Proof - Does the protocol render support non-repudiation of the justifiable parties? 
- [x] Secrecy - What information can be observed or inferred from the operation of the protocol?

Fulfillment: 
- The project uses well known and understood crypto libraries for credential signing. 
- The project does not prevent the issuer from reusing the credential and therefore cannot enforce consent after the first use. 
- The project does support non-repudiation of the issuer. 
- The project does not technically support non-repudiation of the holder but does bind the holder to the credential with a phone number and other patient record data. 
- The verifier can see the patient record and verify it was both signed by the issuer and unchanged by the holder. It can be inferred that the patient has received a COVID-19 vaccine. It can be inferred that the patient is part of the issuer’s HCP. It can be inferred that the verifier is consuming COVID-19 vaccination data. It can be inferred that the number of DNS queries for the verification URL approximates the number of vaccinated patients being verified by the verifier.

#### Governance

Credential Transport is done by the patient and DID Comm Protocols are not supported for cryptographic relationships. Holders may be bound to the credential via phone number or patient record correlation.
Considerations: 
- [x] Justifiable Parties - Has the project identified all justifiable parties whom the DID Comm Peer-to-Peer Protocol used by the provider must protect? 
- [x] Interoperability - Is the DID Comm Peer-to-Peer Protocol used by the provider interoperable with the project’s target ecosystem? 
- [ ] Directionality - Does the DID Comm Peer-to-Peer Protocol used by the provider support both omnidirectional and bidirectional cryptographic relationships? 
- [x] Economy - Does the DID Comm Peer-to-Peer Protocol used by the provider have sufficient economic or open-source support to maintain the protocol?

Fulfillment: 
- The justifiable parties are limited to patients, issuers, and validator HCPs utilizing VCI standards to ingest HL7 FHIR v4 data. 
- The DID Comm Peer-to-Peer Protocol used by the provider is interoperable with all justifiable parties. 
- The DID Comm Peer-to-Peer Protocol used by the provider supports only bidirectional in-person relationships. 
- The DID Comm Peer-to-Peer Protocol used by the provider is supported by the participating members of VCI, but it is unclear if the continued development of the specification has commitment by the participants.

### Layer 3: Credential Interoperability

#### Technical

Considerations: 
- [x] Extensibility - Does extensibility of the Data Exchange Protocol matter to the system? 
- [x] Unintended Use - Should the Data Exchange Protocol enable use of the credential in ways that are unintended by the issuer? 
- [x] Adoption - Does the Data Exchange Protocol have sufficient interoperability at layer 4 (Trust Applications) to support the intended scope of adoption?

Fulfillment: 
- No. Extensibility is not required. 
- No. Unintended use is not desired. 
- Yes. Interoperability of the credential is sufficient for the intended scope of adoption.

#### Governance
Considerations: 
- [x] Registration - How will the credential be registered so all the intended participants can participate? 
- [x] Version Control - How will version control be communicated to layer 4 (Trust Applications)? 
- [x] Cross Boundary Control - Does the layer 3 governance body’s configuration control authority extend to layer 4 (Trust Applications)? 
- [x] Privacy - Is the ability to maintain privacy via the use of Zero Knowledge Proofs or linked data presentations important to the system?

Fulfillment: 
- The credential will be defined in the VCI specification. Since extensibility is not a design goal, there is no need to register the VC. 
- Layer 3 and 4 are tightly coupled and version control will be coordinated between those layers. 
- Yes, the governance body controls layers 3 and 4. 
- No, the ability to use zero knowledge proofs or linked data presentations is not important to the system.

### Layer 4: Applications

#### Technical

See layer 3.

#### Governance

See layer 3.
