'use strict';

const _ = require('lodash');
const assert = require('assert');
const Path = require('path');

module.exports.loadModule = (module) => {
  if (!module) return null;

  // Used for testing by allowing implementations to be passed instead of paths.
  if (_.isFunction(module) || _.isObject(module)) return module;

  if (module.startsWith('kued/')){
    module = Path.resolve(__dirname, '../', module.slice(5));
  }
  try {
    return require(module);
  }
  catch (e){
    return null;
  }
};

module.exports.loadComponent = (dependencyManager, modulePath, options) => {

  const Component = exports.loadModule(modulePath);

  assert.ok(!!Component, `Could not instantiate module: ${modulePath}`);

  const dependencies = Component.dependencies || [];

  const services = dependencies.map((dependency) => dependencyManager.getInstance(dependency));

  const constructorArgs = _.flatten([ 'ignore', options || {}, services]);

  const component = new (Component.bind.apply(Component, constructorArgs));

  if(component.init) component.init();

  return component;
};