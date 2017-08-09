var top = this;
var gameMusic = [new Audio('./assets/audio/Urban-Jungle-2061_Looping.mp3'), new Audio('./assets/audio/Binary-Options.mp3')];
gameMusic.forEach(function(key) {
    key.loop = true;
    key.volume = 0.35;
});
var explosion = new Audio('./assets/audio/explosion.mp3'),
    shatter = new Audio('./assets/audio/shatter.mp3');
var currentMusic = 0;
var game, gameStatus, player, players, playerID = null,
    playerHasID = 0,
    updatedPlayer;
//Lists to define player avatar
var playerShields = [],
    playerList = [],
    playerGuns = [],
    playerShield, playerGun, pillars, gun, fireButton, strafeButton, cursors, keyA, keyS, keyW, keyD, playerBlue, playerRed, playerYellow, playerGreen, currentPlayer, currentGun, enableGameInput;
//Constants!
var maxPlayers = 4;

var htmlMessage = $("#message"),
    htmlChatWindow = $("#chatWindow"),
    htmlMainScreen = $("#mainScreen");

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
    },

    chatMessage = {
        sender: "",
        fontColor: "",
        message: ""
    };

console.log(game);

function preload() {
    //Cancel pausing the game when focus is lost
    game.stage.disableVisibilityChange = true;
    //Add in all the game assets we're going to use
    game.load.image('map01', '../assets/map01small.jpg');
    game.load.image('map02', '../assets/map02.png');
    game.load.image('pillar', '../assets/pillar.png');
    game.load.image('deathZero', '../assets/deathZero.png');
    game.load.image('deathOne', '../assets/deathOne.png');
    game.load.image('deathTwo', '../assets/deathTwo.png');
    game.load.image('deathFive', '../assets/deathFive.png');
    game.load.spritesheet('goal', '../assets/goal.png', 100, 100);
    game.load.spritesheet('gun_basic', '../assets/gun_basic.png', 8, 15);
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
    game.add.sprite(0, 0, 'map02');
    //Adds a group called goals and puts one in each corner
    goals = game.add.group();
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

    //Adds a group called pillars and then adds one in front of each player's base
    pillars = game.add.group();
    pillar = pillars.create(175, 275, 'pillar');
    pillars.create(575, 275, 'pillar');
    pillars.create(375, 125, 'pillar');
    pillars.create(375, 425, 'pillar');
    //Enable physics for the pillars group
    game.physics.arcade.enable(pillars);
    //Iterates over each member of the pillars group and stops them from leaving map.
    pillars.forEachAlive(function(pillar) {
        pillar.body.collideWorldBounds = true;
        pillar.body.immovable = true;
    });

    //Death particle emitter
    emitter = game.add.emitter(0, 0, 100);
    emitter.makeParticles(['deathZero', 'deathOne']);
    emitter.gravity = 0;
    emitter.maxParticleScale = 1.5;

    //Create a group for all the players
    players = game.add.group();
    //loads the players onto the map
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

    // adding weapon and a firebutton and having its movements track player

    for (i = 0; i < maxPlayers; i++) {
        playerGuns.push(game.add.weapon(3, 'playerBullet'));
        playerGuns[i].fireRate = 500;
        playerGuns[i].bulletSpeed = 300;
        playerGuns[i].trackSprite(playerList[i], 15, -25);
        playerGuns[i].bulletKillType = Phaser.Weapon.KILL_LIFESPAN;
        playerGuns[i].bulletLifespan = 5000;
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
    if (enableGameInput === 1) {
        game.input.enabled = true;
    }

    //Iterate through each player's gun's bullets and change them as defined below
    for (i = 0; i < playerGuns.length; i++) {
        playerGuns[i].bullets.forEachAlive(function(playerBullet) {
            //Set up bullet collision events
            game.physics.arcade.collide(playerShields, playerBullet);
            game.physics.arcade.collide(playerBullet, pillars);
            game.physics.arcade.collide(playerList, playerBullet, killPlayer, null, this);

            playerBullet.angle += 10;
            playerBullet.body.bounce.x = 1;
            playerBullet.body.bounce.y = 1;
            playerBullet.body.collideWorldBounds = true;
        });
    };

    //Collision with players and obstacles
    game.physics.arcade.collide(playerList, pillars);
    game.physics.arcade.collide(playerList, playerList);

    //Register mouse for aiming and firing
    mouse = game.input.mousePointer;

    //Stop the following keys from propagating up to the browser - is this necessary?
    game.input.keyboard.addKeyCapture([Phaser.Keyboard.SPACEBAR]);

    /*Movement event handlers. Note: If you don't account for diagonals first, cardinals will override and only move you in one direction, not two.*/

    //Show player shield and body hitboxes
    /*playerList.forEach(function(player) {
        game.debug.body(player);
        game.debug.body(player.children["0"]);
    });*/

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

    //Pressing enter changes focus from the chat to the game and vice versa
    if (enterButton.isDown) {
        myPlayerUpdate.move = 0;
        myPlayerUpdate.fire = 0;
        htmlMessage.focus();
        game.input.enabled = false;
    };

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
    //Stop player and pillars from leaving map.
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

function respawnPlayer(player) {
    player.reset(player.data.respawnX, player.data.respawnY);
    player.children["0"].revive();
};

//Kills the player on contact with a bullet.  Now with fancy particle explosions!
function killPlayer(player, bullet) {
    //Shatter sound effect
    shatter.play();
    //Explosion of binary 'gore'
    emitter.x = player.x;
    emitter.y = player.y;
    emitter.start(true, 3000, null, 30);

    bullet.kill();
    //kill child 0 (the shield) to prevent 'phantom bounce'
    player.children["0"].kill();
    player.kill();
    //Respawn after 5 seconds
    setTimeout(respawnPlayer, 5000, player);
}

/*Player movement routines */

function playerMove(update) {
    currentPlayer.body.velocity.x = 0;
    currentPlayer.body.velocity.y = 0;
    //x,y currently broken
    /*     currentPlayer.x = update.x;
         currentPlayer.y = update.y;*/
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
}