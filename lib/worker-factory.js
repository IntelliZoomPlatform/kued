'use strict';

const Utils = require('./utils');

class WorkerFactory {

  static create(dependencyManager, workerConfig){
    return Utils.loadComponent(dependencyManager, workerConfig.require, workerConfig.options);
  }

}

module.exports = WorkerFactory;