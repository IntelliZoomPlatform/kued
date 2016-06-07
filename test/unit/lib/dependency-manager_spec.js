'use strict';

const _ = require('lodash');
const chai = require('chai');
const expect = chai.expect;
const assert = require('assert');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
chai.use(sinonChai);

const DependencyManager = require('../../../lib/dependency-manager');

describe('Dependency Manager', function(){

  it('should initialize the logger if one was not specified in the provider list', function(){

    const dm = new DependencyManager([]);

    expect(dm.singletons['logger:default']).to.be.defined;
    expect(dm.singletons['logger:default']).to.eq(console);
  });

  it('should locate the correct provider for a dependency', function(){

    const providers = [
      { provides: 'kue' },
      { provides: 'imq' },
      { provides: 'checkpointer' }
    ];

    const dm = new DependencyManager(providers);

    expect(dm.findProviderConfiguration({ provider: 'kue' })).to.eq(providers[0]);
    expect(dm.findProviderConfiguration({ provider: 'imq' })).to.eq(providers[1]);
    expect(dm.findProviderConfiguration({ provider: 'checkpointer' })).to.eq(providers[2]);

  });

  it('should locate the correct provider by name for a dependency', function(){

    const providers = [
      { provides: 'kue' },
      { provides: 'imq' },
      { provides: 'imq', name: 'eu-west-2' },
      { provides: 'checkpointer' }
    ];

    const dm = new DependencyManager(providers);

    expect(dm.findProviderConfiguration({ provider: 'imq', name: 'eu-west-2' })).to.eq(providers[2]);
  });

  it('should use the provided logger if one was specified in the provider list', function(){

    const logProvider = {
      provides: 'logger',
      name: 'default',
      require: {
        options: {
          mode: 'static',
          singleton: true
        },
        log: function () {
          console.log.apply(console, arguments);
        }
      }
    };

    const dm = new DependencyManager([logProvider]);

    expect(dm.singletons['logger:default']).to.be.defined;
    expect(dm.singletons['logger:default']).to.eq(logProvider.require);

  });
  
  it('should create an ID as a combination of the provider type and name', function(){
    
    expect(DependencyManager.getProviderInstanceID('abc', '123')).to.eq('abc:123');
    expect(DependencyManager.getProviderInstanceID('abc')).to.eq('abc:default');
  });

  describe('Module Loading', function(){

    it('should return objects or functions instead of trying to require them', function(){

      expect(DependencyManager.loadProviderModule(_.noop)).to.eq(_.noop);

      const object = { foo: 'bar' };

      expect(DependencyManager.loadProviderModule(object)).to.eq(object);
    });

    it('should load modules relative to the kued project if they start with "kued/"', function(){

      const KueFactory = require('../../../lib/factories/kue');

      expect(DependencyManager.loadProviderModule('kued/lib/factories/kue')).to.eq(KueFactory);
    });

    it('should return null if it cannot load the module', function(){

      expect(DependencyManager.loadProviderModule('kued/lib/factories/no-implementation')).to.be.null;
    });
  });

  describe('Getting Dependencies', function(){

    it('should throw an error if the request for dependency is invalid', function(){

      const dm = new DependencyManager([]);

      expect(function(){

        dm.getInstance();

      }).to.throw(assert.AssertionError);

      expect(function(){

        dm.getInstance({});

      }).to.throw(assert.AssertionError);
    });

    it('should throw an error if a provider is not found for a mandatory dependency', function(){

      const dm = new DependencyManager([]);

      expect(function(){

        dm.getInstance({ provider: 'not-found' });

      }).to.throw(assert.AssertionError);

    });

    it('should not throw an error if an optional dependency is not found', function(){

      const dm = new DependencyManager([]);

      expect(function(){

        dm.getInstance({ provider: 'not-found', optional: true });

      }).to.not.throw(assert.AssertionError);

      expect(dm.getInstance({ provider: 'not-found', optional: true })).to.be.null;

    });

    it('should throw an error if the provider is not found or is returned as a null value', function(){

      const dm = new DependencyManager([{
        provides: 'failtoload',
        require: 'huh!'
      }]);

      expect(function(){

        dm.getInstance({ provider: 'failtoload' });

      }).to.throw(assert.AssertionError);

    });

    it('should return a previously instantiated singleton if set', function(){

      const providers = [{
        provides: 'noop',
        name: 'default',
        require: {
          options: {
            mode: 'static',
            singleton: true
          }
        }
      }];

      const dm = new DependencyManager(providers);

      dm.singletons['noop:default'] = providers[0].require;

      dm.getSingleton = sinon.stub();

      dm.getSingleton.returns(providers[0].require);

      expect(dm.getInstance({ provider: 'noop' })).to.eq(providers[0].require);
      expect(dm.getSingleton).to.be.calledWith('noop:default');
    });
    
    it('should cache a provider if it is marked a singleton', function(){

      const providers = [{
        provides: 'noop',
        name: 'default',
        require: {
          options: {
            mode: 'static',
            singleton: true
          }
        }
      }];

      const dm = new DependencyManager(providers);

      dm.setSingleton = sinon.spy();

      expect(dm.getInstance({ provider: 'noop' })).to.eq(providers[0].require);
      expect(dm.setSingleton).to.be.calledWith('noop:default', providers[0].require);
    });

    it('should support creation of providers using a factory method', function(){

      const providers = [{
        provides: 'noop',
        name: 'default',
        require: {
          options: {
            mode: 'factory',
            singleton: true
          },
          create: sinon.stub()
        }
      }];

      providers[0].require.create.returns(_.noop);

      const dm = new DependencyManager(providers);

      expect(dm.getInstance({ provider: 'noop' })).to.eq(_.noop);
      expect(providers[0].require.create).to.be.calledWith(providers[0]);
    });

    it('should support creation of providers new instantiating an object', function(){

      class Provider {
        static get options(){
          return {
            mode: 'class',
            singleton: true
          };
        }
      }

      const providers = [{
        provides: 'noop',
        name: 'default',
        require: Provider
      }];

      const dm = new DependencyManager(providers);

      expect(dm.getInstance({ provider: 'noop' })).to.be.instanceOf(Provider);
    });

    it('should support creation of providers by returning the exported module value', function(){

      const providers = [{
        provides: 'noop',
        name: 'default',
        require: 'kued/test/unit/lib/test-provider'
      }];

      const dm = new DependencyManager(providers);

      expect(dm.getInstance({ provider: 'noop' })).to.eq(require('./test-provider'));
    });

    it('should throw an error if the provider configuration is not valid', function(){

      const providers = [{
        provides: 'noop',
        name: 'default',
        require: null
      }];

      const dm = new DependencyManager(providers);

      expect(function(){

        dm.getInstance({ provider: 'noop' });

      }).to.throw(assert.AssertionError);
    });

    it('should throw an error if module loading results in a null provider', function(){

      const providers = [{
        provides: 'noop',
        name: 'default',
        require: {
          options: {
            mode: 'factory',
            singleton: true
          },
          create: function(){ return null; }
        }
      }];

      const dm = new DependencyManager(providers);

      expect(function(){

        dm.getInstance({ provider: 'noop' });

      }).to.throw(assert.AssertionError);
    });

    it('should throw an error for a construction mode other than factory, class, or static', function(){


      const providers = [{
        provides: 'noop',
        name: 'default',
        require: {
          options: {
            mode: 'magic'
          }
        }
      }];

      const dm = new DependencyManager(providers);

      expect(function(){

        dm.getInstance({ provider: 'noop' });

      }).to.throw(assert.AssertionError);
    });
  });
});