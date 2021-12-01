- Feature Name: `reissuance-endpoint`
- Start Date: 2021-11-30
- Status: Draft for comment
  
# Summary

Sometimes circumstances might leave an individual holding an invalid SMART Health Card -- e.g., the issuer may have revoked a compromised signing key or an erroneous card. A lightweight, standardized entrypoint into a re-issuance flow can smooth over some of the pain when this happens.

# Motivation

We should empower individuals to obtain a valid card in cases where (owing to circumstances beyond the individual's control) their card may have been invalidated by the issuer.

# Guide-level explanation

Issuers can publish a JSON file with their `issuance` endpoint, if they support this feature. Users submit a request to the (re-)issuance endpoint with help from a health wallet app, optionally passing along a now-invalid SMART Health Card for context. This request leads to a web page where the issuer interacts with the user to complete the re-issuance process.

# Reference-level explanation

Issuers supporting this feature SHALL host a `<<Issuer URI>>/.well-known/shc-configuration` JSON file including:

* `issuance`: URL to begin a workflow for (re-)issuance of a SMART Health Card

An application begins the workflow by submitting a `.smart-health-card` JSON file as a `POST` body with `Content-type: application/json`. The `"verifiableCredential"` array of this JSON structure contains zero, one, or more SHC VCs as context for the re-issuance request. Any submitted credentials provide a contextual hint telling the issuer what SMART Health Card(s) the individual would like to re-issue. For example, in the case where an issuer key has been revoked, a now-invalid SHC would inform the issuer about what content the individual would like to have re-issued. If no context is required, the application MAY issue a `GET` to the `issuance` URL. Servers SHALL treat a `GET` as equivalent to a `POST` without context.

After processing any submitted context and saving any request details, the server generates an opaque interaction URL that acts as a handle for this request (i.e., a URL where the user can navigate to continue the re-issuance process). The server responds with a `303` status and a `Location` header containing the interaction URL.

The server SHALL ensure that no sensitive information can be derived from the interaction URL and SHALL ensure that any interaction URL bound to context has sufficient entropy to be unguessable (e.g., the 122 bits of entropy provided a V4 UUID would be suitable).

The issuer SHALL independently verify any claims before re-issuing a credential; it SHALL NOT simply trust and re-sign claims from client-supplied context.

By design, this protocol avoids putting SHCs appear in URLs, so they do not become part of a user's browser history.

## Example of re-issuance flow

### Configuration file

For an issuer with `iss` of `https://shc.example.org`, a file like the following would be hosted at `https://shc.example.org/.well-known/shc-configuration`:

```json
{
  "issuance": "https://shc.example.org/api/reissue"
}
```

## Reissuance request with a previous SHC as context

An app would `POST` to `https://shc.example.org/api/reissue` a request like:

```
POST /api/reissue
Content-type: application/json

{
  "verifiableCredential": [
    "eyJ6aXAiOiJERUYiLCJhbGciOiJFUzI1NiIsImtpZCI6IjNLZmRnLVh3UC03Z1h5eXd0VWZVQUR3QnVtRE9QS01ReC1pRUxMMTFXOXMifQ.3ZJLb9swEIT_SrC9ypKo1nGtW50CfRyKAk1zKXygqbXFgg-BpIS4gf57d2kHbYMkp5yq24rDjzND3oGOEVroUxpiW1VxQFVGK0PqUZrUl0qGLlZ4K-1gMFakHjFAAW63h1Zcvn4rlsvmUpTNsilgUtDeQToOCO2PP8yHuFenYcEDoZ7WaWtHp3_JpL17Vqj8pDuxhm0BKmCHLmlpvo27n6gSW9r3OtxgiMxp4U1Zl4J4_Hczus4gawJGPwaF19k-nBeKcxxQ3hiinZzQAeFIGYk8GvM9GBLc729rEtwPj4C_Uhzazx1KiyeItNoQD9450oSYzzjoCR33-Nn3PG9K2M4UcKcp_HuZmCXWS7GoxaKpYZ6LR92I5918-rfimGQaY47LF56QL2iSSmmHV77LBOU77Q7ZeDzGhPb8fuhmerMqfThU3GwVdVep6ZYAKu-Epl7BvJ0LGM4VZDt7DOjY298NksgrNYa8xGGvtT0hmhy45lhU1d4HS--RvUiVfGBkp-NgZK5zc3XxAR0GaS4--jjoJA0VRSUan76Mdsdboc6feLLB5r9ssFm_dIMrXpjp-w0.pI1qZajP6_D8PpWSTpEBijcbWW25N3qWTRnsccaS-i9pJ8devQShJwxFvU1E7ojgw0-PPV83OCHyQ9qu39tp7w"
  ]
}
```

And would receive a response like:

```
HTTP/1.1 303 See Other
Location: https://ui.example.org/continue/interact-123456
```

Finally, the application would open a browser context onto https://ui.example.org/continue/interact-123456   
to allow for user interaction with the issuer. At this endpoint the Issuer would provide a way for the end-user to authenticate and would proceed with re-issuance following the issuer's usual issuance practices. (If no `"verifiableCredential"` was provided as context, the issuer would also provide a way for the end-user to specify the details of her request.)


# Drawbacks

A protocol where SHCs are submitted to an endpoint opens an issuer to further attacks if their `.well-known` endpoint is compromised. If an attacker is able to advertise a malicious `issuance` endpoint, they could collect protected health information through externally submitted SHCs.

# Rationale and alternatives

* For issuers supporting SMART on FHIR based issuance, this workflow may be unnecessary
* For other issuers, focus on the entrypoint into a workflow rather than defining a complete process
* Allow issuers to apply their usual procedures for authentication, identity proofing, etc

# Prior art

More comprehensive APIs for the management of VCs are being developed at https://github.com/w3c-ccg/vc-api

# Unresolved questions

* Should we define a mechanism for issuers to (optionally) sign the properties in the configuration document, similar to https://datatracker.ietf.org/doc/html/rfc8414#section-2.1 ?

# Future possibilities

Defining a generic `.well-known/shc-configuration` endpoint allows for additional metadata to be published in the future (e.g., to publish logos, VC types, contact information, etc)
