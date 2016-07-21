var Schema = require('../schemaInstance');

var serviceIntervalSchema = new Schema({
    _id: String,                // e.g. 7AKusy4QOb
    mileage: Number,
    item: String,
    action: String,
    itemDescription: String,
    priority: Number,
    dealership: String,
    _p_forCar: String,
    _created_at: Date,
    _updated_at: Date
});

module.exports = {
    name: "serviceInterval",
    collection: "ServiceInterval",
    schema: serviceIntervalSchema
};
