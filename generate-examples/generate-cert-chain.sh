#!/bin/bash
# This script generates a 3-cert ECDSA chain (root -> CA -> issuer) valid for 5 years.
# Leaf cert uses P-256 (as per the SMART Health Card Framework), CA and root CA use the
# increasingly stronger P-384 and P-521, respectively.

# directory where intermediate files are kept
tmpdir=certs
mkdir -p $tmpdir

# generate self-signed root CA cert
openssl req -x509 -new -newkey ec:<(openssl ecparam -name secp521r1) -keyout $tmpdir/root_CA.key -out $tmpdir/root_CA.crt -nodes -subj "/CN=SMART Health Card Example Root CA" -days 1825

# generate intermediate CA cert request
openssl req -new -newkey ec:<(openssl ecparam -name secp384r1) -keyout $tmpdir/CA.key -out $tmpdir/CA.csr -nodes -subj "/CN=SMART Health Card Example CA" -addext basicConstraints=critical,CA:true

# root CA signs the CA cert request
openssl x509 -req -in $tmpdir/CA.csr -out $tmpdir/CA.crt -CA $tmpdir/root_CA.crt -CAkey $tmpdir/root_CA.key -CAcreateserial -days 1825

# generate issuer signing cert request
openssl req -new -newkey ec:<(openssl ecparam -name prime256v1) -keyout $tmpdir/issuer.key -out $tmpdir/issuer.csr -nodes -subj "/CN=SMART Health Card Example Issuer" -addext keyUsage=digitalSignature

# intermediate CA signs the issuer cert request
openssl x509 -req -in $tmpdir/issuer.csr -out $tmpdir/issuer.crt -CA $tmpdir/CA.crt -CAkey $tmpdir/CA.key -CAcreateserial -days 1825
node src/certs-to-x5c.js --key $tmpdir/issuer.key --cert $tmpdir/issuer.crt --cert $tmpdir/CA.crt --cert $tmpdir/root_CA.crt --private src/config/issuer.jwks.private.json --public issuer/.well-known/jwks.json
