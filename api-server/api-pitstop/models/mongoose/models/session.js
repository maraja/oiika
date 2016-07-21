var Schema = require('../schemaInstance');

var sessionSchema = new Schema({
    // only session and user pointer are needed
    _session_token: String, // e.g. r:HNrrKvCgtFBdl3baQIw3r3Lvv
    _p_user: String // e.g. _User$VqS41XsNGZ
});

module.exports = {
    name: "session",
    collection: "_Session",
    schema: sessionSchema
};
