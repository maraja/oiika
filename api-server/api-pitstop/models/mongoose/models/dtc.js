var Schema = require('../schemaInstance');

var dtcSchema = new Schema({
    _id: String,                // e.g. 7AKusy4QOb
    dtcCode: String,
    description: String,
    _created_at: Date,
    _updated_at: Date
});

module.exports = {
    name: "dtc",
    collection: "DTC",
    schema: dtcSchema
};
