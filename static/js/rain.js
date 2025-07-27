const canvas = document.getElementById('rain-canvas');
const ctx = canvas.getContext('2d');

let width, height;
const raindrops = [];
const splashParticles = [];
const maxDrops = 150;
let dropSpawnTimer = 0;

function resizeCanvas() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Splash particle class
class SplashParticle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 2; // horizontal spread
        this.vy = -Math.random() * 2;        // slight upward motion
        this.alpha = 1;
        this.size = 1 + Math.random();
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.1;              // gravity
        this.alpha -= 0.05;         // fade out
    }

    draw(ctx) {
        if (this.alpha <= 0) return;
        ctx.fillStyle = `rgba(255, 255, 255, ${this.alpha * 0.3})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, 2 * Math.PI);
        ctx.fill();
    }

    isDead() {
        return this.alpha <= 0;
    }
}

// Raindrop class
class Raindrop {
    constructor() {
        this.reset();
    }

    reset() {
        this.x = Math.random() * width;
        this.y = -10 - Math.random() * height; // spawn above view
        this.length = 10 + Math.random() * 10;
        this.speed = 4 + Math.random() * 4;
        this.splash = false;
        this.splashFrame = 0;
    }

    update() {
        if (!this.splash) {
            this.y += this.speed;
            if (this.y > height - 5) {
                this.splash = true;

                // Create splash particles
                for (let i = 0; i < 5; i++) {
                    splashParticles.push(new SplashParticle(this.x, height - 2));
                }
            }
        } else {
            this.splashFrame++;
            if (this.splashFrame > 5) {
                this.reset();
                this.splash = false;
                this.splashFrame = 0;
            }
        }
    }

    draw(ctx) {
        if (!this.splash) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(this.x, this.y + this.length);
            ctx.stroke();
        }
    }
}

// Animation loop
function animate() {
    ctx.clearRect(0, 0, width, height);

    // Gradual drop spawn
    if (raindrops.length < maxDrops) {
        dropSpawnTimer++;
        if (dropSpawnTimer > 2) {
            raindrops.push(new Raindrop());
            dropSpawnTimer = 0;
        }
    }

    // Update + draw raindrops
    raindrops.forEach(drop => {
        drop.update();
        drop.draw(ctx);
    });

    // Update + draw splash particles
    for (let i = splashParticles.length - 1; i >= 0; i--) {
        splashParticles[i].update();
        splashParticles[i].draw(ctx);
        if (splashParticles[i].isDead()) {
            splashParticles.splice(i, 1);
        }
    }

    requestAnimationFrame(animate);
}

animate();
