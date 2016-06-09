var sqlite3 = require('sqlite3');
var db = new sqlite3.Database('storage.db');

module.exports.login = (username, password, callback) => {
  db.get("SELECT uid, gid, username, displayName, role FROM users WHERE username=? AND password=?", [username, password], (err, data) => {
    if (err) {
      callback(err, null);
      return;
    }
    if (data == null) {
      err = new InvalidCredentialsError();
      callback(err, null);
      return;
    }
    callback(null, data);
  });
};

function InvalidCredentialsError(message) {
  this.name = "InvalidCredentialsError";
  this.message = message || 'Invalid username/password';
  this.stack = (new Error()).stack;
}
InvalidCredentialsError.prototype = Object.create(Error.prototype);
InvalidCredentialsError.prototype.constructor = InvalidCredentialsError;