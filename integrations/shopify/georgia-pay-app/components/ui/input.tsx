'use client';

import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'h-11 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 text-sm text-white/90',
        'placeholder:text-white/30 transition-all duration-300',
        'focus:border-accent-blue/50 focus:bg-white/[0.05] focus:outline-none focus:ring-2 focus:ring-accent-blue/20',
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = 'Input';
