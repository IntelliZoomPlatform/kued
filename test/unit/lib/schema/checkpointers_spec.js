'use strict';

const _ = require('lodash');
const chai = require('chai');
const expect = chai.expect;

const Joi = require('joi');
const CheckpointersSchema = require('../../../../lib/schemas/checkpointers');

describe('Checkpointers Schema', function(){

  const expectToBeValid = function(config){
    const shouldBeValid = Joi.validate(config, CheckpointersSchema);
    expect(shouldBeValid.error).to.be.null;
    return shouldBeValid;
  };

  const expectToNotBeValid = function(config){
    const shouldNotBeValid = Joi.validate(config, CheckpointersSchema);
    expect(shouldNotBeValid.error).to.not.be.null;
  };

  it('should allow valid checkpointers configuration', function(){

    expectToBeValid([{
      name: 'RedisCheckpointer',
      require: './lib/checkpointers/redis'
    }]);

    expectToBeValid([{
      name: 'RedisCheckpointer',
      require: './lib/checkpointers/redis',
      options: {
        foo: 'bar'
      }
    }]);

    expectToNotBeValid([{
      name: 'RedisCheckpointer'
    }]);

    expectToNotBeValid([{
      name: 'RedisCheckpointer',
      options: {}
    }]);

    expectToNotBeValid([{
      name: 'RedisCheckpointer',
      require: './lib/checkpointers/redis',
      options: 'asdfadsf'
    }]);
  });

  it('should set the name to "default" if not provided', function(){

    const result = expectToBeValid([{
      require: './lib/checkpointers/redis',
      options: {
        foo: 'bar'
      }
    }]);

    expect(result.value[0].name).to.not.be.undefined;
    expect(result.value[0].name).to.eq('default');
  });

});