var question = require('./queries/question');
var answer = require('./queries/answer');

module.exports = function (server, jwt, secret) {
    var io = require('socket.io')(server);

    io.on('connection', function (socket) {
        var ipAddr = socket.request.connection.remoteAddress;
        socket.on('join', function (token, gid, callback) {
            jwt.verify(token, secret, function (err, decoded) {
                if (err) {
                    callback(err.message);
                    return;
                }
                if (gid) {
                    var roomID = gid.toString();
                } else if (decoded.gid) {
                    var roomID = decoded.gid.toString();
                } else {
                    err = new Error('Group ID undefined');
                    callback(err);
                    return;
                }
                socket.join(roomID);
                console.log(decoded.displayName + ' (' + ipAddr + ') joined room ID: ' + roomID);
                if (decoded.role == 0) {
                    socket.on('ask', function (qid, qsid) {
                        question.ask(qid, function (err, row) {
                            if (err) {
                                console.log(err);
                                return;
                            }
                            var choices = JSON.parse(row.choices);
                            shuffle(choices);
                            io.to(roomID).emit('question', {qsid: qsid, question: row.question, choices: choices});
                        });
                    });
                    socket.on('solve', function (qid) {
                        question.solve(qid, function (err, row) {
                            if (err) {
                                console.log(err);
                                return;
                            }
                            var choices = JSON.parse(row.choices);
                            var answer = choices[row.answer];
                            io.to(roomID).emit('solve-question', answer);
                        });
                    });
                    socket.on('list-answer', function (qsid, callback) {
                        answer.list(qsid, function (err, rows) {
                            if (err) {
                                callback(err.message, null);
                                return;
                            }
                            callback(null, rows);
                        });
                    });
                }
                socket.on('answer', function (qsid, answerText, callback) {
                    answer.add(qsid, decoded.uid, answerText, function (err, result) {
                        if (err) {
                            callback(err.message);
                            return;
                        }
                        callback(null);
                        io.to(roomID).emit('answer-question', result);
                    });
                });
                callback(null);
            });
        });
    });
}

/**
 * Shuffles array in place.
 * @param {Array} a items The array containing the items.
 */
function shuffle(a) {
    var j, x, i;
    for (i = a.length; i; i -= 1) {
        j = Math.floor(Math.random() * i);
        x = a[i - 1];
        a[i - 1] = a[j];
        a[j] = x;
    }
}