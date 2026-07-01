export interface VariantConfig {
    name: string;
    particleColors: string[];
    particleCount: number;
    particleBaseSize: number;
    ambientLightIntensity: number;
    glowRadius: number;
    interactionRadius: number;
}

export const Variants: Record<string, VariantConfig> = {
    crystal: {
        name: 'crystal',
        particleColors: ['#ffffff', '#f8fafc', '#e2e8f0', '#cbd5e1'],
        particleCount: 80,
        particleBaseSize: 2.5,
        ambientLightIntensity: 0.1,
        glowRadius: 150,
        interactionRadius: 100,
    },
    mercury: {
        name: 'mercury',
        particleColors: ['#cbd5e1', '#94a3b8', '#64748b', '#475569'],
        particleCount: 120,
        particleBaseSize: 3,
        ambientLightIntensity: 0.2,
        glowRadius: 120,
        interactionRadius: 80,
    },
    aurora: {
        name: 'aurora',
        particleColors: ['#34d399', '#10b981', '#059669', '#3b82f6', '#8b5cf6'],
        particleCount: 100,
        particleBaseSize: 2,
        ambientLightIntensity: 0.15,
        glowRadius: 180,
        interactionRadius: 120,
    },
    obsidian: {
        name: 'obsidian',
        particleColors: ['#52525b', '#3f3f46', '#27272a', '#18181b'],
        particleCount: 60,
        particleBaseSize: 4,
        ambientLightIntensity: 0.05,
        glowRadius: 80,
        interactionRadius: 60,
    },
    prism: {
        name: 'prism',
        particleColors: ['#f472b6', '#c084fc', '#818cf8', '#38bdf8', '#34d399', '#fbbf24'],
        particleCount: 150,
        particleBaseSize: 1.5,
        ambientLightIntensity: 0.25,
        glowRadius: 200,
        interactionRadius: 150,
    }
};
