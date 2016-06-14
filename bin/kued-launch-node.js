#! /usr/bin/env node

'use strict';

const assert = require('assert');
const Utils = require('../lib/utils');
const argv = require('minimist')(process.argv.slice(2));

assert.ok(argv._.length >= 2, 'Bad argv syntax when launching.  Should be "workgroup.js [run] [base64-config]"');

const command = argv._[0];
const config = Utils.decode(argv._[1]);

const Workgroup = require('../lib/workgroup');

new Workgroup(command, config);