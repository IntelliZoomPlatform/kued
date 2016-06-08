#! /usr/bin/env node

'use strict';

const argv = require('minimist')(process.argv.slice(2));
const Node = require('../lib/node');

new Node(argv);