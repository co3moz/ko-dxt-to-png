const fs = require('fs');
const path = require('path');
const assert = require('assert');
const crypto = require('crypto');
const { PNG } = require('pngjs');
const dxt2png = require('../src');
const { decryptTextureData, deriveKey, rc4 } = require('../src/decryption');

const expectedPixelHashes = {
  'encrypted.itemicon_8_9024_00_0.dxt': '568edbdaa25482d8648ef8ea3b992870df994692db9a21f90fbea8daf1b431ad',
  'encrypted.re_inventory02.dxt': '5d9b8349eb660dfd2bc50dd23a2792f355e52a169a67d54791a97bdb8ae7ddb2'
};

function readPng(file) {
  return new Promise((resolve, reject) => {
    new PNG().parse(fs.readFileSync(file), (err, png) => err ? reject(err) : resolve(png));
  });
}

(async () => {
  const key = deriveKey();
  const compressedPixels = Buffer.from('0011223344556677', 'hex');
  assert.deepStrictEqual(
    decryptTextureData(7, 4, 4, 0x31545844, rc4(key, compressedPixels)),
    compressedPixels
  );

  const row1 = Buffer.from('0011223344556677', 'hex');
  const row2 = Buffer.from('8899aabbccddeeff', 'hex');
  const encryptedRows = Buffer.concat([rc4(key, row1), rc4(key, row2)]);
  assert.deepStrictEqual(
    decryptTextureData(7, 2, 2, 21, encryptedRows),
    Buffer.concat([row1, row2])
  );
  assert.strictEqual(decryptTextureData(4, 2, 2, 21, encryptedRows), encryptedRows);

  let files = await new Promise((resolve, reject) => fs.readdir(__dirname, (err, files) => err ? reject(err) : resolve(files)));

  for (let file of files) {
    if (!file.startsWith('encrypted.')) continue;
    if (!file.endsWith('.dxt')) continue;
    const output = path.resolve(__dirname, './results/', path.basename(file, '.dxt') + '.png');
    console.log(await dxt2png(path.resolve(__dirname, file), output));

    const png = await readPng(output);
    const pixelHash = crypto.createHash('sha256').update(png.data).digest('hex');
    assert.strictEqual(pixelHash, expectedPixelHashes[file], file + ' pixels do not match the known decrypted image');
  }
})().catch(err => {
  console.error('TEST FAILED!');
  console.error(err);
  // eslint-disable-next-line no-process-exit
  process.exit(1);
});
