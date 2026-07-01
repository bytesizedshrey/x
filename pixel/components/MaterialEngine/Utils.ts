/**
 * Utilities for the MaterialEngine
 */

export const lerp = (start: number, end: number, t: number): number => {
    return start * (1 - t) + end * t;
};

export const clamp = (val: number, min: number, max: number): number => {
    return Math.min(Math.max(val, min), max);
};

export const randomRange = (min: number, max: number): number => {
    return Math.random() * (max - min) + min;
};

// Extremely smooth spring easing for physical movement
export const spring = (current: number, target: number, velocity: number, stiffness: number, damping: number, dt: number): [number, number] => {
    const force = -stiffness * (current - target) - damping * velocity;
    const newVelocity = velocity + force * dt;
    const newPosition = current + newVelocity * dt;
    return [newPosition, newVelocity];
};

export const hexToRgba = (hex: string, alpha: number = 1): string => {
    if (!hex.startsWith('#') || (hex.length !== 4 && hex.length !== 7)) {
        return hex;
    }
    let r, g, b;
    if (hex.length === 4) {
        r = parseInt(hex[1] + hex[1], 16);
        g = parseInt(hex[2] + hex[2], 16);
        b = parseInt(hex[3] + hex[3], 16);
    } else {
        r = parseInt(hex.slice(1, 3), 16);
        g = parseInt(hex.slice(3, 5), 16);
        b = parseInt(hex.slice(5, 7), 16);
    }
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

// Generates an array of points for an SVG superellipse path (squircle)
export const getSuperellipsePath = (width: number, height: number, n: number = 4): string => {
    const points: [number, number][] = [];
    const a = width / 2;
    const b = height / 2;
    const steps = 100;

    for (let i = 0; i <= steps; i++) {
        const t = (i / steps) * 2 * Math.PI;
        // Superellipse formula: |x/a|^n + |y/b|^n = 1
        const cosT = Math.cos(t);
        const sinT = Math.sin(t);
        
        const x = Math.pow(Math.abs(cosT), 2 / n) * a * Math.sign(cosT);
        const y = Math.pow(Math.abs(sinT), 2 / n) * b * Math.sign(sinT);
        
        points.push([x + a, y + b]);
    }

    let path = `M ${points[0][0]} ${points[0][1]}`;
    for (let i = 1; i < points.length; i++) {
        path += ` L ${points[i][0]} ${points[i][1]}`;
    }
    path += " Z";
    return path;
};
