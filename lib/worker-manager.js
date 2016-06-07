'use strict';

const Joi = require('joi');
const ConfigSchema = require('./schemas/config');

class WorkerManager {

  static launch(config){

    const result = Joi.validate(config, ConfigSchema);

    if (result.error) throw new Error(result.error);

    config = result.value;

    

  }

}

module.exports = WorkerManager;