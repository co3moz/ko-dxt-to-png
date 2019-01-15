const fs = require('fs');
const path = require('path');
const onlyBuffer = require('../lib/onlyBuffer');

(async () => {
  let files = await new Promise((resolve, reject) => fs.readdir(__dirname, (err, files) => err ? reject(err) : resolve(files)));

  for (let file of files) {
    if (!file.endsWith('.dxt')) continue;
    if (file.endsWith('tga.dxt')) continue;

    let data = await new Promise((resolve, reject) => {
      fs.readFile(path.resolve(__dirname, file), (err, buffer) => {
        if (err) return reject(err);

        onlyBuffer(buffer)
          .then(x => resolve(x))
          .catch(x => reject(x))
      });
    });

    console.log('done %s, name: "%s", format: %s, width: %d, height: %d, size: %s', file, data.name, data.format, data.width, data.height, data.buffer.length);
  }
})().catch(err => {
  console.error('TEST FAILED!');
  console.error(err);
  // eslint-disable-next-line no-process-exit
  process.exit(1);
});