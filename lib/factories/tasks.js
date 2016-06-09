'use strict';

const TaskManager = require('../task-manager');

let dm = null;

class TaskManagerFactory {

  static options(){
    return {
      singleton: true,
      mode: 'factory'
    }
  }

  static setDependencyManager(dependencyManager){
    dm = dependencyManager;
  }
  
  static create(config, logger){
    return new TaskManager(config, logger, dm.getInstance({ provider: 'kue' }));
  }
}

module.exports = TaskManagerFactory;