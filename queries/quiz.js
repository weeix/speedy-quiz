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

module.exports.start = (qzid, qid, callback) => {
  db.run("INSERT INTO quiz_sessions (qzid, qid) VALUES (?, ?)", [qzid, qid], function (err) {
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

module.exports.end = (qsid, callback) => {
  db.run("UPDATE quiz_sessions SET end_time = CURRENT_TIMESTAMP WHERE qsid = ?", qsid, function (err) {
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

module.exports.showQuestions = (qzid, unasked, callback) => {
  if (unasked == true) {
    db.all("SELECT questions_collections.qid FROM quizzes \
    LEFT JOIN questions_collections ON quizzes.cid = questions_collections.cid \
    LEFT JOIN quiz_sessions ON questions_collections.qid = quiz_sessions.qid AND quizzes.qzid = quiz_sessions.qzid \
    WHERE quizzes.qzid = ? AND quiz_sessions.start_time IS NULL", qzid, function (err, rows) {
      returnQuestions(err, rows, callback);
    });
  } else {
    db.all("SELECT questions_collections.qid FROM quizzes LEFT JOIN questions_collections \
    ON quizzes.cid = questions_collections.cid WHERE quizzes.qzid = ?", qzid, function (err, rows) {
      returnQuestions(err, rows, callback);
    });
  }
  function returnQuestions(err, rows, callback) {
    if (err) {
      callback(err, null);
      return;
    }
    if (!rows.length) {
      err = new Error('No questions');
      callback(err, null);
      return;
    }
    callback(null, rows);
  }
}