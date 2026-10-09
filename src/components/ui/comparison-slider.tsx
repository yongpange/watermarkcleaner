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
  aspectRatio?: string; // Optional: manual override (e.g., "aspect-video", "aspect-square")
  autoPlay?: boolean;
  maxHeight?: number; // Maximum height in pixels (default: 600)
}

export default function ComparisonSlider({
  beforeImage,
  afterImage,
  beforeLabel = "Before",
  afterLabel = "After",
  beforeAlt = "Before processing",
  afterAlt = "After processing",
  className,
  aspectRatio, // No default - will be calculated from image
  autoPlay = true,
  maxHeight = 600,
}: ComparisonSliderProps) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [imageRatio, setImageRatio] = useState<number>(1); // Default 1:1 (square)
  const [isLoaded, setIsLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Animation state references
  const animationRef = useRef<number>();
  const startTimeRef = useRef<number>();
  const autoPlaySpeed = 8000; // Time for full cycle (ms) - slower animation

  // Load image and calculate aspect ratio
  useEffect(() => {
    // Reset state when image changes
    setIsLoaded(false);

    const img = new window.Image();
    img.src = beforeImage;

    img.onload = () => {
      const ratio = img.width / img.height;
      // Use image's natural aspect ratio, with loose limits to prevent extreme cases
      // Min ratio: 0.3 (3:1 portrait), Max ratio: 5 (5:1 landscape)
      const clampedRatio = Math.max(0.3, Math.min(5, ratio));
      setImageRatio(clampedRatio);
      setIsLoaded(true);
    };

    img.onerror = () => {
      // Fallback to 1:1 on error
      setImageRatio(1);
      setIsLoaded(true);
    };
  }, [beforeImage]);

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

  // Calculate container style based on aspect ratio
  // Use manual aspectRatio prop if provided, otherwise use calculated imageRatio
  const effectiveRatio = aspectRatio ? undefined : imageRatio;

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative w-full overflow-hidden rounded-2xl bg-muted/50 select-none group cursor-ew-resize touch-pan-y",
        aspectRatio,
        className
      )}
      style={{
        // Apply dynamic aspect ratio if no manual override
        ...(effectiveRatio && { aspectRatio: `${effectiveRatio}` }),
        // Limit max height to prevent extremely tall images
        maxHeight: `${maxHeight}px`,
        // Smooth transition for aspect ratio changes
        transition: isLoaded ? 'aspect-ratio 0.3s ease-out' : undefined,
      }}
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
        <div className="absolute top-3 right-3 bg-black/40 text-white/90 px-2.5 py-1 rounded-lg text-xs font-medium backdrop-blur-md z-10 pointer-events-none transition-opacity duration-300 group-hover:opacity-0 border border-white/10">
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
        <div className="absolute top-3 left-3 bg-black/40 text-white/90 px-2.5 py-1 rounded-lg text-xs font-medium backdrop-blur-md z-10 transition-opacity duration-300 group-hover:opacity-0 border border-white/10">
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
        <div className="absolute top-0 bottom-0 left-[-1px] w-px bg-white/90 shadow-[0_0_12px_rgba(255,255,255,0.6)]"></div>

        <div className="absolute top-1/2 left-[-20px] w-10 h-10 -mt-5 flex items-center justify-center transition-all duration-200 opacity-80 group-hover:opacity-100 group-hover:scale-110">
          <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-xl border border-white/40 shadow-xl flex items-center justify-center text-white">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M9 18l6-6-6-6" />
            </svg>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="rotate-180">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
