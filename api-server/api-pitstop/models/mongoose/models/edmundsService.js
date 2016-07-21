var Schema = require('../schemaInstance');

var edmundsServiceSchema = new Schema({
    _id: String,                // e.g. 7AKusy4QOb
    engineCode: String,
    make: String,
    model: String,
    year: Number,
    action: String,
    laborUnits: String,
    driveType: String,
    partunits: String,
    priority: Number,
    itemDescription: String,
    edmundsId: Number,
    frequency: Number,
    intervalMileage: Number,
    intervalMonth: Number,
    transmissionCode: String,
    _created_at: Date,
    _updated_at: Date
});

module.exports = {
    name: "edmundsService",
    collection: "EdmundsService",
    schema: edmundsServiceSchema
};
