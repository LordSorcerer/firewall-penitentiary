var top = this;
var gameMusic = [new Audio('./assets/audio/Urban-Jungle-2061_Looping.mp3'), new Audio('./assets/audio/Binary-Options.mp3')];
gameMusic.forEach(function(key) {
    key.loop = true;
    key.volume = 0.35;
});
var explosion = new Audio('./assets/audio/explosion.mp3'),
    shatter = new Audio('./assets/audio/shatter.mp3'),
    goalBleep = new Audio('./assets/audio/goalBleep.mp3'),
    ballBleep = new Audio('./assets/audio/ballBleep.mp3');
var currentMusic = 0;
var game, gameStatus, player, players, playerID = null,
    playerHasID = 0,
    updatedPlayer;
//Lists
var playerShields = [],
    playerList = [],
    playerGuns = [],
    roomEntities = [],
    scoreList = [0, 0, 0, 0],
    playerShield, playerGun,
    playerBlue, playerRed, playerYellow, playerGreen, currentPlayer, currentGun,
    forcefields, gun, gameBall, gameBalls, newEntity,
    fireButton, strafeButton, cursors, keyA, keyS, keyW, keyD, enableGameInput;
//Constants!
var maxPlayers = 4,
    maxBullets = 3;

//JQuery html pointers
var htmlMessage = $("#message"),
    htmlChatWindow = $("#chatWindow"),
    htmlMainScreen = $("#mainScreen"),
    htmlScoreRed = $("#scoreRed"),
    htmlScoreYellow = $("#scoreYellow"),
    htmlScoreBlue = $("#scoreBlue"),
    htmlScoreGreen = $("#scoreGreen");

var game = new Phaser.Game(800, 600, Phaser.AUTO, 'mainScreen', {
    preload: preload,
    create: create,
    update: update,
});


//Network functionality
var socket, sender, message;
var myPlayerUpdate = {
        playerID: 0,
        strafe: 0,
        fire: 0,
        move: 0,
        x: 0,
        y: 0,
        bulletLocs: [],
    },

    chatMessage = {
        sender: "",
        fontColor: "",
        message: ""
    };

console.log(game);

function preload() {
    //Don't pause the game when focus is lost
    game.stage.disableVisibilityChange = true;
    //Add in all the game assets we're going to use
    game.load.image('map03', '../assets/map03.png');
    game.load.image('deathZero', '../assets/deathZero.png');
    game.load.image('deathOne', '../assets/deathOne.png');
    game.load.image('deathTwo', '../assets/deathTwo.png');
    game.load.image('deathFive', '../assets/deathFive.png');
    game.load.image('ball03', '../assets/ball03.png');
    game.load.image('forcefield', '../assets/forcefield.png');
    game.load.spritesheet('goal', '../assets/goal3.png', 110, 110);
    game.load.spritesheet('playerBullet', '../assets/playerBullet.png', 10, 10);
    game.load.spritesheet('shield_blue', '../assets/shield_blue.png', 32, 10);
    game.load.spritesheet('shield_red', '../assets/shield_red.png', 32, 10);
    game.load.spritesheet('shield_yellow', '../assets/shield_yellow.png', 32, 10);
    game.load.spritesheet('shield_green', '../assets/shield_green.png', 32, 10);
    game.load.spritesheet('prisoner_blue', '../assets/prisoner_blue.png', 40, 40);
    game.load.spritesheet('prisoner_red', '../assets/prisoner_red.png', 40, 40);
    game.load.spritesheet('prisoner_green', '../assets/prisoner_green.png', 40, 40);
    game.load.spritesheet('prisoner_yellow', '../assets/prisoner_yellow.png', 40, 40);
    game.load.spritesheet('prisoner_dead', '../assets/prisoner_dead.png', 40, 40);
    game.load.spritesheet('gun_basic', '../assets/gun_basic.png', 8, 15);

}


function create() {
    //Create all the groups
    //Create all the sprites
    gameMusic[currentMusic].play();
    /*Create map & terrain features*/
    game.add.sprite(0, 0, 'map03');
    //Adds a group called goals and puts one in each corner
    goals = game.add.group();
    //Create the four goals, setting their location and image rotation
    goalNW = goals.create(50, 50, 'goal');
    goalNW.anchor.setTo(0.5, 0.5);
    goalNW.angle = 90;
    goalSW = goals.create(0, 500, 'goal');
    goalNE = goals.create(750, 50, 'goal');
    goalNE.anchor.setTo(0.5, 0.5);
    goalNE.angle = -180;
    goalSE = goals.create(750, 550, 'goal');
    goalSE.anchor.setTo(0.5, 0.5);
    goalSE.angle = -90;
    //Enable physics model for goals
    game.physics.arcade.enable(goals);
    //Take each goal and make it both immovable and use circle hit detection
    goals.forEachAlive(function(goal) {
        goal.data.active = 0;
        goal.animations.add('flash', [0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0], 7, false);
        goal.body.immovable = true;
        goal.body.isCircle = true;
    });
    goalNW.body.setCircle(64, -27, -27);
    goalNE.body.setCircle(64, 0, -29);
    goalSW.body.setCircle(64, -27, 0);
    goalSE.body.setCircle(64, 0, 0);

    //Scorekeeping text in the bases
    baseTextN = game.add.text(390, 5, "0", { font: "40px Orbitron", fill: "#FFFFFF", align: "center" });
    baseTextE = game.add.text(760, 280, "0", { font: "40px Orbitron", fill: "#FFFFFF", align: "center" });
    baseTextS = game.add.text(390, 550, "0", { font: "40px Orbitron", fill: "#FFFFFF", align: "center" });
    baseTextW = game.add.text(10, 280, "0", { font: "40px Orbitron", fill: "#FFFFFF", align: "center" });
    //Adds a ball group
    gameBalls = game.add.group();
    //Adds a group called forcefields and then adds one in front of each player's base
    forcefields = game.add.group();
    forcefield = forcefields.create(175, 260, 'forcefield');
    forcefields.create(555, 265, 'forcefield');
    forcefields.create(365, 125, 'forcefield');
    forcefields.create(365, 395, 'forcefield');
    //Enable physics for the forcefields group
    game.physics.arcade.enable(forcefields);
    //Iterates over each member of the forcefields group and stops them from leaving map.
    forcefields.forEachAlive(function(forcefield) {
        forcefield.body.collideWorldBounds = true;
        forcefield.body.immovable = true;
    });

    //Sets up the particle emitter to be used upon player death
    emitter = game.add.emitter(0, 0, 100);
    emitter.makeParticles(['deathZero', 'deathOne']);
    emitter.gravity = 0;
    emitter.maxParticleScale = 1.5;

    //Create a group for all the players
    players = game.add.group();
    //loads the players onto the map, adds them to the players group and the playerList array
    playerRed = spawnPlayer("red");
    playerRed.data.fontColor = "red";
    playerList.push(playerRed);
    players.add(playerRed);
    playerYellow = spawnPlayer("yellow");
    playerYellow.data.fontColor = "yellow";
    playerList.push(playerYellow);
    players.add(playerYellow);
    playerBlue = spawnPlayer("blue");
    playerBlue.data.fontColor = "blue";
    playerList.push(playerBlue);
    players.add(playerBlue);
    playerGreen = spawnPlayer("green");
    playerGreen.data.fontColor = "lightgreen";
    playerList.push(playerGreen);
    players.add(playerGreen);

    //Create one gun for each player in the game.
    //playerGun: 3 shots on screen max, rate of fire: 2 per second, 5 second lifespan

    for (i = 0; i < maxPlayers; i++) {
        playerGuns.push(game.add.weapon(3, 'playerBullet'));
        playerGuns[i].fireRate = 500;
        playerGuns[i].bulletSpeed = 300;
        playerGuns[i].trackSprite(playerList[i], 15, -25);
        playerGuns[i].bulletKillType = Phaser.Weapon.KILL_LIFESPAN;
        playerGuns[i].bulletLifespan = 5000;

        //Iterates through all the bullets in the gun and assignes each a unique ID# pair - whichGun and whichBullet in said gun
        for (j = 0; j < maxBullets; j++) {
            playerGuns[i].bullets.children[j].data.ID = [i, j];
        };
    };

    //Register cursor keys for player movement
    cursors = game.input.keyboard.createCursorKeys(),
        //Register the other keys.
        fireButton = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR),
        //.SHIFT key is not working so we use the keyCode of 16
        strafeButton = game.input.keyboard.addKey(16),
        enterButton = game.input.keyboard.addKey(Phaser.Keyboard.ENTER),
        keyA = game.input.keyboard.addKey(Phaser.Keyboard.A),
        keyS = game.input.keyboard.addKey(Phaser.Keyboard.S),
        keyW = game.input.keyboard.addKey(Phaser.Keyboard.W),
        keyD = game.input.keyboard.addKey(Phaser.Keyboard.D);
};

function update() {
    //If chatting has enabled game input, update here
    if (game.input.activePointer.withinGame) {
        game.input.enabled = true;
    } else {
        game.input.enabled = false;
        myPlayerUpdate.move = 0;
    };

    //Iterate through each player's gun's bullets and change them as defined below
    for (i = 0; i < playerGuns.length; i++) {
        playerGuns[i].bullets.forEachAlive(function(playerBullet) {
            //Set up bullet collision events
            game.physics.arcade.collide(playerShields, playerBullet);
            game.physics.arcade.collide(playerBullet, forcefields);
            //Only this client's player checks for death.  Every client does this on their own instance for their own player.
            game.physics.arcade.collide(playerList[myPlayerUpdate.playerID], playerBullet, requestPlayerKilled, null, this);
            playerBullet.angle += 10;
            playerBullet.body.bounce.x = 1;
            playerBullet.body.bounce.y = 1;
            playerBullet.body.collideWorldBounds = true;
        });
    };

    //Collision with players and obstacles
    game.physics.arcade.collide(playerList, forcefields);
    game.physics.arcade.collide(playerList, playerList);
    //Client specific physics checks - mishandling of these is what lead to the multi-ball spawn issue.
    //Make sure only the player using this instance of the client checks to grab the ball.  Each player will do that on their own screen.  NOTE: gameBalls (group) is used because the gameBalls are created dynamically
    game.physics.arcade.overlap(playerList[myPlayerUpdate.playerID], gameBalls, requestBallCarrier, null, this);
    //Make sure only the player using this instance of the client checks to see if they've scored a goal.  Each player will do that on their own screen.
    game.physics.arcade.overlap(playerList[myPlayerUpdate.playerID], goals, requestScoreGoal, null, this);

    //Stop the following keys from propagating up to the browser - is this necessary?
    game.input.keyboard.addKeyCapture([Phaser.Keyboard.SPACEBAR]);

    /*Movement event handlers. Note: If you don't account for diagonals first, cardinals will override and only move you in one direction, not two.*/

    if (keyW.isDown && keyA.isDown || cursors.up.isDown && cursors.left.isDown) {
        //UP LEFT
        myPlayerUpdate.move = 8;
    } else if (keyW.isDown && keyD.isDown || cursors.up.isDown && cursors.right.isDown) {
        //UP RIGHT
        myPlayerUpdate.move = 2;
    } else if (keyS.isDown && keyA.isDown || cursors.down.isDown && cursors.left.isDown) {
        //DOWN LEFT
        myPlayerUpdate.move = 6;
    } else if (keyS.isDown && keyD.isDown || cursors.down.isDown && cursors.right.isDown) {
        //DOWN RIGHT
        myPlayerUpdate.move = 4;
    } else if (keyW.isDown || cursors.up.isDown) {
        //UP
        myPlayerUpdate.move = 1;
    } else if (keyS.isDown || cursors.down.isDown) {
        //DOWN
        myPlayerUpdate.move = 5;
    } else if (keyA.isDown || cursors.left.isDown) {
        //LEFT
        myPlayerUpdate.move = 7;
    } else if (keyD.isDown || cursors.right.isDown) {
        //RIGHT
        myPlayerUpdate.move = 3;
    } else {
        myPlayerUpdate.move = 0;
    };


    if (strafeButton.isDown) {
        myPlayerUpdate.strafe = 1;
    } else {
        myPlayerUpdate.strafe = 0;
    };

    //Checks to see if the spacebar is down
    if (fireButton.isDown) {
        myPlayerUpdate.fire = 1;
    } else {
        myPlayerUpdate.fire = 0;
    };

    //Updates this player's bullet locations
    for (i = 0; i < maxBullets; i++) {
        var tempArray = [];
        tempArray[0] = playerGuns[myPlayerUpdate.playerID].bullets.children[i].x;
        tempArray[1] = playerGuns[myPlayerUpdate.playerID].bullets.children[i].y;
        myPlayerUpdate.bulletLocs[i] = tempArray;
    }


    if (gameStatus != -1) {
        //Adds the player's current location to the update
        myPlayerUpdate.x = playerList[myPlayerUpdate.playerID].x;
        myPlayerUpdate.y = playerList[myPlayerUpdate.playerID].y;

        //Updates the server with the player's current position, movement and fire requests.  Contained in fp_client.js
        sendUpdate(myPlayerUpdate);
    };
}

/*Our custom code to handle game events */

function spawnPlayer(playerColor) {
    var player;
    /*Create player sprites based on color.  Sets start location, sprite, adds shield and sets respawn location on the event of death*/
    switch (playerColor) {
        case "red":
            player = game.add.sprite(400, 20, 'prisoner_red');
            playerShield = game.add.sprite(-30, -25, 'shield_red');
            //Enable physics here so we can set the shield angle properly
            game.physics.arcade.enable(playerShield);
            //Set proper angle and redirect shield
            player.angle = 180;
            playerShield.body.setSize(32, 15, -32, -15);
            player.data.respawnX = 400, player.data.respawnY = 20;
            break;
        case "yellow":
            player = game.add.sprite(780, 300, 'prisoner_yellow');
            playerShield = game.add.sprite(-30, -25, 'shield_yellow');
            //Enable physics here so we can set the shield angle properly
            game.physics.arcade.enable(playerShield);
            //Set proper angle and redirect shield
            player.angle = -90;
            playerShield.body.setSize(15, 32, 0, -32);
            player.data.respawnX = 780, player.data.respawnY = 300;
            break;
        case "blue":
            player = game.add.sprite(400, 580, 'prisoner_blue');
            playerShield = game.add.sprite(-30, -25, 'shield_blue');
            //Enable physics here so we can set the shield angle properly
            game.physics.arcade.enable(playerShield);
            //Set proper angle and redirect shield
            player.angle = 0;
            playerShield.body.setSize(32, 15, 0, -5);
            player.data.respawnX = 400, player.data.respawnY = 580;
            break;
        case "green":
            player = game.add.sprite(20, 300, 'prisoner_green');
            playerShield = game.add.sprite(-30, -25, 'shield_green');
            //Enable physics here so we can set the shield angle properly
            game.physics.arcade.enable(playerShield);
            //Set proper angle and redirect shield
            player.angle = 90;
            playerShield.body.setSize(15, 32, -15, 0);
            player.data.respawnX = 20, player.data.respawnY = 300;
            break;
    }

    //Enable physics on the player
    game.physics.arcade.enable(player);
    //set Circular hitbox centered on player's head
    player.body.isCircle = true;
    player.body.setCircle(15, 5, 5);
    //Stop player and forcefields from leaving map.
    player.body.collideWorldBounds = true;
    //Make the player walk
    player.animations.add('walk', [0, 1, 2, 3], 5, true);
    player.animations.add('die', [5, 6, 7, 8, 9], 10, false);
    //Set the center of the head as the rotation axis
    player.anchor.setTo(0.5, 0.5);

    //Modify the player's shield, add animation for walking and make the shield a child of the player
    playerShield.body.immovable = true;
    playerShield.animations.add('swingShield', [0, 1, 2, 3], 5, true);

    //Create the player's basic weapon, add animation for walking and make it a child of player
    playerGun = game.add.sprite(10, -23, 'gun_basic');
    playerGun.animations.add('swingGun', [0, 1, 2, 3], 5, true);
    playerGun.animations.add('fireGun', [0, 1, 2], 10, false);
    //Adds the newly created shield to a list of shields used for collision events
    playerShields.push(playerShield);
    //Add equipment as children of the player
    player.addChild(playerShield);
    player.addChild(playerGun);

    return player;
};

/*Player movement routines */

function playerMove(update) {
    currentPlayer.body.velocity.x = 0;
    currentPlayer.body.velocity.y = 0;
    var strafe = update.strafe;
    switch (update.move) {
        case 1: //north
            playerMoveN(currentPlayer, strafe);
            break;
        case 2: //Northeast
            playerMoveNE(currentPlayer);
            break;
        case 3: //East
            playerMoveE(currentPlayer, strafe);
            break;
        case 4: //Southeast
            playerMoveSE(currentPlayer);
            break;
        case 5: //South
            playerMoveS(currentPlayer, strafe);
            break;
        case 6: //Southwest
            playerMoveSW(currentPlayer);
            break;
        case 7: //West
            playerMoveW(currentPlayer, strafe);
            break;
        case 8: //Northwest
            playerMoveNW(currentPlayer);
            break;
        default:
            //If you're not moving, stop character, stop left and right equipment animations
            currentPlayer.animations.stop();
            currentPlayer.children["0"].animations.stop();
            currentPlayer.children["1"].animations.stop();
    };

};

function playerMoveN(currentPlayer, strafe) {

    currentPlayer.body.velocity.y = -150;
    currentPlayer.animations.play('walk');
    currentPlayer.children["0"].animations.play('swingShield');
    currentPlayer.children["1"].animations.play('swingGun');
    if (strafe === 0) {
        currentPlayer.angle = 0;
        currentPlayer.children["0"].body.setSize(32, 15, 0, -5);
    }

}

function playerMoveNE(currentPlayer) {
    currentPlayer.body.velocity.x = 150;
    currentPlayer.body.velocity.y = -150;
    currentPlayer.animations.play('walk');
    currentPlayer.children["0"].animations.play('swingShield');
    currentPlayer.children["1"].animations.play('swingGun');
};

function playerMoveE(currentPlayer, strafe) {

    currentPlayer.body.velocity.x = 150;
    currentPlayer.animations.play('walk');
    currentPlayer.children["0"].animations.play('swingShield');
    currentPlayer.children["1"].animations.play('swingGun');
    if (strafe === 0) {
        currentPlayer.angle = 90;
        currentPlayer.children["0"].body.setSize(15, 32, -15, 0);
    };
};

function playerMoveSE(currentPlayer) {
    currentPlayer.body.velocity.x = 150;
    currentPlayer.body.velocity.y = 150;
    currentPlayer.animations.play('walk');
    currentPlayer.children["0"].animations.play('swingShield');
    currentPlayer.children["1"].animations.play('swingGun');
};

function playerMoveS(currentPlayer, strafe) {
    currentPlayer.body.velocity.y = 150;
    currentPlayer.animations.play('walk');
    currentPlayer.children["0"].animations.play('swingShield');
    currentPlayer.children["1"].animations.play('swingGun');
    if (strafe === 0) {
        currentPlayer.angle = 180;
        currentPlayer.children["0"].body.setSize(32, 15, -32, -15);
    };
};

function playerMoveSW(currentPlayer) {
    currentPlayer.body.velocity.x = -150;
    currentPlayer.body.velocity.y = 150;
    currentPlayer.animations.play('walk');
    currentPlayer.children["0"].animations.play('swingShield');
    currentPlayer.children["1"].animations.play('swingGun');
};

function playerMoveW(currentPlayer, strafe) {
    currentPlayer.body.velocity.x = -150;
    currentPlayer.animations.play('walk');
    currentPlayer.children["0"].animations.play('swingShield');
    currentPlayer.children["1"].animations.play('swingGun');
    if (strafe === 0) {
        currentPlayer.angle = -90;
        currentPlayer.children["0"].body.setSize(15, 32, 0, -32);
    };
};

function playerMoveNW(currentPlayer) {
    currentPlayer.body.velocity.x = -150;
    currentPlayer.body.velocity.y = -150;
    currentPlayer.animations.play('walk');
    currentPlayer.children["0"].animations.play('swingShield');
    currentPlayer.children["1"].animations.play('swingGun');
}

function playerFire(update) {
    switch (currentPlayer.angle) {
        case -90:
            currentGun.fireAngle = Phaser.ANGLE_LEFT;
            currentGun.trackSprite(currentPlayer, -20, -15);
            break;
        case 90:
            currentGun.fireAngle = Phaser.ANGLE_RIGHT;
            currentGun.trackSprite(currentPlayer, 20, 15);
            break;
        case 0:
            currentGun.fireAngle = Phaser.ANGLE_UP;
            currentGun.trackSprite(currentPlayer, 15, -20);
            break;
            //-180 is DOWN. 180 is not.  Not sure why.
        case -180:
        default:
            currentGun.fireAngle = Phaser.ANGLE_DOWN;
            currentGun.trackSprite(currentPlayer, -15, 20);
            break;

    };
    currentGun.fire();
    explosion.play();
};

//Update all the player's bullets
function updateBullets(playerID, bulletLocs) {
    for (i = 0; i < maxBullets; i++) {
        playerGuns[playerID].bullets.children[i].x = bulletLocs[i][0];
        playerGuns[playerID].bullets.children[i].y = bulletLocs[i][1];
    }
};


function highlightGoal() {
    //Reset the frame on all the goals to inactive, just to be safe.
    goals.forEachAlive(function(goal) {
        goal.frame = 0;
    });
    if (gameBall.x < 400) {
        if (gameBall.y < 300) {
            goalSE.data.active = 1;
            goalSE.frame = 1;
        } else {
            goalNE.data.active = 1;
            goalNE.frame = 1;
        }
    } else {
        if (gameBall.y < 300) {
            goalSW.data.active = 1;
            goalSW.frame = 1;
        } else {
            goalNW.data.active = 1;
            goalNW.frame = 1;
        }
    }
};

function respawnPlayer(player) {
    player.reset(player.data.respawnX, player.data.respawnY);
    player.children["0"].revive();
};

//The client knows the ball carrier died, now tell the server
function playerKilled(playerID, bulletID) {
    //kills the player
    killEffects(playerList[playerID]);
    //If the player had the ball, destroy it
    if (playerList[playerID].data.hasBall === 1) {
        gameBall.destroy();
        playerList[playerID].data.hasBall = 0;
    };
    whichGun = bulletID[0];
    whichBullet = bulletID[1];
    //Also kills the bullet
    playerGuns[whichGun].bullets.children[whichBullet].kill();
};

//Requests the player's death on contact with a bullet
function requestPlayerKilled(player, bullet) {
    //Tells the server that this player should be killed and pass along the bullet ID so we can kill that, too
    socket.emit('requestPlayerKilled', { x: player.x, y: player.y, playerID: myPlayerUpdate.playerID, hasBall: player.data.hasBall, bulletID: bullet.data.ID });
};

function killEffects(player) {
    //Shatter sound effect
    shatter.play();
    //Explosion of binary 'gore'
    emitter.x = player.x;
    emitter.y = player.y;
    emitter.start(true, 3000, null, 30);
    //kill child 0 (the shield) to prevent 'phantom bounce'
    player.children["0"].kill();
    //Finally, kill the player
    player.kill();
    //Respawn the dead player in 5 seconds
    setTimeout(respawnPlayer, 5000, player);
};

//Sends a ball grab request emit to the server
function requestBallCarrier() {
    socket.emit('requestBallCarrier', myPlayerUpdate.playerID);
};

//Upon receiving a ballCarrier emit from the server, give the right player the ball.
function ballCarrier(playerID) {
    //Attach the ball as a child to the player
    ballBleep.play();
    gameBall.x = 0;
    gameBall.y = 25;
    gameBall.anchor.setTo(0.5, 0.5);
    playerList[playerID].addChild(gameBall);
    playerList[playerID].data.hasBall = 1;
};


function requestScoreGoal(player, goal) {
    if (player.data.hasBall === 1 && goal.data.active === 1) {
        player.data.hasBall = 0;
        socket.emit('requestScoreGoal', myPlayerUpdate.playerID);
    };
}

//Destroys the ball, plays sound effect, flashes goal
function scoreGoal(playerID) {
    player = playerList[playerID];
    //Destroy the ball
    gameBall.destroy();
    player.data.hasBall = 0;
    //Play sound effect and flash the goal on and off
    goalBleep.play();
    goals.forEachAlive(function(goal) {
        //Flash the active goal
        if (goal.data.active === 1) {
            goal.data.active = 0;
            goal.animations.play('flash');
        };
    });

    //Show the goal text for 3 seconds and then hide it again
    text = game.add.text(game.world.centerX, game.world.centerY, "-Packet Delivered-", { font: "30px Orbitron", fill: "#FF00FF", align: "center" });
    text.anchor.setTo(0.5, 0.5);
    text.visible = true;
    setTimeout(function() {
        text.visible = false;
    }, 3000);


};

//Puts the new score information into the scoreboard and into the player bases on the field
function updateScoreBoard(newScoreList) {
    scoreList = newScoreList;
    htmlScoreRed.text(scoreList[0]);
    htmlScoreYellow.text(scoreList[1]);
    htmlScoreBlue.text(scoreList[2]);
    htmlScoreGreen.text(scoreList[3]);
    baseTextN.text = scoreList[0];
    baseTextE.text = scoreList[1];
    baseTextS.text = scoreList[2];
    baseTextW.text = scoreList[3];
};