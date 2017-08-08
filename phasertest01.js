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
    freeIDList = [],
    playerList = [],
    numPlayers = 0,
    gameActive = 0;

var maxPlayers = 1;

setupServer();

io.on('connection', function(socket) {
    //Checks to see if the game is full.  If not, give the player an ID and increment the total number of players.
    socket.on('requestPlayerID', function() {
        if (freeIDList.length > 0) {
            playerID = freeIDList[0];
            freeIDList.splice(0, 1);
            socket.emit('playerID', playerID);
            console.log("Player #" + playerID + " has joined on socket " + socket.id + ".");
            playerList.push({ 'socketID': socket.id, 'playerID': playerID });
             console.log("FreeIDList(" + freeIDList.length + " slot(s) available): " + freeIDList);
            //The Server chats with either the joining player's socket or ALL players' sockets
            if (freeIDList.length <= 0) {
                io.emit('chat', { sender: "Server", fontColor: "#FF00FF", message: "The final player has joined.  Ten seconds until game time." });
                setTimeout(function() {
                    io.emit('chat', { sender: "Server", fontColor: "#FF00FF", message: "The game has begun!" });
                    gameActive = 1;
                }, 12000);
                io.emit('music', 1);
            } else {
                socket.broadcast.emit('chat', { sender: "Server", fontColor: "#FF00FF", message: "A new player has joined the game.  Welcome, Player#" + playerID + "." });
                socket.emit('chat', { sender: "Server", fontColor: "#FF00FF", message: "Welcome to Firewall Penitentiary.  Your body has been immobilized until the start of the game.  Wait patiently, Player#" + playerID + "." });
            }

        } else {
            socket.emit('playerID', -1);
            console.log("Socket: " + socket.id + ", game full.  Enabling observation mode.");
            socket.emit('chat', { sender: "Server", fontColor: "#FF00FF", message: "The game is full.  Switching to observation mode." });
            socket.emit('music', 1);
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
        var index = matchPlayerSocketID(socket.id);
        console.log("Index: " + index);
        //must also get the player's ID so we can free it for use
        if (index != -1) {
            var tempPlayerID = playerList[index].playerID;
            playerList.splice(index, 1);
            freeIDList.push(tempPlayerID);
            console.log(freeIDList);
        };
        console.info("Socket " + socket.id + " has disconnected.");
        io.emit('chat', { sender: "Server", fontColor: "#FF00FF", message: "Player#" + tempPlayerID + " has disconnected." });
    });
});

server.listen(port, function() {
    console.log("Firewall Penitentiary Server v1.0  Listening on Port#: " + port);
    console.log("FreeIDList(" + freeIDList.length + " slot(s) available): " + freeIDList);
});



function matchPlayerSocketID(currentSocketID) {
    var ret = -1;
    for (i = 0; i < playerList.length; i++) {
        console.log("ID: " + playerList[i].socketID + " id: " + currentSocketID);
        if (playerList[i].socketID == currentSocketID) {
            ret = i;
        };
    };
    return ret;
};

//Create a number of playerIDs equal to maxPlayers and put them in the freeIDList
function setupServer() {
    for (i = 0; i < maxPlayers; i++) {
        freeIDList.push(i);
    }

}