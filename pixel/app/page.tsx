import { PremiumCard } from '../components/MaterialEngine/PremiumCard';
import { CinematicEnvironment } from '../components/MaterialEngine/CinematicEnvironment';

export default function Home() {
  return (
    <main className="min-h-screen bg-[#1c1c1c] text-zinc-200 font-sans flex flex-col relative overflow-hidden selection:bg-white/10">
      
      <CinematicEnvironment />
      
      {/* Editorial Grid Overlays */}
      <div className="absolute inset-0 z-0 pointer-events-none flex justify-center opacity-30">
        <div className="w-full max-w-[1400px] h-full grid grid-cols-12 gap-6 px-12">
            {[...Array(12)].map((_, i) => (
                <div key={i} className="h-full border-l border-white/5" />
            ))}
        </div>
      </div>

      {/* Page-level Cinematic Typography */}
      <div className="absolute inset-0 z-0 pointer-events-none flex flex-col justify-between p-12 max-w-[1400px] mx-auto w-full">
        <div className="w-full flex justify-between items-start">
            <h1 className="text-4xl font-light tracking-tight leading-[0.9] text-white/90">
                MACHINED<br/>IN LIGHT
            </h1>
            <div className="text-right">
                <p className="text-[10px] uppercase tracking-[0.2em] text-white/50 font-mono">01.002.44</p>
                <p className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-mono mt-1">Study</p>
            </div>
        </div>
        
        <div className="w-full flex justify-between items-end">
            <p className="text-[13px] font-light text-white/40 max-w-[280px] leading-relaxed tracking-wide">
                A physical exploration of optical density, refraction, and industrial precision. Rendered entirely in real-time.
            </p>
            <div className="flex gap-16">
                <div className="flex flex-col gap-2">
                    <span className="text-[9px] uppercase tracking-[0.2em] text-white/30 font-mono">Material</span>
                    <span className="text-[11px] uppercase tracking-[0.1em] text-white/80 font-sans">Smoked Resin</span>
                </div>
                <div className="flex flex-col gap-2">
                    <span className="text-[9px] uppercase tracking-[0.2em] text-white/30 font-mono">Environment</span>
                    <span className="text-[11px] uppercase tracking-[0.1em] text-white/80 font-sans">Studio Gray</span>
                </div>
            </div>
        </div>
      </div>

      {/* The Hero Object */}
      <div className="z-10 flex-1 flex flex-col items-center justify-center">
        <PremiumCard />
      </div>
    </main>
  );
}

