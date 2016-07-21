var Schema = require('../schemaInstance');

var carSchema = new Schema({
    _id: String,                // e.g. 7AKusy4QOb
    VIN: String,
    engine: String,
    tank_size: String,
    baseMileage: Number,
    totalMileage: Number,
    make: String,
    model: String,
    year: String,
    trim_level: String,
    city_mileage: String,
    highway_mileage: String,
    pendingDTCs: Array,
    storedDTCs: Array,
    pendingEdmundServices: Array,
    pendingIntervalServices: Array,
    currentCar: Boolean,
    owner: String,
    dealership: String,
    _created_at: Date,
    _updated_at: Date
});

module.exports = {
    name: "car",
    collection: "Car",
    schema: carSchema
};
