// Wait for DOM to be fully loaded before initializing the game
document.addEventListener('DOMContentLoaded', () => {
    // Initialize game elements
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const scoreElement = document.getElementById('score');
    const highScoreElement = document.getElementById('highScore');
    const levelElement = document.getElementById('level');
    const restartBtn = document.getElementById('restartBtn');

    const gridSize = 20;
    const tileCount = canvas.width / gridSize;

    let snake = [{ x: 10, y: 10 }];
    let food = { x: 15, y: 15 };
    let dx = 1;  // Start moving right
    let dy = 0;
    let score = 0;
    let highScore = localStorage.getItem('snakeHighScore') || 0;
    let level = 1;
    let gameLoop;
    let gameSpeed = 100;
    let particles = [];

    highScoreElement.textContent = highScore;

    // Particle system for effects
    class Particle {
        constructor(x, y, color) {
            this.x = x;
            this.y = y;
            this.color = color;
            this.size = Math.random() * 2 + 1;
            this.speedX = Math.random() * 4 - 2;
            this.speedY = Math.random() * 4 - 2;
            this.life = 0.7;
        }

        update() {
            this.x += this.speedX;
            this.y += this.speedY;
            this.life -= 0.03;
            this.size -= 0.1;
        }

        draw() {
            if (this.life <= 0) return;
            ctx.save();
            ctx.globalAlpha = this.life * 0.3;
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }

    function createParticles(x, y, color, amount) {
        const maxParticles = 20;
        particles = particles.filter(p => p.life > 0);
        
        if (particles.length > maxParticles) {
            particles.length = maxParticles;
        }
        
        const particlesToCreate = Math.min(amount, maxParticles - particles.length);
        for (let i = 0; i < particlesToCreate; i++) {
            particles.push(new Particle(x, y, color));
        }
    }

    function draw() {
        // Reset the canvas context completely
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.globalAlpha = 1.0;  // Explicitly set alpha to 1
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw background
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, '#2c3e50');
        gradient.addColorStop(1, '#34495e');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw grid with fixed opacity
        ctx.globalAlpha = 0.1;  // Set fixed opacity for grid
        ctx.strokeStyle = '#ffffff';
        for (let i = 0; i < tileCount; i++) {
            ctx.beginPath();
            ctx.moveTo(i * gridSize, 0);
            ctx.lineTo(i * gridSize, canvas.height);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, i * gridSize);
            ctx.lineTo(canvas.width, i * gridSize);
            ctx.stroke();
        }
        ctx.globalAlpha = 1.0;  // Reset opacity after grid

        // Draw snake
        snake.forEach((segment, index) => {
            const isHead = index === 0;
            ctx.save();
            ctx.globalAlpha = 1.0;  // Ensure snake is fully opaque
            ctx.shadowBlur = isHead ? 10 : 5;
            ctx.shadowColor = isHead ? '#2ecc71' : '#27ae60';
            ctx.fillStyle = isHead ? '#2ecc71' : '#27ae60';
            
            ctx.fillRect(
                segment.x * gridSize + 1,
                segment.y * gridSize + 1,
                gridSize - 2,
                gridSize - 2
            );
            
            if (isHead) {
                ctx.fillStyle = '#000';
                const eyeSize = 3;
                const eyeOffset = dx !== 0 ? 4 : 0;
                const eyeOffsetY = dy !== 0 ? 4 : 0;
                ctx.beginPath();
                ctx.arc(
                    segment.x * gridSize + gridSize/2 - eyeOffset + eyeSize,
                    segment.y * gridSize + gridSize/2 - eyeOffsetY,
                    eyeSize,
                    0,
                    Math.PI * 2
                );
                ctx.arc(
                    segment.x * gridSize + gridSize/2 + eyeOffset - eyeSize,
                    segment.y * gridSize + gridSize/2 - eyeOffsetY,
                    eyeSize,
                    0,
                    Math.PI * 2
                );
                ctx.fill();
            }
            ctx.restore();
        });

        // Draw food
        ctx.save();
        ctx.globalAlpha = 1.0;  // Ensure food is fully opaque
        const pulseSize = Math.sin(Date.now() * 0.01) * 1;
        ctx.fillStyle = '#e74c3c';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#e74c3c';
        ctx.beginPath();
        ctx.arc(
            food.x * gridSize + gridSize/2,
            food.y * gridSize + gridSize/2,
            (gridSize/2 - 2) + pulseSize,
            0,
            Math.PI * 2
        );
        ctx.fill();
        ctx.restore();

        // Draw particles last
        particles = particles.filter(particle => particle.life > 0);
        particles.forEach(particle => {
            particle.update();
            particle.draw();
        });
    }

    function update() {
        const head = { x: snake[0].x + dx, y: snake[0].y + dy };

        if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount ||
            snake.some(segment => segment.x === head.x && segment.y === head.y)) {
            gameOver();
            return;
        }

        snake.unshift(head);

        if (head.x === food.x && head.y === food.y) {
            score += 10;
            scoreElement.textContent = score;
            
            if (score > highScore) {
                highScore = score;
                highScoreElement.textContent = highScore;
                localStorage.setItem('snakeHighScore', highScore);
            }

            if (score % 50 === 0) {
                level++;
                levelElement.textContent = level;
                gameSpeed = Math.max(50, 100 - (level * 5));
                clearInterval(gameLoop);
                gameLoop = setInterval(() => {
                    update();
                    draw();
                }, gameSpeed);
            }

            createParticles(
                food.x * gridSize + gridSize/2,
                food.y * gridSize + gridSize/2,
                '#e74c3c',
                10
            );

            food = {
                x: Math.floor(Math.random() * tileCount),
                y: Math.floor(Math.random() * tileCount)
            };
        } else {
            snake.pop();
        }
    }

    function gameOver() {
        clearInterval(gameLoop);
        
        createParticles(
            snake[0].x * gridSize + gridSize/2,
            snake[0].y * gridSize + gridSize/2,
            '#e74c3c',
            15
        );

        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#ecf0f1';
        ctx.textAlign = 'center';
        
        ctx.font = 'bold 40px Arial';
        ctx.fillText('Game Over!', canvas.width/2, canvas.height/2 - 40);
        
        ctx.font = '24px Arial';
        ctx.fillText(`Score: ${score}`, canvas.width/2, canvas.height/2 + 10);
        
        if (score === highScore && score > 0) {
            ctx.fillStyle = '#f1c40f';
            ctx.fillText('New High Score!', canvas.width/2, canvas.height/2 + 50);
        }

        restartBtn.style.display = 'block';
        document.addEventListener('keydown', restart);
    }

    function restart(e) {
        if (e.type === 'click' || e.code === 'Space') {
            document.removeEventListener('keydown', restart);
            restartBtn.style.display = 'none';
            startGame();
        }
    }

    function startGame() {
        snake = [{ x: 10, y: 10 }];
        dx = 1;
        dy = 0;
        score = 0;
        level = 1;
        gameSpeed = 100;
        particles = [];
        scoreElement.textContent = score;
        levelElement.textContent = level;
        restartBtn.style.display = 'none';
        
        food = {
            x: Math.floor(Math.random() * tileCount),
            y: Math.floor(Math.random() * tileCount)
        };
        
        if (gameLoop) clearInterval(gameLoop);
        
        gameLoop = setInterval(() => {
            update();
            draw();
        }, gameSpeed);
    }

    startGame();

    document.addEventListener('keydown', (e) => {
        switch(e.key) {
            case 'ArrowUp':
            case 'w':
                if (dy !== 1) { dx = 0; dy = -1; }
                break;
            case 'ArrowDown':
            case 's':
                if (dy !== -1) { dx = 0; dy = 1; }
                break;
            case 'ArrowLeft':
            case 'a':
                if (dx !== 1) { dx = -1; dy = 0; }
                break;
            case 'ArrowRight':
            case 'd':
                if (dx !== -1) { dx = 1; dy = 0; }
                break;
        }
    });

    restartBtn.addEventListener('click', restart);
}); 