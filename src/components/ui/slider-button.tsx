import React, { useState, useRef, useEffect } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SliderButtonProps {
  onSlideComplete: () => void;
  text: string;
  variant?: 'start' | 'stop';
  disabled?: boolean;
  className?: string;
  isActive?: boolean; // New prop to track if timer is running
}

const SliderButton = ({ 
  onSlideComplete, 
  text, 
  variant = 'start', 
  disabled = false,
  className,
  isActive = false
}: SliderButtonProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [sliderPosition, setSliderPosition] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();

  const maxPosition = 200; // Approximate width for completion
  const completionThreshold = 0.85; // 85% of the way
  
  // Initialize position based on timer state
  React.useEffect(() => {
    if (variant === 'stop' && isActive) {
      setSliderPosition(getMaxPosition());
    } else if (variant === 'start' && !isActive) {
      setSliderPosition(0);
    }
  }, [variant, isActive]);

  // Calculate the actual max position based on container width
  const getMaxPosition = () => {
    if (!sliderRef.current) return maxPosition;
    const containerWidth = sliderRef.current.offsetWidth;
    return containerWidth - 56; // 56px for handle width (w-14 = 56px)
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (disabled || isCompleted) return;
    setIsDragging(true);
    e.preventDefault();
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled || isCompleted) return;
    setIsDragging(true);
    e.preventDefault();
  };

  useEffect(() => {
    const handleMove = (clientX: number) => {
      if (!isDragging || !sliderRef.current) return;

      const rect = sliderRef.current.getBoundingClientRect();
      const currentMaxPosition = getMaxPosition();
      let newPosition;
      
      if (variant === 'start') {
        // For start: slide from left to right
        newPosition = Math.max(0, Math.min(clientX - rect.left - 28, currentMaxPosition));
      } else {
        // For stop: slide from right to left
        newPosition = Math.max(0, Math.min(clientX - rect.left - 28, currentMaxPosition));
      }
      
      setSliderPosition(newPosition);

      // Check completion based on variant
      let completed = false;
      if (variant === 'start') {
        // Start timer: slide right to complete
        completed = newPosition >= currentMaxPosition * completionThreshold;
      } else {
        // Stop timer: slide left to complete (position should be near 0)
        completed = newPosition <= currentMaxPosition * (1 - completionThreshold);
      }

      if (completed && !isCompleted) {
        setIsCompleted(true);
        setIsDragging(false);
        
        // Trigger the action
        onSlideComplete();
        
        // Reset after a short delay
        setTimeout(() => {
          if (variant === 'start') {
            setSliderPosition(getMaxPosition()); // Stay on right for start
          } else {
            setSliderPosition(0); // Go to left for stop
          }
          setIsCompleted(false);
        }, 300);
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      handleMove(e.clientX);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        handleMove(e.touches[0].clientX);
      }
    };

    const handleEnd = () => {
      if (isDragging && !isCompleted) {
        // Animate back to original position if not completed
        const targetPosition = variant === 'stop' && isActive ? getMaxPosition() : 0;
        animationRef.current = requestAnimationFrame(() => {
          setSliderPosition(prev => {
            const diff = targetPosition - prev;
            const newPos = prev + diff * 0.2;
            if (Math.abs(diff) < 2) {
              setIsDragging(false);
              return targetPosition;
            }
            animationRef.current = requestAnimationFrame(() => setSliderPosition(newPos));
            return newPos;
          });
        });
      } else {
        setIsDragging(false);
      }
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('mouseup', handleEnd);
      document.addEventListener('touchend', handleEnd);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchend', handleEnd);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isDragging, isCompleted, onSlideComplete]);

  const currentMaxPosition = getMaxPosition();
  const progressPercentage = (sliderPosition / currentMaxPosition) * 100;
  const isNearCompletion = variant === 'start' ? progressPercentage > 70 : progressPercentage < 30;

  return (
    <div 
      ref={sliderRef}
      className={cn(
        "relative h-14 overflow-hidden cursor-pointer select-none",
        variant === 'start' 
          ? "bg-gradient-to-r from-green-500 to-green-600" 
          : "bg-gradient-to-r from-red-500 to-red-600",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      style={{ borderRadius: '100px' }}
    >
      {/* Progress Background */}
      <div 
        className={cn(
          "absolute inset-0 transition-all duration-200",
          variant === 'start' 
            ? "bg-gradient-to-r from-green-400 to-green-500" 
            : "bg-gradient-to-r from-red-400 to-red-500"
        )}
        style={{ 
          width: `${Math.min(progressPercentage + 15, 100)}%`,
          opacity: isDragging ? 0.8 : 0 
        }}
      />
      
      {/* Text */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span 
          className={cn(
            "text-white font-medium transition-all duration-200",
            isDragging ? "text-sm" : "text-base",
            isNearCompletion && "animate-pulse"
          )}
        >
          {isCompleted ? 'Completed!' : text}
        </span>
      </div>
      
      {/* Slider Handle */}
      <div
        ref={handleRef}
        className={cn(
          "absolute top-1 left-1 bottom-1 w-14 bg-white shadow-lg",
          "flex items-center justify-center cursor-grab active:cursor-grabbing",
          "transition-all duration-200",
          isDragging && "shadow-xl scale-105",
          isCompleted && "bg-green-100"
        )}
        style={{ 
          transform: `translateX(${sliderPosition}px)`,
          transition: isDragging ? 'none' : 'transform 0.3s ease-out',
          borderRadius: '100px'
        }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        {variant === 'start' ? (
          <ChevronRight 
            className={cn(
              "w-5 h-5 transition-all duration-200",
              "text-green-600",
              isDragging && "scale-110",
              isCompleted && "text-green-700"
            )} 
          />
        ) : (
          <ChevronLeft 
            className={cn(
              "w-5 h-5 transition-all duration-200",
              "text-red-600",
              isDragging && "scale-110",
              isCompleted && "text-red-700"
            )} 
          />
        )}
      </div>
      
      {/* Completion Indicator */}
      <div 
        className="absolute right-2 top-1/2 transform -translate-y-1/2"
        style={{ opacity: isNearCompletion ? 1 : 0.3 }}
      >
        <div className={cn(
          "w-2 h-2 rounded-full",
          variant === 'start' ? "bg-green-200" : "bg-red-200"
        )} />
      </div>
    </div>
  );
};

export default SliderButton;