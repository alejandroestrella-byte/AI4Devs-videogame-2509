# User Prompts and Requests

This document contains all the prompts and requests made during the development of the Castlevania clone game.

## Initial Setup
1. Replace the main canvas with a new one based on scenario.png

## Player Sprite Implementation
2. Change placeholder player sprite to Elias.png when standing after attack action or after jumping action, when player is advancing change the player sprite to Elias_running.png
3. Make sure the sprites for the player can be seen without the empty background of the PNG images and properly integrated in the canvas of the game
4. Make sure canvas scenario overlaps the transparency background of the player sprite
5. When the player jumps replace the sprite with Elias_jump.png
6. Make sure the jump logic of changing the sprite is implemented properly

## Platforms
7. Add platforms to the game environment. Ensure the player character can land on and interact with these platforms. Once done, test the game to ensure the player character can collect items and that the score updates accordingly.
8. Just let 4 platforms and make sure they can be achieved by the character

## Collectables
9. Add a collectable item based on collectable.png, this item can be reachable for the player
10. Only add 2 collectables per scenario, make it half size you presented
11. Make sure collectables can be reached by the player
12. There is no way to get all collectables
13. There is no way to get collectable 1
14. The collectable 1 is not reachable because platform 2 does not let you advance and grab it
15. The collectable 1 is not reachable, reposition at the beginning of platform 2

## Enemies
16. Add enemies to the game environment, there are 3 types of them:
    - The first sprite is based on skull.png can jump randomly
    - The second sprite is based on Creature.png can only move horizontally and is always over the platforms
    - The third one is based on Fire.png it moves horizontally and always on platform 1, it can move over the other platforms
17. Make sure enemy number 3 advances on the contrary side once they reached the end of the canvas, make sure enemy number 2 can advance in contrary side of the platform once it reached the edge of the platform
18. Enemy number 3 can pass through platforms 2, 3 and 4
19. Enemy number 2 can begin walking from the end of platform number 3
20. Enemy 2 (Creature) starts at the end of Platform 4
21. Enemy 2 (Creature) to start at the end of Platform 3
22. See Enemy 2 starting on the Platform 3 and do not let to fall to other platform
23. See Enemy 2 starting on top of Platform 4 and staying there
24. Enemy 2 must start in the middle of platform 4 and do not let it falling to other place
25. Enemy 2 should be always on platform 4

## Game Over and Combat
26. Implement game over logic that triggers when the player character collides with an enemy
27. Make sure an enemy can be defeated if the attack action is performed just before the enemy collision with player
28. Make sure attack action can be performed while jumping

## Win Condition
29. Add a winning condition that triggers when all collectables are gotten and all enemies are defeated

## Infinite Levels
30. Modify the game in order to allow create infinite levels, so when user wins a level, a new one with new random positioned of collectables, different number of enemies and platforms will appear and automatically start

## Spawn Protection
31. Avoid enemies collide to player when the level begins

## Winning Screen
32. After finish a level add a winning screen where after confirmation dialogue begins the next level

## UI and Instructions
33. Add the instructions of the game on the bottom of the screen

## Attack Improvements
34. Make sure attacks can defeat an enemy when the player is behind it
35. Attack action should be last twice is now

