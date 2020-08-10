# Verifiable Lab Results

## Status

Early proposal drafted with input from technology and lab vendors

## Introduction -- Health Cards

In this proposal we focus on enabling "Health Cards", with a short term goal to enable a consumer to receive COVID-19 serology or PCR results from a participating lab and **present these results to another party in a verifiable manner**. Key use cases include conveying point-in-time infection status for return-to-workplace and travel. This approach should also support documentation of immunization status and other health details.

Because we must ensure end-user privacy and because Health Cards must work across organizational and jurisdictional boundaries, we are building on international open standards and decentralized infrastructure. 


## Conceptual Model

![Figure](https://i.imgur.com/T8RHjlJ.png)
* **Issuer** (e.g., a lab) generates verifiable credentials 
* **Holder** stores credentials and presents them at will
* **Verifier** receives credentials from holder and ensures they are properly signed


## Design Goals

* Support **end-to-end workflow** where users receive and present relevant healthcare data
* Enable workflow with **open standards**
* Support strong **cryptographic signatures**
* Support **binding credentials to keys** stored on a user's device
* Enable **privacy preserving** data presentations for specific use cases


### Start Small -- Think Big

We enable Health Cards  by defining building blocks that can be used across healthcare. The core building block allows us to aggregate data into meaningful sets, signed by an issuer, and stored/presented by a consumer as needed. The broader set of use cases might eventually include:

* Managing an immunization record that can be shared with schools or employers, or for travel
* Sharing verifiable health history data with clinical research studies
* Sharing voluntary data with public health agencies
* Sharing questionnaire responses with healthcare providers

Despite this broad scope, our *short-term definition of success* requires that we:

* Represent "Health Cards" in a "Health Wallet", focusing on COVID-19 status
* Ensure that each role (issuer, holder, app) can be implemented by any organization following open standards, provided they sign on to the relevant trust framework
* Align with a longer term vision for standards-based decentralized identity, where each role (issuer, holder, app)


### User Experience

1. **Install** a "Health Wallet" app
2. **Connect** the Health Wallet to a lab account
3. **Save** a COVID-19 results card from the lab to the Health Wallet
4. When a user wants to **share** COVID-19 results with a verifier:
    a) Open Health Wallet
    b) Scan a QR code displayed by verifier
    c) Agree when prompted with "Share COVID-19 results with _{Verifier Name_}?"

## Demo
Sometimes it's easiest to learn by seeing. For an end-to-end demonstration including Mobile Wallet, Lab API, and Verifier, see https://c19.cards/ (source code [on GitHub](https://github.com/microsoft-healthcare-madison/health-wallet-demo) -- and if you want to learn how to test your own components against the demo site, see [READMD.md](https://github.com/microsoft-healthcare-madison/health-wallet-demo/blob/master/README.md#using-the-hosted-demo-components)).

#### Demo Mobile Wallet: Home Screen
![](https://i.imgur.com/pMuA3N9.png)

#### Demo Mobile Wallet Approval Screen
![](https://i.imgur.com/fDdem2h.png)



## Design Considerations

This section outlines higher-level design considerations. See ["Protocol Details"](#Protocol-details) below for technical details.

### Data Flow

Each step in the flow must have well-defined inputs and outputs. For each step we define at least one required data transfer method to establish a basis for interoperability.

#### Connecting Health Wallet to Lab
* Required method: OpenID Connect (OIDC) redirect + `form_post` flow
* Optional entry point: FHIR `$HealthWallet.connect` operation to begin the OIDC redirect

#### Getting credentials into Health Wallet
* Required method: File download
* Optional method: [FHIR API Access](#FHIR-API-amp-Other-Alternatives)

#### Presenting credentials to Verifier
* Required method: OpenID Connect (OIDC) redirect + `form_post` flow (assumes devices are online)
* Optional method: Direct device-to-device connections (e.g. Bluetooth, NFC -- out of scope in the short term)

### Trust

Which issuers can participate, which test results should be considered, and how do verifiers learn this information?

At a _pilot project level_:

#### Which Issuers can participate?
* We'll work with a willing set of issuers and define expectations/requirements
* Verifiers will learn the list of participating issuers out of band; each issuer will be associated with a public URL
* Verifiers will discover public keys associated with an issuer via [DID `.well-known` URLs](https://identity.foundation/specs/did-configuration/)
* For transparency, we'll publish a list of participating organizations in a public directory

#### Which lab tests should be considered in decision-making?
* We'll create or identify FHIR profiles for each lab test that define required fields, vocabularies, etc.
* Verifiers will learn out of band about which lab tests should be considered in decision-making; this set is expected to evolve over time as new tests are developed and as our scientific understanding evolves

In a _post-pilot deployment_: a network of participants would define and agree to a formal Trust Framework. This is still TBD.

### Privacy

It is an explicit design goal to let the holder **only disclose a minimum amount of information** to a verifier. The information _required_ to be disclosed is use-case dependent, and -- particularly in a healthcare setting -- it can be difficult for lay people to judge which data elements are necessary to be shared.

To start, the granularity of information disclosure will be at the level of an entire credential (i.e., a user can select "which cards" to share from a Health Wallet, and each card is shared wholesale). The credentials are designed to only include the minimum information necessary for a given use case.

If we identify *optional* data elements for a given use case, we might incorporate them into credentials by including a cryptographic hash of their values instead of embedding values directly. Longer term we can provide more granular options using techniques like zero-knowledge proofs, or by allowing a trusted intermediary to sumamrize results in a just-in-time fashion.

### Data Model

The credential's data is **represented in FHIR** as outlined in [Modeling Verifiable Credentials in FHIR](https://hackmd.io/@HealthWallet/modeling-healthcare-data-with-vcs)


## Protocol details

### Install a “Health Wallet” app

In this step, the user installs a standards-based mobile app. The app generates a decentralized identifier on behalf of the user, including:
* a key of type `EcdsaSecp256k1VerificationKey2019` to enable verification of JWT signatures created by this issuer, using the `ES256K` signature algorithm
* a key of type `RSAEncryptionPublicKey` to enable encryption of JWE payloads created for this issuer, using `"alg": "RSA-OAEP"` and `"enc": "A128CBC-HS256"`
 
This identifier conforms to the [`did:ion` method](https://identity.foundation/sidetree/spec/); it will be used for secure interactions with the issuer and the verifier, from here on out. A good way to start is to build out ION DIDs in [Long-Form](https://identity.foundation/sidetree/spec/#long-form-did-uris)

:::warning
:question: **DID Methods** There are different DID methods, with trade-offs. It's useful to pick an approach that:

* works for issuers as well as holders
* supports key rotation
* supports distinct keys per-device
* supports service endpoint discovery

-- so we're starting with `did:ion`, but should continue to evaluate this choice as requirements emerge. 
:::

:::warning
:question: **Signature and encryption algorithms** There are different cryptographic algorithms, with trade-offs. It's useful to pick algorithms for consistent implementations -- so we're starting with `ES256K` for verification and `RSA-OEAP` for encryption, but should continue to evaluate this choice as requirements emerge. 
:::

### Connect Health Wallet to lab account

In this step, the lab learns about the end-user's DID. To accomplish this, the lab initiates an OpenID Connect request associated with the user's account (e.g., by displaying a link or a QR code in the portal, or by hosting a FHIR API endpoint that allows a third-party app to initiate an OIDC request). The specific OpenID Connect profile we use is called ["DID SIOP"](https://identity.foundation/did-siop/).

:::info
:spiral_note_pad: **Discovering DIDs for labs:** To ensure that all parties can maintain an up-to-date list of DIDs for known labs, each lab [hosts a `.well-known/did-configuration` file](https://identity.foundation/specs/did-configuration/) on the web relative to its `.registration.client_url`, so parties such as the Health Wallet app can maintain a list of DIDs for each domain.
:::

```sequence
participant User's Device as Device
participant Lab

Device -> Device: Create users DID:ION: keys
Lab -> Lab: Create DID:ION: keys

note over Device: Later, either [A], [B] or [C]...
Lab --> Device: [A] Click `openid://` link\non issuer's portal
Lab --> Device: [B] Scan QR code or NFC tag with\n`openid://` link
Device --> Lab: [C] FHIR $HealthWallet.connect
Lab --> Device: [C] Return `openid://` link in\nFHIR Parameters resource
Device -> Device: React to `openid` link
Device -> Device: Validate prompt

note over Device: Ask user to connect
Device -> Lab: Issue request to `request_uri`
Lab -> Lab: Generate DID SIOP\nrequest with lab's\nkeys
Lab -> Device: Return DID SIOP Request
Device -> Device: Validate DID SIOP JWT

note over Device: Ask user to share keys
Device -> Device: Formulate DID SIOP Response
Device -> Lab: Submit response\n([C] with Authorization header)
Lab -> Lab: Store keys to\nuser account
Lab -> Device: Ack
```

#### DID SIOP Request Discovery
The lab constructs an OIDC request, which is displayed to the user (newlines and spaces added for clarity):

```
openid://?
  response_type=id_token
  &scope=did_authn
  &request_uri=<<URL where request object can be found>>
  &client_id=<<URL where response object will be posted>>
```

:::info
#### Simplifying the workflow when a FHIR API connection exists
If the Health Wallet app already has a FHIR API connection to the lab that includes the `__HealthWallet.*` scope, the app can begin an OIDC connection by invoking the `$HealthWallet.connect` operation:

    GET /Patient/:id/$HealthWallet.connect
    
The operation returns a FHIR `Parameters` resource with the OIDC request URL:

```json
{
"resourceType": "Parameters",
  "parameter": [{
    "name": "openidUrl",
    "valueUri": "openid://?response_type=..."
  }]
}
```

This allows the Health Wallet to begin the connection workflow directly, without requiring the user to sign into the lab portal or take any extra steps. This is an optional entry point for the connection workflow; it does not change the subsequent steps.
:::

#### DID SIOP Request
The `<<URL where request object can be found>>` in `request_uri` can be dereferened to a Request Object signed by the lab.

With a header like:

```json
{
   "alg": "ES256K",
   "typ": "JWT",
   "kid": "did:ion:<<identifer for lab>>#<<verification-key-id>>"
}
```

And a body like:
```json
{
  "iss": "did:ion:<<did-value>>",
  "response_type": "id_token",
  "client_id": "<<URL where response object will be posted>>",
  "scope": "did_authn",
  "response_mode" : "form_post",
  "response_context": "wallet",
  "nonce": "<<unique value>>",
  "state": "<<client-supplied value, possibly empty>>",
  "registration":  {
    "id_token_signed_response_alg" : "ES256K",
    "id_token_encrypted_response_alg": "RSA-OAEP",
    "id_token_encrypted_response_enc": "A128CBC-HS256",
    "client_uri": "<<base URL for lab>>"
  }
}
```

> **Note** that by using this URI-based approach, the lab can choose to display a static QR code printed on a sticker at the check-in counter, generating the signed request objects dynamically each time a client dereferences the `request_uri`.

##### Request options

* `response_mode` the Health Wallet should recognize and support `form_post` and `fragment` modes.
* `response_context` of `wallet` allows the relying party to indicate that the wallet can issue a response in its own user agent context, effectively performing a "headless" submission and keeping the user in the wallet at the end of the interaction rather than redirecting back to the relying paty.
> Note: The `wallet` response context is only suitable in combination with a SMART on FHIR or other authenticated API connection, to prevent session fixation attacks. Otherwise, the relying party must receive its response in the system browser context, and must verify that the session where the request was generated and the session where the response was provided are both sessions for the same end-user.

DID SIOP Request Validation


### Validate Request Object

#### Regular JWS Validation

1. Validate the JWT according to JWS

#### Regular DID-SIOP Validation
https://identity.foundation/did-siop/#siop-request-validation

> **Bug in spec:** Do NOT attempt to validate according to [OIDC Core 7.5](https://openid.net/specs/openid-connect-core-1_0.html#SelfIssuedValidation) because this applies to the response, not the request.

2. If no `did_doc`: resolve the DID-Document from the DID found in `iss`
3. If `did_doc` is present, ... (DOES NOT APPLY (YET))
4. If `jwks_uri` is present, ... (DOES NOT APPLY (YET))
5. Validate `kid` matches the resolved DID-D

#### Additional Validation

6. Validate `response_type` is "id_token"
7. Validate `scope` contains "did_authn"
8. Validate `response_mode` is "form_post" or "fragment"
9. Validate `nonce` is present and store it
10. Validate `state` is present and store it
11. Validate `registration` is present as an object
12. Validate `registration.id_token_signed_response_alg` is an array of algorithms and contains only "ES256K"
13. Validate `registration.client_uri` is present and store it
14. Resolve `.well-known/did-configuration` hosted at the URL given in `registration.client_uri`
    a. Ask user for permission first?
15. Validate `kid` corresponds to a known DID for this lab


#### User Prompt

The Health Wallet displays a message to the user asking something like "Connect to lab.example.com?" (based on the `.registration.client_uri` value, like "https://lab.example.com"). If the user agrees, the Health Wallet constructs a SIOP Response object, then signs it to create a signed JWS, and then encrypts the JWS to create a JWE.

#### DID SIOP Response

The Health Wallet constructs a SIOP Response Object like:

```json
{
  "iss": "https://self-issued.me",
  "aud": "<<client_id from the request>>",
  "nonce": "<<unique value>>",
  "exp": <<expiration time as JSON number of seconds since epoch>>,
  "iat": <<issuance time as JSON number of seconds since epoch>>,
  "did": "did:ion:<<identifier for user>>"
}
```

... then signs it using its DID, and encrypts it using the lab's DID (This step requires looking inside the DID Document for an `RSAEncryptionPublicKey`, which can be used for encrypting a payload for this party.

> TODO: Show the header for the JWS, and the header for the JWE around it.) 

Finally the Health Wallet submits the  `id_token` and `state` values back to the client's URL (conveyed in the `client_id` request field). If `response_context` is `wallet`, the Health Wallet may issue an HTTP call directly to the client's URL; otherwise the Health Wallet submits a response in the context of the system browser. For example, if `response_mode` is `form_post` and `response_context` is `wallet`, the response might be sumitted as:
```
POST <<URL where response object will be posted>>
Content-type: application/x-www-form-urlencoded

id_token=<<signed and encrypted SIOP Response Object>>
&state=<<state value from SIOP Request Object, if any>>
```

:::info
If the Health Wallet received the `openid` link via the FHIR `$HealthWallet.connect` operation, the DID SIOP is authorized by including the SMART on FHIR bearer token in an `Authorziation` header.
:::


### Lab Generates Results

When the lab performs tests and the results come in, the lab creates a FHIR payload and a corresponding VC.

```sequence
participant Holder
participant Lab

note over Lab, Holder: Earlier...
Lab -> Lab: Generate Lab's DID
Holder --> Lab:  Upload DID
Lab -> Lab: If labs for holder already\nexist: re-generate VCs

note over Lab, Holder: Lab Result Created
Lab -> Lab: Generate FHIR Representation
Lab -> Lab: Generate VC Representation
Lab -> Lab: Generate JWT Payload\nincluding Holder DID (if\nknown) and sign
Lab -> Lab: Store on holder's account

note over Lab, Holder: Later...
Lab -> Holder: Holder downloads VCs
```

See [Modeling Verifiable Credentials in FHIR](https://hackmd.io/@jmandel/modeling-healthcare-data-with-vcs) for details, at a high level the VC looks like:

```json
{
  "@context": [
    "https://www.w3.org/2018/credentials/v1"
  ],
  "type": [
    "VerifiableCredential",
    "https://healthwallet.cards#covid19",
    "https://healthwallet.cards#presentation-context-online"],
  "issuer": "<<did:ion identifier for lab>>",
  "issuanceDate": "2020-05-01T11:59:00-07:00",
  "display": "COVID-19 Card for Eve Everywoman",
  "credentialSubject": {
    "id": "<<did:identifier for holder if known>>",
    "fhirVersion": "<<FHIR Version>>",
    "fhirBundle": {
      <<FHIR Bundle>>
    }
  }
}
```

### Lab Results are Finalized

In this step, the user learns that new lab results are available (e.g., by receiving a text message or email notification). To facilitate this workflow, the lab can include a link to help the user download the credentials directly, e.g., from at a login-protected page in the Lab's patient portal. The file should be served with a `.fhir-backed-vc` file extension, so the Health Wallet app can be configured to recognize this extension. Contents should be a JSON object containing an array of Verifiable Credential JWTs:

```json
{
  "verifiableCredential": [
    "<<Encrypted Verifiable Credential JWT string>>",
    "<<Encrypted Verifiable Credential JWT string>>"
  ]
}
```

Finally, the Health Wallet asks the user if they want to save any/all of the supplied credentials.

#### FHIR API & Other Alternatives

:::info
The file download is the lowest common denominator. Lab results delivery could also be conveyed through the [FHIR API $issueVc operation](#FHIR-API-amp-Other-Alternatives) and, as such, could be delivered to the Health Wallet app via an existing FHIR connection. Conceivably there are other ways to transfer the results, with their own cons and pros.

FHIR API Example Approach

##### `$HealthWallet.issueVc` operation

A Health Wallet can `POST /Patient/:id/$HealthWallet.issueVc` to a FHIR-enabeld issuer to request the generation of a specific type of Health Card. The body of the POST looks like:

```json
{
  "resourceType": "Parameters",
  "parameter": [{
    "name": "credentialType",
    "valueUri": "https://healthwallet.cards#covid19"
  }, {
    "name": "presentationContext",
    "valueUri": "https://healthwallet.cards#presentation-context-online"
  }]
}
```

The `credentialType` and `presentationContext` parameters are both required. By default, the issuer will decide which identity claims to include based on the requested `presentationContext`. If the health wallet wants to fine-tune identity claims in the generated credentials, it can provide an explicit list of one or more `includeIdentityClaim`s, which will limit the claims included in the VC. For example, to request that only name be included:

```json
{
  "resourceType": "Parameters",
  "parameter": [{
    "name": "credentialType",
    "valueUri": "https://healthwallet.cards#covid19"
  }, {
    "name": "presentationContext",
    "valueUri": "https://healthwallet.cards#presentation-context-online"
  }, {
    "name": "includeIdentityClaim",
    "valueString": "Patient.name"
  }, {
    "name": "encryptForKeyId",
    "valueString": "#encryption-key-1"
  }]
}
```

If no `encryptForKeyId` parameter is supplied, then the signed VC is returned unencrypted. To request encryption, the client includes an `encryptForKeyId` parameter with a `valueString`, indicating the requested encryption key ID, starting with `#`. This ensures that even if the client's DID document includes more than one encryption key, the server will know which one to use for encrypting this payload.

The response is a `Parameters` resourceincludes one more more `verifiableCredential` values like:

```json
{
  "resourceType": "Parameters",
  "parameter":[{
    "name": "verifiableCredential",
    "valueAttachment":{
      "data":"<<base64 encoded VC>>"
    }
  }]
}
```


If a client calls `$HealthWallet.issueVc` when no DID has been bound to the Patient record, the server responds with a FHIR OperationOutcome including the `no-did-boud` code:

```json
{
  "resourceType": "OperationOutcome",
  "issue": [
    {
      "severity": "error",
      "code": "processing",
      "details": {
        "coding": [
          {
            "system": "https://healthwallet.cards",
            "code": "no-did-bound",
            "display": "No DID is bound to the requested Patient account"
          }
        ]
      }
    }
  ]
}

```
```
:::

### Presenting lab results to a verifier

In this step, the verifier asks the user to share a COVID-19 result. The overall flow is similar to ["Connect Health Wallet to lab account"](#Connect-Health-Wallet-to-lab-account) above, in that it follows the DID SIOP protcol.

#### Initiate the Presentation

This step can happen in person or online.

```sequence
participant Laboratory as Lab
participant Holder
participant Verifier

Verifier -> Verifier: generate openid:// link \n with upload URL, public key\nand presentation context

note over Holder, Verifier: In Person Presentation
Verifier -> Verifier: Display openid:// link\nin QR code
Verifier -> Holder: scan QR code

note over Holder, Verifier: Online Presentation
Verifier -> Verifier: redirect with openid:// link
Verifier -> Holder: process redirect
```

#### Complete the Presentation

```sequence
participant Laboratory as Lab
participant Holder
participant Verifier

Holder -> Holder: find VCs suitable for\npresentation context
Holder -> Holder: let user pick VC\nto share
Holder -> Holder: confirm sharing
Holder -> Holder: encrypt VC with\nVerifier's public key
Holder -> Verifier: send encrypted VC
Verifier -> Verifier: decrypt VC

note over Lab, Verifier: Verify VC
Verifier -> Verifier: validate JWT
Verifier -> Verifier: extract labs DID\nand resolve
Verifier -> Verifier: ...
```

#### Presentation Protocol Details
The process begins with a QR code or `openid://` link. The only differences are:

1. The SIOP Request Object includes a `claims` object asking for relevant Verifiable Credentials to be included in the response:
    ```json
    {
      // ... other request fields like 
      // `iss`, `response_type`, etc
      "claims": {
        "id_token": {
          "health-wallet-covid19-card": {"essential": true},
        }
      }
    }
    ```

2. Based on the requested claims, the Health Wallet prompts the user to share specific verifiable credentials (in the example above: health cards). The selected credentials are packaged into a Verifiable Presentation according to [W3C Verifiable Presentations](https://w3c.github.io/vc-data-model/#presentations-0).

3. The `id_token` constituting the SIOP Response Object includes a `.vp.verifiableCredential` array:
    ```json
    {
      // ... other response fields like
      // `iss`, `aud`, etc.
      "vp": {
        "@context": ["https://www.w3.org/2018/credentials/v1"],
        "type": ["VerifiablePresentation"],
        "verifiableCredential": [
          "<<Verifiable Credential JWT string>>",
          "<<Verifiable Credential JWT string>>"
        ]
      }
    }
    ```
---

## Potential Extensions

### Fallback for smartphone-based offline presentation

We should be able to specify additional "return paths" in the DID SIOP workflow that don't depend on an HTTP upload but instead rely on local transfer (e.g., via NFC or bluetooth)

### Fallback for users without a smartphone

While it's hard to provide the same level of functionality and convenience without a mobile phone, there are still steps we can take to allow broader use of these verifiable credentials. Here's one possibleS approach to graceful degradation:

* Lab generates VCs that aren't bound to any specific user DID
* Lab makes VCs available for download
* User prints a QR Code conveying the VC, or a link to a hosted copy of the VC (optionally protected by a password or PIN)
* Verifier scans the barcode, retrieves the VC, and verifies signatures -- then relies on out-of band relationship with the user to match the VC to a real-world identity. For example, the user may be an employee or customer of the verifier, and thus the user's name and phone number may be known by the verifier in advance. The verifier must compare the identity attributes inside the VC with the attributes they have verified out of band.
