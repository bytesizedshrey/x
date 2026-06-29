"use client";

import { MorphingAvatar } from "@/components/MorphingAvatar";
import { motion } from "framer-motion";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#E5E5E5] relative overflow-hidden">
      {/* Subtle dotted background pattern with slow panning animation */}
      <motion.div 
        className="absolute inset-[-100%] z-0 opacity-40 pointer-events-none" 
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, #a0a0a0 1px, transparent 0)',
          backgroundSize: '32px 32px'
        }}
        animate={{
          x: ["0%", "-5%", "0%"],
          y: ["0%", "-5%", "0%"],
        }}
        transition={{
          duration: 20,
          ease: "linear",
          repeat: Infinity,
        }}
      />

      <motion.main 
        className="relative z-10 flex flex-col sm:flex-row items-center justify-center gap-12 sm:gap-24"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: {
              staggerChildren: 0.2,
              delayChildren: 0.3
            }
          }
        }}
      >
        {/* Left Avatar */}
        <motion.div variants={{
          hidden: { opacity: 0, y: 30, scale: 0.9 },
          visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 200, damping: 20 } }
        }}>
          <MorphingAvatar 
            imageSrc="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop"
            basePrice={189}
            discount={-56}
          />
        </motion.div>
        
        {/* Right Avatar */}
        <motion.div variants={{
          hidden: { opacity: 0, y: 30, scale: 0.9 },
          visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 200, damping: 20 } }
        }}>
          <MorphingAvatar 
            imageSrc="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=400&auto=format&fit=crop"
            basePrice={89}
            discount={56}
          />
        </motion.div>
      </motion.main>
    </div>
  );
}

