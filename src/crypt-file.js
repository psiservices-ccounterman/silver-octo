#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const parseArgs = require('minimist');
const crypto = require('crypto');
const zlib = require('zlib');

const prog = process.argv[1];
const argv = parseArgs(process.argv.slice(2), {});

if (
  argv.help ||
  argv.h ||
  (typeof argv.plain === 'undefined' && typeof argv.encrypted === 'undefined') ||
  (typeof argv.plain !== 'undefined' && typeof argv.encrypted !== 'undefined')
) {
  process.stderr.write(`${path.basename(prog)}
  --encrypted filename
  --plain filename
  --out filename
  --public filename
  --private filename

One and only one of --encrypted or --plain may be specified.
`);
  process.exit(0);
}

let encryptedFile = argv.encrypted;
let publicKeyFile = argv.public;
let privateKeyFile = argv.private;
let plainFile = argv.plain;
let outFile = argv.out;

if (typeof privateKeyFile !== 'string') {
  privateKeyFile = `secure-browser-privkey.pem`;
}
if (typeof publicKeyFile !== 'string') {
  publicKeyFile = `admin-pubkey.pem`;
}

if (typeof outFile !== 'string') {
  outFile = `-`;
}

let encrypt = true;

if (typeof encryptedFile === 'string') {
  process.stderr.write(`Decrypting ${encryptedFile}\n`);
  encrypt = false;
}
if (typeof plainFile === 'string') {
  process.stderr.write(`Encrypting ${plainFile}\n`);
  encrypt = true;
}

process.stderr.write(`Key files ${publicKeyFile} and ${privateKeyFile}
Output: ${outFile}
`);

const publicKey = fs.readFileSync(publicKeyFile);

const privateKey = fs.readFileSync(privateKeyFile);

// Like openssl rsautl -decrypt -inkey alice/privkey.pem  -in xaa.1 -out xaa.1d -oaep

if (!encrypt) {
  const fBuffer = fs.readFileSync(encryptedFile);
  process.stderr.write(`readSignedEncryptedJson read ${fBuffer.length} bytes\n`);

  try {
    const signedEncryptedSum = fBuffer.subarray(0, 512);
    const part1 = signedEncryptedSum.subarray(0, 256);
    const part2 = signedEncryptedSum.subarray(256);

    const keyEncrypted = fBuffer.subarray(512, 768);
    const dataAndNonce = fBuffer.subarray(768);

    const d1 = crypto.privateDecrypt(privateKey.toString(), part1);
    const d2 = crypto.privateDecrypt(privateKey.toString(), part2);
    const key = crypto.privateDecrypt(privateKey.toString(), keyEncrypted);

    const verify = crypto.createVerify('SHA256');
    const nonce = Buffer.from('            ');
    dataAndNonce.copy(nonce, 0, 0, 6);
    dataAndNonce.copy(nonce, 6, dataAndNonce.length - 6, dataAndNonce.length);

    const tag = Buffer.from('                ');
    dataAndNonce.copy(tag, 0, dataAndNonce.length - 16 - 6, dataAndNonce.length - 6);
    const cipherText = dataAndNonce.subarray(6, dataAndNonce.length - 6 - 16);

    const decipher = crypto.createDecipheriv('aes-256-gcm', key, nonce);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([decipher.update(cipherText), decipher.final()]);

    verify.update(decrypted);

    if (!verify.verify(publicKey.toString(), Buffer.concat([d1, d2]))) {
      // throw ('signature validation error');
      fs.writeFileSync(outFile, '');
    }
    const unData = zlib.gunzipSync(decrypted);
    fs.writeFileSync(outFile, unData);
  } catch (error) {
    throw new Error(`Error decrypting readSignedEncryptedJson file: ${error.message}`);
    // return null;
  }
} else {
  let data = fs.readFileSync(plainFile);
  let zData = zlib.gzipSync(data);
  let nonce = crypto.randomBytes(12);
  let key = crypto.randomBytes(32);
  let cipher = crypto.createCipheriv('aes-256-gcm', key, nonce);
  let encrypted = Buffer.concat([nonce.subarray(0, 6), cipher.update(zData), cipher.final(), cipher.getAuthTag(), nonce.subarray(6, 12)]);

  const sign = crypto.createSign('SHA256');
  sign.update(zData);
  let mySig = sign.sign(privateKey.toString());

  let pubEnc = Buffer.concat([
    crypto.publicEncrypt(publicKey.toString(), mySig.subarray(0, 128)),
    crypto.publicEncrypt(publicKey.toString(), mySig.subarray(128)),
    crypto.publicEncrypt(publicKey.toString(), key),
    encrypted,
  ]);
  fs.writeFileSync(outFile, pubEnc);
}
