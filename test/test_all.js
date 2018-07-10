const fs = require('fs');
const path = require('path');
const dxt2png = require('../lib/dxt2png');

(async () => {
  let files = await new Promise((resolve, reject) => fs.readdir(__dirname, (err, files) => err ? reject(err) : resolve(files)));

  for (let file of files) {
    if (!file.endsWith('.dxt')) continue;
    console.log(await dxt2png(path.resolve(__dirname, file), path.resolve(__dirname, './results/', path.basename(file, '.dxt') + '.png')))
  }
})().catch(err => {
  console.error('TEST FAILED!');
  console.error(err);
  // eslint-disable-next-line no-process-exit
  process.exit(1);
});