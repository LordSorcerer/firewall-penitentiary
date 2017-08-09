    

    //Networking Stuff
    
//Updates the server with the player's current position, movement and fire requests
function sendUpdate (myPlayerUpdate) {

        socket.emit('updatePlayer', myPlayerUpdate);
}



    $(document).ready(function() {
        //Establish network connection
        socket = io();
        //tell the server you have an ID or that you have no id (ID < 0)
        // myPlayerUpdate.playerID = localStorage.getItem("playerID");
        existingUser = sessionStorage.getItem("playerID");
        if (existingUser == null) {
            socket.emit('requestPlayerID');
        }

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
            //Dead players shouldn't be updating themselves... unless they're zombies
            if (currentPlayer.alive === true) {
                if (update.fire === 1) {
                    playerFire(update);
                }
                playerMove(update);
            };
        });

        socket.on('music', function(track) {
            console.log("Got music req");
            gameMusic[currentMusic].pause();
            gameMusic[track].play();
            currentMusic = track;
        });

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
            enableGameInput = 1;
        });

        $("#sendChat").on("click", function() {
            event.preventDefault();
            /* game.stage.focus();
             console.log(game.input.enabled);
             game.input.enabled = true;
             console.log(game.input.enabled);*/
            //Make sure the user isn't entering a blank line
            if (htmlMessage.val().trim() !== "") {
                chatMessage.sender = "Player #" + myPlayerUpdate.playerID;
                chatMessage.fontColor = playerList[myPlayerUpdate.playerID].data.fontColor;
                chatMessage.message = htmlMessage.val().trim();
                htmlMessage.val("");
                socket.emit('chat', chatMessage);
            }
        });
    });