#!/bin/bash
# This script generates a 3-cert ECDSA chain (root -> CA -> issuer).
# Leaf cert uses P-256 and is valid for 1 year (as per the SMART Health Card Framework),
# CA and root CA use the increasingly stronger P-384 and P-521, and are valid for
# 5 and 10 years, respectively.

# directory where intermediate files are kept
tmpdir=certs
mkdir -p $tmpdir

# generate self-signed root CA cert
openssl req -x509 -new -newkey ec:<(openssl ecparam -name secp521r1) -keyout $tmpdir/root_CA.key -out $tmpdir/root_CA.crt -nodes -subj "/CN=SMART Health Card Example Root CA" -days 3650 -config openssl_ca.cnf -extensions v3_ca -sha512

# generate intermediate CA cert request
openssl req -new -newkey ec:<(openssl ecparam -name secp384r1) -keyout $tmpdir/CA.key -out $tmpdir/CA.csr -nodes -subj "/CN=SMART Health Card Example CA" -config openssl_ca.cnf -extensions v3_ca -sha384

# root CA signs the CA cert request
openssl x509 -req -in $tmpdir/CA.csr -out $tmpdir/CA.crt -CA $tmpdir/root_CA.crt -CAkey $tmpdir/root_CA.key -CAcreateserial -days 1825 -extfile openssl_ca.cnf -extensions v3_ca -sha512

# generate issuer signing cert request
openssl req -new -newkey ec:<(openssl ecparam -name prime256v1) -keyout $tmpdir/issuer.key -out $tmpdir/issuer.csr -nodes -subj "/CN=SMART Health Card Example Issuer" -config openssl_ca.cnf -extensions v3_issuer -sha256

# intermediate CA signs the issuer cert request
openssl x509 -req -in $tmpdir/issuer.csr -out $tmpdir/issuer.crt -CA $tmpdir/CA.crt -CAkey $tmpdir/CA.key -CAcreateserial -days 365 -extfile openssl_ca.cnf -extensions v3_issuer -sha384

# add the issuer key to the JWK sets 
node src/certs-to-x5c.js --key $tmpdir/issuer.key --cert $tmpdir/issuer.crt --cert $tmpdir/CA.crt --cert $tmpdir/root_CA.crt --private src/config/issuer.jwks.private.json --public issuer/.well-known/jwks.json
