'use strict';

const assert = require('assert');
const Utils = require('./utils');
const Bridge = require('./bridges/bridge');

class BridgeFactory {

  constructor(){
    this.registry = {
      input: {
        'imq': 'kued/lib/bridges/imq-input',
        'kue': 'kued/lib/bridges/kue-input'
      },
      output: {
        'imq': 'kued/lib/bridges/imq-output',
        'kue': 'kued/lib/bridges/kue-output'
      }
    };
  }

  registerInput(id, requirePath){
    this.registry.input[id] = requirePath;
  }

  registerOutput(id, requirePath){
    this.registry.output[id] = requirePath;
  }

  getRequirePath(direction, id){
    const path = this.registry[direction][id];
    assert.ok(!!path, `Could not find ${direction} module with ID ${id}`);
    return path;
  }

  static getComponentId(path){
    assert.ok(path.indexOf(':') > 0, `Invalid Bridge path specification: ${path}`);
    return path.slice(0, path.indexOf(':'));
  }

  create(dependencyManager, bridgeConfig){

    const inputId = BridgeFactory.getComponentId(bridgeConfig.input);

    const inputRequirePath = this.getRequirePath('input', inputId);

    const input = Utils.loadComponent(dependencyManager, inputRequirePath, bridgeConfig);

    const outputId = BridgeFactory.getComponentId(bridgeConfig.output);

    const outputRequirePath = this.getRequirePath('output', outputId);

    const output = Utils.loadComponent(dependencyManager, outputRequirePath, bridgeConfig);

    const bridge = new Bridge(dependencyManager.getLogger(), input, output);

    bridge.init();

    return bridge;
  }

}

module.exports = new BridgeFactory();