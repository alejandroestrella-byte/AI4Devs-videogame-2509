// Castlevania Clone - Main Game File
// Using Phaser 3

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    backgroundColor: '#000000', // Fallback color while loading
    transparent: true, // Ensure transparency is handled properly
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 300 },
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

const game = new Phaser.Game(config);

// Game variables
let player;
let platforms;
let cursors;
let playerState = 'idle'; // 'idle', 'running', 'jumping', 'attacking'
let collectables;
let score = 0;
let scoreText;
let collectableCount = 0;
let collectableCountText;
let enemies;
let gameOver = false;
let gameOverText;
let gameWon = false;
let victoryText;
let currentLevel = 1;
let totalCollectables = 2;
let totalEnemies = 3;
let defeatedEnemies = 0;
let playerEnemyCollider = null;
let spawnProtectionTimer = 0;
const SPAWN_PROTECTION_DURATION = 180; // 3 seconds at 60fps
let waitingForNextLevel = false;
let levelCompleteText = null;
let continueText = null;

function preload() {
    // Load scenario background
    this.load.image('scenario', 'assets/images/scenario.png');
    
    // Load Elias sprites with transparency support
    this.load.image('elias', 'assets/images/Elias.png');
    this.load.image('elias_running', 'assets/images/Elias_running.png');
    this.load.image('elias_jump', 'assets/images/Elias_jump.png');
    this.load.image('elias_attack', 'assets/images/Elias_attack.png');
    
    // Load collectable item
    this.load.image('collectable', 'assets/images/collectable.png');
    
    // Load enemy sprites
    this.load.image('skull', 'assets/images/skull.png');
    this.load.image('creature', 'assets/images/Creature.png');
    this.load.image('fire', 'assets/images/Fire.png');
    
    // Create platform textures with different sizes
    // Stone platform texture (dark grey with borders)
    this.add.graphics()
        .fillStyle(0x4a4a4a) // Dark grey
        .fillRect(0, 0, 200, 24)
        .lineStyle(2, 0x2a2a2a) // Darker border
        .strokeRect(0, 0, 200, 24)
        .generateTexture('platform', 200, 24);
    
    // Large platform texture
    this.add.graphics()
        .fillStyle(0x4a4a4a)
        .fillRect(0, 0, 400, 24)
        .lineStyle(2, 0x2a2a2a)
        .strokeRect(0, 0, 400, 24)
        .generateTexture('platform_large', 400, 24);
    
    // Small platform texture
    this.add.graphics()
        .fillStyle(0x4a4a4a)
        .fillRect(0, 0, 100, 24)
        .lineStyle(2, 0x2a2a2a)
        .strokeRect(0, 0, 100, 24)
        .generateTexture('platform_small', 100, 24);
}

function create() {
    // Add scenario background - MUST be added first to render behind everything
    // Create it as a static background layer
    const scenario = this.add.image(0, 0, 'scenario');
    scenario.setOrigin(0, 0);
    
    // Scale the scenario to cover the entire canvas
    const scaleX = this.cameras.main.width / scenario.width;
    const scaleY = this.cameras.main.height / scenario.height;
    const scale = Math.max(scaleX, scaleY);
    scenario.setScale(scale);
    
    // CRITICAL: Set scenario depth to minimum and ensure it renders FIRST
    // This allows the scenario to show through transparent areas of the player sprite
    scenario.setDepth(0); // Lowest depth - renders first as background
    scenario.setScrollFactor(0); // Fixed to camera
    scenario.setAlpha(1);
    scenario.setActive(true);
    scenario.setVisible(true);
    
    // Store reference to scenario so it persists
    this.scenario = scenario;
    
    // Create platforms group
    platforms = this.physics.add.staticGroup();
    
    // Create collectables group
    collectables = this.physics.add.group({
        defaultKey: 'collectable',
        immovable: false,
        allowGravity: false
    });
    
    // Score display
    score = 0;
    scoreText = this.add.text(16, 16, 'Score: 0', {
        fontSize: '32px',
        fill: '#ffffff',
        fontFamily: 'Arial',
        stroke: '#000000',
        strokeThickness: 4
    });
    scoreText.setDepth(20); // Above everything
    
    // Initialize game over and win states
    gameOver = false;
    gameOverText = null;
    gameWon = false;
    victoryText = null;
    defeatedEnemies = 0;
    spawnProtectionTimer = SPAWN_PROTECTION_DURATION; // Start with spawn protection
    waitingForNextLevel = false;
    levelCompleteText = null;
    continueText = null;
    
    // If first level, set initial level; otherwise level is already set
    if (!currentLevel || currentLevel === 1) {
        currentLevel = 1;
    }
    
    // Calculate level difficulty (increase with level)
    // More enemies and collectables as level increases
    totalCollectables = 2 + Math.floor(currentLevel / 2); // 2, 2, 3, 3, 4, 4...
    totalEnemies = 3 + Math.floor(currentLevel / 3); // 3, 3, 3, 4, 4, 4, 5...
    
    // Collectable counter display
    collectableCount = 0;
    collectableCountText = this.add.text(16, 60, 'Collectables: 0 / ' + totalCollectables, {
        fontSize: '24px',
        fill: '#ffff00',
        fontFamily: 'Arial',
        stroke: '#000000',
        strokeThickness: 4
    });
    collectableCountText.setDepth(20); // Above everything
    
    // Display level text
    const levelText = this.add.text(400, 16, 'Level: ' + currentLevel, {
        fontSize: '32px',
        fill: '#00ff00',
        fontFamily: 'Arial',
        stroke: '#000000',
        strokeThickness: 4
    });
    levelText.setOrigin(0.5, 0); // Center horizontally, align top
    levelText.setDepth(20);
    
    // Display game instructions at the bottom
    const instructionsText = this.add.text(400, 550, 'ARROWS: Move | SPACE: Attack | Collect all items and defeat all enemies', {
        fontSize: '18px',
        fill: '#ffffff',
        fontFamily: 'Arial',
        stroke: '#000000',
        strokeThickness: 3,
        backgroundColor: '#000000',
        padding: { x: 10, y: 5 }
    });
    instructionsText.setOrigin(0.5, 0.5); // Center horizontally and vertically
    instructionsText.setDepth(20); // Above most elements
    instructionsText.setAlpha(0.85); // Slightly transparent
    
    // Function to handle item collection
    this.collectItem = function(player, collectable) {
        // Remove the collectable
        collectable.disableBody(true, true);
        
        // Update score
        score += 10;
        scoreText.setText('Score: ' + score);
        
        // Update collectable counter
        collectableCount++;
        collectableCountText.setText('Collectables: ' + collectableCount + ' / ' + totalCollectables);
        
        // Check win condition after collecting
        this.checkWinCondition();
        
        // Optional: Add a sound effect or visual feedback here
    };
    
    // Function to handle enemy collision - check if player is attacking
    this.handleEnemyCollision = function(player, enemy) {
        // Don't process collision during spawn protection
        if (spawnProtectionTimer > 0) {
            return;
        }
        
        // Only process collision if not already game over
        if (!gameOver) {
            // Check if player is attacking (attack timer > 0 means attack is active)
            // Give a reasonable window - if attack timer is still counting down, enemy is defeated
            // This works regardless of player position (front or behind enemy)
            if (this.attackTimer > 0 || playerState === 'attacking') {
                // Player is attacking - defeat the enemy
                // Check if enemy is still active (might have been defeated by proximity check)
                if (enemy && enemy.active && !enemy.body.destroyed) {
                    // Disable the enemy body and remove it
                    enemy.disableBody(true, true);
                    
                    // Update defeated enemies count
                    defeatedEnemies++;
                    
                    // Give score for defeating enemy
                    score += 20; // More points for defeating enemy
                    scoreText.setText('Score: ' + score);
                    
                    // Check win condition after defeating enemy
                    this.checkWinCondition();
                }
                
                // Optional: Add visual feedback for enemy defeat
                // Enemy is already destroyed above
            } else {
                // Player is not attacking - trigger game over
                gameOver = true;
                
                // Stop player movement
                player.setVelocity(0, 0);
                player.setTint(0xff0000); // Red tint to indicate damage/death
                
                // Stop all enemies
                if (enemies && enemies.children && enemies.children.entries) {
                    enemies.children.entries.forEach(function(enemy) {
                        enemy.setVelocity(0, 0);
                    });
                }
                
                // Display game over text
                gameOverText = this.add.text(400, 250, 'GAME OVER', {
                    fontSize: '64px',
                    fill: '#ff0000',
                    fontFamily: 'Arial',
                    stroke: '#000000',
                    strokeThickness: 8,
                    fontStyle: 'bold'
                });
                gameOverText.setOrigin(0.5, 0.5);
                gameOverText.setDepth(30); // Above everything
                
                // Display restart instruction
                const restartText = this.add.text(400, 320, 'Press R to Restart', {
                    fontSize: '32px',
                    fill: '#ffffff',
                    fontFamily: 'Arial',
                    stroke: '#000000',
                    strokeThickness: 4
                });
                restartText.setOrigin(0.5, 0.5);
                restartText.setDepth(30);
                
                // Add restart key
                this.restartKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
            }
        }
    };
    
    // Function to check win condition
    this.checkWinCondition = function() {
        // Only check if game is not already over or won
        if (!gameOver && !gameWon && !waitingForNextLevel) {
            // Check if all collectables are collected and all enemies are defeated
            if (collectableCount >= totalCollectables && defeatedEnemies >= totalEnemies) {
                // Level completed! Show winning screen
                this.showLevelCompleteScreen();
            }
        }
    };
    
    // Function to show level complete screen
    this.showLevelCompleteScreen = function() {
        gameWon = true;
        waitingForNextLevel = true;
        
        // Stop player movement
        player.setVelocity(0, 0);
        player.clearTint();
        
        // Stop all enemies
        if (enemies && enemies.children && enemies.children.entries) {
            enemies.children.entries.forEach(function(enemy) {
                enemy.setVelocity(0, 0);
            });
        }
        
        // Display level complete text
        levelCompleteText = sceneRef.add.text(400, 200, 'LEVEL COMPLETE!', {
            fontSize: '72px',
            fill: '#00ff00',
            fontFamily: 'Arial',
            stroke: '#000000',
            strokeThickness: 8,
            fontStyle: 'bold'
        });
        levelCompleteText.setOrigin(0.5, 0.5);
        levelCompleteText.setDepth(30);
        
        // Display level number
        const levelNumberText = sceneRef.add.text(400, 280, 'Level ' + currentLevel + ' Complete', {
            fontSize: '36px',
            fill: '#ffff00',
            fontFamily: 'Arial',
            stroke: '#000000',
            strokeThickness: 4
        });
        levelNumberText.setOrigin(0.5, 0.5);
        levelNumberText.setDepth(30);
        
        // Display score
        const scoreDisplayText = sceneRef.add.text(400, 330, 'Score: ' + score, {
            fontSize: '32px',
            fill: '#ffffff',
            fontFamily: 'Arial',
            stroke: '#000000',
            strokeThickness: 4
        });
        scoreDisplayText.setOrigin(0.5, 0.5);
        scoreDisplayText.setDepth(30);
        
        // Display continue instruction
        continueText = sceneRef.add.text(400, 390, 'Press SPACE to Continue', {
            fontSize: '28px',
            fill: '#00ffff',
            fontFamily: 'Arial',
            stroke: '#000000',
            strokeThickness: 4,
            fontStyle: 'bold'
        });
        continueText.setOrigin(0.5, 0.5);
        continueText.setDepth(30);
        
        // Add blinking effect to continue text
        sceneRef.tweens.add({
            targets: continueText,
            alpha: { from: 1, to: 0.3 },
            duration: 800,
            yoyo: true,
            repeat: -1
        });
    };
    
    // Function to generate next level
    this.generateNextLevel = function() {
        // Clean up victory/level complete text if exists
        if (victoryText) {
            victoryText.destroy();
            victoryText = null;
        }
        if (levelCompleteText) {
            levelCompleteText.destroy();
            levelCompleteText = null;
        }
        if (continueText) {
            continueText.destroy();
            continueText = null;
        }
        
        // Clean up any other level complete text objects
        const textObjects = sceneRef.children.list.filter(child => 
            child.text && (
                child.text.includes('LEVEL COMPLETE') ||
                child.text.includes('Level') && child.text.includes('Complete') ||
                child.text.includes('Press SPACE to Continue')
            )
        );
        textObjects.forEach(textObj => textObj.destroy());
        
        waitingForNextLevel = false;
        gameWon = false; // Reset win state
        
        // Increment level
        currentLevel++;
        
        // Reset game state for new level
        collectableCount = 0;
        defeatedEnemies = 0;
        spawnProtectionTimer = SPAWN_PROTECTION_DURATION; // Reset spawn protection for new level
        
        // Calculate new level difficulty
        totalCollectables = 2 + Math.floor(currentLevel / 2);
        totalEnemies = 3 + Math.floor(currentLevel / 3);
        
        // Update UI
        scoreText.setText('Score: ' + score);
        collectableCountText.setText('Collectables: ' + collectableCount + ' / ' + totalCollectables);
        
        // Update level text if it exists, otherwise create it
        const levelTexts = this.children.list.filter(child => child.text && child.text.includes('Level:'));
        if (levelTexts.length > 0) {
            levelTexts[0].setText('Level: ' + currentLevel);
        } else {
            const levelText = this.add.text(400, 16, 'Level: ' + currentLevel, {
                fontSize: '32px',
                fill: '#00ff00',
                fontFamily: 'Arial',
                stroke: '#000000',
                strokeThickness: 4
            });
            levelText.setOrigin(0.5, 0);
            levelText.setDepth(20);
        }
        
        // Clean up old platforms
        platforms.children.entries.forEach(function(platform) {
            platform.destroy();
        });
        platforms.clear(true, true);
        
        // Clean up old enemies
        if (enemies && enemies.children) {
            enemies.children.entries.forEach(function(enemy) {
                enemy.destroy();
            });
            enemies.clear(true, true);
        }
        
        // Clean up old collectables
        collectables.children.entries.forEach(function(collectable) {
            collectable.destroy();
        });
        collectables.clear(true, true);
        
        // Generate new level
        this.createLevelElements();
        
        // Reset player position to start
        player.x = 100;
        player.y = 450;
        player.setVelocity(0, 0);
        player.clearTint();
        playerState = 'idle';
        player.setTexture('elias');
        player.setScale(player.playerScale);
        this.adjustPlayerBody();
    };
    
    // Function to create level elements (platforms, enemies, collectables)
    const sceneRef = this; // Store scene reference to ensure proper context
    this.createLevelElements = function() {
        // Always create ground platform first (Platform 1)
        const platform1 = platforms.create(400, 568, 'platform_large').setScale(4, 1).refreshBody();
        platform1.setDepth(5);
        sceneRef.platform1Ref = platform1;
        
        // Generate random number of elevated platforms (2-6 platforms)
        const numElevatedPlatforms = Math.min(2 + Math.floor(currentLevel / 2), 6);
        const platformPositions = [];
        
        // Generate elevated platforms
        for (let i = 0; i < numElevatedPlatforms; i++) {
            // Random position within playable area
            const x = Phaser.Math.Between(100, 700);
            const y = Phaser.Math.Between(300, 520); // Elevated, reachable heights
            
            // Choose random platform size
            const platformTypes = ['platform', 'platform_large', 'platform_small'];
            const platformType = platformTypes[Phaser.Math.Between(0, platformTypes.length - 1)];
            
            const platform = platforms.create(x, y, platformType).refreshBody();
            platform.setDepth(5);
            platformPositions.push(platform);
        }
        
        // Always create a fresh enemies group to ensure it's properly initialized with scene context
        // If enemies group exists, destroy individual enemies first, then create a new group
        if (enemies && enemies.children && enemies.children.entries) {
            // Destroy individual enemies first
            enemies.children.entries.forEach(function(enemy) {
                if (enemy && enemy.active) {
                    enemy.destroy();
                }
            });
        }
        
        // Create a fresh enemies group with the scene's physics world
        // Always create new group to ensure proper initialization
        enemies = sceneRef.physics.add.group();
        
        // Generate enemies with random types and positions
        for (let i = 0; i < totalEnemies; i++) {
            const enemyType = Phaser.Math.Between(1, 3); // 1=skull, 2=creature, 3=fire
            
            if (enemyType === 1) {
                // Skull enemy - can jump randomly, place on ground or platforms
                const enemyPlatform = platformPositions.length > 0 && Math.random() > 0.5 
                    ? platformPositions[Phaser.Math.Between(0, platformPositions.length - 1)]
                    : platform1;
                const enemyX = enemyPlatform === platform1 
                    ? Phaser.Math.Between(100, 700)
                    : enemyPlatform.x + Phaser.Math.Between(-80, 80);
                const enemyY = enemyPlatform === platform1 
                    ? 450
                    : enemyPlatform.y - 30; // Above platform surface
                
                const skullEnemy = enemies.create(enemyX, enemyY, 'skull');
                skullEnemy.setScale(0.15);
                skullEnemy.setDepth(9);
                skullEnemy.setBlendMode(Phaser.BlendModes.NORMAL);
                skullEnemy.clearTint();
                skullEnemy.setCollideWorldBounds(true);
                skullEnemy.setBounce(0.2);
                skullEnemy.body.setSize(skullEnemy.width * 0.6, skullEnemy.height * 0.8);
                skullEnemy.body.setOffset((skullEnemy.width - skullEnemy.body.width) / 2, skullEnemy.height * 0.1);
                skullEnemy.jumpTimer = 0;
                skullEnemy.jumpCooldown = 0;
                skullEnemy.moveDirection = Phaser.Math.Between(0, 1) ? 1 : -1;
                
            } else if (enemyType === 2) {
                // Creature enemy - moves horizontally on platforms
                if (platformPositions.length > 0) {
                    const targetPlatform = platformPositions[Phaser.Math.Between(0, platformPositions.length - 1)];
                    const enemyX = targetPlatform.x;
                    const enemyY = targetPlatform.y - 30; // Above platform surface
                    
                    const creatureEnemy = enemies.create(enemyX, enemyY, 'creature');
                    creatureEnemy.setScale(0.15);
                    creatureEnemy.setDepth(9);
                    creatureEnemy.setBlendMode(Phaser.BlendModes.NORMAL);
                    creatureEnemy.clearTint();
                    creatureEnemy.setCollideWorldBounds(true);
                    creatureEnemy.setBounce(0.2);
                    creatureEnemy.body.setSize(creatureEnemy.width * 0.6, creatureEnemy.height * 0.8);
                    creatureEnemy.body.setOffset((creatureEnemy.width - creatureEnemy.body.width) / 2, creatureEnemy.height * 0.1);
                    creatureEnemy.moveDirection = Phaser.Math.Between(0, 1) ? 1 : -1;
                    creatureEnemy.moveSpeed = 80;
                    creatureEnemy.hoverPlatform = targetPlatform; // Reference for edge detection
                }
                
            } else if (enemyType === 3) {
                // Fire enemy - moves horizontally on platform 1, can pass through other platforms
                const enemyX = Phaser.Math.Between(150, 650);
                const fireEnemy = enemies.create(enemyX, 450, 'fire');
                fireEnemy.setScale(0.15);
                fireEnemy.setDepth(9);
                fireEnemy.setBlendMode(Phaser.BlendModes.NORMAL);
                fireEnemy.clearTint();
                fireEnemy.setCollideWorldBounds(true);
                fireEnemy.setBounce(0.2);
                fireEnemy.body.setSize(fireEnemy.width * 0.6, fireEnemy.height * 0.8);
                fireEnemy.body.setOffset((fireEnemy.width - fireEnemy.body.width) / 2, fireEnemy.height * 0.1);
                fireEnemy.moveDirection = Phaser.Math.Between(0, 1) ? 1 : -1;
                fireEnemy.moveSpeed = 100;
                fireEnemy.platform1Y = 450;
                fireEnemy.canJump = true;
            }
        }
        
        // Generate collectables on random platforms
        const availablePlatforms = [platform1, ...platformPositions];
        
        for (let i = 0; i < totalCollectables; i++) {
            if (availablePlatforms.length > 0) {
                const targetPlatform = availablePlatforms[Phaser.Math.Between(0, availablePlatforms.length - 1)];
                const collectableX = targetPlatform === platform1
                    ? Phaser.Math.Between(150, 650)
                    : targetPlatform.x + Phaser.Math.Between(-80, 80);
                const collectableY = targetPlatform === platform1
                    ? 445
                    : targetPlatform.y - 35; // Above platform surface
                
                const collectable = collectables.create(collectableX, collectableY, 'collectable');
                collectable.setScale(0.05);
                collectable.setDepth(8);
                collectable.body.setSize(collectable.width * 0.8, collectable.height * 0.8);
            }
        }
        
        // Add collisions for enemies and platforms
        // Fire enemy should only collide with platform 1
        sceneRef.physics.add.collider(enemies, platforms, null, function(enemy, platform) {
            if (enemy.texture && enemy.texture.key === 'fire') {
                return platform === platform1;
            }
            if (enemy.texture && enemy.texture.key === 'creature' && enemy.hoverPlatform) {
                return platform === enemy.hoverPlatform;
            }
            return true;
        });
        
        // Remove existing player-enemy collider if it exists
        if (playerEnemyCollider) {
            playerEnemyCollider.destroy();
            playerEnemyCollider = null;
        }
        
        // Add collision between player and enemies (but will be disabled during spawn protection)
        playerEnemyCollider = sceneRef.physics.add.overlap(player, enemies, sceneRef.handleEnemyCollision, null, sceneRef);
        
        // Disable collision during spawn protection
        if (spawnProtectionTimer > 0) {
            playerEnemyCollider.active = false;
        }
        
        // Re-add collision between player and collectables
        sceneRef.physics.add.overlap(player, collectables, sceneRef.collectItem, null, sceneRef);
    };
    
    // Create player with Elias sprite - start on ground or first platform
    player = this.physics.add.sprite(100, 450, 'elias');
    
    // Scale down the player sprite to a reasonable size (adjust scale factor as needed)
    // Assuming the Elias sprite might be large, scale it down proportionally
    player.playerScale = 0.15; // Store scale as property so it persists
    player.setScale(player.playerScale);
    
    // Set player depth to be ABOVE the scenario
    // This ensures player renders on top, but scenario shows through transparent areas
    player.setDepth(10);
    
    // Ensure player alpha is set correctly for transparency
    player.setAlpha(1);
    
    // CRITICAL: Use NORMAL blend mode to ensure PNG transparency works correctly
    // This allows the scenario background to show through transparent pixels
    player.setBlendMode(Phaser.BlendModes.NORMAL);
    
    // Remove any tinting to ensure proper colors and transparency
    player.clearTint(); // Use clearTint to ensure no tinting affects transparency
    
    // Adjust physics body to better match the visible sprite area
    // Reduce the body size to avoid empty transparent areas
    player.body.setSize(player.width * 0.6, player.height * 0.8);
    player.body.setOffset((player.width - player.body.width) / 2, player.height * 0.1);
    
    player.setBounce(0.2);
    player.setCollideWorldBounds(true);
    playerState = 'idle';
    
    // Helper function to adjust physics body size when texture changes
    this.adjustPlayerBody = function() {
        player.body.setSize(player.width * 0.6, player.height * 0.8);
        player.body.setOffset((player.width - player.body.width) / 2, player.height * 0.1);
    };
    
    // Player physics
    this.physics.add.collider(player, platforms);
    
    // Note: Player collisions with collectables and enemies are added in createLevelElements
    
    // Generate initial level (level 1) - call after player is created
    this.createLevelElements();
    
    // Track when player lands after jumping
    this.wasJumping = false;
    this.attackTimer = 0;
    
    // Input
    cursors = this.input.keyboard.createCursorKeys();
    
    // Add space bar for attacking
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
}

function update() {
    // Handle game over restart
    if (gameOver && this.restartKey && Phaser.Input.Keyboard.JustDown(this.restartKey)) {
        // Restart the scene
        this.scene.restart();
        return; // Don't process any game logic
    }
    
    // Handle level complete - wait for confirmation to continue
    if (waitingForNextLevel && Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
        // User confirmed, generate next level
        this.generateNextLevel();
        return; // Don't process game logic until next frame
    }
    
    // Don't update game logic if game over or waiting for next level confirmation
    if (gameOver || waitingForNextLevel) {
        return;
    }
    
    // Handle spawn protection timer
    if (spawnProtectionTimer > 0) {
        spawnProtectionTimer--;
        
        // Enable player-enemy collision when spawn protection ends
        if (spawnProtectionTimer === 0 && playerEnemyCollider) {
            playerEnemyCollider.active = true;
        }
    }
    
    // Decrease attack timer and check for enemy hits during attack
    if (this.attackTimer > 0) {
        this.attackTimer--;
        
        // Check for enemies within attack range during attack frames
        // This allows attacks to hit enemies from any direction (front or behind)
        if (enemies && enemies.children && enemies.children.entries) {
            enemies.children.entries.forEach(enemy => {
                if (enemy && enemy.active && !enemy.body.destroyed) {
                    // Calculate distance between player and enemy
                    const dx = Math.abs(player.x - enemy.x);
                    const dy = Math.abs(player.y - enemy.y);
                    
                    // Attack range: within 80 pixels horizontally and 60 pixels vertically
                    // This ensures attacks work when player is behind enemy
                    if (dx <= 80 && dy <= 60) {
                        // Player is attacking and enemy is in range - defeat the enemy
                        enemy.disableBody(true, true);
                        
                        // Update defeated enemies count
                        defeatedEnemies++;
                        
                        // Give score for defeating enemy
                        score += 20;
                        scoreText.setText('Score: ' + score);
                        
                        // Check win condition after defeating enemy
                        this.checkWinCondition();
                    }
                }
            });
        }
    }
    
    // Check if player is in the air (jumping)
    const isJumping = !player.body.touching.down;
    const justLanded = this.wasJumping && !isJumping;
    this.wasJumping = isJumping;
    
    // PRIORITY 1: Handle jump initiation - MUST be checked first
    if (cursors.up.isDown && player.body.touching.down && playerState !== 'attacking') {
        player.setVelocityY(-330);
        player.setTexture('elias_jump');
        player.setScale(player.playerScale);
        this.adjustPlayerBody();
        playerState = 'jumping';
    }
    
    // PRIORITY 2: Maintain jump sprite while in the air - CRITICAL
    // But don't override if attacking
    if (isJumping && playerState === 'jumping' && playerState !== 'attacking') {
        // Force jump sprite to stay while in the air - override any other sprite changes
        player.setTexture('elias_jump');
        player.setScale(player.playerScale);
        this.adjustPlayerBody();
    }
    
    // PRIORITY 3: Handle landing - transition back from jump (unless attacking)
    if (justLanded && playerState === 'jumping') {
        // Player just landed while jumping, determine next state based on movement
        if (player.body.velocity.x === 0) {
            player.setTexture('elias');
            player.setScale(player.playerScale);
            this.adjustPlayerBody();
            playerState = 'idle';
        } else {
            player.setTexture('elias_running');
            player.setScale(player.playerScale);
            this.adjustPlayerBody();
            playerState = 'running';
        }
    }
    
    // PRIORITY 4: Attack action (can be performed while jumping or on ground)
    if (Phaser.Input.Keyboard.JustDown(this.spaceKey) && this.attackTimer === 0 && playerState !== 'attacking') {
        player.setTexture('elias_attack');
        player.setScale(player.playerScale);
        this.adjustPlayerBody();
        playerState = 'attacking';
        this.attackTimer = 60; // Attack animation duration (frames) - doubled from 30
    }
    
    // PRIORITY 5: When attack finishes, return to appropriate state
    if (this.attackTimer === 0 && playerState === 'attacking') {
        // Check if player is still in the air (jumping)
        if (isJumping) {
            // Return to jump sprite while still in the air
            player.setTexture('elias_jump');
            player.setScale(player.playerScale);
            this.adjustPlayerBody();
            playerState = 'jumping';
        } else if (player.body.velocity.x === 0) {
            // On ground and not moving - idle
            player.setTexture('elias');
            player.setScale(player.playerScale);
            this.adjustPlayerBody();
            playerState = 'idle';
        } else {
            // On ground and moving - running
            player.setTexture('elias_running');
            player.setScale(player.playerScale);
            this.adjustPlayerBody();
            playerState = 'running';
        }
    }
    
    // PRIORITY 6: Player movement (only if not jumping or attacking)
    if (playerState !== 'attacking' && playerState !== 'jumping') {
        if (cursors.left.isDown) {
            player.setVelocityX(-160);
            player.setFlipX(true); // Face left
            player.setTexture('elias_running');
            player.setScale(player.playerScale);
            this.adjustPlayerBody();
            playerState = 'running';
        } else if (cursors.right.isDown) {
            player.setVelocityX(160);
            player.setFlipX(false); // Face right
            player.setTexture('elias_running');
            player.setScale(player.playerScale);
            this.adjustPlayerBody();
            playerState = 'running';
        } else {
            player.setVelocityX(0);
            // Only change to idle if not jumping (shouldn't happen due to check above, but safety)
            if (!isJumping) {
                player.setTexture('elias');
                player.setScale(player.playerScale);
                this.adjustPlayerBody();
                playerState = 'idle';
            }
        }
    } else if (playerState === 'jumping') {
        // Allow horizontal movement while jumping, but keep jump sprite
        if (cursors.left.isDown) {
            player.setVelocityX(-160);
            player.setFlipX(true);
        } else if (cursors.right.isDown) {
            player.setVelocityX(160);
            player.setFlipX(false);
        } else {
            player.setVelocityX(0);
        }
    }
    
    // Enemy movement logic
    if (enemies && enemies.children && enemies.children.entries) {
        enemies.children.entries.forEach(enemy => {
            // Enemy Type 1: Skull enemy - random jumps
            if (enemy.texture && enemy.texture.key === 'skull') {
                // Decrease timers
                if (enemy.jumpCooldown > 0) {
                    enemy.jumpCooldown--;
                }
                enemy.jumpTimer--;
                
                // Random jump logic
                if (enemy.jumpCooldown <= 0 && enemy.body.touching.down) {
                    // Random chance to jump (1 in 120 frames chance each frame when on ground)
                    if (Phaser.Math.Between(1, 120) === 1) {
                        enemy.setVelocityY(-280); // Jump up
                        enemy.jumpCooldown = 60; // Cooldown before next jump
                    }
                }
                
                // Random horizontal movement
                if (Phaser.Math.Between(1, 60) === 1) {
                    // Randomly change direction
                    enemy.moveDirection = Phaser.Math.Between(0, 1) ? 1 : -1;
                }
                
                // Move horizontally
                enemy.setVelocityX(enemy.moveDirection * 80);
                
                // Flip sprite based on direction
                if (enemy.moveDirection < 0) {
                    enemy.setFlipX(true);
                } else {
                    enemy.setFlipX(false);
                }
            }
            
            // Enemy Type 2: Creature enemy - moves horizontally on platform 4
            if (enemy.texture && enemy.texture.key === 'creature') {
                // Move horizontally
                enemy.setVelocityX(enemy.moveDirection * enemy.moveSpeed);
                
                // Ensure enemy always stays on platform 4
                if (enemy.hoverPlatform) {
                    const platformCenterX = enemy.hoverPlatform.x;
                    const platformCenterY = enemy.hoverPlatform.y;
                    const platformWidth = enemy.hoverPlatform.width;
                    const platformLeftEdge = platformCenterX - platformWidth / 2;
                    const platformRightEdge = platformCenterX + platformWidth / 2;
                    const platformSurfaceY = platformCenterY - 12; // Platform surface (center - 12px)
                    const enemyHalfWidth = enemy.body.width / 2;
                    const enemyTargetY = platformSurfaceY - (enemy.height * enemy.scaleY * 0.4); // Position on platform surface
                    
                    // Keep enemy on platform 4 surface vertically
                    if (Math.abs(enemy.y - enemyTargetY) > 5) {
                        enemy.y = enemyTargetY;
                        enemy.setVelocityY(0); // Stop vertical movement
                    }
                    
                    // Constrain enemy horizontally to platform 4 bounds
                    if (enemy.x - enemyHalfWidth < platformLeftEdge) {
                        enemy.x = platformLeftEdge + enemyHalfWidth;
                        enemy.moveDirection = 1; // Force movement right
                    } else if (enemy.x + enemyHalfWidth > platformRightEdge) {
                        enemy.x = platformRightEdge - enemyHalfWidth;
                        enemy.moveDirection = -1; // Force movement left
                    }
                    
                    // Reverse direction when reaching platform edges
                    if (enemy.x - enemyHalfWidth <= platformLeftEdge && enemy.moveDirection < 0) {
                        enemy.moveDirection = 1; // Reverse to move right
                    } else if (enemy.x + enemyHalfWidth >= platformRightEdge && enemy.moveDirection > 0) {
                        enemy.moveDirection = -1; // Reverse to move left
                    }
                }
                
                // Flip sprite based on direction
                if (enemy.moveDirection < 0) {
                    enemy.setFlipX(true);
                } else {
                    enemy.setFlipX(false);
                }
            }
            
            // Enemy Type 3: Fire enemy - moves horizontally on platform 1, can move over other platforms
            if (enemy.texture && enemy.texture.key === 'fire') {
                // Move horizontally
                enemy.setVelocityX(enemy.moveDirection * enemy.moveSpeed);
                
                // Reverse direction at canvas edges (world bounds)
                const enemyHalfWidth = enemy.body.width / 2;
                if (enemy.x - enemyHalfWidth <= 0 && enemy.moveDirection < 0) {
                    // Reached left edge of canvas, reverse to move right
                    enemy.moveDirection = 1;
                } else if (enemy.x + enemyHalfWidth >= this.cameras.main.width && enemy.moveDirection > 0) {
                    // Reached right edge of canvas, reverse to move left
                    enemy.moveDirection = -1;
                }
                
                // Try to return to platform 1 if too far away or in air
                // Check if enemy is on ground and far from platform 1 center
                if (enemy.body.touching.down) {
                    const platform1CenterX = this.platform1Ref ? this.platform1Ref.x : 400;
                    const distanceFromPlatform1 = Math.abs(enemy.x - platform1CenterX);
                    
                    // If on a platform far from platform 1, try to move back towards it
                    if (distanceFromPlatform1 > 200 && enemy.y < enemy.platform1Y - 50) {
                        // Enemy is on an elevated platform, move towards platform 1
                        if (enemy.x < platform1CenterX) {
                            enemy.moveDirection = 1; // Move right
                        } else {
                            enemy.moveDirection = -1; // Move left
                        }
                    }
                }
                
                // If enemy is not on ground and falling, try to jump when landing to move towards platform 1
                if (!enemy.body.touching.down && enemy.canJump && enemy.body.velocity.y > 0) {
                    // Will attempt to move towards platform 1 when landing
                    enemy.canJump = false;
                }
                
                // Reset canJump when on ground
                if (enemy.body.touching.down) {
                    enemy.canJump = true;
                }
                
                // Flip sprite based on direction
                if (enemy.moveDirection < 0) {
                    enemy.setFlipX(true);
                } else {
                    enemy.setFlipX(false);
                }
            }
        });
    }
}

