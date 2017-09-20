var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 3000;

app.use('/assets', express.static(__dirname + '/assets'));
app.use('/js', express.static(__dirname + '/js'));

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/index.html');
});

var playerID = 0,
    freeIDList = [],
    playerList = [],
    scoreList = [],
    numPlayers = 0,
    gameActive = 0;
var maxPlayers = 4;

var ballXLoc, ballYLoc, ballCarried = 0;

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
                    startGame();
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

    //Once a ballCarrier emit is received, ignore requests until a goal is scored
    socket.on('requestBallCarrier', function(playerID) {
        if (ballCarried === 0) {
            io.emit('ballCarrier', playerID);
            ballCarried = 1;
        }
    });

    socket.on('requestPlayerKilled', function(player) {
        //Confirm player killed with clients
        io.emit('playerKilled', player.playerID, player.bulletID);
        if (player.hasBall === 1) {
            ballCarried = 0;
            //Send the new ball to the player's location
            spawnEntity(player.x, player.y, 'ball03');
        }
    });

    //Someone scored a goal.  Emit this information to each client.
    socket.on('requestScoreGoal', function(playerID) {
        setTimeout(spawnBall, 5000);
        ballCarried = 0;
        scoreList[playerID] += 1;
        console.log("Score - [R: " + scoreList[0] + ", Y: " + scoreList[1] + ", B: " + scoreList[2] + ", G: " + scoreList[3] + "]");
        //Pass the player ID and the scoreList to run scoreGoal() and updateScoreBoard()
        io.emit('scoreGoal', { playerID, scoreList });
    });

//When a player logs out, run this disconnect 
    socket.on('disconnect', function() {
        //get the disconnected socket ID and remove it from the playerList
        var index = matchPlayerSocketID(socket.id);
        //must also get the player's ID so we can free it for use
        if (index != -1) {
            var tempPlayerID = playerList[index].playerID;
            playerList.splice(index, 1);
            freeIDList.push(tempPlayerID);
            //Sort the list, lowest to highest
            freeIDList.sort(function(a, b) {
                return a - b;
            });
            console.log("FreeIDList(" + freeIDList.length + " slot(s) available): " + freeIDList);
        };
        console.info("Socket " + socket.id + " has disconnected.");
        io.emit('chat', { sender: "Server", fontColor: "#FF00FF", message: "Player#" + tempPlayerID + " has disconnected." });
        //If there are no players connected, reset the game room
        if (freeIDList.length === maxPlayers) {
            setupServer();
            console.log("No players connected.  Resetting Game Room.");
        };
    });
});

server.listen(port, function() {
    console.log("Firewall Penitentiary Server v1.0  Listening on Port#: " + port + "\nFreeIDList(" + freeIDList.length + " slot(s) available): " + freeIDList);
});


//Given a player's socket, return the index number in the playerList
function matchPlayerSocketID(currentSocketID) {
    var ret = -1;
    for (i = 0; i < playerList.length; i++) {
        if (playerList[i].socketID == currentSocketID) {
            ret = i;
        };
    };
    return ret;
};

//Create a number of playerIDs equal to maxPlayers and put them in the freeIDList, set all scores and ballCarried status to 0
function setupServer() {
    for (i = 0; i < maxPlayers; i++) {
        gameActive = 0;
        freeIDList[i] = i;
        scoreList[i] = 0;
        ballCarried = 0;
    };

};

function startGame() {
    gameActive = 1;
    //starts the ball right in the middle of the game room
    spawnEntity(385, 285, 'ball03');
}

function spawnBall() {
    ballXLoc = randomIntFromInterval(100, 700) - 17;
    ballYLoc = randomIntFromInterval(100, 500) - 17;
    //emit the signal to spawn and entity(the ball at) x,y coordinates
    spawnEntity(ballXLoc, ballYLoc, 'ball03');
}


function randomIntFromInterval(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

function spawnEntity(x, y, name) {
    io.emit('spawnEntity', { x, y, name });
}