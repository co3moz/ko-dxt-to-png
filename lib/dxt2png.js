const dxt = require('dxt-js');
const fs = require('fs');
const path = require('path');
const { PNG } = require('node-png');

const TGA = require('tga');
const tgaSignature = 'TRUEVISION-XFILE.';

module.exports = function dxt2png(file, outputLocation) {
  return new Promise((resolve, reject) => {
    fs.readFile(file, (err, buffer) => {
      if (err) return reject(err);

      if (buffer.slice(buffer.length - tgaSignature.length - 1, buffer.length - 1).toString() == tgaSignature) {
        let tga = new TGA(buffer);

        let png = new PNG({
          width: tga.width, height: tga.height
        });

        png.data = Buffer.from(tga.pixels);

        png.pack().pipe(fs.createWriteStream(path.resolve(outputLocation)))
          .on('error', function (error) {
            reject(error)
          })
          .on('finish', function () {
            resolve({ file, name: '', format: 'tga', width: tga.width, height: tga.height });
          });

        return;
      }

      let offset = 0;
      let nameLength = buffer.readInt32LE(offset);
      offset += 4;

      if (nameLength > 200) return reject(new Error('name cannot be longer than 200, probably this file is invalid, len: ' + nameLength))

      let name = buffer.slice(offset, offset + nameLength).toString();
      offset += nameLength;

      offset += 4; // skip the NTF thing

      let width = buffer.readInt32LE(offset);
      offset += 4;

      let height = buffer.readInt32LE(offset);
      offset += 4;

      if (width > 8096 || height > 8096) return reject(new Error('this game is too old, cannot have this much texture width: ' + width + ', height: ' + height));

      let typeData = buffer.slice(offset, offset + 8);
      offset += 8;

      let crop = buffer.slice(offset);
      let format = 'unknown';

      if (typeData.toString().indexOf('DXT1') != -1) {
        crop = dxt.decompress(crop, width, height, dxt.flags.DXT1);
        format = 'dxt1';
      } else if (typeData.toString().indexOf('DXT3') != -1) {
        crop = dxt.decompress(crop, width, height, dxt.flags.DXT3);
        format = 'dxt3';
      } else if (typeData.toString().indexOf('DXT5') != -1) {
        crop = dxt.decompress(crop, width, height, dxt.flags.DXT5);
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
        return reject(new Error('Unsupported file! [' + typeData.join(', ') + ']'));
      }



      let png = new PNG({
        width, height
      });

      png.data = crop;

      png.pack().pipe(fs.createWriteStream(path.resolve(outputLocation)))
        .on('error', function (error) {
          reject(error)
        })
        .on('finish', function () {
          resolve({ file, name, format, width, height });
        });
    });
  });
}