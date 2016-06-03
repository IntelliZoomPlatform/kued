'use strict';

const _ = require('lodash');
const chai = require('chai');
const expect = chai.expect;

const Joi = require('joi');
const IronMQSchema = require('../../../../lib/schemas/imq');

describe('IronMQ Connection Schema', function(){

  const expectToBeValid = function(config){
    const shouldBeValid = Joi.validate(config, IronMQSchema);
    expect(shouldBeValid.error).to.be.null;
  };

  const expectToNotBeValid = function(config){
    const shouldNotBeValid = Joi.validate(config, IronMQSchema);
    expect(shouldNotBeValid.error).to.not.be.null;
  };

  it('should allow valid IronMQ connection configuration', function(){

    expectToBeValid({
      token: 'abcde12345',
      project_id: 'abcde12345'
    });

    expectToNotBeValid({
      token: 'a',
      project_id: 'abcde12345'
    });

    expectToNotBeValid({
      token: 'abcde12345',
      project_id: 'a'
    });

    expectToNotBeValid({
      project_id: 'abcde12345'
    });

    expectToNotBeValid({
      token: 'abcde12345'
    });
  });


});