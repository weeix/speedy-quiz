var sqlite3 = require('sqlite3');
var db = new sqlite3.Database('storage.db');

module.exports.list = (callback) => {
  db.all("SELECT qzid, gid, cid FROM quizzes", (err, rows) => {
    if (err) {
      callback(err, null);
      return;
    }
    if (!rows.length) {
      err = new Error('No quizzes');
      callback(err, null);
      return;
    }
    callback(null, rows);
  });
};

module.exports.add = (gid, cid, callback) => {
  db.run("INSERT INTO quizzes (gid, cid) VALUES (?, ?)", [gid, cid], function (err) {
    if (err) {
      callback(err, null);
      return;
    }
    var result = {
      changes: this.changes,
      lastID: this.lastID
    }
    callback(null, result);
  });
};