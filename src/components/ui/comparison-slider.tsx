"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface ComparisonSliderProps {
  beforeImage: string; // The "Before" image (Blur/Original)
  afterImage: string;  // The "After" image (Clear/Processed)
  beforeLabel?: string;
  afterLabel?: string;
  beforeAlt?: string; // SEO friendly alt text
  afterAlt?: string;  // SEO friendly alt text
  className?: string;
  aspectRatio?: string;
  autoPlay?: boolean;
}

export default function ComparisonSlider({
  beforeImage,
  afterImage,
  beforeLabel = "Before",
  afterLabel = "After",
  beforeAlt = "Before processing",
  afterAlt = "After processing",
  className,
  aspectRatio = "aspect-square",
  autoPlay = true,
}: ComparisonSliderProps) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Animation state references
  const animationRef = useRef<number>();
  const startTimeRef = useRef<number>();
  const autoPlaySpeed = 4000; // Time for full cycle (ms)

  // 1. Manual Move Handler
  const handleMove = useCallback(
    (clientX: number) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
      setSliderPosition(percentage);
    },
    []
  );

  // 2. Mouse/Touch Event Handlers
  const handleMouseMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isDragging) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    handleMove(clientX);
  }, [isDragging, handleMove]);

  const handleMouseDown = useCallback(() => {
    setIsDragging(true);
    // Stop animation immediately on interaction
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = undefined;
    }
  }, []);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    // Animation will resume via useEffect dependency on isDragging/isHovered
  }, []);

  // 3. AutoPlay Logic
  const startAutoPlay = useCallback(() => {
    if (!autoPlay || isDragging || isHovered) return;

    const animate = () => {
      if (!startTimeRef.current) {
        startTimeRef.current = Date.now();
      }

      const elapsed = Date.now() - startTimeRef.current;
      // Calculate progress (0 to 1)
      const progress = (elapsed % autoPlaySpeed) / autoPlaySpeed;
      
      // Sine wave for smooth back-and-forth buffer: 50% +/- 45%
      // Range: ~5% to ~95%
      const amplitude = 45;
      const center = 50;
      const wave = Math.sin(progress * Math.PI * 2); 
      
      // Use standard sine wave
      // t=0 -> sin(0)=0 -> 50% (start at center)
      // t=0.25 -> sin(PI/2)=1 -> 95% (right)
      // t=0.75 -> sin(3PI/2)=-1 -> 5% (left)
      const newPos = center + (wave * amplitude);

      setSliderPosition(newPos);
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
  }, [autoPlay, autoPlaySpeed, isDragging, isHovered]);

  // 4. Effects
  // Global event listeners for dragging
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('touchmove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchend', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('touchmove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Manage AutoPlay lifecycle
  useEffect(() => {
    if (autoPlay && !isDragging && !isHovered) {
      startAutoPlay();
    }
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = undefined;
      }
    };
  }, [autoPlay, isDragging, isHovered, startAutoPlay]);


  // CLICK to jump
  const handleClick = (e: React.MouseEvent) => {
    // If not dragging, move to click position
    if (!isDragging) {
      handleMove(e.clientX);
    }
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative w-full overflow-hidden rounded-xl bg-gray-100 shadow-2xl select-none group cursor-ew-resize touch-pan-y",
        aspectRatio,
        className
      )}
      onMouseDown={handleMouseDown}
      onTouchStart={handleMouseDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      {/* 
        LAYER 1: BOTTOM (AFTER / CLEAR) 
        Always fully rendered.
      */}
      <div className="absolute inset-0 w-full h-full">
        <Image
          src={afterImage}
          alt={afterAlt}
          fill
          className="object-cover"
          draggable={false}
          priority
        />
        <div className="absolute top-4 right-4 bg-black/50 text-white/90 px-3 py-1 rounded text-xs font-semibold backdrop-blur-sm z-10 pointer-events-none transition-opacity duration-300 group-hover:opacity-0">
          {afterLabel}
        </div>
      </div>

      {/* 
        LAYER 2: TOP (BEFORE / BLUR)
        Clipped using clip-path for high performance and perfect overlap.
        Shows the Left side of the image (0 to sliderPosition).
      */}
      <div
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{
          clipPath: `inset(0 ${100 - sliderPosition}% 0 0)`,
        }}
      >
        <Image
          src={beforeImage}
          alt={beforeAlt}
          fill
          className="object-cover"
          draggable={false}
          priority
        />
        <div className="absolute top-4 left-4 bg-black/50 text-white/90 px-3 py-1 rounded text-xs font-semibold backdrop-blur-sm z-10 transition-opacity duration-300 group-hover:opacity-0">
          {beforeLabel}
        </div>
      </div>

      {/* 
        LAYER 3: DIVIDER LINE
        Placed exactly at the clip boundary.
      */}
      <div
        className="absolute inset-y-0 w-0 pointer-events-none"
        style={{ left: `${sliderPosition}%` }}
      >
        {/* The visible line centered on the position */}
        <div className="absolute top-0 bottom-0 left-[-1px] w-[2px] bg-white shadow-[0_0_10px_rgba(0,0,0,0.5)]"></div>
        
        {/* Minimalist Center Indicator (Optional, keep it very subtle or remove) */}
        <div className="absolute top-1/2 left-[-12px] w-6 h-6 -mt-3 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
             {/* Small handle arrows */}
             <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md border border-white/50 shadow-lg flex items-center justify-center text-white">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <path d="M15 18l-6-6 6-6" />
                  <path d="M9 18l6-6-6-6" opacity="0" /> 
                </svg>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="rotate-180">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
             </div>
        </div>
      </div>
    </div>
  );
}
