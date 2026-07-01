'use client';
import React, { useEffect, useRef } from 'react';

export function CinematicEnvironment() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d', { alpha: false });
        if (!ctx) return;

        let width = 0;
        let height = 0;
        let animationId = 0;

        const resize = () => {
            width = window.innerWidth;
            height = window.innerHeight;
            const dpr = window.devicePixelRatio || 1;
            canvas.width = width * dpr;
            canvas.height = height * dpr;
            ctx.scale(dpr, dpr);
            
            // Set initial mouse to top-left for cinematic idle
            if (mouseRef.current.targetX === 0) {
                mouseRef.current.targetX = width * 0.2;
                mouseRef.current.targetY = height * -0.1;
                mouseRef.current.x = width * 0.2;
                mouseRef.current.y = height * -0.1;
            }
        };

        const handlePointerMove = (e: PointerEvent) => {
            mouseRef.current.targetX = e.clientX;
            mouseRef.current.targetY = e.clientY;
        };

        window.addEventListener('resize', resize);
        window.addEventListener('pointermove', handlePointerMove);
        resize();

        // Massive floating industrial forms
        const objects = [
            { cx: width * 0.2, cy: height * 0.3, radius: 400, depth: 0.2, type: 'sphere' },
            { cx: width * 0.8, cy: height * 0.7, radius: 250, depth: 0.5, type: 'capsule' }
        ];

        let time = 0;

        const render = () => {
            time += 0.005;
            
            // Smooth mouse interpolation
            mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.05;
            mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.05;

            const mx = mouseRef.current.x;
            const my = mouseRef.current.y;
            const nx = (mx / width) * 2 - 1;
            const ny = (my / height) * 2 - 1;

            // Solid studio background
            ctx.fillStyle = '#1c1c1c';
            ctx.fillRect(0, 0, width, height);

            objects.forEach((obj) => {
                const pX = obj.cx + nx * (100 * obj.depth);
                const pY = obj.cy + ny * (100 * obj.depth) + Math.sin(time + obj.cx) * 20; // slow inevitable drift

                if (obj.type === 'sphere') {
                    // Massive, out-of-focus smoked resin sphere
                    const grad = ctx.createRadialGradient(
                        pX - nx * 100, pY - ny * 100, 0,
                        pX, pY, obj.radius
                    );
                    grad.addColorStop(0, 'rgba(255, 255, 255, 0.03)');
                    grad.addColorStop(0.5, 'rgba(0, 0, 0, 0.2)');
                    grad.addColorStop(1, 'rgba(0, 0, 0, 0.0)');
                    
                    ctx.fillStyle = grad;
                    ctx.beginPath();
                    ctx.arc(pX, pY, obj.radius, 0, Math.PI * 2);
                    ctx.fill();
                } else if (obj.type === 'capsule') {
                    // Optical disc/capsule shape
                    ctx.save();
                    ctx.translate(pX, pY);
                    ctx.rotate(Math.PI / 4 + Math.sin(time * 0.5) * 0.1);
                    
                    const grad = ctx.createLinearGradient(-obj.radius, 0, obj.radius, 0);
                    grad.addColorStop(0, 'rgba(255,255,255,0.0)');
                    grad.addColorStop(0.5, 'rgba(255,255,255,0.02)');
                    grad.addColorStop(0.8, 'rgba(0,0,0,0.15)');
                    grad.addColorStop(1, 'rgba(255,255,255,0)');

                    ctx.fillStyle = grad;
                    ctx.beginPath();
                    ctx.roundRect(-obj.radius, -obj.radius * 0.4, obj.radius * 2, obj.radius * 0.8, obj.radius * 0.4);
                    ctx.fill();
                    ctx.restore();
                }
            });

            // Universal studio key light sweeping the entire background wall
            const wallGrad = ctx.createLinearGradient(
                width / 2 - nx * 1200, height / 2 - ny * 1200,
                width / 2 + nx * 1200, height / 2 + ny * 1200
            );
            wallGrad.addColorStop(0, 'rgba(255,255,255,0)');
            wallGrad.addColorStop(0.5, 'rgba(255,255,255,0.015)');
            wallGrad.addColorStop(1, 'rgba(255,255,255,0)');
            
            ctx.fillStyle = wallGrad;
            ctx.fillRect(0, 0, width, height);

            animationId = requestAnimationFrame(render);
        };

        render();

        return () => {
            window.removeEventListener('resize', resize);
            window.removeEventListener('pointermove', handlePointerMove);
            cancelAnimationFrame(animationId);
        };
    }, []);

    return (
        <canvas 
            ref={canvasRef} 
            className="fixed inset-0 w-full h-full -z-10 pointer-events-none"
        />
    );
}
