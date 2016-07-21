var Schema = require('../schemaInstance');

var userSchema = new Schema({
    // only session and user pointer are needed
    _id: String,                // e.g. 7AKusy4QOb
    username: String,           // e.g. test@test.org,
    email: String,              // e.g. test@test.org,
    facebookId: String,         // e,g, 10207839012364786
    _hashed_password: String,   // password hashed by bcrypt
    phoneNumber: String,        // e.g. 1234567890
    name: String,               // e.g. benn1
    _created_at: Date,        // e.g. "2016-05-02T16:34:55.559Z"
    _updated_at: Date,        // e.g. "2016-05-17T16:54:34.247Z"
    authData: Object,           // e.g see NOTE_1
    firstCar: String            // e.g. True
});

module.exports = {
    name: "user",
    collection: "_User",
    schema: userSchema
};

// NOTE_1:
// {
//   "facebook": {
//     "access_token": "<token>",
//     "expiration_date": "2016-07-30T19:46:03.353Z",
//     "id": "<facebookId>"
//   }
// }
