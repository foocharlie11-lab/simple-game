const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 1000;
canvas.height = 600;

let currentLevel = 1;
let score = 0;

// Game states
const GAME_STATE = {
    PLAYING: 'playing',
    GAME_OVER: 'gameOver',
    WIN: 'win'
};

let gameState = GAME_STATE.PLAYING;

// Player object
const player = {
    x: 50,
    y: 400,
    width: 30,
    height: 40,
    velocityY: 0,
    velocityX: 0,
    jumping: false,
    grounded: false,
    speed: 5,
    jumpPower: 15,
    maxSpeedX: 8
};

// Keyboard input
const keys = {};
window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
});
window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// Platform class
class Platform {
    constructor(x, y, width, height, color = '#8B7355') {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }

    isTouching(obj) {
        return (
            obj.x + obj.width > this.x &&
            obj.x < this.x + this.width &&
            obj.y + obj.height >= this.y &&
            obj.y + obj.height <= this.y + this.height &&
            obj.velocityY >= 0
        );
    }
}

// Enemy class
class Enemy {
    constructor(x, y, width, height, minX, maxX) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.minX = minX;
        this.maxX = maxX;
        this.speed = 2.5;
        this.direction = 1;
    }

    update() {
        this.x += this.speed * this.direction;
        if (this.x <= this.minX || this.x + this.width >= this.maxX) {
            this.direction *= -1;
        }
    }

    draw() {
        ctx.fillStyle = '#e74c3c';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        // Draw eyes
        ctx.fillStyle = '#000';
        ctx.arc(this.x + 8, this.y + 8, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(this.x + this.width - 8, this.y + 8, 3, 0, Math.PI * 2);
        ctx.fill();
    }

    collidesWith(obj) {
        return (
            obj.x < this.x + this.width &&
            obj.x + obj.width > this.x &&
            obj.y < this.y + this.height &&
            obj.y + obj.height > this.y
        );
    }
}

// Coin class
class Coin {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 15;
        this.height = 15;
        this.collected = false;
        this.rotation = 0;
    }

    update() {
        this.rotation += 0.1;
    }

    draw() {
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.rotate(this.rotation);
        ctx.fillStyle = '#f1c40f';
        ctx.beginPath();
        ctx.arc(0, 0, this.width / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#f39c12';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
    }

    collidesWith(obj) {
        return (
            obj.x < this.x + this.width &&
            obj.x + obj.width > this.x &&
            obj.y < this.y + this.height &&
            obj.y + obj.height > this.y
        );
    }
}

// Goal class
class Goal {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 60;
        this.glow = 0;
    }

    update() {
        this.glow += 0.05;
    }

    draw() {
        const alpha = Math.sin(this.glow) * 0.3 + 0.7;
        ctx.fillStyle = `rgba(46, 204, 113, ${alpha})`;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.strokeStyle = '#2ecc71';
        ctx.lineWidth = 3;
        ctx.strokeRect(this.x, this.y, this.width, this.height);
        
        // Draw flag on top
        ctx.fillStyle = '#f39c12';
        ctx.beginPath();
        ctx.moveTo(this.x + this.width / 2, this.y);
        ctx.lineTo(this.x + this.width / 2 + 20, this.y + 10);
        ctx.lineTo(this.x + this.width / 2, this.y + 20);
        ctx.closePath();
        ctx.fill();
    }

    collidesWith(obj) {
        return (
            obj.x < this.x + this.width &&
            obj.x + obj.width > this.x &&
            obj.y < this.y + this.height &&
            obj.y + obj.height > this.y
        );
    }
}

// Level configurations
const levels = [
    {
        platforms: [
            new Platform(0, 550, 1000, 50, '#8B7355'),
            new Platform(200, 450, 150, 20),
            new Platform(450, 380, 150, 20),
            new Platform(700, 450, 150, 20),
            new Platform(300, 280, 150, 20),
            new Platform(600, 250, 150, 20),
        ],
        enemies: [
            new Enemy(250, 410, 30, 30, 200, 400),
            new Enemy(500, 340, 30, 30, 450, 600),
        ],
        coins: [
            new Coin(230, 420),
            new Coin(500, 350),
            new Coin(750, 420),
            new Coin(330, 250),
            new Coin(650, 220),
        ],
        goal: new Goal(900, 450)
    },
    {
        platforms: [
            new Platform(0, 550, 1000, 50, '#8B7355'),
            new Platform(100, 480, 120, 20),
            new Platform(300, 420, 120, 20),
            new Platform(120, 340, 120, 20),
            new Platform(400, 340, 120, 20),
            new Platform(650, 380, 120, 20),
            new Platform(500, 260, 120, 20),
            new Platform(750, 250, 120, 20),
        ],
        enemies: [
            new Enemy(100, 440, 30, 30, 100, 220),
            new Enemy(350, 380, 30, 30, 300, 520),
            new Enemy(600, 340, 30, 30, 500, 770),
        ],
        coins: [
            new Coin(140, 450),
            new Coin(340, 390),
            new Coin(160, 310),
            new Coin(450, 310),
            new Coin(690, 350),
            new Coin(550, 230),
            new Coin(800, 220),
        ],
        goal: new Goal(900, 450)
    },
    {
        platforms: [
            new Platform(0, 550, 1000, 50, '#8B7355'),
            new Platform(50, 480, 100, 20),
            new Platform(180, 420, 100, 20),
            new Platform(80, 340, 100, 20),
            new Platform(280, 340, 100, 20),
            new Platform(450, 400, 100, 20),
            new Platform(350, 280, 100, 20),
            new Platform(650, 360, 100, 20),
            new Platform(550, 220, 100, 20),
            new Platform(800, 300, 100, 20),
        ],
        enemies: [
            new Enemy(50, 440, 30, 30, 50, 150),
            new Enemy(200, 380, 30, 30, 180, 280),
            new Enemy(300, 300, 30, 30, 80, 380),
            new Enemy(500, 360, 30, 30, 450, 550),
        ],
        coins: [
            new Coin(80, 450),
            new Coin(220, 390),
            new Coin(120, 310),
            new Coin(320, 310),
            new Coin(480, 370),
            new Coin(400, 250),
            new Coin(690, 330),
            new Coin(600, 190),
            new Coin(830, 270),
        ],
        goal: new Goal(900, 480)
    }
];

let platforms = [];
let enemies = [];
let coins = [];
let goal = null;

function loadLevel(levelNum) {
    const levelIndex = Math.min(levelNum - 1, levels.length - 1);
    const levelData = levels[levelIndex];
    
    platforms = levelData.platforms;
    enemies = levelData.enemies;
    coins = levelData.coins.map(c => new Coin(c.x, c.y));
    goal = new Goal(levelData.goal.x, levelData.goal.y);
    
    player.x = 50;
    player.y = 400;
    player.velocityY = 0;
    player.velocityX = 0;
    player.grounded = false;
}

// Update player
function updatePlayer() {
    // Horizontal movement
    if (keys['ArrowLeft']) {
        player.velocityX = -player.maxSpeedX;
    } else if (keys['ArrowRight']) {
        player.velocityX = player.maxSpeedX;
    } else {
        player.velocityX *= 0.85;
    }

    player.x += player.velocityX;

    // Jumping
    if ((keys[' '] || keys['ArrowUp']) && player.grounded) {
        player.velocityY = -player.jumpPower;
        player.jumping = true;
        player.grounded = false;
    }

    // Gravity
    player.velocityY += 0.6;
    player.y += player.velocityY;

    // Ground collision
    player.grounded = false;
    for (let platform of platforms) {
        if (platform.isTouching(player)) {
            player.grounded = true;
            player.velocityY = 0;
            player.y = platform.y - player.height;
            break;
        }
    }

    // Boundary collision
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;

    // Bottom death
    if (player.y > canvas.height) {
        gameState = GAME_STATE.GAME_OVER;
    }

    // Enemy collision
    for (let enemy of enemies) {
        if (enemy.collidesWith(player)) {
            gameState = GAME_STATE.GAME_OVER;
        }
    }

    // Coin collection
    for (let coin of coins) {
        if (!coin.collected && coin.collidesWith(player)) {
            coin.collected = true;
            score += 10;
            document.getElementById('score').textContent = score;
        }
    }

    // Goal reached
    if (goal.collidesWith(player)) {
        gameState = GAME_STATE.WIN;
        document.getElementById('levelScore').textContent = score;
    }
}

// Draw player
function drawPlayer() {
    ctx.fillStyle = '#3498db';
    ctx.fillRect(player.x, player.y, player.width, player.height);
    
    // Draw eyes
    ctx.fillStyle = '#fff';
    ctx.fillRect(player.x + 5, player.y + 10, 8, 8);
    ctx.fillRect(player.x + 17, player.y + 10, 8, 8);
    
    // Draw pupils
    ctx.fillStyle = '#000';
    ctx.fillRect(player.x + 7, player.y + 12, 4, 4);
    ctx.fillRect(player.x + 19, player.y + 12, 4, 4);
}

// Main game loop
function gameLoop() {
    // Clear canvas
    ctx.fillStyle = 'rgba(135, 206, 235, 0.3)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (gameState === GAME_STATE.PLAYING) {
        updatePlayer();
        
        // Update entities
        enemies.forEach(e => e.update());
        coins.forEach(c => c.update());
        goal.update();

        // Draw entities
        platforms.forEach(p => p.draw());
        enemies.forEach(e => e.draw());
        coins.filter(c => !c.collected).forEach(c => c.draw());
        goal.draw();
        drawPlayer();
    } else if (gameState === GAME_STATE.GAME_OVER) {
        document.getElementById('gameOver').classList.add('show');
        document.getElementById('finalScore').textContent = score;
    } else if (gameState === GAME_STATE.WIN) {
        document.getElementById('winScreen').classList.add('show');
    }

    requestAnimationFrame(gameLoop);
}

function nextLevel() {
    currentLevel++;
    score += 50; // Bonus for completing level
    document.getElementById('level').textContent = currentLevel;
    document.getElementById('score').textContent = score;
    document.getElementById('winScreen').classList.remove('show');
    loadLevel(currentLevel);
    gameState = GAME_STATE.PLAYING;
}

// Start game
loadLevel(1);
gameLoop();
