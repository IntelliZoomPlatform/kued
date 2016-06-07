'use strict';

const Joi = require('joi');
const IronMQSchema = require('../schemas/imq');
const IronMQClient = require('iron_mq').Client;

class IronMQFactory {

  static options(){
    return {
      singleton: true,
      mode: 'factory'
    }
  }

  static create(config, logger, _imq){

    const IMQ = _imq || IronMQClient;
    const result = Joi.validate(config, IronMQSchema);

    if (result.error) throw new Error(result.error);

    config = result.value;

    return new IMQ(config);
  }
}

module.exports = IronMQFactory;