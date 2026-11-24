(async () => {
  hook();
  require('../src/bin.js');
})().catch(err => {
  console.error('TEST FAILED!');
  console.error(err);
  // eslint-disable-next-line no-process-exit
  process.exit(1);
});

function hook() {
  process.cwd = () => __dirname;
  process.argv = [
    '',
    '',
    '-d',
    '-o',
    'results'
  ];
}