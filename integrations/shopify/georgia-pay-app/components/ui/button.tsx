'use client';

import { motion, type HTMLMotionProps } from 'framer-motion';
import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'ghost' | 'outline';
type Size = 'sm' | 'md' | 'lg';

export const buttonVariants: Record<Variant, string> = {
  primary:
    'bg-accent text-white border border-transparent hover:bg-accent-hover shadow-sm',
  secondary:
    'border-2 border-bd-strong bg-bg-surface text-tx-primary hover:border-accent hover:bg-bg-mint dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100',
  ghost: 'text-tx-secondary hover:text-accent hover:bg-bg-subtle dark:hover:bg-stone-800',
  outline:
    'border-2 border-bd-strong text-tx-primary hover:border-accent hover:bg-bg-mint dark:hover:bg-stone-800',
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
          'inline-flex items-center justify-center gap-2 rounded-btn font-medium transition-colors duration-150',
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
