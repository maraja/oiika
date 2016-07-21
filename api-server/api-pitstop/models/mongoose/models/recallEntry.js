var Schema = require('../schemaInstance');

var recallEntrySchema = new Schema({
    _id: String,                // e.g. 7AKusy4QOb
    state: String,
    nhtsaID: String,
    oemID: String,
    name: String,
    description: String,
    type: String,
    risk: String,
    remedy: String,
    remedyAvailable: Boolean,
    partsAvailable: String,
    profitRank: String,
    overallRank: String,
    laborMin: String,
    laborMax: String,
    laborDifficulty: String,
    reimbursement: Number,
    _p_forRecallMasters: String,
    _created_at: Date,
    _updated_at: Date
});

module.exports = {
    name: "recallEntry",
    collection: "RecallEntry",
    schema: recallEntrySchema
};
