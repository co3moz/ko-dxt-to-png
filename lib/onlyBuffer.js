const dxt = require('dxt-js');
const { PNG } = require('node-png');

module.exports = function bufferDxt2Png(buffer) {
  return new Promise((resolve, reject) => {
    let offset = 0;
    let nameLength = buffer.readInt32LE(offset);
    offset += 4;

    if (nameLength > 200) return reject(new Error('name cannot be longer than 200, probably this file is not dxt, len: ' + nameLength))

    let name = buffer.slice(offset, offset + nameLength).toString();
    offset += nameLength;

    offset += 4; // skip the NTF thing

    let width = buffer.readInt32LE(offset);
    offset += 4;

    let height = buffer.readInt32LE(offset);
    offset += 4;

    if (width > 2048 || height > 2048) return reject(new Error('max resolution is 2048x2048, cannot have this much texture width: ' + width + ', height: ' + height));

    let typeData = buffer.slice(offset, offset + 8);
    offset += 8;

    let crop = buffer.slice(offset);
    let format = 'unknown';

    if (typeData.toString().indexOf('DXT1') != -1) {
      crop = dxt.decompress(crop, width, height, dxt.flags.DXT1);
      crop = Buffer.from(crop);
      format = 'dxt1';
    } else if (typeData.toString().indexOf('DXT3') != -1) {
      crop = dxt.decompress(crop, width, height, dxt.flags.DXT3);
      crop = Buffer.from(crop);
      format = 'dxt3';
    } else if (typeData.toString().indexOf('DXT5') != -1) {
      crop = dxt.decompress(crop, width, height, dxt.flags.DXT5);
      crop = Buffer.from(crop);
      format = 'dxt5';
    } else if (typeData[0] == 21) { // a8r8g8b8
      for (let i = 0; i < crop.length; i += 4) {
        let t = crop[i + 2];
        crop[i + 2] = crop[i];
        crop[i] = t;
      }
      format = 'a8r8g8b8';
    } else if (typeData[0] == 22) { // x8r8g8b8
      for (let i = 0; i < crop.length; i += 4) {
        let t = crop[i + 2];
        crop[i + 2] = crop[i];
        crop[i] = t;
        crop[i + 3] = 255
      }
      format = 'x8r8g8b8';
    } else if (typeData[0] == 25) { // a1r5g5b5
      let temp = Buffer.allocUnsafe(crop.length * 2); // 16 bit -> 32 bit
      let k = 0;
      for (let i = 0; i < crop.length; i += 2) {
        let a = (crop[i + 1] << 8) + crop[i];

        temp[k++] = ((a >> 10) & 0b11111) << 3;
        temp[k++] = ((a >> 5) & 0b11111) << 3;
        temp[k++] = (a & 0b11111) << 3;
        temp[k++] = a >> 15 ? 255 : 0;
      }
      crop = temp;
      format = 'a1r5g5b5';
    } else if (typeData[0] == 26) { // a4r4g4b4
      let temp = Buffer.allocUnsafe(crop.length * 2);  // 16 bit -> 32 bit
      let k = 0;
      for (let i = 0; i < crop.length; i += 2) {
        let a = (crop[i + 1] << 8) + crop[i];

        temp[k++] = ((a >> 8) & 0xf) << 4;
        temp[k++] = ((a >> 4) & 0xf) << 4;
        temp[k++] = (a & 0xf) << 4;
        temp[k++] = a >> 8;
      }
      crop = temp;
      format = 'a4r4g4b4';
    } else {
      return reject(new Error('Unsupported file! type data [' + typeData.join(', ') + ']'));
    }

    

    let png = new PNG({
      width, height
    });

    png.data = crop;

    var bufList = [];
    png.pack().on('data', function (buf) {
      bufList.push(buf);
    }).on('error', function (error) {
      reject(error)
    }).on('end', function () {
      resolve({ name, format, width, height, buffer: Buffer.concat(bufList) });
    });
  });
}