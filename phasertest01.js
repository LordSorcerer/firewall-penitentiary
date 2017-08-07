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
    /* freePlayerID = [],
     assignedPlayerID = [],*/
    playerList = [],
    numPlayers = 0,
    gameActive = 0;

io.on('connection', function(socket) {
    //Checks to see if the game is full.  If not, give the player an ID and increment the total number of players.
    socket.on('requestPlayerID', function() {
        playerID = playerList.length;
        if (playerID >= 0 && playerList.length < 4) {
            socket.emit('playerID', playerID);
            console.log("Player #" + playerID + " has joined on socket " + socket.id + ".");
            playerList.push({ "socket": socket.id, "playerID": playerID });
            console.log("Player socket list: " + playerList);
            //The Server chats with either the joining player's socket or ALL players' sockets
            socket.emit('chat', { sender: "Server", fontColor: "#FF00FF", message: "Welcome to Firewall Penitentiary.  Your body has been immobilized until the start of the game.  Wait patiently, Player#" + playerID + "."});
            if (playerList.length >= 4) {
                io.emit('chat', { sender: "Server", fontColor: "#FF00FF", message: "The final player has joined.  Five seconds until game time..." });
                setTimeout(function() {
                    io.emit('chat', { sender: "Server", fontColor: "#FF00FF", message: "The game has begun!" });
                    gameActive = 1;
                }, 5000);
            } else {
                socket.broadcast.emit('chat', { sender: "Server", fontColor: "#FF00FF", message: "A new player has joined the game.  Welcome, Player#" + playerID });
            }

        } else {
            socket.emit('playerID', -1);
            console.log("Socket: " + socket.id + ", game full.  Enabling observation mode.");
            socket.emit('chat', { sender: "Server", fontColor: "#FF00FF", message: "The game is full.  Switching to observation mode." });
        };
    });

    socket.on('chat', function(chatMessage) {
        io.emit('chat', chatMessage);
    });

    //If the game is disabled for any reason, don't listen to updatePlayer requests
    socket.on('updatePlayer', function(update) {
        if (gameActive === 1) {
            io.emit('updatePlayer', update);
        };
    });

    socket.on('disconnect', function() {
        //get the disconnected socket ID and remove it from the player list
        console.log("Socket: " + socket);
        /*Object.keys()*/
        var index = playerList.indexOf(socket.id);
        console.log("Index: " + index);
        //must also get the player's ID so we can free it for use
        if (index != -1) {
            playerList.splice(index, 1);
        };
        console.info("Socket " + socket.id + " has disconnected.");
        io.emit('chat', { sender: "Server", fontColor: "#FF00FF", message: + "Player#" + index + " has disconnected." });
    });
});

server.listen(port, function() {
    console.log("Firewall Penitentiary Server v1.0  Listening on Port#: " + port);
});