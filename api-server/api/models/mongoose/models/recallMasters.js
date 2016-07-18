var Schema = require('../schemaInstance');

var recallMastersSchema = new Schema({
    _id: String,                // e.g. 7AKusy4QOb
    recalls: Array,
    _p_forCar: String
});

module.exports = {
    name: "recallMasters",
    collection: "RecallMasters",
    schema: recallMastersSchema
};
