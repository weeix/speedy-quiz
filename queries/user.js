var sqlite3 = require('sqlite3');

var db = new sqlite3.Database('storage.db');

exports.login = (username, password, callback) => {
  db.get("SELECT uid, gid, username, displayName, role FROM users WHERE username=? AND password=?", [username, password], (error, data) => {
    if (error) {
      callback(error, null);
      return;
    }
    if (data == null) {
      error = new Error('InvalidCredentials');
      callback(error, null);
      return;
    }
    callback(null, data);
  });
};