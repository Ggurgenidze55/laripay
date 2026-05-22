'use client';

import { motion, type HTMLMotionProps } from 'framer-motion';
import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'ghost' | 'outline';
type Size = 'sm' | 'md' | 'lg';

export const buttonVariants: Record<Variant, string> = {
  primary:
    'bg-gradient-to-r from-accent-blue to-accent-violet text-white shadow-glow hover:shadow-glow-violet border border-border',
  secondary:
    'border border-border-strong bg-canvas-card text-foreground shadow-card hover:bg-canvas-elevated dark:glass-panel dark:shadow-none dark:hover:bg-foreground/[0.06]',
  ghost: 'text-foreground-muted hover:text-foreground hover:bg-surface-inset',
  outline:
    'border border-border-strong text-foreground hover:border-accent-blue/60 hover:bg-canvas-elevated',
};

const sizes: Record<Size, string> = {
  sm: 'h-9 px-4 text-xs',
  md: 'h-11 px-6 text-sm',
  lg: 'h-12 px-8 text-sm font-medium',
};

export interface ButtonProps extends HTMLMotionProps<'button'> {
  variant?: Variant;
  size?: Size;
  magnetic?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', magnetic = true, children, ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        whileHover={magnetic ? { scale: 1.02, y: -1 } : undefined}
        whileTap={magnetic ? { scale: 0.98 } : undefined}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-shadow duration-300',
          buttonVariants[variant],
          sizes[size],
          className,
        )}
        {...props}
      >
        {children}
      </motion.button>
    );
  },
);
Button.displayName = 'Button';
