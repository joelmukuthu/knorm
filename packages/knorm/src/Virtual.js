class Virtual {
  constructor({ name, model, descriptor } = {}) {
    if (!name) {
      throw new Error('Virtual requires a name');
    }

    if (!model || !(model.prototype instanceof Model)) {
      throw new Error(`Virtual '${name}' requires a subclass of Model`);
    }

    if (typeof descriptor === 'function') {
      descriptor = {
        get: descriptor
      };
    }

    if (!descriptor.get && !descriptor.set) {
      throw new Error(
        `Virtual '${model.name}.${name}' has no setter or getter`
      );
    }

    if (descriptor.get) {
      if (typeof descriptor.get !== 'function') {
        throw new Error(
          `Getter for virtual '${model.name}.${name}' is not a function`
        );
      }
      this.get = descriptor.get;
    }

    if (descriptor.set) {
      if (typeof descriptor.set !== 'function') {
        throw new Error(
          `Setter for virtual '${model.name}.${name}' is not a function`
        );
      }
      this.set = descriptor.set;
    }

    this.name = name;
    this.model = model;
  }
}

module.exports = Virtual;

const Model = require('./Model'); // circular dep
