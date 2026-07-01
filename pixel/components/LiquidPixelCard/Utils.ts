/**
 * Math and interpolation utilities for the LiquidEngine
 */

export const lerp = (start: number, end: number, factor: number): number => {
    return start + (end - start) * factor;
};

export const randomRange = (min: number, max: number): number => {
    return Math.random() * (max - min) + min;
};

// Hex to RGBA conversion for canvas operations
export const hexToRgba = (hex: string, alpha: number = 1): string => {
    // Check if it's a valid hex string, otherwise return as is or default
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

// Easing functions for liquid-like motion
export const easeOutQuad = (x: number): number => {
    return 1 - (1 - x) * (1 - x);
};

export const easeInOutSine = (x: number): number => {
    return -(Math.cos(Math.PI * x) - 1) / 2;
};

// Get a random color from an array
export const getRandomColor = (colors: string[]): string => {
    return colors[Math.floor(Math.random() * colors.length)];
};
