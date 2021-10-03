# QR Code FAQ

### JWS Max Length for V22 QR at Various Error Correction Levels

A single, non-chunked Version 22 SMART Health Card QR contains two segments
* The first Byte mode segment (`shc:/`) always has 20 header bits and 40 data bits for a total of 60 bits.[<sup>1</sup>](https://www.nayuki.io/page/optimal-text-segmentation-for-qr-codes)
* The second segment (the numeric encoded QR code) always has 16 header bits and a variable number of data bits depending on the QR code length.[<sup>1</sup>](https://www.nayuki.io/page/optimal-text-segmentation-for-qr-codes)

The max JWS size that can fit in a single Version 22 QR code depends on the remaining space, which depends on the error correction used.

76 bits are already reserved for the required segment headers and `shc:/` prefix. The following table lists the total number of bits a Version 22 QR Code can contain.


| Error Correction Level | Total data bits for V22 QR |
| ------------- | ------------- |
| Low  | 8048  |
| Medium  | 6256  |
| Quartile  | 4544  |
| High  | 3536  |

[<sup>2 (Table Source)</sup>](https://www.qrcode.com/en/about/version.html)


Each JWS character is encoded into two numeric characters (As described in [Encoding Chunks as QR codes](https://spec.smarthealth.cards/#encoding-chunks-as-qr-codes))
and each numeric character requires 20/6 bits.[<sup>1</sup>](https://www.nayuki.io/page/optimal-text-segmentation-for-qr-codes)

Thus we can determine the maximum JWS size for each error correction with the following:

JWS Size
=  ((Total Data Bits - 76 bits reserved) * 6/20 bits per numeric character * 1/2 JWS character per numeric character
= (Total Data Bits - 76)*3/20

The results of the above rounded down to the nearest integer number of characters gives:

| Error Correction Level | Max JWS Length for V22 QR |
| ------------- | ------------- |
| Low  | 1195  |
| Medium  | 927  |
| Quartile  | 670  |
| High  | 519  |

**References:**
1. [Project Nayuki: Optimal text segmentation for QR Codes](https://www.nayuki.io/page/optimal-text-segmentation-for-qr-codes)
2. [QR Code capacities](https://www.qrcode.com/en/about/version.html)
