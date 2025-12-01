// Ambient floating physics engine for interactive splash page
// Creates a gentle, aesthetically pleasing floating effect without gravity

export class PhysicsWorld {
    constructor(canvas, options = {}) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.particles = [];
        this.mouse = { x: 0, y: 0, isActive: false };
        this.animationId = null;
        this.isRunning = false;
        this.time = 0;
        
        // Physics parameters for gentle floating motion
        this.damping = options.damping ?? 0.98;
        this.mouseRadius = options.mouseRadius ?? 150;
        this.mouseStrength = options.mouseStrength ?? 0.8;
        this.returnStrength = options.returnStrength ?? 0.002;
        
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
        const x = options.x ?? Math.random() * this.canvas.width;
        const y = options.y ?? Math.random() * this.canvas.height;
        
        const particle = {
            x,
            y,
            homeX: x,
            homeY: y,
            vx: options.vx ?? 0,
            vy: options.vy ?? 0,
            radius: options.radius ?? Math.random() * 20 + 10,
            color: options.color ?? this.randomColor(),
            label: options.label ?? null,
            fontSize: options.fontSize ?? 14,
            fontColor: options.fontColor ?? '#ffffff',
            // Unique phase offset for organic movement
            phase: Math.random() * Math.PI * 2,
            driftAmplitude: options.driftAmplitude ?? (15 + Math.random() * 20),
            driftFrequency: options.driftFrequency ?? (0.5 + Math.random() * 0.5),
            // Pre-compute glow color for performance
            glowColor: null,
        };
        // Compute glow color once
        particle.glowColor = particle.color.replace(/[\d.]+\)$/, '0.15)');
        return this.addParticle(particle);
    }
    
    randomColor() {
        const colors = [
            'rgba(37, 99, 235, 0.75)',
            'rgba(59, 130, 246, 0.75)',
            'rgba(16, 185, 129, 0.75)',
            'rgba(245, 158, 11, 0.75)',
            'rgba(236, 72, 153, 0.75)',
            'rgba(139, 92, 246, 0.75)',
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    redistributeParticles() {
        const scaleX = this.canvas.width / (this.prevWidth || this.canvas.width);
        const scaleY = this.canvas.height / (this.prevHeight || this.canvas.height);
        
        this.particles.forEach((p) => {
            p.x = Math.min(Math.max(p.x * scaleX, p.radius), this.canvas.width - p.radius);
            p.y = Math.min(Math.max(p.y * scaleY, p.radius), this.canvas.height - p.radius);
            p.homeX = Math.min(Math.max(p.homeX * scaleX, p.radius), this.canvas.width - p.radius);
            p.homeY = Math.min(Math.max(p.homeY * scaleY, p.radius), this.canvas.height - p.radius);
        });
        
        this.prevWidth = this.canvas.width;
        this.prevHeight = this.canvas.height;
    }
    
    update() {
        this.time += 0.016; // ~60fps time step
        
        for (const p of this.particles) {
            // Gentle ambient drift using sine waves for organic movement
            const driftX = Math.sin(this.time * p.driftFrequency + p.phase) * p.driftAmplitude * 0.02;
            const driftY = Math.cos(this.time * p.driftFrequency * 0.7 + p.phase) * p.driftAmplitude * 0.015;
            
            // Soft return force toward home position
            const homeDistX = p.homeX - p.x;
            const homeDistY = p.homeY - p.y;
            const returnForceX = homeDistX * this.returnStrength;
            const returnForceY = homeDistY * this.returnStrength;
            
            // Mouse repulsion with smooth falloff
            if (this.mouse.isActive) {
                const dx = p.x - this.mouse.x;
                const dy = p.y - this.mouse.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < this.mouseRadius && distance > 0) {
                    // Smooth cubic falloff for natural feel (manual multiplication for performance)
                    const normalizedDist = distance / this.mouseRadius;
                    const oneMinusNorm = 1 - normalizedDist;
                    const force = oneMinusNorm * oneMinusNorm * this.mouseStrength;
                    
                    p.vx += (dx / distance) * force;
                    p.vy += (dy / distance) * force;
                }
            }
            
            // Apply forces
            p.vx += driftX + returnForceX;
            p.vy += driftY + returnForceY;
            
            // Apply damping
            p.vx *= this.damping;
            p.vy *= this.damping;
            
            // Update position
            p.x += p.vx;
            p.y += p.vy;
            
            // Soft boundary collision
            const margin = p.radius;
            if (p.x < margin) {
                p.x = margin;
                p.vx *= -0.5;
            } else if (p.x > this.canvas.width - margin) {
                p.x = this.canvas.width - margin;
                p.vx *= -0.5;
            }
            
            if (p.y < margin) {
                p.y = margin;
                p.vy *= -0.5;
            } else if (p.y > this.canvas.height - margin) {
                p.y = this.canvas.height - margin;
                p.vy *= -0.5;
            }
        }
        
        // Gentle particle-particle separation
        for (let i = 0; i < this.particles.length; i++) {
            for (let j = i + 1; j < this.particles.length; j++) {
                this.separateParticles(this.particles[i], this.particles[j]);
            }
        }
    }
    
    separateParticles(p1, p2) {
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const minDist = p1.radius + p2.radius + 5; // Small gap between particles
        
        if (distance < minDist && distance > 0) {
            const nx = dx / distance;
            const ny = dy / distance;
            
            // Gentle push apart
            const overlap = (minDist - distance) * 0.15;
            p1.x -= nx * overlap;
            p1.y -= ny * overlap;
            p2.x += nx * overlap;
            p2.y += ny * overlap;
            
            // Soft velocity exchange
            const pushForce = 0.1;
            p1.vx -= nx * pushForce;
            p1.vy -= ny * pushForce;
            p2.vx += nx * pushForce;
            p2.vy += ny * pushForce;
        }
    }
    
    draw() {
        // Clear canvas completely for clean render
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw particles with subtle glow effect
        for (const p of this.particles) {
            // Outer glow (use pre-computed color)
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.radius + 4, 0, Math.PI * 2);
            this.ctx.fillStyle = p.glowColor;
            this.ctx.fill();
            
            // Main circle
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = p.color;
            this.ctx.fill();
            
            // Inner highlight for depth
            this.ctx.beginPath();
            this.ctx.arc(p.x - p.radius * 0.25, p.y - p.radius * 0.25, p.radius * 0.35, 0, Math.PI * 2);
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
            this.ctx.fill();
            
            // Draw label
            if (p.label) {
                this.ctx.fillStyle = p.fontColor;
                this.ctx.font = `bold ${p.fontSize}px Inter, system-ui, sans-serif`;
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText(p.label, p.x, p.y);
            }
        }
        
        // Subtle mouse indicator
        if (this.mouse.isActive) {
            const gradient = this.ctx.createRadialGradient(
                this.mouse.x, this.mouse.y, 0,
                this.mouse.x, this.mouse.y, this.mouseRadius
            );
            gradient.addColorStop(0, 'rgba(37, 99, 235, 0.08)');
            gradient.addColorStop(1, 'rgba(37, 99, 235, 0)');
            
            this.ctx.beginPath();
            this.ctx.arc(this.mouse.x, this.mouse.y, this.mouseRadius, 0, Math.PI * 2);
            this.ctx.fillStyle = gradient;
            this.ctx.fill();
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
        this.prevWidth = this.canvas.width;
        this.prevHeight = this.canvas.height;
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
        if (this.resizeHandler) {
            window.removeEventListener('resize', this.resizeHandler);
        }
    }
}

// Factory function for creating a splash page physics world
export function createSplashPhysics(container, options = {}) {
    const canvas = document.createElement('canvas');
    canvas.className = 'splash-canvas';
    container.appendChild(canvas);
    
    const world = new PhysicsWorld(canvas, {
        damping: options.damping ?? 0.96,
        mouseRadius: options.mouseRadius ?? 140,
        mouseStrength: options.mouseStrength ?? 0.6,
        returnStrength: options.returnStrength ?? 0.003,
    });
    
    return world;
}

// Create labeled skill bubbles arranged in a balanced layout
export function createSkillBubbles(world, skills = []) {
    const defaultSkills = [
        { label: 'JS', color: 'rgba(245, 158, 11, 0.85)' },
        { label: 'Python', color: 'rgba(59, 130, 246, 0.85)' },
        { label: 'Go', color: 'rgba(16, 185, 129, 0.85)' },
        { label: 'React', color: 'rgba(97, 218, 251, 0.85)' },
        { label: 'AWS', color: 'rgba(255, 153, 0, 0.85)' },
        { label: 'Docker', color: 'rgba(0, 145, 210, 0.85)' },
        { label: 'Git', color: 'rgba(240, 80, 51, 0.85)' },
        { label: 'SQL', color: 'rgba(139, 92, 246, 0.85)' },
    ];
    
    const items = skills.length > 0 ? skills : defaultSkills;
    const centerX = world.canvas.width / 2;
    const centerY = world.canvas.height / 2;
    
    // Distribute bubbles in a circular pattern around center
    items.forEach((skill, index) => {
        const angle = (index / items.length) * Math.PI * 2 - Math.PI / 2;
        const radius = Math.min(world.canvas.width, world.canvas.height) * 0.28;
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;
        
        world.createParticle({
            x,
            y,
            radius: 32 + Math.random() * 8,
            color: skill.color,
            label: skill.label,
            fontSize: 13,
            fontColor: '#ffffff',
            driftAmplitude: 12 + Math.random() * 8,
            driftFrequency: 0.4 + Math.random() * 0.3,
        });
    });
}

// Create decorative floating particles distributed across the canvas
export function createFloatingParticles(world, count = 12) {
    const margin = 60;
    const width = world.canvas.width - margin * 2;
    const height = world.canvas.height - margin * 2;
    
    for (let i = 0; i < count; i++) {
        // Distribute particles more evenly using grid-based positioning with jitter
        const cols = Math.ceil(Math.sqrt(count * (width / height)));
        const rows = Math.ceil(count / cols);
        const col = i % cols;
        const row = Math.floor(i / cols);
        
        const cellWidth = width / cols;
        const cellHeight = height / rows;
        
        const x = margin + col * cellWidth + cellWidth * 0.5 + (Math.random() - 0.5) * cellWidth * 0.6;
        const y = margin + row * cellHeight + cellHeight * 0.5 + (Math.random() - 0.5) * cellHeight * 0.6;
        
        world.createParticle({
            x,
            y,
            radius: 6 + Math.random() * 12,
            color: world.randomColor(),
            driftAmplitude: 18 + Math.random() * 15,
            driftFrequency: 0.3 + Math.random() * 0.4,
        });
    }
}
