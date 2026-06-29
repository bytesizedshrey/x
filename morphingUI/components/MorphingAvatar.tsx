"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface MorphingAvatarProps {
  imageSrc: string;
  basePrice: number;
  discount: number;
  isActive?: boolean;
}

export function MorphingAvatar({ imageSrc, basePrice, discount, isActive: controlledIsActive }: MorphingAvatarProps) {
  const [isHovered, setIsHovered] = useState(false);
  const active = controlledIsActive !== undefined ? controlledIsActive : isHovered;

  // Spring configuration based on prompt suggestion for "luxurious" feel
  const springConfig = {
    type: "spring" as const,
    stiffness: 260,
    damping: 26,
    mass: 0.9,
  };

  // Dimensions
  const MAIN_RADIUS = 54;
  const EXTENSION_RADIUS = 36;
  const EXTENSION_OFFSET = 90;
  
  // When active, the main circle subtly compresses and shifts to preserve perceived volume
  const mainRadius = active ? MAIN_RADIUS - 2 : MAIN_RADIUS;
  const mainShift = active ? -4 : 0;
  
  const extX = active ? EXTENSION_OFFSET : 0;
  const extRadius = active ? EXTENSION_RADIUS : 10;

  return (
    <motion.div 
      className="relative flex flex-col items-center"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ WebkitTapHighlightColor: "transparent" }}
      animate={{ y: active ? 0 : [0, -6, 0] }}
      transition={{
        y: active ? springConfig : {
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut"
        }
      }}
    >
      {/* Container for the avatar and morphing shape */}
      <div className="relative w-[108px] h-[108px] z-10 flex items-center justify-center">
        
        {/* Morphing Background */}
        <div className="absolute inset-0 z-0 pointer-events-none" style={{ left: '-50%', width: '200%', overflow: 'visible' }}>
          <svg className="absolute w-full h-[200px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 overflow-visible">
            <defs>
              <filter id="goo">
                <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur" />
                <feColorMatrix 
                  in="blur" 
                  mode="matrix" 
                  values="
                    1 0 0 0 0  
                    0 1 0 0 0  
                    0 0 1 0 0  
                    0 0 0 20 -9" 
                  result="goo" 
                />
                <feComposite in="SourceGraphic" in2="goo" operator="over" />
              </filter>
            </defs>

            <g filter="url(#goo)">
              {/* Main Circle - Background */}
              <motion.circle
                cx="50%"
                cy="50%"
                animate={{ 
                  r: mainRadius,
                  x: mainShift
                }}
                transition={springConfig}
                fill="#000"
              />
              
              {/* Extension Circle - Background */}
              <motion.circle
                cx="50%"
                cy="50%"
                animate={{ 
                  x: extX,
                  r: extRadius
                }}
                transition={springConfig}
                fill="#000"
              />
            </g>

            {/* Crisp Top Layer to ensure main circles have no aliasing from the filter */}
            <g>
              <motion.circle
                cx="50%"
                cy="50%"
                animate={{ 
                  r: mainRadius,
                  x: mainShift
                }}
                transition={springConfig}
                fill="#000"
              />
              <motion.circle
                cx="50%"
                cy="50%"
                animate={{ 
                  x: extX,
                  r: extRadius
                }}
                transition={springConfig}
                fill="#000"
              />
            </g>
          </svg>
        </div>

        {/* Avatar Image (Crisp, above background) */}
        <motion.div 
          className="absolute z-10 w-[96px] h-[96px] rounded-full overflow-hidden shadow-inner"
          animate={{ x: mainShift }}
          transition={springConfig}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <motion.img 
            src={imageSrc} 
            alt="Avatar" 
            className="w-full h-full object-cover filter brightness-[0.85] contrast-[1.1] transform-gpu" 
            animate={{ scale: active ? 1.15 : 1 }}
            transition={springConfig}
          />
        </motion.div>

        {/* Elements inside the extension */}
        <div className="absolute top-0 bottom-0 left-full w-[90px] pointer-events-none flex items-center z-20">
          
          {/* White Dot */}
          <motion.div
            className="absolute w-[6px] h-[6px] bg-white rounded-full"
            initial={{ opacity: 0, scale: 0.5, x: 20 }}
            animate={{ 
              opacity: active ? 1 : 0, 
              scale: active ? 1 : 0.5,
              x: active ? 15 : 20
            }}
            transition={{
              ...springConfig,
              opacity: { duration: 0.3, delay: active ? 0.1 : 0 }
            }}
          />

          {/* Arrow */}
          <motion.div
            className="absolute text-white"
            initial={{ opacity: 0, x: 20 }}
            animate={{ 
              opacity: active ? 1 : 0,
              x: active ? 35 : 20
            }}
            transition={{
              ...springConfig,
              opacity: { duration: 0.3, delay: active ? 0.15 : 0 }
            }}
          >
            <ArrowRight size={18} strokeWidth={2.5} />
          </motion.div>
        </div>
      </div>

      {/* Price Badge */}
      <motion.div 
        className="relative z-30 mt-4 flex items-center bg-black rounded-full px-3 py-1.5 shadow-lg overflow-hidden"
        initial={{ y: 0 }}
        animate={{ y: active ? -4 : 0 }}
        transition={springConfig}
      >
        <span className="text-white font-medium text-[15px] tabular-nums tracking-tight mr-2">
          ${basePrice}
        </span>
        
        {/* Animated Badge Content */}
        <motion.div 
          className="bg-white/20 rounded-full px-2 py-0.5"
          initial={{ backgroundColor: "rgba(255,255,255,0.2)" }}
          animate={{ 
            backgroundColor: active ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.2)" 
          }}
          transition={springConfig}
        >
          <span className="text-white text-xs font-semibold tabular-nums">
            {discount > 0 ? `+${discount}` : discount}
          </span>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
