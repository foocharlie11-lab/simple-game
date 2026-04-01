const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 1200;
canvas.height = 320;
const worldWidth = 2400;
let cameraX = 0;

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
    y: 260,
    width: 30,
    height: 40,
    velocityY: 0,
    velocityX: 0,
    jumping: false,
    grounded: false,
    speed: 5,
    jumpPower: 14,
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
    constructor(x, y, width, height, color = '#8B7355', dx = 0, minX = null, maxX = null) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
        this.dx = dx;
        this.minX = minX;
        this.maxX = maxX;
    }

    update() {
        if (!this.dx || this.minX === null || this.maxX === null) return;
        this.x += this.dx;
        if (this.x <= this.minX || this.x + this.width >= this.maxX) {
            this.dx *= -1;
            this.x = Math.max(this.minX, Math.min(this.x, this.maxX - this.width));
        }
    }

    draw(offset = 0) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x - offset, this.y, this.width, this.height);
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

    draw(offset = 0) {
        const centerX = this.x - offset + this.width / 2;
        const centerY = this.y + this.height / 2;
        const radius = Math.max(this.width, this.height) / 2;

        ctx.fillStyle = '#e74c3c';
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fill();

        // Draw eyes
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(centerX - 8, centerY - 6, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(centerX + 8, centerY - 6, 3, 0, Math.PI * 2);
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

// Bird class
class Bird {
    constructor(x, y, minX, maxX, speed = 3) {
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 28;
        this.minX = minX;
        this.maxX = maxX;
        this.speed = speed;
        this.direction = Math.random() > 0.5 ? 1 : -1;
        this.wingFlap = 0;
    }

    update() {
        this.x += this.speed * this.direction;
        if (this.x <= this.minX || this.x + this.width >= this.maxX) {
            this.direction *= -1;
        }
        this.wingFlap += 0.2;
    }

    draw(offset = 0) {
        const centerX = this.x - offset + this.width / 2;
        const centerY = this.y + this.height / 2;
        const wingOffset = Math.sin(this.wingFlap) * 8;

        // Body
        ctx.fillStyle = '#2c3e50';
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, this.width / 2, this.height / 2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Left wing
        ctx.fillStyle = '#34495e';
        ctx.beginPath();
        ctx.moveTo(centerX - 10, centerY);
        ctx.quadraticCurveTo(centerX - 40, centerY - 20 - wingOffset, centerX - 10, centerY - 8);
        ctx.lineTo(centerX - 10, centerY + 4);
        ctx.closePath();
        ctx.fill();

        // Right wing
        ctx.beginPath();
        ctx.moveTo(centerX + 10, centerY);
        ctx.quadraticCurveTo(centerX + 40, centerY - 20 + wingOffset, centerX + 10, centerY - 8);
        ctx.lineTo(centerX + 10, centerY + 4);
        ctx.closePath();
        ctx.fill();

        // Wing details
        ctx.strokeStyle = '#22313f';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(centerX - 18, centerY - 4);
        ctx.lineTo(centerX - 28, centerY - 12 - wingOffset / 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(centerX + 18, centerY - 4);
        ctx.lineTo(centerX + 28, centerY - 12 + wingOffset / 2);
        ctx.stroke();

        // Eye
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(centerX + 10, centerY - 6, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(centerX + 11, centerY - 6, 2, 0, Math.PI * 2);
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

// Waterfall class
class Waterfall {
    constructor(x, y, width, height, offFrames = 120, onFrames = 70) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.offFrames = offFrames;
        this.onFrames = onFrames;
        this.timer = 0;
        this.active = true;
    }

    update() {
        this.timer += 1;
        if (this.active && this.timer >= this.onFrames) {
            this.active = false;
            this.timer = 0;
        } else if (!this.active && this.timer >= this.offFrames) {
            this.active = true;
            this.timer = 0;
        }
    }

    draw(offset = 0) {
        const x = this.x - offset;
        if (this.active) {
            ctx.fillStyle = 'rgba(52, 152, 219, 0.55)';
            ctx.fillRect(x, this.y, this.width, this.height);

            ctx.fillStyle = 'rgba(236, 240, 241, 0.45)';
            for (let i = 0; i < 6; i++) {
                ctx.fillRect(x + 6 + i * 6, this.y + (i % 2) * 14, 6, this.height - (i % 2) * 24);
            }

            ctx.strokeStyle = 'rgba(41, 128, 185, 0.8)';
            ctx.lineWidth = 2;
            ctx.strokeRect(x, this.y, this.width, this.height);
        } else {
            ctx.fillStyle = 'rgba(100, 150, 180, 0.3)';
            ctx.fillRect(x, this.y, this.width, 8);
            ctx.fillStyle = '#2980b9';
            ctx.fillRect(x, this.y + 8, this.width, 4);
        }
    }

    collidesWith(obj) {
        if (!this.active) return false;
        return (
            obj.x < this.x + this.width &&
            obj.x + obj.width > this.x &&
            obj.y + obj.height > this.y &&
            obj.y < this.y + this.height
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

    draw(offset = 0) {
        ctx.save();
        ctx.translate(this.x + this.width / 2 - offset, this.y + this.height / 2);
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

// Spike class
class Spike {
    constructor(x, y, width = 20, height = 20) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }

    draw(offset = 0) {
        // Draw spike as a triangle
        ctx.fillStyle = '#c0392b';
        ctx.beginPath();
        ctx.moveTo(this.x + this.width / 2 - offset, this.y);
        ctx.lineTo(this.x + this.width - offset, this.y + this.height);
        ctx.lineTo(this.x - offset, this.y + this.height);
        ctx.closePath();
        ctx.fill();

        // Add outline
        ctx.strokeStyle = '#a93226';
        ctx.lineWidth = 2;
        ctx.stroke();
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

    draw(offset = 0) {
        const alpha = Math.sin(this.glow) * 0.3 + 0.7;
        ctx.fillStyle = `rgba(46, 204, 113, ${alpha})`;
        ctx.fillRect(this.x - offset, this.y, this.width, this.height);
        ctx.strokeStyle = '#2ecc71';
        ctx.lineWidth = 3;
        ctx.strokeRect(this.x - offset, this.y, this.width, this.height);
        
        // Draw flag on top
        ctx.fillStyle = '#f39c12';
        ctx.beginPath();
        ctx.moveTo(this.x + this.width / 2 - offset, this.y);
        ctx.lineTo(this.x + this.width / 2 + 20 - offset, this.y + 10);
        ctx.lineTo(this.x + this.width / 2 - offset, this.y + 20);
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

function drawBackground() {
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#1c92d2');
    gradient.addColorStop(1, '#f2fcfe');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Simple parallax clouds
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    const cloudOffset = (cameraX * 0.22) % (canvas.width * 2);
    for (let i = 0; i < 6; i++) {
        const x = (i * 380 - cloudOffset + canvas.width * 2) % (canvas.width * 2) - 200;
        ctx.beginPath();
        ctx.ellipse(x, 70, 72, 24, 0, 0, Math.PI * 2);
        ctx.ellipse(x + 64, 72, 58, 20, 0, 0, Math.PI * 2);
        ctx.ellipse(x + 118, 68, 78, 26, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    // Ground shadow
    ctx.fillStyle = 'rgba(0,0,0,0.08)';
    ctx.fillRect(0, canvas.height - 50, canvas.width, 8);
}

// Level configurations
const levels = [
    {
        platforms: [
            new Platform(0, 300, worldWidth, 50, '#8B7355'),
            new Platform(180, 240, 180, 20),
            new Platform(520, 190, 170, 20),
            new Platform(880, 240, 160, 20),
            new Platform(1180, 160, 170, 20),
            new Platform(1520, 200, 170, 20),
            new Platform(1880, 140, 140, 20, '#8B7355', 1.8, 1800, 2100),
        ],
        enemies: [
            new Enemy(240, 270, 30, 30, 180, 360),
            new Enemy(560, 220, 30, 30, 520, 690),
            new Enemy(920, 280, 30, 30, 880, 1040),
        ],
        coins: [
            new Coin(220, 260),
            new Coin(540, 210),
            new Coin(940, 270),
            new Coin(1210, 190),
            new Coin(1550, 230),
            new Coin(1900, 170),
        ],
        spikes: [
            new Spike(420, 340, 20, 20),
            new Spike(760, 340, 20, 20),
            new Spike(1340, 340, 20, 20),
            new Spike(1700, 340, 20, 20),
        ],
        waterfalls: [
            new Waterfall(520, 0, 40, 220, 130, 70),
        ],
        birds: [
            new Bird(320, 70, 260, 420, 2.2),
            new Bird(1020, 90, 960, 1120, 2.5),
            new Bird(1580, 80, 1500, 1660, 2.8),
        ],
        goal: new Goal(2160, 240)
    },
    {
        platforms: [
            new Platform(0, 300, worldWidth, 50, '#8B7355'),
            new Platform(140, 230, 140, 20),
            new Platform(420, 170, 140, 20),
            new Platform(760, 220, 140, 20),
            new Platform(1100, 130, 140, 20, '#8B7355', 2, 1080, 1220),
            new Platform(1470, 170, 160, 20),
            new Platform(1820, 120, 160, 20),
            new Platform(2080, 75, 120, 20),
        ],
        enemies: [
            new Enemy(180, 290, 30, 30, 140, 260),
            new Enemy(460, 230, 30, 30, 420, 560),
            new Enemy(820, 290, 30, 30, 760, 900),
            new Enemy(1540, 230, 30, 30, 1470, 1630),
        ],
        coins: [
            new Coin(180, 300),
            new Coin(440, 240),
            new Coin(780, 290),
            new Coin(1130, 190),
            new Coin(1520, 230),
            new Coin(1850, 170),
            new Coin(2100, 135),
        ],
        spikes: [
            new Spike(620, 340, 20, 20),
            new Spike(960, 340, 20, 20),
            new Spike(1710, 340, 20, 20),
        ],
        waterfalls: [
            new Waterfall(1100, 0, 40, 150, 140, 80),
        ],
        birds: [
            new Bird(520, 90, 480, 640, 2.3),
            new Bird(860, 70, 820, 940, 2.7),
            new Bird(1580, 100, 1540, 1620, 2.5),
        ],
        goal: new Goal(2200, 185)
    },
    {
        platforms: [
            new Platform(0, 300, worldWidth, 50, '#8B7355'),
            new Platform(100, 230, 120, 20),
            new Platform(340, 180, 120, 20),
            new Platform(620, 220, 120, 20),
            new Platform(930, 160, 140, 20),
            new Platform(1240, 110, 140, 20, '#8B7355', 1.6, 1220, 1360),
            new Platform(1590, 150, 160, 20),
            new Platform(1900, 100, 160, 20),
            new Platform(2140, 50, 120, 20),
        ],
        enemies: [
            new Enemy(220, 300, 30, 30, 200, 320),
            new Enemy(360, 260, 30, 30, 340, 460),
            new Enemy(650, 310, 30, 30, 620, 740),
            new Enemy(980, 240, 30, 30, 930, 1080),
            new Enemy(1610, 230, 30, 30, 1590, 1750),
        ],
        coins: [
            new Coin(100, 310),
            new Coin(360, 260),
            new Coin(640, 300),
            new Coin(950, 230),
            new Coin(1260, 180),
            new Coin(1600, 220),
            new Coin(1930, 170),
            new Coin(2160, 130),
        ],
        spikes: [
            new Spike(470, 340, 20, 20),
            new Spike(820, 340, 20, 20),
            new Spike(1480, 340, 20, 20),
            new Spike(1810, 340, 20, 20),
        ],
        waterfalls: [
            new Waterfall(1240, 0, 40, 120, 130, 70),
        ],
        birds: [
            new Bird(240, 80, 200, 320, 3),
            new Bird(680, 95, 640, 760, 2.4),
            new Bird(1260, 75, 1220, 1300, 2.6),
        ],
        goal: new Goal(2230, 140),
        spawnX: 20,
        spawnY: 260
    }
];

let platforms = [];
let enemies = [];
let coins = [];
let spikes = [];
let birds = [];
let waterfalls = [];
let goal = null;

function loadLevel(levelNum) {
    const levelIndex = Math.min(levelNum - 1, levels.length - 1);
    const levelData = levels[levelIndex];
    
    platforms = levelData.platforms;
    enemies = levelData.enemies;
    coins = levelData.coins.map(c => new Coin(c.x, c.y));
    spikes = levelData.spikes;
    birds = levelData.birds || [];
    waterfalls = levelData.waterfalls || [];
    goal = new Goal(levelData.goal.x, levelData.goal.y);
    
    player.x = levelData.spawnX ?? 50;
    player.y = levelData.spawnY ?? 260;
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

    // Boundary collision in the full level world
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > worldWidth) player.x = worldWidth - player.width;

    // Bottom death
    if (player.y > canvas.height) {
        gameState = GAME_STATE.GAME_OVER;
    }

    // Camera follows the player horizontally
    cameraX = Math.min(Math.max(player.x - canvas.width / 3, 0), worldWidth - canvas.width);

    // Enemy collision
    for (let enemy of enemies) {
        if (enemy.collidesWith(player)) {
            gameState = GAME_STATE.GAME_OVER;
        }
    }

    // Bird collision
    for (let bird of birds) {
        if (bird.collidesWith(player)) {
            gameState = GAME_STATE.GAME_OVER;
        }
    }

    // Waterfall collision
    for (let waterfall of waterfalls) {
        if (waterfall.collidesWith(player)) {
            gameState = GAME_STATE.GAME_OVER;
        }
    }

    // Spike collision
    for (let spike of spikes) {
        if (spike.collidesWith(player)) {
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
    const offset = cameraX;
    const centerX = player.x - offset + player.width / 2;
    const centerY = player.y + player.height / 2;
    const radius = Math.max(player.width, player.height) / 2;

    ctx.fillStyle = '#3498db';
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();

    // Draw eyes
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(centerX - 7, centerY - 4, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(centerX + 7, centerY - 4, 5, 0, Math.PI * 2);
    ctx.fill();

    // Draw pupils
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(centerX - 7, centerY - 4, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(centerX + 7, centerY - 4, 2, 0, Math.PI * 2);
    ctx.fill();
}

// Main game loop
function gameLoop() {
    // Draw background and then the game world
    drawBackground();

    if (gameState === GAME_STATE.PLAYING) {
        updatePlayer();
        
        // Update entities
        platforms.forEach(p => p.update());
        enemies.forEach(e => e.update());
        birds.forEach(b => b.update());
        waterfalls.forEach(w => w.update());
        coins.forEach(c => c.update());
        goal.update();

        // Draw entities
        platforms.forEach(p => p.draw(cameraX));
        waterfalls.forEach(w => w.draw(cameraX));
        spikes.forEach(s => s.draw(cameraX));
        enemies.forEach(e => e.draw(cameraX));
        birds.forEach(b => b.draw(cameraX));
        coins.filter(c => !c.collected).forEach(c => c.draw(cameraX));
        goal.draw(cameraX);
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
