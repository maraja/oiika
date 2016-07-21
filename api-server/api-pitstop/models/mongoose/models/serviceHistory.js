var Schema = require('../schemaInstance');

var serviceHistorySchema = new Schema({
    _id: String,                // e.g. 7AKusy4QOb
    mileage: Number,
    mileageSetByUser: Number,
    carId: String,
    serviceObjectId: String,
    serviceId: String,
    shopId: String,
    userMarkedDoneOn: String,
    type: Number,
    _created_at: Date,
    _updated_at: Date
});

module.exports = {
    name: "serviceHistory",
    collection: "ServiceHistory",
    schema: serviceHistorySchema
};
