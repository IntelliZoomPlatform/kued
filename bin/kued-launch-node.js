#! /usr/bin/env node

'use strict';

const argv = require('minimist')(process.argv.slice(2));
const Workgroup = require('../lib/workgroup');

new Workgroup(argv);