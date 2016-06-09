'use strict';

const _ = require('lodash');
const assert = require('assert');
const Utils = require('./utils');

const Joi = require('joi');
const DependencySchema = require('./schemas/dependency');
const ProviderSchema = require('./schemas/provider');

class DependencyManager {

  constructor(providers){
    this.providers = providers;
    this.singletons = {};
    this.initializeLogger();
  }

  initializeLogger(){

    // Check to see if a provider was registered for the logger.
    let providerConfig = this.findProviderConfiguration({ provider: 'logger' });

    let logger = null;

    if (!providerConfig){

      logger = console;

      this.providers.push({
        name: 'default',
        provides: 'logger',
        require: {
          options: {
            singleton: true
          },
          create: () => console
        }
      });
    }
    else {

      logger = this.getInstance({ name: 'default', provider: 'logger' });
    }

    this.singletons['logger:default'] = logger;
  }

  getLogger(){
    return this.getSingleton('logger:default');
  }

  setSingleton(id, value){
    this.singletons[id] = value;
  }

  getSingleton(id){
    return this.singletons[id];
  }

  static getProviderInstanceID(provides, name){
    name = name || 'default';
    return `${provides}:${name}`;
  }

  findProviderConfiguration(dependency){
    return _.find(this.providers, (provider) => {

      if (dependency.provider === provider.provides){

        // Name specified in configuration
        if (_.isString(dependency.name)){

          // Use the specified provider name or 'default' if none is present.
          const providerName = (!_.isString(provider.name))? 'default' : provider.name;

          return dependency.name === providerName;
        }
        return true;
      }

      return false;
    });
  }

  static loadProviderModule(module){
    return Utils.loadModule(module);
  }

  getInstance(dependency){

    assert.ok(!!dependency, 'No dependency configuration was provided.');

    const dependencyCheck = Joi.validate(dependency, DependencySchema);

    assert.ok(!dependencyCheck.error,
      'Dependency request does not conform to dependency schema:' + JSON.stringify(dependencyCheck.error));

    dependency = dependencyCheck.value;

    const providerConfiguration = this.findProviderConfiguration(dependency);
    const providerInstanceName = DependencyManager.getProviderInstanceID(dependency.provider, dependency.name);

    // Check for null (optional provider condition)
    if (!providerConfiguration){
      if (dependency.optional) return null;
      throw new assert.AssertionError(`Could not find target provider: ${providerInstanceName}`);
    }

    const providerCheck = Joi.validate(providerConfiguration, ProviderSchema);

    assert.ok(!providerCheck.error, 'Provider does not conform to schema:' + JSON.stringify(providerCheck.error));

    const Provider = DependencyManager.loadProviderModule(providerConfiguration.require);

    assert.ok(!!Provider,
      `Could not load provider module: ${providerConfiguration.require} for ${providerInstanceName}`);

    const options = Provider.options || {};

    const singleton = _.isBoolean(options.singleton)? options.singleton : true;

    if (singleton){
      if (this.singletons.hasOwnProperty(providerInstanceName)) return this.getSingleton(providerInstanceName);
    }

    const mode = options.mode || 'factory';

    let instance = null;

    switch(mode){
      case 'factory':
        if (Provider.setDependencyManager) Provider.setDependencyManager(this);
        instance = Provider.create(providerConfiguration, this.getLogger());
        break;
      case 'class': instance = new Provider(providerConfiguration, this.getLogger()); break;
      case 'static': instance = Provider; break;
      default: assert.fail(mode, 'factory|class|static', 'Unknown provider "mode".');
    }

    assert.ok(!!instance, `Provider factory yielded nothing for ${providerInstanceName}`);

    if (singleton) this.setSingleton(providerInstanceName, instance);

    return instance;
  }
}


module.exports = DependencyManager;