var sqlite3 = require('sqlite3');
var db = new sqlite3.Database('storage.db');

module.exports.ask = (qid, callback) => {
  db.get("SELECT question, choices FROM questions WHERE qid = ?", qid, function (err, row) {
    if (err) {
      callback(err, null);
      return;
    }
    if (row == null) {
      err = new Error('Question not found');
      callback(err, null);
      return;
    }
    callback(null, row);
  })
}

module.exports.solve = (qid, callback) => {
  db.get("SELECT choices, answer FROM questions WHERE qid = ?", qid, function (err, row) {
    if (err) {
      callback(err, null);
      return;
    }
    if (row == null) {
      err = new Error('Question not found');
      callback(err, null);
      return;
    }
    callback(null, row);
  })
}