import { lerp } from './Utils';

export class PointerTracker {
    public x: number = 0;
    public y: number = 0;
    public targetX: number = 0;
    public targetY: number = 0;
    public velocityX: number = 0;
    public velocityY: number = 0;
    public isHovering: boolean = false;
    
    // Smoothness factor (lower = smoother/slower, higher = snappier)
    private easing: number = 0.1;
    private rect: DOMRect | null = null;
    
    constructor(easing: number = 0.1) {
        this.easing = easing;
    }

    public updateBounds(rect: DOMRect) {
        this.rect = rect;
    }

    public onPointerMove(clientX: number, clientY: number) {
        if (!this.rect) return;
        this.targetX = clientX - this.rect.left;
        this.targetY = clientY - this.rect.top;
        this.isHovering = true;
    }

    public onPointerEnter() {
        this.isHovering = true;
    }

    public onPointerLeave() {
        this.isHovering = false;
    }

    public update() {
        // If not hovering, we might want the target to drift to center or stay put
        // For a liquid effect, letting it stay put and letting the energy diffuse is nice.
        
        const prevX = this.x;
        const prevY = this.y;

        this.x = lerp(this.x, this.targetX, this.easing);
        this.y = lerp(this.y, this.targetY, this.easing);

        this.velocityX = this.x - prevX;
        this.velocityY = this.y - prevY;
    }
}
