const glob = require('glob');
const path = require('path');
const dxt2png = require('../dxt2png');

(async () => {
  let files = await new Promise((resolve, reject) => glob('./**/*.dxt', (err, files) => err ? reject(err) : resolve(files)));

  for (let file of files) {
    console.log(file, await dxt2png(file, path.resolve(__dirname, './results/', path.basename(file, '.dxt') + '.png')))
  }
})().catch(err => {
  console.error('TEST FAILED!');
  console.error(err);
  process.exit(1);
});