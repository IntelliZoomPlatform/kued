'use strict';

const _ = require('lodash');
const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const assert = require('assert');
chai.use(sinonChai);

const Workgroup = require('../../../lib/workgroup');

describe('Workgroup', function(){

  it('should find a component out of a list by it\'s name', function(){

    const list = [
      {
        "name": "HelloWorker",
        "require": "kued/test/integration/workers/hello",
        "options": {
          "cron": {
            "cronTime": "* * * * * *"
          }
        }
      }
    ];

    expect(Workgroup.findByName(list, 'HelloWorker')).to.eq(list[0]);

  });

});