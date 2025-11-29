// Lightweight physics engine for interactive splash page
// Implements basic particle physics with gravity, bouncing, and mouse interaction

export class PhysicsWorld {
    constructor(canvas, options = {}) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.particles = [];
        this.mouse = { x: 0, y: 0, isActive: false };
        this.animationId = null;
        this.isRunning = false;
        
        // Physics constants
        this.gravity = options.gravity ?? 0.3;
        this.friction = options.friction ?? 0.99;
        this.bounce = options.bounce ?? 0.7;
        this.mouseRadius = options.mouseRadius ?? 120;
        this.mouseStrength = options.mouseStrength ?? 0.15;
        
        this.setupCanvas();
        this.bindEvents();
    }
    
    setupCanvas() {
        this.resize();
    }
    
    resize() {
        const rect = this.canvas.parentElement.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
    }
    
    bindEvents() {
        // Mouse/touch tracking
        this.canvas.addEventListener('mousemove', (e) => this.handlePointerMove(e));
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this.handlePointerMove(touch);
        }, { passive: false });
        
        this.canvas.addEventListener('mouseenter', () => { this.mouse.isActive = true; });
        this.canvas.addEventListener('mouseleave', () => { this.mouse.isActive = false; });
        this.canvas.addEventListener('touchstart', () => { this.mouse.isActive = true; });
        this.canvas.addEventListener('touchend', () => { this.mouse.isActive = false; });
        
        // Resize handling
        window.addEventListener('resize', () => {
            this.resize();
            this.redistributeParticles();
        });
    }
    
    handlePointerMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        this.mouse.x = (e.clientX || e.pageX) - rect.left;
        this.mouse.y = (e.clientY || e.pageY) - rect.top;
    }
    
    addParticle(particle) {
        this.particles.push(particle);
        return particle;
    }
    
    createParticle(options = {}) {
        const particle = {
            x: options.x ?? Math.random() * this.canvas.width,
            y: options.y ?? Math.random() * this.canvas.height,
            vx: options.vx ?? (Math.random() - 0.5) * 2,
            vy: options.vy ?? (Math.random() - 0.5) * 2,
            radius: options.radius ?? Math.random() * 20 + 10,
            color: options.color ?? this.randomColor(),
            mass: options.mass ?? 1,
            label: options.label ?? null,
            fontSize: options.fontSize ?? 14,
            fontColor: options.fontColor ?? '#ffffff',
        };
        return this.addParticle(particle);
    }
    
    randomColor() {
        const colors = [
            'rgba(37, 99, 235, 0.8)',   // Blue (accent)
            'rgba(59, 130, 246, 0.8)',  // Light blue
            'rgba(16, 185, 129, 0.8)',  // Green
            'rgba(245, 158, 11, 0.8)',  // Amber
            'rgba(236, 72, 153, 0.8)',  // Pink
            'rgba(139, 92, 246, 0.8)',  // Purple
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    redistributeParticles() {
        this.particles.forEach((p) => {
            if (p.x > this.canvas.width) p.x = this.canvas.width - p.radius;
            if (p.y > this.canvas.height) p.y = this.canvas.height - p.radius;
        });
    }
    
    update() {
        for (const p of this.particles) {
            // Apply gravity
            p.vy += this.gravity;
            
            // Apply mouse interaction
            if (this.mouse.isActive) {
                const dx = p.x - this.mouse.x;
                const dy = p.y - this.mouse.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < this.mouseRadius && distance > 0) {
                    const force = (this.mouseRadius - distance) / this.mouseRadius;
                    const angle = Math.atan2(dy, dx);
                    p.vx += Math.cos(angle) * force * this.mouseStrength * 10;
                    p.vy += Math.sin(angle) * force * this.mouseStrength * 10;
                }
            }
            
            // Apply friction
            p.vx *= this.friction;
            p.vy *= this.friction;
            
            // Update position
            p.x += p.vx;
            p.y += p.vy;
            
            // Boundary collision
            if (p.x - p.radius < 0) {
                p.x = p.radius;
                p.vx *= -this.bounce;
            } else if (p.x + p.radius > this.canvas.width) {
                p.x = this.canvas.width - p.radius;
                p.vx *= -this.bounce;
            }
            
            if (p.y - p.radius < 0) {
                p.y = p.radius;
                p.vy *= -this.bounce;
            } else if (p.y + p.radius > this.canvas.height) {
                p.y = this.canvas.height - p.radius;
                p.vy *= -this.bounce;
            }
        }
        
        // Simple particle-particle collision
        for (let i = 0; i < this.particles.length; i++) {
            for (let j = i + 1; j < this.particles.length; j++) {
                this.resolveCollision(this.particles[i], this.particles[j]);
            }
        }
    }
    
    resolveCollision(p1, p2) {
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const minDist = p1.radius + p2.radius;
        
        if (distance < minDist && distance > 0) {
            // Normalize collision vector
            const nx = dx / distance;
            const ny = dy / distance;
            
            // Relative velocity
            const dvx = p1.vx - p2.vx;
            const dvy = p1.vy - p2.vy;
            
            // Relative velocity along collision normal
            const dvn = dvx * nx + dvy * ny;
            
            // Don't resolve if velocities are separating
            if (dvn > 0) return;
            
            // Calculate impulse (simplified - assuming equal masses)
            const restitution = this.bounce;
            const impulse = -(1 + restitution) * dvn / 2;
            
            // Apply impulse
            p1.vx += impulse * nx;
            p1.vy += impulse * ny;
            p2.vx -= impulse * nx;
            p2.vy -= impulse * ny;
            
            // Separate particles to avoid overlap
            const overlap = (minDist - distance) / 2;
            p1.x -= overlap * nx;
            p1.y -= overlap * ny;
            p2.x += overlap * nx;
            p2.y += overlap * ny;
        }
    }
    
    draw() {
        // Clear canvas with slight transparency for trail effect
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw particles
        for (const p of this.particles) {
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = p.color;
            this.ctx.fill();
            
            // Add subtle shadow for depth
            this.ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
            this.ctx.shadowBlur = 10;
            this.ctx.shadowOffsetX = 2;
            this.ctx.shadowOffsetY = 2;
            
            // Draw label if exists
            if (p.label) {
                this.ctx.shadowColor = 'transparent';
                this.ctx.fillStyle = p.fontColor;
                this.ctx.font = `bold ${p.fontSize}px Inter, sans-serif`;
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText(p.label, p.x, p.y);
            }
        }
        
        // Reset shadow
        this.ctx.shadowColor = 'transparent';
        this.ctx.shadowBlur = 0;
        this.ctx.shadowOffsetX = 0;
        this.ctx.shadowOffsetY = 0;
        
        // Draw mouse interaction indicator
        if (this.mouse.isActive) {
            this.ctx.beginPath();
            this.ctx.arc(this.mouse.x, this.mouse.y, this.mouseRadius, 0, Math.PI * 2);
            this.ctx.strokeStyle = 'rgba(37, 99, 235, 0.15)';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        }
    }
    
    loop() {
        if (!this.isRunning) return;
        this.update();
        this.draw();
        this.animationId = requestAnimationFrame(() => this.loop());
    }
    
    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.loop();
    }
    
    stop() {
        this.isRunning = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
    
    destroy() {
        this.stop();
        this.particles = [];
    }
}

// Factory function for creating a splash page physics world
export function createSplashPhysics(container, options = {}) {
    // Create canvas element
    const canvas = document.createElement('canvas');
    canvas.className = 'splash-canvas';
    container.appendChild(canvas);
    
    // Create physics world
    const world = new PhysicsWorld(canvas, {
        gravity: options.gravity ?? 0.2,
        friction: options.friction ?? 0.995,
        bounce: options.bounce ?? 0.6,
        mouseRadius: options.mouseRadius ?? 100,
        mouseStrength: options.mouseStrength ?? 0.2,
    });
    
    return world;
}

// Create labeled skill bubbles
export function createSkillBubbles(world, skills = []) {
    const defaultSkills = [
        { label: 'JS', color: 'rgba(245, 158, 11, 0.9)' },
        { label: 'Python', color: 'rgba(59, 130, 246, 0.9)' },
        { label: 'Go', color: 'rgba(16, 185, 129, 0.9)' },
        { label: 'React', color: 'rgba(97, 218, 251, 0.9)' },
        { label: 'AWS', color: 'rgba(255, 153, 0, 0.9)' },
        { label: 'Docker', color: 'rgba(0, 145, 210, 0.9)' },
        { label: 'Git', color: 'rgba(240, 80, 51, 0.9)' },
        { label: 'SQL', color: 'rgba(139, 92, 246, 0.9)' },
    ];
    
    const items = skills.length > 0 ? skills : defaultSkills;
    
    items.forEach((skill, index) => {
        const angle = (index / items.length) * Math.PI * 2;
        const centerX = world.canvas.width / 2;
        const centerY = world.canvas.height / 2;
        const radius = Math.min(world.canvas.width, world.canvas.height) * 0.25;
        
        world.createParticle({
            x: centerX + Math.cos(angle) * radius,
            y: centerY + Math.sin(angle) * radius,
            vx: (Math.random() - 0.5) * 3,
            vy: (Math.random() - 0.5) * 3 - 2,
            radius: 35 + Math.random() * 10,
            color: skill.color,
            label: skill.label,
            fontSize: 12,
            fontColor: '#ffffff',
        });
    });
}

// Create decorative floating particles
export function createFloatingParticles(world, count = 15) {
    for (let i = 0; i < count; i++) {
        world.createParticle({
            x: Math.random() * world.canvas.width,
            y: Math.random() * world.canvas.height,
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2 - 1,
            radius: 8 + Math.random() * 15,
            color: world.randomColor(),
        });
    }
}
