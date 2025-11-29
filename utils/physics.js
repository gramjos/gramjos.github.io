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
        this.lastTime = 0;
        
        // Physics constants (tuned for 60fps baseline, scaled by delta time)
        this.gravity = options.gravity ?? 0.3;
        this.friction = options.friction ?? 0.99;
        this.bounce = options.bounce ?? 0.7;
        this.mouseRadius = options.mouseRadius ?? 120;
        this.mouseStrength = options.mouseStrength ?? 0.15;
        
        // Target frame time for physics scaling (60fps = ~16.67ms)
        this.targetFrameTime = 1000 / 60;
        
        // Collision constants
        this.collisionBuffer = 0.5;           // Small buffer to prevent re-collision
        this.groundFriction = 0.98;           // Extra friction when on ground
        this.particleRestitution = 0.8;       // Bounciness factor for particle-particle collisions
        
        this.setupCanvas();
        this.bindEvents();
    }
    
    setupCanvas() {
        this.resize();
    }
    
    resize() {
        // Use the actual container dimensions
        const container = this.canvas.parentElement;
        const rect = container.getBoundingClientRect();
        
        // Set canvas dimensions to match container exactly
        // Use devicePixelRatio for crisp rendering on high-DPI displays
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        
        // Scale canvas CSS to match container
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';
        
        // Scale context for high-DPI rendering
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        
        // Store logical dimensions for physics calculations
        this.width = rect.width;
        this.height = rect.height;
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
        
        // Resize handling with debounce
        let resizeTimeout;
        this.resizeHandler = () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.resize();
                this.redistributeParticles();
            }, 100);
        };
        window.addEventListener('resize', this.resizeHandler);
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
            x: options.x ?? Math.random() * this.width,
            y: options.y ?? Math.random() * this.height,
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
        // Ensure particles stay within bounds after resize
        for (const p of this.particles) {
            // Clamp positions to be within the new canvas bounds
            p.x = Math.max(p.radius, Math.min(this.width - p.radius, p.x));
            p.y = Math.max(p.radius, Math.min(this.height - p.radius, p.y));
        }
    }
    
    update(deltaTime) {
        // Scale physics by delta time for consistent simulation
        const timeScale = deltaTime / this.targetFrameTime;
        
        for (const p of this.particles) {
            // Apply gravity (scaled by time)
            p.vy += this.gravity * timeScale;
            
            // Apply mouse interaction
            if (this.mouse.isActive) {
                const dx = p.x - this.mouse.x;
                const dy = p.y - this.mouse.y;
                const distSq = dx * dx + dy * dy;
                const distance = Math.sqrt(distSq);
                
                if (distance < this.mouseRadius && distance > 0) {
                    const force = (this.mouseRadius - distance) / this.mouseRadius;
                    const nx = dx / distance;
                    const ny = dy / distance;
                    p.vx += nx * force * this.mouseStrength * 10 * timeScale;
                    p.vy += ny * force * this.mouseStrength * 10 * timeScale;
                }
            }
            
            // Apply friction (use power for time-correct damping)
            const frictionFactor = Math.pow(this.friction, timeScale);
            p.vx *= frictionFactor;
            p.vy *= frictionFactor;
            
            // Update position (scaled by time)
            p.x += p.vx * timeScale;
            p.y += p.vy * timeScale;
            
            // Boundary collision with proper clamping
            this.resolveBoundaryCollision(p);
        }
        
        // Particle-particle collision with improved resolution
        this.resolveParticleCollisions();
    }
    
    resolveBoundaryCollision(p) {
        const damping = this.bounce;
        
        // Left wall
        if (p.x < p.radius) {
            p.x = p.radius;
            p.vx = Math.abs(p.vx) * damping;
        }
        // Right wall
        else if (p.x > this.width - p.radius) {
            p.x = this.width - p.radius;
            p.vx = -Math.abs(p.vx) * damping;
        }
        
        // Top wall
        if (p.y < p.radius) {
            p.y = p.radius;
            p.vy = Math.abs(p.vy) * damping;
        }
        // Bottom wall
        else if (p.y > this.height - p.radius) {
            p.y = this.height - p.radius;
            p.vy = -Math.abs(p.vy) * damping;
            
            // Apply extra friction when on ground to settle faster
            p.vx *= this.groundFriction;
        }
    }
    
    resolveParticleCollisions() {
        const particles = this.particles;
        const len = particles.length;
        
        for (let i = 0; i < len; i++) {
            for (let j = i + 1; j < len; j++) {
                this.resolveCollision(particles[i], particles[j]);
            }
        }
    }
    
    resolveCollision(p1, p2) {
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const distSq = dx * dx + dy * dy;
        const minDist = p1.radius + p2.radius;
        const minDistSq = minDist * minDist;
        
        // Early exit if not colliding
        if (distSq >= minDistSq || distSq === 0) return;
        
        const distance = Math.sqrt(distSq);
        
        // Normalize collision vector
        const nx = dx / distance;
        const ny = dy / distance;
        
        // Separate particles first (prevents jitter from overlapping)
        const overlap = minDist - distance;
        const separationX = (overlap / 2 + this.collisionBuffer) * nx;
        const separationY = (overlap / 2 + this.collisionBuffer) * ny;
        
        p1.x -= separationX;
        p1.y -= separationY;
        p2.x += separationX;
        p2.y += separationY;
        
        // Relative velocity
        const dvx = p1.vx - p2.vx;
        const dvy = p1.vy - p2.vy;
        
        // Relative velocity along collision normal
        const dvn = dvx * nx + dvy * ny;
        
        // Don't resolve if velocities are separating
        if (dvn > 0) return;
        
        // Calculate impulse (equal masses assumed)
        const restitution = this.bounce * this.particleRestitution;
        const impulse = -(1 + restitution) * dvn / 2;
        
        // Apply impulse
        p1.vx += impulse * nx;
        p1.vy += impulse * ny;
        p2.vx -= impulse * nx;
        p2.vy -= impulse * ny;
    }
    
    draw() {
        // Clear canvas completely for clean rendering
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        // Draw particles
        for (const p of this.particles) {
            // Draw shadow first for depth
            this.ctx.beginPath();
            this.ctx.arc(p.x + 2, p.y + 2, p.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
            this.ctx.fill();
            
            // Draw main particle
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = p.color;
            this.ctx.fill();
            
            // Draw label if exists
            if (p.label) {
                this.ctx.fillStyle = p.fontColor;
                this.ctx.font = `bold ${p.fontSize}px Inter, sans-serif`;
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText(p.label, p.x, p.y);
            }
        }
        
        // Draw mouse interaction indicator
        if (this.mouse.isActive) {
            this.ctx.beginPath();
            this.ctx.arc(this.mouse.x, this.mouse.y, this.mouseRadius, 0, Math.PI * 2);
            this.ctx.strokeStyle = 'rgba(37, 99, 235, 0.15)';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        }
    }
    
    loop(currentTime) {
        if (!this.isRunning) return;
        
        // Calculate delta time in milliseconds
        const deltaTime = this.lastTime ? currentTime - this.lastTime : this.targetFrameTime;
        this.lastTime = currentTime;
        
        // Cap delta time to prevent large jumps (e.g., when tab is backgrounded)
        const cappedDelta = Math.min(deltaTime, this.targetFrameTime * 3);
        
        this.update(cappedDelta);
        this.draw();
        this.animationId = requestAnimationFrame((time) => this.loop(time));
    }
    
    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.lastTime = 0;
        this.animationId = requestAnimationFrame((time) => this.loop(time));
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
        // Clean up resize listener
        if (this.resizeHandler) {
            window.removeEventListener('resize', this.resizeHandler);
        }
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
    
    // Use logical dimensions
    const centerX = world.width / 2;
    const centerY = world.height / 2;
    const spreadRadius = Math.min(world.width, world.height) * 0.25;
    
    items.forEach((skill, index) => {
        const angle = (index / items.length) * Math.PI * 2;
        
        world.createParticle({
            x: centerX + Math.cos(angle) * spreadRadius,
            y: centerY + Math.sin(angle) * spreadRadius,
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2,
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
            x: Math.random() * world.width,
            y: Math.random() * world.height,
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2,
            radius: 8 + Math.random() * 15,
            color: world.randomColor(),
        });
    }
}
