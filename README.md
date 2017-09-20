# firewall-penitentiary: A game by Daniel Day, Jamie Leask, Thomas Murphy and Matthew Sullivan
## Deployed to Heroku: https://firewall-penitentiary.herokuapp.com/

It is the year 2103CE and the planet now stands on the brink of serious overpopulation.  To save on space and reduce overhead, convicted criminals are now hard wired into 'on-line virtual prisons,' computer simulations in which their brains interface directly with server while their bodies are kept healthy but paralyzed until they have served out their sentence.  In some cases, especially where criminals with a more violent history are concerned, their antics are broadcast on the media bands as a form of entertainment.  A modern cybersport, if you will.  A fraction of the proceeds help fund the ailing justice system but the majority serve to line the pockets of investors and CEOs. 

Our story focuses on the fate of one such 'virtual prison,' Firewall 5 Penitentiary, and its inhabitants.  The guards are underpaid, the inmates restless, the server is badly outdated and needs maintenance but the necessary funds simply aren't available.  As a result, security focuses on the more important areas of the network, leaving older, less vital systems vulnerable to the actions of anyone who happens upon them.  More and more prisoners are slipping through the cracks and escaping into the vastness of the internet...


Controls
---------
W / Up arrow: Moves you north (up)
A / Left arrow: Moves you west (left)
S / Down arrow: Moves you south (down)
E / Right arrow: Moves you east (right)

Spacebar: Fires your weapon
Shift: Enables strafe mode (stops your avatar from changing facing while moving)

Placing the mouse cursor over the main game window allows you to control your character.  Moving the mouse cursor anywhere outside of the main game window disables game input so that you can use the chat feature.


Network Play
-------------
Once all four players have joined (by navigating to the game page), the server will deploy a packet (ie the ball) to the center of the Game Room.  It is your goal to touch the packet, thus picking it up, and bring it to the goal that glows in a different color.  Scoring a goal will cause the server to drop another packet after a slight delay.  

You can kill other players by shooting them and deflect shots fired at you with your trusty shield.  Killing a player forces them to drop the ball, enabling you to score a goal.  Play continues until one player reaches a certain number of goals (victory condition not yet implemented for testing purposes).

To play again, all players must close the browser window to reset the server.  Wait 10 seconds and navigate to the game page.  The server will take care of the rest.




Known Issues
------------
1. Players in motion will continue in the same direction if the mouse cursor is moved outside of the main game window. Quick fix: press both the same movement key and opposite key once focus is placed on the main game window.

2. Players can currently "push" each other on collision.  This may cause clients to display the pushed player's position inaccurately but once they move it will synch up again.

3. Four players are REQUIRED in order to start the game.  Single player, two player and eight player versions are in progress.

4. The game utilizes a client-server-client model for the time being.  This is causing latency issues.