const crypto = require('crypto');

const DEFAULT_CIPHER_STRING = 'owsd9012%$1as!wpow1033b%!@%12';

const BLOCK_SIZE = {
  0x31545844: 8,  // DXT1
  0x32545844: 16, // DXT2
  0x33545844: 16, // DXT3
  0x34545844: 16, // DXT4
  0x35545844: 16  // DXT5
};

const BYTES_PER_PIXEL = {
  20: 3, // R8G8B8
  21: 4, // A8R8G8B8
  22: 4, // X8R8G8B8
  23: 2, // R5G6B5
  24: 2, // X1R5G5B5
  25: 2, // A1R5G5B5
  26: 2  // A4R4G4B4
};

function deriveKey(cipherString) {
  const cipher = Buffer.isBuffer(cipherString)
    ? cipherString
    : Buffer.from(cipherString || DEFAULT_CIPHER_STRING, 'latin1');

  // CryptDeriveKey(CALG_RC4, SHA1(cipherString), 0x800000)
  return crypto.createHash('sha1').update(cipher).digest().slice(0, 16);
}

function rc4(key, input) {
  const state = new Uint8Array(256);
  let j = 0;

  for (let i = 0; i < state.length; i++) state[i] = i;
  for (let i = 0; i < state.length; i++) {
    j = (j + state[i] + key[i % key.length]) & 0xff;
    const value = state[i];
    state[i] = state[j];
    state[j] = value;
  }

  const output = Buffer.allocUnsafe(input.length);
  let i = 0;
  j = 0;
  for (let offset = 0; offset < input.length; offset++) {
    i = (i + 1) & 0xff;
    j = (j + state[i]) & 0xff;
    const value = state[i];
    state[i] = state[j];
    state[j] = value;
    output[offset] = input[offset] ^ state[(state[i] + state[j]) & 0xff];
  }

  return output;
}

function topLevelSize(width, height, format) {
  if (BLOCK_SIZE[format]) {
    return Math.max(1, Math.ceil(width / 4)) *
      Math.max(1, Math.ceil(height / 4)) * BLOCK_SIZE[format];
  }

  if (BYTES_PER_PIXEL[format]) {
    return width * height * BYTES_PER_PIXEL[format];
  }

  return 0;
}

function decryptTextureData(version, width, height, format, payload, cipherString) {
  // Version 4 is plain. Knight Online only encrypts version 7 textures.
  if (version !== 7) return payload;

  const key = deriveKey(cipherString);
  const size = topLevelSize(width, height, format);
  if (!size || payload.length < size) {
    throw new Error('Encrypted texture pixel data is truncated or has an unsupported format');
  }

  let decrypted;
  if (BLOCK_SIZE[format]) {
    // CryptoAPI was called once per mip level with Final=TRUE, so RC4 restarts
    // for every level. The converter only consumes the first level.
    decrypted = rc4(key, payload.slice(0, size));
  } else {
    // Uncompressed textures were read one scanline at a time, resetting RC4
    // after every row.
    const stride = width * BYTES_PER_PIXEL[format];
    decrypted = Buffer.allocUnsafe(size);
    for (let offset = 0; offset < size; offset += stride) {
      rc4(key, payload.slice(offset, offset + stride)).copy(decrypted, offset);
    }
  }

  return payload.length === size
    ? decrypted
    : Buffer.concat([decrypted, payload.slice(size)]);
}

module.exports = {
  DEFAULT_CIPHER_STRING,
  decryptTextureData,
  deriveKey,
  rc4,
  topLevelSize
};
