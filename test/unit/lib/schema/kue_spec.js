'use strict';

const _ = require('lodash');
const chai = require('chai');
const expect = chai.expect;

const Joi = require('joi');
const KueSchema = require('../../../../lib/schemas/kue');

describe('Kue Schema', function(){

  const expectToBeValid = function(config){
    const shouldBeValid = Joi.validate(config, KueSchema);
    expect(shouldBeValid.error).to.be.null;
    return shouldBeValid;
  };

  const expectToNotBeValid = function(config){
    const shouldNotBeValid = Joi.validate(config, KueSchema);
    expect(shouldNotBeValid.error).to.not.be.null;
  };

  it('should provide a default prefix', function(){

    const result = expectToBeValid({
      connection: {
        redis: {}
      }
    });

    expect(result.value.connection.prefix).to.not.be.undefined;
    expect(result.value.connection.prefix).to.eq('kue');

  });

  it('should provide a default watchStuckInterval', function(){

    const result = expectToBeValid({
      connection: {
        redis: {}
      }
    });

    expect(result.value.watchStuckInterval).to.not.be.undefined;
    expect(result.value.watchStuckInterval).to.eq(1000);
  });

  it('should require that the connection property is present', function(){

    expectToNotBeValid({});
  });

  describe('with Connection URI schema', function(){

    it('should allow a valid Redis URI to be passed', function(){

      expectToBeValid({
        connection: {
          redis: 'redis://localhost'
        }
      });

      expectToNotBeValid({
        connection: {
          redis: 'http://localhost'
        }
      });
    });
  });

  describe('with TCP connection schema', function(){

    it('should allow valid IP or Hostname', function(){

      expectToBeValid({
        connection: {
          redis: {
            host: 'redis.example.com'
          }
        }
      });

      expectToBeValid({
        connection: {
          redis: {
            host: '192.168.0.2'
          }
        }
      });

      expectToNotBeValid({
        connection: {
          redis: {
            host: 'rclayton@example.com'
          }
        }
      });

    });

    it('should restrict specified port values', function(){

      expectToBeValid({
        connection: {
          redis: {
            port: 12345
          }
        }
      });

      expectToNotBeValid({
        connection: {
          redis: {
            port: -1
          }
        }
      });

      expectToNotBeValid({
        connection: {
          redis: {
            port: 70000
          }
        }
      });

      expectToNotBeValid({
        connection: {
          redis: {
            port: 'adsfasdf'
          }
        }
      });
    });

    it('should restrict specified database values', function(){

      expectToBeValid({
        connection: {
          redis: {
            db: 0
          }
        }
      });

      expectToBeValid({
        connection: {
          redis: {
            db: 10
          }
        }
      });

      expectToNotBeValid({
        connection: {
          redis: {
            db: -1
          }
        }
      });

      expectToNotBeValid({
        connection: {
          redis: {
            db: 'adsfasdf'
          }
        }
      });
    });

    it('should pass through custom Redis connection properties', function(){

      expectToBeValid({
        connection: {
          redis: {
            options: {}
          }
        }
      });

      expectToNotBeValid({
        connection: {
          redis: {
            options: 'adsfasdf'
          }
        }
      });

    });
  });

  describe('with Unix socket connection schema', function(){

    it('should require the socket location', function(){

      expectToBeValid({
        connection: {
          redis: {
            socket: '/path/to/my/unix.sock'
          }
        }
      });

    });

    it('should pass through custom Redis connection properties', function(){

      expectToBeValid({
        connection: {
          redis: {
            socket: '/path/to/my/unix.sock',
            options: {}
          }
        }
      });

      expectToNotBeValid({
        connection: {
          redis: {
            socket: '/path/to/my/unix.sock',
            options: 'adsfasdf'
          }
        }
      });
    });
  });

  describe('with Redis factory connection schema', function(){

    it('should allow a factory function to be supplied', function(){

      expectToBeValid({
        connection: {
          redis: {
            createClientFactory: function(){}
          }
        }
      });

      expectToNotBeValid({
        connection: {
          redis: {
            createClientFactory: 'huh'
          }
        }
      });
    });
  });
});