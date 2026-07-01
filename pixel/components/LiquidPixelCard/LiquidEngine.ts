import { PointerTracker } from './PointerTracker';
import { MaterialProps, Materials } from './Materials';
import { VariantConfig, Variants } from './Variants';
import { randomRange, lerp, getRandomColor, hexToRgba } from './Utils';

class Particle {
    x: number;
    y: number;
    baseX: number;
    baseY: number;
    color: string;
    size: number;
    alpha: number;
    targetAlpha: number;
    velocity: { x: number; y: number };
    rotation: number;
    rotationSpeed: number;
    isCapsule: boolean;
    length: number;

    constructor(width: number, height: number, config: VariantConfig) {
        this.baseX = randomRange(0, width);
        this.baseY = randomRange(0, height);
        this.x = this.baseX;
        this.y = this.baseY;
        this.color = getRandomColor(config.particleColors);
        this.size = randomRange(config.particleBaseSize * 0.5, config.particleBaseSize * 2);
        this.alpha = randomRange(0.1, 0.5);
        this.targetAlpha = this.alpha;
        this.velocity = { x: randomRange(-0.2, 0.2), y: randomRange(-0.2, 0.2) };
        this.rotation = randomRange(0, Math.PI * 2);
        this.rotationSpeed = randomRange(-0.02, 0.02);
        this.isCapsule = Math.random() > 0.5;
        this.length = this.isCapsule ? randomRange(this.size * 2, this.size * 4) : this.size;
    }

    update(tracker: PointerTracker, config: VariantConfig, width: number, height: number) {
        // Drift
        this.baseX += this.velocity.x;
        this.baseY += this.velocity.y;

        // Wrap around
        if (this.baseX < -50) this.baseX = width + 50;
        if (this.baseX > width + 50) this.baseX = -50;
        if (this.baseY < -50) this.baseY = height + 50;
        if (this.baseY > height + 50) this.baseY = -50;

        // Interaction
        const dx = tracker.x - this.baseX;
        const dy = tracker.y - this.baseY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        let offsetX = 0;
        let offsetY = 0;

        if (tracker.isHovering && dist < config.interactionRadius) {
            const force = (config.interactionRadius - dist) / config.interactionRadius;
            
            // Push particles away slightly
            const angle = Math.atan2(dy, dx);
            offsetX = -Math.cos(angle) * force * 20;
            offsetY = -Math.sin(angle) * force * 20;

            // React to velocity
            offsetX += tracker.velocityX * force * 0.5;
            offsetY += tracker.velocityY * force * 0.5;
            
            // Increase alpha/energy when near cursor
            this.targetAlpha = Math.min(1, this.alpha + force * 0.8);
            this.rotationSpeed = lerp(this.rotationSpeed, (Math.random() > 0.5 ? 0.1 : -0.1) * force, 0.1);
        } else {
            this.targetAlpha = this.alpha;
            this.rotationSpeed = lerp(this.rotationSpeed, this.velocity.x * 0.1, 0.05);
        }

        // Apply smooth movement to actual position
        this.x = lerp(this.x, this.baseX + offsetX, 0.1);
        this.y = lerp(this.y, this.baseY + offsetY, 0.1);
        this.rotation += this.rotationSpeed;
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        
        ctx.fillStyle = hexToRgba(this.color, this.targetAlpha);
        
        if (this.isCapsule) {
            ctx.beginPath();
            ctx.roundRect(-this.length / 2, -this.size / 2, this.length, this.size, this.size / 2);
            ctx.fill();
        } else {
            ctx.beginPath();
            ctx.arc(0, 0, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }
}

export class LiquidEngine {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private tracker: PointerTracker;
    private variantName: string;
    private config: VariantConfig;
    private material: MaterialProps;
    private particles: Particle[] = [];
    private animationId: number = 0;
    private width: number = 0;
    private height: number = 0;
    private energyLevel: number = 0; // 0 to 1, ramps up on hover

    constructor(canvas: HTMLCanvasElement, tracker: PointerTracker, variant: string) {
        this.canvas = canvas;
        const context = canvas.getContext('2d', { alpha: true });
        if (!context) throw new Error("Could not get 2D context");
        this.ctx = context;
        this.tracker = tracker;
        this.variantName = variant;
        
        this.config = Variants[variant] || Variants.crystal;
        this.material = Materials[variant] || Materials.crystal;

        this.init();
    }

    private init() {
        this.resize();
        this.createParticles();
    }

    public resize() {
        const rect = this.canvas.parentElement?.getBoundingClientRect();
        if (rect) {
            this.width = rect.width;
            this.height = rect.height;
            // Handle high DPI displays
            const dpr = window.devicePixelRatio || 1;
            this.canvas.width = this.width * dpr;
            this.canvas.height = this.height * dpr;
            this.ctx.scale(dpr, dpr);
        }
    }

    private createParticles() {
        this.particles = [];
        for (let i = 0; i < this.config.particleCount; i++) {
            this.particles.push(new Particle(this.width, this.height, this.config));
        }
    }

    public updateVariant(variant: string) {
        if (this.variantName !== variant) {
            this.variantName = variant;
            this.config = Variants[variant] || Variants.crystal;
            this.material = Materials[variant] || Materials.crystal;
            this.createParticles();
        }
    }

    public start() {
        if (this.animationId) return;
        const render = () => {
            this.draw();
            this.animationId = requestAnimationFrame(render);
        };
        render();
    }

    public stop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = 0;
        }
    }

    private drawFakeRefraction() {
        // Draw edge highlights and subtle inner shadows to fake thickness/refraction
        
        // Inner shadow
        this.ctx.shadowColor = this.material.shadowColor;
        this.ctx.shadowBlur = 20;
        this.ctx.shadowOffsetX = 0;
        this.ctx.shadowOffsetY = 10;
        
        // Clear canvas
        this.ctx.clearRect(0, 0, this.width, this.height);

        // Base surface layer
        this.ctx.fillStyle = hexToRgba(this.material.baseColor, this.material.opacity);
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Reset shadow
        this.ctx.shadowColor = 'transparent';
        this.ctx.shadowBlur = 0;
    }

    private drawLighting() {
        // Calculate energy level based on hover
        this.energyLevel = lerp(this.energyLevel, this.tracker.isHovering ? 1 : 0, 0.05);

        // Specular highlight following cursor
        if (this.energyLevel > 0.01) {
            const gradient = this.ctx.createRadialGradient(
                this.tracker.x, this.tracker.y, 0,
                this.tracker.x, this.tracker.y, this.config.glowRadius
            );
            
            gradient.addColorStop(0, hexToRgba(this.material.specularHighlight, this.energyLevel * 0.4));
            gradient.addColorStop(1, 'rgba(0,0,0,0)');
            
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(0, 0, this.width, this.height);
        }

        // Edge ambient lighting (fake caustics along the rim)
        const edgeGradient = this.ctx.createLinearGradient(0, 0, this.width, this.height);
        edgeGradient.addColorStop(0, hexToRgba(this.material.edgeHighlight, this.config.ambientLightIntensity));
        edgeGradient.addColorStop(1, 'rgba(0,0,0,0)');
        
        this.ctx.fillStyle = edgeGradient;
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Top edge rim light
        const rimGrad = this.ctx.createLinearGradient(0, 0, 0, 100);
        rimGrad.addColorStop(0, hexToRgba(this.material.edgeHighlight, 0.5));
        rimGrad.addColorStop(1, 'rgba(0,0,0,0)');
        this.ctx.fillStyle = rimGrad;
        this.ctx.fillRect(0, 0, this.width, 100);
    }

    private draw() {
        this.drawFakeRefraction();
        
        // Update & Draw Particles
        for (const p of this.particles) {
            p.update(this.tracker, this.config, this.width, this.height);
            p.draw(this.ctx);
        }

        this.drawLighting();
    }
}
