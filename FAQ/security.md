# Security FAQ (Draft)

## Issuer

### Can someone steal my keys?

The issuer private keys must be generated, stored, and protected with great care, same as with PKI keys. The OWASP key management [cheat sheet](https://cheatsheetseries.owasp.org/cheatsheets/Key_Management_Cheat_Sheet.html) provide guidance on these items. To lower the risk of a key compromise, it is recommended to rotate issuance keys every year.

### Can someone pretend to be me?

Health cards are digitally signed, using strong, state-of-the-art cryptographic algorithms. Health card forgery is only possible if someone
1. gains access to the issuer private key(s),
2. takes control of the issuer endpoint (encoded in the health card) and replaces the public key set with a fake one, or
3. modifies the issuer’s information in a trust framework directory.

### Can a rogue insider start issuing health cards?

Anyone with access to the issuer private keys can issue health cards under the issuer’s identity. Make sure these are generated, stored, and protected adequately. The OWASP key management [cheat sheet](https://cheatsheetseries.owasp.org/cheatsheets/Key_Management_Cheat_Sheet.html) provide guidance on these items. To reduce the risk of insider threats, an issuer should have good audit practices, and log when a health card is issued, and by which employee.

### I found fraudulent health cards falsely issued under my name, what should I do?

Is the key used to issue these fraudulent health cards still in your published issuer public key set? If so, you need to retire that key immediately: delete the public key in the published key set and the corresponding private key. This will also invalidate all real cards issued under that key; contact your users to help them get a new health card.

If you don't recognize the key, are they tricking verifiers into thinking you are part of the same organization? Has the rogue key been listed as trusted in a trust framework? If so, follow the framework's method to have it removed.

### I’m changing my keys, will my previously issued health cards still be valid?

Expired private keys should be deleted, the corresponding public keys should stay in the issuer published key set to allow verifiers to validate health cards issued using them. Revoked private keys (compromised, issued in error, etc.) should be deleted and removed from the published key set.

## User

### Can someone steal my health card?

A health card (digital file or paper QR code) is a “bearer” credential, anyone holding it can present it. Since all the contents of the health card is presented to verifiers, an attacker would need to have matching identifying information to use it illegitimately.

### What if I lose my health card?

A health card file is a normal file, you can make back-ups. The QR code on a paper card contains all the digitally signed information to present to a verifier; presenting a backup photocopy or a picture of the QR code is enough for a verifier to validate the health card information.

### Am I disclosing too much information when presenting a health card?

All the content of the health card is disclosed when presenting it. Issuers, wallet applications, and QR paper cards should clearly indicate what information is encoded and disclosed when presenting a health card.

## Verifier

### How do I recognize forged health cards?

Health cards are digitally signed, using strong, state-of-the-art cryptographic algorithms. It is infeasible to forge a health card without compromising a trusted issuer private key, and to modify one without invalidating its signature. Never relies solely on the textual elements of a paper card or a wallet app, always verify the cryptographic signature protecting the health card.

### How can I trust the issuer of a health card?

The specified validation steps ensure that a presented health card was properly signed by an issuer key. How to trust that key is application/organization specific. It most cases, issuers will be part of a trust framework that verifiers will choose to accept (like how merchants accept Visa, Mastercard, AMEX). Verifiers therefore need to make sure the signing key is a valid identity in the frameworks they accept. For keys part of a directory-based trust framework, make sure the key is part of the trusted directory. For keys part of a PKI-based trust framework, make sure that:
1. the JSON key matches the key in the PKI certificate,
2. the PKI certificate chain is valid (not expired at card issuance time, nor revoked),
3. the PKI certificate chain roots into a trusted identity.
