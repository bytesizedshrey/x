export interface MaterialProps {
    baseColor: string; // The darkest background color
    surfaceColor: string; // The slightly lighter surface color (simulates the front face)
    edgeHighlight: string; // Color for the bright rim/edge lighting
    specularHighlight: string; // The moving bright spot following the cursor
    shadowColor: string; // Inner shadow for depth
    opacity: number; // Base opacity of the material
    refractionAlpha: number; // How strong the edge distortion/refraction feels
}

export const Materials: Record<string, MaterialProps> = {
    crystal: {
        baseColor: '#000000',
        surfaceColor: '#ffffff',
        edgeHighlight: '#ffffff',
        specularHighlight: '#ffffff',
        shadowColor: '#000000',
        opacity: 0.03,
        refractionAlpha: 0.15,
    },
    mercury: {
        baseColor: '#0f172a',
        surfaceColor: '#94a3b8',
        edgeHighlight: '#f8fafc',
        specularHighlight: '#e2e8f0',
        shadowColor: '#020617',
        opacity: 0.08,
        refractionAlpha: 0.2,
    },
    aurora: {
        baseColor: '#020617',
        surfaceColor: '#10b981', // subtle green tint
        edgeHighlight: '#34d399',
        specularHighlight: '#a7f3d0',
        shadowColor: '#064e3b',
        opacity: 0.05,
        refractionAlpha: 0.25,
    },
    obsidian: {
        baseColor: '#000000',
        surfaceColor: '#18181b',
        edgeHighlight: '#52525b',
        specularHighlight: '#a1a1aa',
        shadowColor: '#000000',
        opacity: 0.8, // Much more opaque
        refractionAlpha: 0.3,
    },
    prism: {
        baseColor: '#170f20',
        surfaceColor: '#c084fc',
        edgeHighlight: '#f0abfc',
        specularHighlight: '#ffffff',
        shadowColor: '#3b0764',
        opacity: 0.06,
        refractionAlpha: 0.3,
    }
};
