#! /usr/bin/env node

'use strict';

const argv = require('minimist')(process.argv.slice(2));
const Path = require('path');

const Joi = require('joi');
const ConfigSchema = require('../lib/schemas/config');

const configRelPath = argv.config || argv.c || 'kued.json';
const configFile = Path.join(process.cwd(), configRelPath);
const config = require(configFile);
const configCheck = Joi.validate(config, ConfigSchema);

if (configCheck.error){
  console.log(['error'], { message: 'Invalid configuration.', error: configCheck.error });
}

const WorkgroupManager = require('../lib/workgroup-manager');
const workgroupManager = new WorkgroupManager(console);

workgroupManager.connect((err) => {

  if (err) process.exit(-1);

  workgroupManager.launch(config, (err) => {

    if (err) {
      workgroupManager.disconnect(() => {
        if (err) process.exit(-1);
      });
    }
  });
});