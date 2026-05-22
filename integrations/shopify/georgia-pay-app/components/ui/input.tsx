'use client';

import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'h-11 w-full rounded-xl border border-border-strong bg-canvas px-4 text-sm text-foreground',
        'placeholder:text-foreground-muted transition-all duration-300',
        'focus:border-accent-blue focus:bg-canvas-elevated focus:outline-none focus:ring-2 focus:ring-accent-blue/25',
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = 'Input';
