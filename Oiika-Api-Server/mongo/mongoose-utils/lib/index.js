module.exports = {
  validate: require('../../../api/helpers/validators'),
  plugin: {
    timestamps: require('./plugins/timestamps'),
    extendedMethods: require('./plugins/extendedMethods')
    // uploads: require('./plugins/uploads')
  }
};