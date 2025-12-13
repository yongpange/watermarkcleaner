'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface ImageComparisonProps {
  beforeImage: {
    src: string;
    alt?: string;
  };
  afterImage: {
    src: string;
    alt?: string;
  };
  title?: string;
  description?: string;
  autoPlay?: boolean;
  autoPlaySpeed?: number; // ms per full cycle
  className?: string;
}

export default function ImageComparison({
  beforeImage,
  afterImage,
  title,
  description,
  autoPlay = true,
  autoPlaySpeed = 6000,
  className,
}: ImageComparisonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [imagesLoaded, setImagesLoaded] = useState(0);
  const [imageErrors, setImageErrors] = useState(false);
  const animationRef = useRef<number>();
  const startTimeRef = useRef<number>();
  const wasPlayingRef = useRef(false);

  const handleMouseMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!containerRef.current || !isDragging) return;

    const rect = containerRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));

    setSliderPosition(percentage);
  }, [isDragging]);

  const startAutoPlay = useCallback(() => {
    if (!autoPlay || isDragging) return;

    const animate = () => {
      if (!startTimeRef.current) {
        startTimeRef.current = Date.now();
      }

      const elapsed = Date.now() - startTimeRef.current;
      const progress = (elapsed % autoPlaySpeed) / autoPlaySpeed;

      // Smooth back and forth animation
      const smoothProgress = 0.5 - 0.5 * Math.cos(progress * Math.PI * 2);
      setSliderPosition(smoothProgress * 100);

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
  }, [autoPlay, autoPlaySpeed, isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    document.body.style.cursor = '';

    // Resume auto-play if it was playing before
    if (wasPlayingRef.current && autoPlay) {
      wasPlayingRef.current = false;
      startAutoPlay();
    }
  }, [autoPlay, startAutoPlay]);

  const handleMouseDown = useCallback(() => {
    setIsDragging(true);
    document.body.style.cursor = 'grabbing';

    // Stop auto-play when user starts interacting
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      wasPlayingRef.current = true;
    }
  }, []);

  const handleImageLoad = () => {
    setImagesLoaded(prev => prev + 1);
  };

  const handleImageError = () => {
    console.error('Failed to load comparison image');
    setImageErrors(true);
    // Still increment so loading spinner goes away
    setImagesLoaded(prev => prev + 1);
  };

  // Auto-play effect
  useEffect(() => {
    if (autoPlay && !isDragging && imagesLoaded >= 2) {
      startAutoPlay();
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [autoPlay, isDragging, startAutoPlay, imagesLoaded]);

  // Event listeners for drag
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('touchmove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchend', handleMouseUp);
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('touchmove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchend', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('touchmove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Reset cursor on unmount
  useEffect(() => {
    return () => {
      document.body.style.cursor = '';
    };
  }, []);

  const handleSliderClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));

    setSliderPosition(percentage);
  };

  return (
    <div className={cn("w-full", className)}>
      {title && (
        <div className="mb-4">
          <h2 className="text-2xl font-bold mb-2">{title}</h2>
          {description && <p className="text-muted-foreground">{description}</p>}
        </div>
      )}

      <div
        ref={containerRef}
        className="relative w-auto inline-block overflow-hidden rounded-xl shadow-2xl select-none mx-auto"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleSliderClick}
        role="slider"
        aria-label="Before and after comparison"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(sliderPosition)}
        tabIndex={0}
        style={{ maxWidth: '1200px' }}
      >
        {/* After image (displayed as background) */}
        <Image
          src={afterImage.src}
          alt={afterImage.alt || 'After'}
          width={1200}
          height={0}
          className="w-full h-auto pointer-events-none bg-background"
          onLoad={handleImageLoad}
          onError={handleImageError}
          priority
          style={{ opacity: imagesLoaded < 2 ? 0 : 1 }}
        />

        {/* Before image with clip-path */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{
            clipPath: `inset(0 ${100 - sliderPosition}% 0 0)`,
          }}
        >
          <Image
            src={beforeImage.src}
            alt={beforeImage.alt || 'Before'}
            width={1200}
            height={0}
            className="w-full h-auto pointer-events-none bg-background"
            onLoad={handleImageLoad}
            onError={handleImageError}
            style={{ opacity: imagesLoaded < 2 ? 0 : 1 }}
          />
        </div>

        {/* Divider line */}
        <div
          className="absolute inset-y-0 pointer-events-none"
          style={{
            left: `${sliderPosition}%`,
            transform: 'translateX(-50%)',
          }}
        >
          <div className="w-0.5 h-full bg-white shadow-lg shadow-black/20 relative">
            {/* Drag handle */}
            <div
              className={cn(
                "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white shadow-xl flex items-center justify-center cursor-grab",
                "pointer-events-auto transition-transform",
                isDragging && "cursor-grabbing scale-110",
                isHovered && "scale-105"
              )}
              onMouseDown={handleMouseDown}
              onTouchStart={handleMouseDown}
              role="button"
              aria-label="Drag to compare"
            >
              <div className={cn("flex gap-1 transition-colors", isDragging && "text-violet-600")}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0">
                  <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Labels */}
        <div className="absolute top-4 left-4 z-10">
          <span className="bg-black/70 text-white px-4 py-2 rounded-full text-sm font-medium backdrop-blur-sm border border-white/10">
            Before
          </span>
        </div>

        <div className="absolute top-4 right-4 z-10">
          <span className="bg-violet-600/90 text-white px-4 py-2 rounded-full text-sm font-medium backdrop-blur-sm border border-white/10">
            After
          </span>
        </div>

        {/* Loading overlay */}
        {imagesLoaded < 2 && !imageErrors && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center backdrop-blur-sm z-20">
            <div className="w-12 h-12 rounded-full border-4 border-violet-600 border-t-transparent animate-spin"></div>
          </div>
        )}

        {/* Error message */}
        {imageErrors && (
          <div className="absolute inset-0 bg-background/90 flex flex-col items-center justify-center backdrop-blur-sm z-20">
            <div className="text-center px-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                  <line x1="12" y1="9" x2="12" y2="13"></line>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Failed to load images</h3>
              <p className="text-muted-foreground text-sm mb-4">Please check that the image files exist in <code className="bg-muted px-1 py-0.5 rounded">public/imgs/</code></p>
              <p className="text-xs text-muted-foreground">Looking for files:</p>
              <ul className="text-xs text-muted-foreground mt-1">
                <li>• {beforeImage.src}</li>
                <li>• {afterImage.src}</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Play/Pause button */}
      {autoPlay && (
        <div className="flex justify-center mt-4">
          <button
            onClick={() => {
              if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
                animationRef.current = undefined;
              } else {
                startAutoPlay();
              }
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted hover:bg-muted/80 transition-colors text-sm font-medium"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0">
              {animationRef.current ? (
                <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"></path>
              ) : (
                <polygon points="5 3 19 12 5 21 5 3"></polygon>
              )}
            </svg>
            {animationRef.current ? 'Pause' : 'Play'} Animation
          </button>
        </div>
      )}
    </div>
  );
}
