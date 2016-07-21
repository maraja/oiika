var Schema = require('../schemaInstance');

var shopSchema = new Schema({
    // only shop and user pointer are needed
    _id: String,
    name: String
});

module.exports = {
    name: "shop",
    collection: "Shop",
    schema: shopSchema
};
