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

var playerID = 0,
    playerList = [],
    numPlayers = 0;


io.on('connection', function(socket) {
    //Checks to see if the game is full.  If not, give the player an ID and increment the total number of players.
    socket.on('requestPlayerID', function() {
        if (playerList.length < 4) {
            //Supposedly a workaround for a chrome '++' error with socket.io
            playerID = playerList.length;
            if (playerID >= 0) {
                socket.emit('playerID', playerID);
                console.log("Player #" + playerID + " has joined. On socket " + socket.id);
                playerList.push(socket.id);
                console.log("Player socket list: " + playerList);
                socket.emit('sendPlayerList', playerList);
            }

        } else {
            io.emit('playerID', -1);
            console.log("Game full.  Player control refused.");
        };
    });

    socket.on('chat', function(chatMessage) {
        io.emit('chat', chatMessage);
    });

    socket.on('updatePlayer', function(update) {
        io.emit('updatePlayer', update);
    });

    socket.on('disconnect', function(socket) {
        //get the disconnected socket ID and remove it from the player list
        var index = playerList.indexOf(socket);
        if (index != -1) {
            playerList.splice(index, 1);
            console.info("Socket " + socket.id + " has disconnected.");
        }
    });
});



server.listen(port, function() {
    console.log('listening on *:' + port);
});