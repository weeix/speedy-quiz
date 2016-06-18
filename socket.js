module.exports = function (server) {
    var io = require('socket.io')(server);
    console.log('Socket.io listenning');

    io.on('connection', function (socket) {
        console.log('A user connected');
        socket.on('disconnect', function () {
            console.log('User disconnected');
        })
    });
}