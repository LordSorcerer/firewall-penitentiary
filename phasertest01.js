var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 3000;

app.use('/assets', express.static(__dirname + '/assets'));
app.use('/js', express.static(__dirname + '/js'));

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/phasertest01.html');
});

var playerID = [0, 1, 2, 3],
    numPlayers = 0;


io.on('connection', function(socket) {
    if (numPlayers < 4) {
        io.emit('playerID', playerID[numPlayers]);
        numPlayers += 1; //Supposedly a workaround for a chrome ++ error with socket.io
        console.log("Player #" + numPlayers + " has joined.");
    };
    socket.on('chat', function(chatMessage) {
    	io.emit('chat', chatMessage);
    });

    socket.on('updatePlayer', function(update) {
        io.emit('updatePlayer', update);
    });

    socket.on('disconnect', function(socket) {
        numPlayers -= 1;
    })
});

server.listen(port, function() {
    console.log('listening on *:' + port);
});