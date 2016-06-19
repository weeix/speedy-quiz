var question = require('./queries/question');

module.exports = function (server, jwt, secret) {
    var io = require('socket.io')(server);

    io.on('connection', function (socket) {
        socket.on('join', function (token, gid, callback) {
            jwt.verify(token, secret, function (err, decoded) {
                if (err) {
                    callback(err);
                    return;
                }
                var roomID = gid.toString();
                socket.join(roomID);
                console.log(decoded.displayName + ' joined room ID: ' + gid);
                if (decoded.role == 0) {
                    socket.on('ask', function (qid) {
                        question.ask(qid, function (err, row) {
                            console.log(err,row);
                            io.to(roomID).emit('question', row);
                        });
                    });
                }
                callback(null);
            });
        });
    });
}