'use strict';

const _ = require('lodash');
const async = require('async');
const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
chai.use(sinonChai);

const TestUtils = require('../../utils');

const Logger = require('../../logger');
const logger = new Logger();

const RedisCheckpointer = require('../../../lib/checkpointers/redis');

const dtg = new Date().getTime();

const checkpointer = new RedisCheckpointer({
  prefix: `checkpointer-${dtg}`,
  connection: 'redis://localhost'
}, logger);

describe('Redis Checkpointer', function() {

  it('update and retrieve a checkpoint', function(next){

    async.waterfall([

      (next) => {
        checkpointer.updateCheckpoint('dtg', { dtg }, next);
      },
      (next) => {
        checkpointer.getCheckpoint('dtg', next);
      }

    ], TestUtils.wrapAsync(next, function(err, result){

      expect(err).to.be.null;
      expect(result).to.deep.eq({ dtg });
    }));
  });

});