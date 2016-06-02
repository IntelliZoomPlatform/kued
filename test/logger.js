'use strict';

const _ = require('lodash');

class Logger {

  constructor(){
    this.log = (process.env.SHOW_LOGGING)? console.log.bind(console) : _.noop;
  }
}

module.exports = Logger;

