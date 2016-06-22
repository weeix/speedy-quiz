var sqlite3 = require('sqlite3');
var db = new sqlite3.Database('storage.db');

module.exports.add = (qsid, uid, answerText, callback) => {
    db.get("SELECT aid FROM answered WHERE qsid = ? AND uid = ?", [qsid, uid], function (err, row) {
        if (err) {
            callback(err, null);
            return;
        }
        if (row != null) {
            err = new Error('This account has already answered');
            callback(err, null);
            return;
        }
        db.get("SELECT end_time, choices FROM quiz_sessions LEFT JOIN questions ON quiz_sessions.qid = questions.qid \
    WHERE quiz_sessions.qsid = ?", qsid, function (err, row) {
                if (err) {
                    callback(err, null);
                    return;
                }
                if (row == null) {
                    err = new Error('Question does not exist');
                    callback(err, null);
                    return;
                }
                if (row.end_time != null) {
                    err = new Error('Question timeout');
                    callback(err, null);
                    return;
                }
                var choices = JSON.parse(row.choices);
                var answerIndex = choices.indexOf(answerText);
                db.run("INSERT INTO answered (qsid, uid, answer) VALUES (?, ?, ?)", [qsid, uid, answerIndex], function (err) {
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
            });
    });
};

module.exports.list = (qsid, callback) => {
    db.all("SELECT answered.uid, users.displayName, answered.answer, questions.choices FROM answered \
    LEFT JOIN quiz_sessions ON answered.qsid = quiz_sessions.qsid \
    LEFT JOIN users ON answered.uid = users.uid \
    LEFT JOIN questions ON quiz_sessions.qid = questions.qid \
    WHERE answered.qsid = ? ORDER BY answered.answered_time ASC", qsid, function (err, rows) {
            if (err) {
                callback(err, null);
                return;
            }
            callback(null, rows);
        });
};