#!/usr/bin/env node

/* eslint-disable no-process-exit, no-empty */

const { program } = require('commander');
const dxtToPNG = require('./index.cjs');
const path = require('path');
const fs = require('fs');
const json = require('../package.json');

program
  .argument('[file]', 'input .dxt file')
  .option('-o, --output [value]', 'output file name')
  .option('-d, --directory', 'look cwd and convert all .dxt files')

program
  .version(json.version)
  .parse(process.argv);

const options = program.opts();

if (options.directory) {
  let dirLocation = path.resolve(process.cwd());
  let files = fs.readdirSync(dirLocation).filter(file => file.toLowerCase().endsWith('.dxt'));

  if (files.length == 0) {
    console.log('no .dxt files found!');
    return;
  }

  (async () => {
    let i = 0;
    for (let file of files) {
      i++;

      let location = path.resolve(dirLocation, file);
      let output = path.resolve(options.output ? options.output : path.dirname(location), path.basename(location, path.extname(location)) + '.png');

      try {
        let outCheck = fs.statSync(output);
        if (outCheck) {
          console.log(parseInt(i / files.length * 100) + '% | file is already converted skipping this one! ' + output)
          continue;
        }
      } catch (e) {

      }

      console.log(parseInt(i / files.length * 100) + '% | ', JSON.stringify(await dxtToPNG(location, output)));
    }

    console.log('I looked every file and I could converted %i of them', i);
  })().catch(x => console.error(x));

  return;
}

if (!program.args.length) return program.help();

let arg = program.args[0];
let location = path.resolve(arg);

let output = path.resolve(path.dirname(location), path.basename(location, '.dxt') + '.png');
if (options.output) {
  output = path.resolve(options.output);
}

try {
  let outCheck = fs.statSync(output);
  if (outCheck) {
    console.error('output file is already existed ' + output)
    process.exit(1);
  }
} catch (e) {

}

dxtToPNG(location, output).then(x => console.log(JSON.stringify(x))).catch(x => console.error(x))
