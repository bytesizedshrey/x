"use client";

import React, { useEffect, useRef } from 'react';
import { PointerTracker } from './PointerTracker';
import { LiquidEngine } from './LiquidEngine';

export interface LiquidPixelCardProps {
    variant?: 'crystal' | 'mercury' | 'aurora' | 'obsidian' | 'prism';
    className?: string;
    children?: React.ReactNode;
}

export const LiquidPixelCard: React.FC<LiquidPixelCardProps> = ({
    variant = 'crystal',
    className = '',
    children
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const engineRef = useRef<LiquidEngine | null>(null);
    const trackerRef = useRef<PointerTracker | null>(null);
    const animationFrameRef = useRef<number>(0);

    useEffect(() => {
        if (!containerRef.current || !canvasRef.current) return;

        // Initialize pointer tracker
        trackerRef.current = new PointerTracker(0.1);
        trackerRef.current.updateBounds(containerRef.current.getBoundingClientRect());

        // Initialize engine
        engineRef.current = new LiquidEngine(canvasRef.current, trackerRef.current, variant);
        engineRef.current.start();

        // Update loop for pointer tracker
        const updateTracker = () => {
            if (trackerRef.current) trackerRef.current.update();
            animationFrameRef.current = requestAnimationFrame(updateTracker);
        };
        updateTracker();

        // Handle resizing
        const resizeObserver = new ResizeObserver((entries) => {
            for (let entry of entries) {
                if (trackerRef.current) {
                    trackerRef.current.updateBounds(entry.target.getBoundingClientRect());
                }
                if (engineRef.current) {
                    engineRef.current.resize();
                }
            }
        });

        resizeObserver.observe(containerRef.current);

        return () => {
            resizeObserver.disconnect();
            cancelAnimationFrame(animationFrameRef.current);
            if (engineRef.current) {
                engineRef.current.stop();
            }
        };
    }, []);

    // Handle variant changes without re-mounting
    useEffect(() => {
        if (engineRef.current) {
            engineRef.current.updateVariant(variant);
        }
    }, [variant]);

    const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        if (trackerRef.current) {
            trackerRef.current.onPointerMove(e.clientX, e.clientY);
        }
    };

    const handlePointerEnter = () => {
        if (trackerRef.current) {
            trackerRef.current.onPointerEnter();
        }
    };

    const handlePointerLeave = () => {
        if (trackerRef.current) {
            trackerRef.current.onPointerLeave();
        }
    };

    // The styles here focus on creating the "premium material" shape.
    // Notice there is NO backdrop-blur. We use subtle gradients and borders.
    return (
        <div
            ref={containerRef}
            className={`
                relative overflow-hidden group isolate
                rounded-[2rem] border border-white/10
                bg-gradient-to-b from-white/5 to-transparent
                shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_8px_32px_rgba(0,0,0,0.4)]
                ${className}
            `}
            style={{
                // Custom bezier for any structural transitions (e.g., scale on hover)
                transition: 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.5s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
            onPointerMove={handlePointerMove}
            onPointerEnter={handlePointerEnter}
            onPointerLeave={handlePointerLeave}
        >
            {/* The optical highlight layer (Top Edge Rim) */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent z-20 pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity duration-700" />
            
            {/* The canvas rendering engine */}
            <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full z-0 block pointer-events-none"
            />
            
            {/* Inner content wrapper */}
            <div className="relative z-10 w-full h-full p-8 flex flex-col">
                {children}
            </div>
        </div>
    );
};
