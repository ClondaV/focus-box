document.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById('ambient-canvas');
    const ctx = canvas.getContext('2d');

    let width, height;
    function resizeCanvas() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

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

    document.addEventListener('click', e => {
        if (currentState === 'fire') {
            for (let i = 0; i < 5; i++) {
                fireParticles.push(new FireParticle(mouse.x, mouse.y, true));
            }
        }
    });

    // Theme colors
    const stateColors = {
        rain: '#171717d0',
        forest: '#5cb85c',
        winter: '#005b96',
        fire: '#ff4500'
    };

    function setTheme(state) {
        // Set --hover-color for hover effects
        const color = stateColors[state] || '#000000';
        document.documentElement.style.setProperty('--hover-color', color);

        // Set --authbox-bg-color to match canvas backdrop style per state:
        const boxColors = {
        rain:   'rgba(30, 30, 30, 0.88)',      // soft dark gray
        forest: 'rgba(35, 55, 35, 0.90)',      // muted forest green
        winter: 'rgba(40, 60, 80, 0.90)',      // frosty bluish tone
        fire:   'rgba(60, 25, 10, 0.92)'       // warm ember tone
        };

        const boxColor = boxColors[state] || 'rgba(20,20,20,0.95)';
        document.documentElement.style.setProperty('--authbox-bg-color', boxColor);
    }

    // State toggle logic
    const toggleButton = document.querySelector('.state-toggle-button');
    const iconSpan = toggleButton?.querySelector('.icon');

    const states = [
        { name: 'rain', icon: '🌧️' },
        { name: 'forest', icon: '🌲' },
        { name: 'winter', icon: '❄️' },
        { name: 'fire', icon: '🔥' },
    ];

    let savedState = localStorage.getItem('quietuneState');
    let currentIndex = savedState
        ? states.findIndex(s => s.name === savedState)
        : 0;
    let currentState = states[currentIndex].name;

    setTheme(currentState);
    if (iconSpan) iconSpan.textContent = states[currentIndex].icon;

    toggleButton?.addEventListener('click', () => {
        currentIndex = (currentIndex + 1) % states.length;
        currentState = states[currentIndex].name;
        localStorage.setItem('quietuneState', currentState);

        raindrops = [];
        leaves = [];
        snowflakes = [];
        splashParticles = [];
        fireParticles = [];
        ambientFireParticles = [];

        setTheme(currentState);
        if (iconSpan) {
            iconSpan.textContent = states[currentIndex].icon;
            iconSpan.classList.remove('pop');
            void iconSpan.offsetWidth;
            iconSpan.classList.add('pop');
        }
    });

    // Utility
    function distance(x1, y1, x2, y2) {
        return Math.hypot(x2 - x1, y2 - y1);
    }

    /// --- PARTICLE ARRAYS ---
    let raindrops = [];
    let splashParticles = [];
    let leaves = [];
    let snowflakes = [];
    let fireParticles = [];
    let ambientFireParticles = [];

    // --- CLASSES ---
    class Raindrop {
        constructor() { this.reset(); }
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
            ctx.strokeStyle = 'rgba(255,255,255,0.5)';
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

    class Leaf {
        constructor() { this.reset(); }
        reset() {
            this.x = Math.random() * width;
            this.y = -10 - Math.random() * height;
            this.size = 8 + Math.random() * 6;
            this.speed = 2 + Math.random() * 1.5;
            this.angle = Math.random() * Math.PI * 2;
            this.vx = 0;
            this.vy = this.speed;
            this.repelCooldown = 0;
        }
        update() {
            this.angle += 0.01;
            this.x += Math.sin(this.angle) * 0.5 + this.vx;
            this.y += this.vy;

            const dx = this.x - mouse.x;
            const dy = this.y - mouse.y;
            const d = Math.sqrt(dx * dx + dy * dy);

            if (d < 40 && this.repelCooldown <= 0) {
                this.vx = (dx / d) * 6;
                this.vy = (dy / d) * 6;
                this.repelCooldown = 10;
            }

            if (this.repelCooldown > 0) this.repelCooldown--;

            this.vx *= 0.9;
            this.vy = Math.max(this.speed, this.vy * 0.95);

            if (this.y > height + 10 || this.x < -50 || this.x > width + 50) this.reset();
        }
        draw() {
            ctx.fillStyle = '#7BB661';
            ctx.beginPath();
            ctx.ellipse(this.x, this.y, this.size, this.size / 2, this.angle, 0, Math.PI * 2);
            ctx.fill();
        }
    }

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
            if (this.frozen && Date.now() - this.freezeTime > 3000) {
                this.frozen = false;
            }
            if (!this.frozen) {
                this.y += this.speed;
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

    class FireParticle {
        constructor(x, y, isBurst = false) {
            this.x = x;
            this.y = y;
            this.radius = 1 + Math.random() * 2;
            this.alpha = 1;
            this.vx = (Math.random() - 0.5) * (isBurst ? 6 : 2);
            this.vy = (isBurst ? -1 : -0.5) * (2 + Math.random() * 2);
        }
        update() {
            this.x += this.vx + Math.sin(Date.now() * 0.005 + this.y * 0.01) * 0.1;
            this.y += this.vy;
            this.alpha -= 0.001;
        }
        draw() {
            if (this.alpha <= 0) return;
            ctx.beginPath();
            const hue = 20 + Math.random() * 30;
            ctx.fillStyle = `hsla(${hue}, 100%, 60%, ${this.alpha})`;
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    class AmbientFireParticle {
        constructor() { this.reset(); }
        reset() {
            this.x = Math.random() * width;
            this.y = height + Math.random() * 50;
            this.radius = Math.random() * 1.5 + 0.5;
            this.alpha = Math.random() * 0.3 + 0.2;
            this.vx = (Math.random() - 0.5) * 0.2;
            this.vy = -0.5 - Math.random() * 0.5;
        }
        update() {
            this.x += this.vx;
            this.y += this.vy;
            this.alpha -= 0.001;
            if (this.alpha <= 0 || this.y < -10) this.reset();
        }
        draw() {
            ctx.beginPath();
            ctx.fillStyle = `rgba(255, ${Math.floor(Math.random() * 80 + 50)}, 0, ${this.alpha})`;
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function animate() {
        // Set background color
        if (currentState === 'rain') ctx.fillStyle = '#000000';
        else if (currentState === 'forest') ctx.fillStyle = '#1b2f1f';
        else if (currentState === 'winter') ctx.fillStyle = '#182430';
        else if (currentState === 'fire') ctx.fillStyle = '#1f0e0a';

        ctx.fillRect(0, 0, width, height);

        if (currentState === 'rain') {
            if (raindrops.length < 150) raindrops.push(new Raindrop());
            raindrops.forEach(d => { d.update(); d.draw(); });
            splashParticles.forEach((s, i) => {
                s.update(); s.draw();
                if (s.alpha <= 0) splashParticles.splice(i, 1);
            });
        }

        else if (currentState === 'forest') {
            if (leaves.length < 70) leaves.push(new Leaf());
            leaves.forEach(l => { l.update(); l.draw(); });
        }

        else if (currentState === 'winter') {
            if (snowflakes.length < 100) snowflakes.push(new Snowflake());
            snowflakes.forEach(s => { s.update(); s.draw(); });
        }

        else if (currentState === 'fire') {
            for (let i = 0; i < 2; i++) {
                if (ambientFireParticles.length < 150)
                    ambientFireParticles.push(new AmbientFireParticle());
            }
            ambientFireParticles.forEach((p, i) => {
                p.update(); p.draw();
                if (p.alpha <= 0) ambientFireParticles.splice(i, 1);
            });
            fireParticles.forEach((p, i) => {
                p.update(); p.draw();
                if (p.alpha <= 0) fireParticles.splice(i, 1);
            });
        }

        requestAnimationFrame(animate);
    }

    animate();
});
