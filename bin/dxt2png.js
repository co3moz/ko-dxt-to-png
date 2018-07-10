#!/usr/bin/env node
/* eslint-disable no-process-exit, no-empty */

const program = require('commander');
const dxt2png = require('../lib/dxt2png');
const path = require('path');
const fs = require('fs');

program
  .usage('<file>')
  .option('-o, --output', 'output file name')

program
  .version('1.0.1')
  .parse(process.argv);


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
} catch(e) {

}

dxt2png(location, output).then(x => console.log(x)).catch(x => console.error(x))
