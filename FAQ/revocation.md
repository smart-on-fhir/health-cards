# Revocation FAQ (draft)

Starting from v1.2.0 of the SMART Health Card (SHC) framework, individual health cards issued by mistake can be revoked by listing its revocation identifier in an issuer's revocation list. Legacy health cards can use an external mechanism to derive a revocation identifier based on the health card's content; see the [legacy revocation methods](#legacy-revocation-methods) section.

## Main revocation method

### What should I use as a revocation identifier?

Issuers that keep track of every single issued SHC could create a per-SHC `rid` for fine-grained revocation. In many cases, an issuer will have an internal user ID that can be used to revoke all cards belonging to a particular user; using the timestamp feature allows an issue to invalidate cards up to a certain time.

### Why is a one-way transformation on the user ID recommended for revocation ID?

Publishing an internal user ID might be a privacy issue. A one-way transform with high-entropy input prevents reversal of the CRL’s content. The proposed HMAC-SHA-256 algorithm using a 256-bit key achieves that.

### Why are Card Revocation Lists tied to a key identifier?

Since SHC don’t have expiry dates, public keys and revocation information must be publicly available forever. Creating a per-kid CRL allows issuers to cap the size of CRLs, and verifier apps might not need to download the CRLs of old keys when the corresponding SHCs are replaced by newer ones.

### Why is there a limit on the size of the revocation ID?

Per-design, SHC are small to fit into QR codes. Moreover, verifier applications might need to store the aggregated revocation information from many issuers; capping the `rid` size therefore limits the bandwidth and storage requirements of verifiers.

The recommended methods of taking the base64url encoding of the b4-bit truncated HMAC-SHA-256 output results in 11 characters. The 24-character limit allows the encoding of 128-bit values in base64url, if required by an issuer.

## Legacy revocation methods

Note: This section will contain information about the legacy methods once these are specified.

### Why are the legacy methods specified externally?

The legacy methods must derive a revocation ID based on the SHC content. Since the revocation IDs are publicly published, it is inevitable to prevent a determined attacker with sufficient resources from guessing the correct data leading to a particular revocation ID. Since this has privacy implications, each issuer must decide on the appropriate method to use in their jurisdiction.







