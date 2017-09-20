    //Networking Stuff

    //Updates the server with the player's current position, movement and fire requests
    function sendUpdate(myPlayerUpdate) {

        socket.emit('updatePlayer', myPlayerUpdate);
    }


    $(document).ready(function() {
        //Establish network connection
        socket = io();

        //request an ID from the server
            socket.emit('requestPlayerID');

        //Get a playerID from the server
        socket.on('playerID', function(ID) {
            //Check to see if the game is open.  If not, observe instead.
            gameStatus = ID;
            if (gameStatus != -1) {
                myPlayerUpdate.playerID = ID;
                console.log("I am player #" + myPlayerUpdate.playerID + ". On socket " + socket.id);
            }
        });

        //Did we receive an 'update' message from the server?
        socket.on('updatePlayer', function(update) {
            //Make sure we're updating the right player and gun
            currentPlayer = playerList[update.playerID];
            currentGun = playerGuns[update.playerID];
            //Update player's location on other clients' screens before running the update
            if (update.playerID !== myPlayerUpdate.playerID) {
                currentPlayer.x = update.x;
                currentPlayer.y = update.y;
                //Update all the player's bullets
                updateBullets(update.playerID, update.bulletLocs);
            };


            //Dead players shouldn't be updating themselves... unless they're zombies
            if (currentPlayer.alive === true) {
                if (update.fire === 1) {
                    playerFire(update);
                }
                playerMove(update);
            };
        });

        socket.on('music', function(track) {
            gameMusic[currentMusic].pause();
            gameMusic[track].play();
            currentMusic = track;
        });

//Breaks the message into three parts, identifying the sender, font color and actual message
        socket.on('chat', function(newMessage) {
            sender = newMessage.sender;
            fontColor = newMessage.fontColor;
            message = newMessage.message;
            htmlChatWindow.append("<li><span style='color:" + fontColor + ";'>" + sender + ": </span>" + message + "</li>");
            if (sender === "Server") {
                responsiveVoice.speak(message);
            };
            //Scrolls to the newest message
            htmlChatWindow.animate({ scrollTop: htmlChatWindow.prop('scrollHeight') }, 0);
        });

//Create a new game entity.  In this case, the ball is created but the function is set up to create any game entity.
        socket.on('spawnEntity', function(entity) {
            newEntity = game.add.sprite(entity.x, entity.y, entity.name);
            game.physics.arcade.enable(newEntity);
            newEntity.body.isCircle = true;
            if (entity.name === 'ball03') {
                gameBall = newEntity;
                gameBalls.add(gameBall);
                highlightGoal();
            };
        });

        socket.on('ballCarrier', function(playerID) {
            ballCarrier(playerID);
        });

        socket.on('playerKilled', function(playerID, bulletID) {
            playerKilled(playerID, bulletID);
        });

        socket.on('scoreGoal', function(score) {
            scoreGoal(score.playerID);
            updateScoreBoard(score.scoreList);
        });

        $("#sendChat").on("click", function() {
            event.preventDefault();
            if (htmlMessage.val().trim() !== "") {
                chatMessage.sender = "Player #" + myPlayerUpdate.playerID;
                chatMessage.fontColor = playerList[myPlayerUpdate.playerID].data.fontColor;
                chatMessage.message = htmlMessage.val().trim();
                htmlMessage.val("");
                socket.emit('chat', chatMessage);
            }
        });
    });