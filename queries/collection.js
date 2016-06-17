var sqlite3 = require('sqlite3');
var db = new sqlite3.Database('storage.db');

module.exports.list = (callback) => {
  db.all("SELECT cid, collectionName FROM collections", (err, rows) => {
    if (err) {
      callback(err, null);
      return;
    }
    if (!rows.length) {
      err = new Error('No collections');
      callback(err, null);
      return;
    }
    callback(null, rows);
  });
};