- Feature Name: `reissuance-endpoint`
- Start Date: 2021-11-30
- Status: Draft for comment
  
# Summary

Sometimes circumstances might leave an individual holding an invalid SMART Health Card -- e.g., the issuer may have revoked a compromised signing key or an erroneous card. A lightweight, standardized entrypoint into a re-issuance flow can smooth over some of the pain when this happens.

# Motivation

We should empower individuals to obtain a valid card in cases where (owing to circumstances beyond the individual's control) their card may have been invalidated by the issuer.

# Guide-level explanation

Issuers can publish a JSON file with their `issuance` endpoint, if they support this feature. Users can navigate to the (re)issuance site (e.g., with help from a mobile health wallet app), optionally passing along a now-invalid SMART Health Card for context. At this site, the issuer provides a UX that the individual can use to request (re-)issuance of a SMART Health Card.

# Reference-level explanation

Issuers supporting this feature SHALL host a `<<Issuer URI>>/.well-known/smart-health-cards-configuration` JSON file including:

* `issuance`: URL of a site that where individuals can request (re-)issuance of a SMART Health Card

A consumer can navigate to the issuance URL (generally with help from a wallet app, but this is not necessary for the protocol) to begin the workflow. Optionally a fragment MAY be appended to the URL including the contents of a `.smart-health-card` JSON file as a contextual hint telling the issuer what SMART Health Card(s) the individual would like to receive. For example, in the case where an issuer key has been revoked, a now-invalid SHC would inform the issuer about what content the individual would like to have re-issued.
To append a fragment:

1. Begin with one or more SMART Health Cards that provide context for the request
2. Represent these SMART Health Cards as a minified JSON string following the `.smart-health-card` file format -- e.g. `{"verifiableCredential": ["eyJ6aXA..."]}`
3. URLencode this string
4. Append `#` and the encoded string to the issuance URL

## Example of re-issuance flow

### Published onfiguration file

For an issuer with `iss` of `https://shc.example.org`, a file like the following would be hosted at `https://shc.example.org/.well-known/smart-health-cards-configuration`:

```json
{
  "issuance": "https://reissue.example.org/request"
}
```

## Reissuance request with no context

An individual could navigate to:

    https://reissue.example.org/request
    
to begin the process of requesting (re-)issuance of a SMART Helath Card with no context. At this endpoint the Issuer would provide a way for the end-user to authenticate and specify the details of her request, following the issuer's usual issuance practices.


## Reissuance request with a previous SHC as context

Using the example value from https://spec.smarthealth.cards/examples/#example-0 as context, an individual could navigate to:

    https://reissue.example.org/request#%7B%22verifiableCredential%22%3A%5B%22eyJ6aXAiOiJERUYiLCJhbGciOiJFUzI1NiIsImtpZCI6IjNLZmRnLVh3UC03Z1h5eXd0VWZVQUR3QnVtRE9QS01ReC1pRUxMMTFXOXMifQ.3ZJLb9swEIT_SrC9ypKo1nGtW50CfRyKAk1zKXygqbXFgg-BpIS4gf57d2kHbYMkp5yq24rDjzND3oGOEVroUxpiW1VxQFVGK0PqUZrUl0qGLlZ4K-1gMFakHjFAAW63h1Zcvn4rlsvmUpTNsilgUtDeQToOCO2PP8yHuFenYcEDoZ7WaWtHp3_JpL17Vqj8pDuxhm0BKmCHLmlpvo27n6gSW9r3OtxgiMxp4U1Zl4J4_Hczus4gawJGPwaF19k-nBeKcxxQ3hiinZzQAeFIGYk8GvM9GBLc729rEtwPj4C_Uhzazx1KiyeItNoQD9450oSYzzjoCR33-Nn3PG9K2M4UcKcp_HuZmCXWS7GoxaKpYZ6LR92I5918-rfimGQaY47LF56QL2iSSmmHV77LBOU77Q7ZeDzGhPb8fuhmerMqfThU3GwVdVep6ZYAKu-Epl7BvJ0LGM4VZDt7DOjY298NksgrNYa8xGGvtT0hmhy45lhU1d4HS--RvUiVfGBkp-NgZK5zc3XxAR0GaS4--jjoJA0VRSUan76Mdsdboc6feLLB5r9ssFm_dIMrXpjp-w0.pI1qZajP6_D8PpWSTpEBijcbWW25N3qWTRnsccaS-i9pJ8devQShJwxFvU1E7ojgw0-PPV83OCHyQ9qu39tp7w%22%5D%7D`
    

to request re-issuance of a previously expired SHC. At this endpoint the Issuer would provide a way for the end-user to authenticate and would proceed with re-issuance following the isuer's usual issuance practices.



# Drawbacks

A protocol where SHCs are submitted to an endpoint opens an issuer to further attacks if their `.well-known` endpoint is compromised (i.e. if an attacker can insert a configuration file at that endpoint). If an attacker is able to advertise a malicious `issuance` endpoint, they could collect protected health information through externally submitted SHCs.

# Rationale and alternatives

* For issuers supporting SMART on FHIR based issuance, this workflow may be unnecessary
* For other issuers, focus on the entrypoint into a workflow rather than defining a complete process
* Allow issuers to apply their usual procedures for authentication, identity proofing, etc

# Prior art

More comprehensive APIs for the management of VCs are being developed at https://github.com/w3c-ccg/vc-api

# Unresolved questions

* Should we include context as a fragment (`#`) or a query parameter (`?context=`) or via POST?
  * Fragment means data never *needs* to be submitted to a server (but is accessible to JS provided by the issuer)
  * POST would prevent data from appearing in browser history (but well-written JS could use `replaceState` to avoid this, too)
  * POST is unlikely to work well in wallet-app-to-browser redirect scenarios  

# Future possibilities

Defining a generic `.well-known/smart-health-cards-configuration` endpoint allows for additional metadata to be published in the future
