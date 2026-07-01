import { PointerPhysics } from './PointerPhysics';

export class OpticalRenderer {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private physics: PointerPhysics;
    
    private width: number = 0;
    private height: number = 0;
    
    private animationId: number = 0;
    private lastTime: number = 0;

    constructor(canvas: HTMLCanvasElement, physics: PointerPhysics) {
        this.canvas = canvas;
        // MUST BE TRUE for physical transparency
        const ctx = canvas.getContext('2d', { alpha: true }); 
        if (!ctx) throw new Error("Could not initialize 2D context");
        this.ctx = ctx;
        this.physics = physics;
        this.init();
    }

    private init() {
        this.resize();
    }

    public resize() {
        const rect = this.canvas.parentElement?.getBoundingClientRect();
        if (rect) {
            this.width = rect.width;
            this.height = rect.height;
            const dpr = window.devicePixelRatio || 1;
            this.canvas.width = this.width * dpr;
            this.canvas.height = this.height * dpr;
            this.ctx.scale(dpr, dpr);
        }
    }

    public start() {
        this.lastTime = performance.now();
        const loop = (time: number) => {
            const dt = (time - this.lastTime) / 1000;
            this.lastTime = time;
            this.draw(dt);
            this.animationId = requestAnimationFrame(loop);
        };
        this.animationId = requestAnimationFrame(loop);
    }

    public stop() {
        if (this.animationId) cancelAnimationFrame(this.animationId);
    }

    private draw(dt: number) {
        // Clear frame completely for true transparency
        this.ctx.clearRect(0, 0, this.width, this.height);

        // --- 1. BASE MATERIAL (Optical Density) ---
        // Smoked black resin. Light from the background passes through it.
        this.ctx.globalCompositeOperation = 'source-over';
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.width, this.height);

        const lightX = this.physics.heavyX;
        const lightY = this.physics.heavyY;
        const nx = (lightX / this.width) * 2 - 1; 
        const ny = (lightY / this.height) * 2 - 1;
        
        // --- 2. THE OPTICAL SEAM ---
        // Internal manufacturing detail.
        const seamY = this.height / 2;
        const seamParallax = ny * 10;
        
        this.ctx.globalCompositeOperation = 'screen';
        
        const seamLightDist = Math.abs((seamY + seamParallax) - lightY);
        const seamIntensity = Math.max(0, 1 - seamLightDist / 250);
        
        const seamGrad = this.ctx.createLinearGradient(0, 0, this.width, 0);
        seamGrad.addColorStop(0, 'rgba(255,255,255,0)');
        seamGrad.addColorStop(0.5, `rgba(255,255,255,${0.01 + seamIntensity * 0.1})`);
        seamGrad.addColorStop(1, 'rgba(255,255,255,0)');
        
        this.ctx.fillStyle = seamGrad;
        this.ctx.fillRect(0, seamY + seamParallax, this.width, 0.5); 

        // --- 3. MASSIVE STUDIO SOFTBOX (Key Light) ---
        // Broad, slow falloff simulating a huge diffuse light source catching the surface.
        const grad = this.ctx.createLinearGradient(
            this.width / 2 - nx * 800, this.height / 2 - ny * 800,
            this.width / 2 + nx * 800, this.height / 2 + ny * 800
        );
        grad.addColorStop(0, 'rgba(255,255,255,0)');
        grad.addColorStop(0.3, 'rgba(255,255,255,0.01)');
        grad.addColorStop(0.48, 'rgba(255,255,255,0.08)');
        grad.addColorStop(0.5, 'rgba(255,255,255,0.22)'); // Core specular reflection
        grad.addColorStop(0.52, 'rgba(255,255,255,0.05)');
        grad.addColorStop(1, 'rgba(255,255,255,0)');
        
        this.ctx.fillStyle = grad;
        this.ctx.fillRect(0, 0, this.width, this.height);

        // --- 4. INTERNAL VOLUME (Thickness) ---
        this.ctx.globalCompositeOperation = 'source-over';
        const wallThickness = 14;
        
        const wallOffsetX = -nx * 8;
        const wallOffsetY = -ny * 8;
        
        // Simulates the physical thickness of the block. 
        // More material = darker transmission (Beer's Law).
        this.ctx.fillStyle = 'rgba(0,0,0,0.4)'; 
        this.ctx.fillRect(wallThickness + wallOffsetX, wallThickness + wallOffsetY, this.width - wallThickness*2, this.height - wallThickness*2);

        // --- 5. CINEMATIC RIM LIGHT (Edge Catchlight) ---
        // Crisp, intentional edge definition
        const rimAngle = Math.atan2(ny, nx);
        const rx = this.width/2 - Math.cos(rimAngle) * this.width;
        const ry = this.height/2 - Math.sin(rimAngle) * this.height;
        
        const rimGrad = this.ctx.createLinearGradient(rx, ry, this.width/2, this.height/2);
        rimGrad.addColorStop(0, 'rgba(255,255,255,0.7)'); // Strong catchlight on facing edge
        rimGrad.addColorStop(0.4, 'rgba(255,255,255,0.05)');
        rimGrad.addColorStop(1, 'rgba(255,255,255,0)');
        
        this.ctx.strokeStyle = rimGrad;
        this.ctx.lineWidth = 1; 
        this.ctx.strokeRect(0.5, 0.5, this.width - 1, this.height - 1);

        // --- 6. INNER BEVEL (Refraction) ---
        const bevelGrad = this.ctx.createLinearGradient(rx, ry, this.width/2, this.height/2);
        bevelGrad.addColorStop(0, 'rgba(255,255,255,0.08)');
        bevelGrad.addColorStop(0.4, 'rgba(0,0,0,0)');
        
        this.ctx.strokeStyle = bevelGrad;
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(wallThickness, wallThickness, this.width - wallThickness*2, this.height - wallThickness*2);
    }
}
