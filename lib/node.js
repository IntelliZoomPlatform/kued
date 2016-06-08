'use strict';

const assert = require('assert');
const DependencyManager = require('./dependency-manager');

class Node {

  constructor(argv){

    assert.ok(argv._.length >= 2, 'Bad argv syntax when launching.  Should be "node.js [run] [base64-config]"');

    this.command = argv._[1];
    this.config = Node.decode(argv._[1]);

    console.log(JSON.stringify(this.config, null, 2));

    this.dependencyManager = new DependencyManager(this.config.providers);

    this.execute();
  }

  static decode(configString){
    return JSON.parse((new Buffer(configString, 'base64')).toString('utf8'));
  }

  execute(){

    switch(this.command){
      // Execute
      default:



        break;
    }
  }
}

module.exports = Node;