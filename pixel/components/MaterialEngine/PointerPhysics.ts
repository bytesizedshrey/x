import { spring, clamp } from './Utils';

export class PointerPhysics {
    public rawX: number = 0;
    public rawY: number = 0;
    
    // The physical point being dragged (simulates a heavy mass attached to the cursor)
    public x: number = 0;
    public y: number = 0;
    
    public velocityX: number = 0;
    public velocityY: number = 0;

    // A secondary, even heavier point that chases the primary point (for delayed specular highlights)
    public heavyX: number = 0;
    public heavyY: number = 0;
    public heavyVelocityX: number = 0;
    public heavyVelocityY: number = 0;

    public isHovering: boolean = false;
    public hoverForce: number = 0; // 0 to 1 smooth transition
    public hoverVelocity: number = 0;

    private rect: DOMRect | null = null;
    
    constructor() {}

    public updateBounds(rect: DOMRect) {
        this.rect = rect;
    }

    public onPointerMove(clientX: number, clientY: number) {
        if (!this.rect) return;
        this.rawX = clamp(clientX - this.rect.left, 0, this.rect.width);
        this.rawY = clamp(clientY - this.rect.top, 0, this.rect.height);
        this.isHovering = true;
    }

    public onPointerEnter() {
        this.isHovering = true;
    }

    public onPointerLeave() {
        this.isHovering = false;
    }

    public update(dt: number) {
        // Safe delta time to avoid physics explosions
        const safeDt = Math.min(dt, 0.032); // Max 32ms step

        // Idle state target: Top-left for a classic cinematic rim/key light
        const idleTargetX = this.rect ? this.rect.width * 0.2 : this.x;
        const idleTargetY = this.rect ? this.rect.height * -0.1 : this.y;
        
        const targetX = this.isHovering ? this.rawX : idleTargetX;
        const targetY = this.isHovering ? this.rawY : idleTargetY;

        // Primary mass (responsive, but has slight weight)
        const [nx, nvx] = spring(this.x, targetX, this.velocityX, 250, 20, safeDt);
        const [ny, nvy] = spring(this.y, targetY, this.velocityY, 250, 20, safeDt);
        this.x = nx;
        this.y = ny;
        this.velocityX = nvx;
        this.velocityY = nvy;

        // Heavy mass (very slow, creates the "thick fluid/acrylic" delayed highlight feel)
        const [hnx, hnvx] = spring(this.heavyX, this.x, this.heavyVelocityX, 60, 15, safeDt);
        const [hny, hnvy] = spring(this.heavyY, this.y, this.heavyVelocityY, 60, 15, safeDt);
        this.heavyX = hnx;
        this.heavyY = hny;
        this.heavyVelocityX = hnvx;
        this.heavyVelocityY = hnvy;

        // Hover state easing
        const [nhf, nhfv] = spring(this.hoverForce, this.isHovering ? 1 : 0, this.hoverVelocity, 120, 15, safeDt);
        this.hoverForce = clamp(nhf, 0, 1);
        this.hoverVelocity = nhfv;
    }
}
