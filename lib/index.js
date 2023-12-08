#!/usr/bin/env node
const { getConfig, printTimePassed, getInfo } = require('./utils/index.js');
const Installer = require('./installer');
const Dump = require('./dump.js');
const Database = require('./database.js');
const Initialize = require('./initialize.js');

const yargs = require('yargs');
const { hideBin } = require('yargs/helpers');

/** @var {yargs} argv - The command line arguments. */
const argv = yargs(hideBin(process.argv)).argv;

/** @var {WPMMconfig} config - The configuration object for the script. */
const config = getConfig(argv);

/** @var {number} startTime - the time at which the script started. */
const startTime = Date.now();

const actions = {
  info: () => {
    getInfo(config, actions);
  },
  dump: () => {
    const dump = new Dump(this);
    dump.init();
  },
  init: () => {
    const initializer = new Initialize(config);
    initializer.generateConfig();
  },
  'upload-database': () => {
    const db = new Database(config);
    db.uploadDatabase(config.database.filename).then(() => {
      console.log('🚀 Database uploaded successfully.');
    });
  },
  'dump-database': () => {
    const date = new Date().getUTCDate();
    const newDbName = `${config.wordpress.config_DB_Name}-${date}.sql.gz`;
    const db = new Database(config);
    db.dumpDatabase(newDbName).then(() => {
      console.log('🚀 Database dumped successfully to', newDbName, '.');
    });
  },
  default: () => {
    // Install WordPress
    const installer = new Installer(config);

    installer.run().then(() => {
      console.log('🚀 WordPress installed successfully.');
    });
  }
};

const action = Object.keys(argv).find(key => argv[key] === true);
(actions[action])();

printTimePassed(startTime);
process.exit(0);
