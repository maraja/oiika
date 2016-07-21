var util = require('util');
var logger = require('../../logger');
var models = require('../../models');
var helper = require('../helpers');
var sequelize = models.sequelize;

module.exports = {
    getShops: getShops,
    getShopById: getShopById,
    getShopByIdMain: getShopByIdMain
};

function getShops(req, res) {
    // get all shops 
    models.shop.findAll({
        attributes: [
            ["id", "id"],
            ["name", "name"],
            ["address", "address"],
            ["latitude", "latitude"],
            ["longitude", "longitude"],
            ["phone_number", "phone"],
            ["email", "email"]
        ],
        // include: [{model: models.car_shop},
        //           {model: models.service_customized}]
    }).then(function(result) {
        // TODO: use reuslt.dataValues
        res.json(result);
    }, function(error) {
        logger.warn("error in getShops: ", "unexpected error");
        logger.warn(error);

        var message = "internal db error";
        var err = helper.makeError("TRANSACTION_ERROR", message);
        helper.sendErrorResponse(res, err);
    });
}

function getShopByIdMain(shopId) {
    // TODO: validation should be wrapped into a function
    if (!(typeof(shopId) === "number" && shopId >= 0)) {
        throw(helper.makeError("INVALID_INPUT", "shopId must be non-negative"));
    }

    logger.debug("getting shop #%s", shopId);

    return models.shop.findOne({
        attributes: [
            ["id", "id"],
            ["name", "name"],
            ["address", "address"],
            ["latitude", "latitude"],
            ["longitude", "longitude"],
            ["phone_number", "phone"],
            ["email", "email"]
        ],
        where: {
            id: shopId
        }
    }).then(function(result) {
        if (!result) {
            result = {};
        }
        else {
            result = result.dataValues;
        }
        return result;
    })
}

function getShopById(req, res) {
    var params = req.swagger.params;
    var shopId = params.shopId.value;

    // validation

    return getShopByIdMain(shopId).then(function(result) {
        res.json(result);
    }, function(error) {
        logger.warn("error in getShopById: ", "unexpected error");
        logger.warn(error);
        var message = "internal db error";
        var err = helper.makeError("TRANSACTION_ERROR", message);
        helper.sendErrorResponse(res, err);
    });
}
