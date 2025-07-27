const canvas = document.getElementById('ambient-canvas');
const ctx = canvas.getContext('2d');

let width, height;
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

function resizeCanvas() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
}

// Mouse tracking
let mouse = { x: -1000, y: -1000 };
document.addEventListener('mousemove', e => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
});
document.addEventListener('mouseleave', () => {
    mouse.x = -1000;
    mouse.y = -1000;
});

// State logic
let currentState = 'rain';
const stateColors = {
    rain: '#00BFFF',         // Deep sky blue
    forest: '#5cb85c',       // Forest green
    winter: '#b0e0e6'        // Powder blue
};

function setTheme(state) {
    const color = stateColors[state] || '#00BFFF';
    document.documentElement.style.setProperty('--hover-color', color);
}

document.querySelectorAll('.state-buttons button').forEach(btn => {
    btn.addEventListener('click', () => {
        currentState = btn.dataset.state;
        raindrops = [];
        leaves = [];
        snowflakes = [];
        splashParticles = [];
        setTheme(currentState);
    });
});

/// ------------ RAIN STATE ------------
let raindrops = [];
let splashParticles = [];
class Raindrop {
    constructor() {
        this.reset();
    }
    reset() {
        this.x = Math.random() * width;
        this.y = -10 - Math.random() * height;
        this.length = 10 + Math.random() * 10;
        this.speed = 4 + Math.random() * 4;
        this.splash = false;
    }
    update() {
        this.y += this.speed;
        if (!this.splash && distance(this.x, this.y, mouse.x, mouse.y) < 30) {
            this.splash = true;
            for (let i = 0; i < 6; i++) splashParticles.push(new Splash(this.x, this.y));
        } else if (this.y > height - 5 && !this.splash) {
            this.splash = true;
            for (let i = 0; i < 5; i++) splashParticles.push(new Splash(this.x, height - 2));
        }
        if (this.splash) this.reset();
    }
    draw() {
        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x, this.y + this.length);
        ctx.stroke();
    }
}
class Splash {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 2;
        this.vy = -Math.random() * 2;
        this.alpha = 1;
    }
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.1;
        this.alpha -= 0.05;
    }
    draw() {
        if (this.alpha <= 0) return;
        ctx.fillStyle = `rgba(255,255,255,${this.alpha * 0.3})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 1.5, 0, Math.PI * 2);
        ctx.fill();
    }
}

/// ------------ FOREST STATE ------------
let leaves = [];
class Leaf {
    constructor() {
        this.reset();
    }
    reset() {
        this.x = Math.random() * width;
        this.y = -10 - Math.random() * height;
        this.size = 8 + Math.random() * 6;
        this.speed = 1 + Math.random() * 1.5;
        this.angle = Math.random() * Math.PI * 2;
        this.vx = 0;
        this.vy = this.speed;
    }
    update() {
        this.angle += 0.01;
        this.x += Math.sin(this.angle) * 0.5 + this.vx;
        this.y += this.vy;

        // When cursor is near, shove the leaf away
        const dx = this.x - mouse.x;
        const dy = this.y - mouse.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < 60) {
            this.vx = (dx / d) * 5;
            this.vy = (dy / d) * 5;
        } else {
            this.vx *= 0.9;
            this.vy = this.speed; // reset fall speed
        }

        if (this.y > height + 10 || this.x < -50 || this.x > width + 50) this.reset();
    }
    draw() {
        ctx.fillStyle = '#7BB661';
        ctx.beginPath();
        ctx.ellipse(this.x, this.y, this.size, this.size / 2, this.angle, 0, Math.PI * 2);
        ctx.fill();
    }
}

/// ------------ WINTER STATE ------------
let snowflakes = [];
class Snowflake {
    constructor() {
        this.reset();
        this.frozen = false;
        this.freezeTime = 0;
    }
    reset() {
        this.x = Math.random() * width;
        this.y = -10 - Math.random() * height;
        this.radius = 2 + Math.random() * 2;
        this.speed = 0.5 + Math.random();
        this.frozen = false;
        this.freezeTime = 0;
    }
    update() {
        if (!this.frozen && distance(this.x, this.y, mouse.x, mouse.y) < 25) {
            this.frozen = true;
            this.freezeTime = Date.now();
        }

        if (this.frozen) {
            // Unfreeze after 3 seconds
            if (Date.now() - this.freezeTime > 3000) {
                this.frozen = false;
            }
        } else {
            this.y += this.speed;

            // Check for collisions with other frozen flakes
            for (let other of snowflakes) {
                if (other === this || !other.frozen) continue;
                let dx = this.x - other.x;
                let dy = this.y - other.y;
                let dist = Math.hypot(dx, dy);
                if (dist < this.radius + other.radius) {
                    this.x += dx * 0.1;
                    this.y -= dy * 0.1;
                }
            }
        }

        if (this.y > height + 10) this.reset();
    }
    draw() {
        ctx.fillStyle = this.frozen ? 'rgba(200,220,255,0.9)' : 'rgba(255,255,255,0.8)';
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(Math.PI / 4);
        ctx.beginPath();
        ctx.moveTo(0, -this.radius);
        for (let i = 0; i < 8; i++) {
            ctx.rotate(Math.PI / 4);
            ctx.lineTo(0, -this.radius);
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }
}

/// ------------ ANIMATION LOOP ------------
function animate() {
    // Background per state
    if (currentState === 'rain') {
        ctx.fillStyle = '#0e0f12'; // Deep gray-blue
    } else if (currentState === 'forest') {
        ctx.fillStyle = '#1b2f1f'; // Earthy green
    } else if (currentState === 'winter') {
        ctx.fillStyle = '#182430'; // Cool blue-gray
    }
    ctx.fillRect(0, 0, width, height);

    if (currentState === 'rain') {
        if (raindrops.length < 150) raindrops.push(new Raindrop());
        raindrops.forEach(d => (d.update(), d.draw()));
        splashParticles.forEach((s, i) => {
            s.update();
            s.draw();
            if (s.alpha <= 0) splashParticles.splice(i, 1);
        });
    }

    else if (currentState === 'forest') {
        if (leaves.length < 70) leaves.push(new Leaf());
        leaves.forEach(l => (l.update(), l.draw()));
    }

    else if (currentState === 'winter') {
        if (snowflakes.length < 100) snowflakes.push(new Snowflake());
        snowflakes.forEach(s => (s.update(), s.draw()));
    }

    requestAnimationFrame(animate);
}
animate();

function distance(x1, y1, x2, y2) {
    return Math.hypot(x2 - x1, y2 - y1);
}
