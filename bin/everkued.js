#! /usr/bin/env node

'use strict';

const _ = require('lodash');
const assert = require('assert');
const argv = require('minimist')(process.argv.slice(2));
const Joi = require('joi');
const ConfigSchema = require('../lib/schemas/config');
const Workgroup = require('../lib/workgroup');

if (argv.help){
  let message = '\nKued Evergreen\n';
  message += '--------------------------------------------------------------\n';
  message += '--config=(evergreen config file)              Required.\n';
  message += '--workgroup=(workgroup name)                  Required.\n';
  message += '--workers-path=(JS path to workers node)      Default=workers.\n';
  message += '--modules=(JS Evergreen modules to import)    Optional.\n\n';
  message += 'Example:\n\n';
  message += 'everkued --config config.json \\\n';
  message += '         --workgroup ImageProcessor \\\n';
  message += '         --workers-path foo.bar.workers \\\n';
  message += '         --modules trbl-evergreen-mongo\n\n';
  console.log(message);
  process.exit(0);
}

assert.ok(!!argv.config, '--config=(evergreen config file) is required.');
assert.ok(!!argv.workgroup, '--workgroup=(workgroup name) is required');

const workersPath =  (argv.workersPath)? argv.workersPath : 'workers';

const tryRequireEvergreen = () => {
  try {
    return require('trbl-evergreen');
  }
  catch (e){
    let message = 'Evergreen is not imported for Kued by default.  ';
    message += 'This is to minimize the number of dependencies imported by the Kued framework.\n\n';
    message += 'To use Evergreen with Kued, locally install it in the code base you are executing ';
    message += 'this script from: \n\nnpm install --save evergreen';
    console.error(message);
    process.exit(1);
  }
};

const evergreen = tryRequireEvergreen();

if (argv.modules){
  const modules = argv.modules.split(',').map((module) => {
    return require(module);
  });
  evergreen.addModules(modules);
}

evergreen.renderFromFile(argv.config).and().then((config) => {

  let kuedConfig = _.get(config, workersPath);

  assert.ok(!!kuedConfig, `Kued configuration not found at path: ${workersPath}`);

  const configCheck = Joi.validate(kuedConfig, ConfigSchema);

  assert.ok(!configCheck.error, 'Worker configuration is not valid.');

  kuedConfig = configCheck.value;

  kuedConfig.workgroup = _.find(kuedConfig.workgroups, (workgroup) => workgroup.name === argv.workgroup);

  assert.ok(!!kuedConfig.workgroup, `Workgroup not found in config: ${argv.workgroup}`);

  delete kuedConfig.workgroups;

  new Workgroup('run', kuedConfig);

}, (err) => {
  console.error(err);
  process.exit(1);
});
