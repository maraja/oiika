module.exports = {
    makeError: makeError
}

function makeError(type, message) {
    // type and message must be string
    var err = new Error();
    err.nonce = true; // error that is not handled
    err.name = type;
    err.message = message;
    return err;
}
