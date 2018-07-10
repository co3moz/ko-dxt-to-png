#!/usr/bin/env node
/* eslint-disable no-process-exit, no-empty */

const program = require('commander');
const dxt2png = require('../lib/dxt2png');
const path = require('path');
const fs = require('fs');

program
  .usage('<file>')
  .option('-o, --output', 'output file name')
  .option('-d, --directory', 'look cwd and convert all .dxt files')

program
  .version('1.1.0')
  .parse(process.argv);

if (program.directory) {
  let dirLocation = path.resolve(process.cwd());
  let files = fs.readdirSync(dirLocation).filter(file => file.endsWith('.dxt'));

  if (files.length == 0) {
    console.log('no .dxt files found!');
    return;
  }

  (async () => {
    let i = 0;
    for (let file of files) {
      i++;

      let location = path.resolve(dirLocation, file);
      let output = path.resolve(path.dirname(location), path.basename(location, '.dxt') + '.png');

      try {
        let outCheck = fs.statSync(output);
        if (outCheck) {
          console.log(parseInt(i / files.length * 100) + '% | file is already converted skipping this one! ' + output)
          continue;
        }
      } catch (e) {

      }

      console.log(parseInt(i / files.length * 100) + '% | ', await dxt2png(location, output));
    }

    console.log('I looked every file and I could converted %i of them', i);
  })().catch(x => console.error(x));

  return;
}

if (!program.args.length) return program.help();

let arg = program.args[0];
let location = path.resolve(arg);
let output = path.resolve(path.dirname(location), path.basename(location, '.dxt') + '.png');
if (program.output) {
  output = path.resolve(program.output);
}
try {
  let outCheck = fs.statSync(output);
  if (outCheck) {
    console.error('output file is already existed ' + output)
    process.exit(1);
  }
} catch (e) {

}

dxt2png(location, output).then(x => console.log(x)).catch(x => console.error(x))
