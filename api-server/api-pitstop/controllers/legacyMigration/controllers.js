module.exports = {
    logger: require('../../../logger'),
    helper: require('../../helpers'),
    models: require('../../models/mongoose'),
    sequelizeModels: require('../../../models'),
    carController: require('../car'),
    issueController: require('../issue'),
    scanController: require('../scan'),
    scannerController: require('../scanner'),
    shopController: require('../shop'),
    userController: require('../user'),
    utilityController: require('../utilities')
}
