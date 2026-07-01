"use client";

import React, { useEffect, useRef } from 'react';
import { PointerPhysics } from './PointerPhysics';
import { OpticalRenderer } from './OpticalRenderer';

export const PremiumCard: React.FC = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const physicsRef = useRef<PointerPhysics | null>(null);
    const rendererRef = useRef<OpticalRenderer | null>(null);
    const frameId = useRef<number>(0);
    const lastTime = useRef<number>(0);

    useEffect(() => {
        if (!containerRef.current || !canvasRef.current) return;

        physicsRef.current = new PointerPhysics();
        physicsRef.current.updateBounds(containerRef.current.getBoundingClientRect());

        rendererRef.current = new OpticalRenderer(canvasRef.current, physicsRef.current);
        rendererRef.current.start();

        const updatePhysics = (time: number) => {
            if (!lastTime.current) lastTime.current = time;
            const dt = (time - lastTime.current) / 1000;
            lastTime.current = time;

            if (physicsRef.current) physicsRef.current.update(dt);
            frameId.current = requestAnimationFrame(updatePhysics);
        };
        frameId.current = requestAnimationFrame(updatePhysics);

        const ro = new ResizeObserver((entries) => {
            for (let entry of entries) {
                if (physicsRef.current) {
                    physicsRef.current.updateBounds(entry.target.getBoundingClientRect());
                }
                if (rendererRef.current) {
                    rendererRef.current.resize();
                }
            }
        });
        ro.observe(containerRef.current);

        return () => {
            ro.disconnect();
            cancelAnimationFrame(frameId.current);
            if (rendererRef.current) rendererRef.current.stop();
        };
    }, []);

    const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        if (physicsRef.current) physicsRef.current.onPointerMove(e.clientX, e.clientY);
    };

    const onPointerEnter = () => {
        if (physicsRef.current) physicsRef.current.onPointerEnter();
    };

    const handlePointerLeave = () => {
        if (physicsRef.current) physicsRef.current.onPointerLeave();
    };

    return (
        <div 
            ref={containerRef}
            className="relative isolate group"
            style={{ 
                width: '280px', 
                height: '420px'
            }}
            onPointerMove={onPointerMove}
            onPointerEnter={onPointerEnter}
            onPointerLeave={handlePointerLeave}
        >
            <div 
                className="w-full h-full relative cursor-crosshair overflow-hidden transition-transform duration-[2s] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.02] shadow-[0_40px_80px_rgba(0,0,0,0.8)]"
            >
                {/* SVG continuous clip-path for physical edge smoothing */}
                <svg width="0" height="0" className="absolute">
                    <defs>
                        <clipPath id="superellipse-clip" clipPathUnits="objectBoundingBox">
                            <path d="M 0,0.5 C 0,0 0,0 0.5,0 S 1,0 1,0.5 1,1 0.5,1 0,1 0,0.5 Z" />
                        </clipPath>
                    </defs>
                </svg>

                <div 
                    className="absolute inset-0"
                    style={{
                        clipPath: 'url(#superellipse-clip)'
                    }}
                >
                    <canvas 
                        ref={canvasRef} 
                        className="absolute inset-0 w-full h-full z-0 block pointer-events-none"
                    />

                    {/* True Laser Engraved Typography (Reacts to Canvas Light) */}
                    <div className="absolute inset-0 z-10 flex flex-col justify-between p-10 pointer-events-none mix-blend-overlay opacity-90">
                        <div className="flex justify-between items-start w-full">
                            <h2 className="text-[11px] text-white tracking-[0.2em] font-medium font-sans uppercase">
                                Optical Resin
                            </h2>
                            <span className="text-[9px] uppercase tracking-[0.3em] text-white/60 font-mono">
                                OX-774A
                            </span>
                        </div>

                        <div className="flex flex-col gap-1 items-start mb-2">
                            <p className="text-[10px] text-white/50 font-normal tracking-[0.1em] font-sans">
                                Material Study 001
                            </p>
                            <p className="text-[9px] text-white/30 font-normal tracking-[0.05em] font-mono uppercase">
                                Machined in Light
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
