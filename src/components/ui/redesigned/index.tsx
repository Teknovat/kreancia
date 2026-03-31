/**
 * Kreancia Design System - Swiss Functional
 * Clean, efficient, brutally functional components
 */

import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

// ============================================================================
// TYPOGRAPHY SYSTEM
// ============================================================================

interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  level?: 1 | 2 | 3 | 4;
  variant?: 'display' | 'title' | 'subtitle';
}

export function Heading({ level = 1, variant = 'title', className, children, ...props }: HeadingProps) {
  const Tag = `h${level}` as keyof JSX.IntrinsicElements;

  const variants = {
    display: 'text-4xl md:text-6xl font-black uppercase tracking-tight text-gray-900',
    title: 'text-2xl md:text-3xl font-bold uppercase tracking-wide text-gray-900',
    subtitle: 'text-lg font-medium uppercase tracking-wide text-gray-600'
  };

  return (
    <Tag className={cn(variants[variant], className)} {...props}>
      {children}
    </Tag>
  );
}

export function Text({ className, children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn('text-gray-700 leading-relaxed', className)} {...props}>
      {children}
    </p>
  );
}

export function Label({ className, children, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label className={cn('text-sm font-medium text-gray-700 uppercase tracking-wide', className)} {...props}>
      {children}
    </label>
  );
}

// ============================================================================
// BUTTON SYSTEM
// ============================================================================

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, icon, children, className, disabled, ...props }, ref) => {
    const variants = {
      primary: 'bg-gray-900 text-white border-gray-900 hover:bg-gray-800',
      secondary: 'bg-white text-gray-900 border-gray-900 hover:bg-gray-50',
      ghost: 'bg-transparent text-gray-700 border-transparent hover:bg-gray-100',
      danger: 'bg-red-600 text-white border-red-600 hover:bg-red-700'
    };

    const sizes = {
      sm: 'px-3 py-2 text-sm',
      md: 'px-4 py-3 text-base',
      lg: 'px-6 py-4 text-lg'
    };

    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center font-medium border-2 transition-all duration-150',
          'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          variants[variant],
          sizes[size],
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
        {icon && !loading && <span className="mr-2">{icon}</span>}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

// ============================================================================
// CARD SYSTEM
// ============================================================================

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'outlined' | 'elevated';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function Card({ variant = 'default', padding = 'md', className, children, ...props }: CardProps) {
  const variants = {
    default: 'bg-white border-2 border-gray-200',
    outlined: 'bg-transparent border-2 border-gray-900',
    elevated: 'bg-white border-2 border-gray-200 shadow-lg'
  };

  const paddings = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };

  return (
    <div className={cn(variants[variant], paddings[padding], className)} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('border-b-2 border-gray-200 p-6 -m-6 mb-6', className)} {...props}>
      {children}
    </div>
  );
}

export function CardContent({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('', className)} {...props}>
      {children}
    </div>
  );
}

// ============================================================================
// FORM SYSTEM
// ============================================================================

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ error, label, className, id, ...props }, ref) => {
    return (
      <div className="space-y-2">
        {label && (
          <Label htmlFor={id}>
            {label}
            {props.required && <span className="text-red-600 ml-1">*</span>}
          </Label>
        )}
        <input
          ref={ref}
          className={cn(
            'w-full px-4 py-3 border-2 border-gray-200 bg-white',
            'focus:outline-none focus:border-gray-900 transition-colors',
            'placeholder:text-gray-500',
            error && 'border-red-500 focus:border-red-500',
            className
          )}
          id={id}
          {...props}
        />
        {error && (
          <p className="text-sm text-red-600 font-medium">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
  label?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ error, label, className, id, ...props }, ref) => {
    return (
      <div className="space-y-2">
        {label && (
          <Label htmlFor={id}>
            {label}
            {props.required && <span className="text-red-600 ml-1">*</span>}
          </Label>
        )}
        <textarea
          ref={ref}
          className={cn(
            'w-full px-4 py-3 border-2 border-gray-200 bg-white resize-none',
            'focus:outline-none focus:border-gray-900 transition-colors',
            'placeholder:text-gray-500',
            error && 'border-red-500 focus:border-red-500',
            className
          )}
          id={id}
          {...props}
        />
        {error && (
          <p className="text-sm text-red-600 font-medium">{error}</p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

// ============================================================================
// DATA DISPLAY
// ============================================================================

interface MetricProps {
  label: string;
  value: string;
  change?: string;
  variant?: 'default' | 'success' | 'warning' | 'danger';
  loading?: boolean;
}

export function Metric({ label, value, change, variant = 'default', loading }: MetricProps) {
  const variants = {
    default: 'border-gray-200 bg-white',
    success: 'border-green-200 bg-green-50',
    warning: 'border-orange-200 bg-orange-50',
    danger: 'border-red-200 bg-red-50'
  };

  return (
    <Card variant="default" className={variants[variant]}>
      <div className="space-y-2">
        <Label>{label}</Label>
        <div className="text-3xl font-bold text-gray-900">
          {loading ? "..." : value}
        </div>
        {change && (
          <Text className="text-sm text-gray-600">{change}</Text>
        )}
      </div>
    </Card>
  );
}

// ============================================================================
// LOADING STATES
// ============================================================================

export function LoadingSpinner({ size = 24, className }: { size?: number; className?: string }) {
  return <Loader2 size={size} className={cn('animate-spin text-gray-400', className)} />;
}

export function PageLoading({ message = "Chargement..." }: { message?: string }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center space-y-4">
        <LoadingSpinner size={48} />
        <Text className="text-lg font-medium text-gray-600">{message}</Text>
      </div>
    </div>
  );
}

// ============================================================================
// LAYOUT HELPERS
// ============================================================================

export function Container({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('max-w-7xl mx-auto px-6', className)} {...props}>
      {children}
    </div>
  );
}

export function Grid({ cols = 1, gap = 6, className, children, ...props }: {
  cols?: 1 | 2 | 3 | 4 | 6;
  gap?: number;
  className?: string;
  children: React.ReactNode;
} & React.HTMLAttributes<HTMLDivElement>) {
  const colsMap = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
    6: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-6'
  };

  return (
    <div className={cn('grid', colsMap[cols], `gap-${gap}`, className)} {...props}>
      {children}
    </div>
  );
}