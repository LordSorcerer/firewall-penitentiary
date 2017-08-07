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
    numPlayers = 0,
    gameActive = 0;


io.on('connection', function(socket) {
    //Checks to see if the game is full.  If not, give the player an ID and increment the total number of players.
    socket.on('requestPlayerID', function() {
        playerID = playerList.length;
        if (playerID >= 0 && playerList.length < 4) {
            socket.emit('playerID', playerID);
            console.log("Player #" + playerID + " has joined. On socket " + socket.id);
            playerList.push(socket.id);
            console.log("Player socket list: " + playerList);
            if (playerList.length >= 4) {
                io.emit('chat', { sender: "Server", message: "Five seconds until game time..." });
                setTimeout(function() {
                    io.emit('chat', { sender: "Server", message: "The game has begun!" });
                    gameActive = 1;
                }, 5000);
            }

        } else {
            socket.emit('playerID', -1);
            console.log("Socket: " + socket.id + ", game full.  Enabling observation mode.");
            socket.emit('chat',{sender: "Server", message: "Game full.  Switching to observation mode." } )
        };
    });

    socket.on('chat', function(chatMessage) {
        io.emit('chat', chatMessage);
    });

    socket.on('updatePlayer', function(update) {
        if (gameActive === 1) {
            io.emit('updatePlayer', update);
        };
    });


    socket.on('disconnect', function(socket) {
        //get the disconnected socket ID and remove it from the player list
        var index = playerList.indexOf(socket);
        if (index != -1) {
            playerList.splice(index, 1);
            console.info("Socket " + socket.id + " has disconnected.");
        };
    });
});



server.listen(port, function() {
    console.log('listening on *:' + port);
});