import { forwardRef } from 'react';
import Spinner from './Spinner';

const variants = {
  primary:   'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500',
  secondary: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-gray-400',
  danger:    'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
  ghost:     'text-primary-600 hover:bg-primary-50 focus:ring-primary-500',
  accent:    'bg-accent-500 text-white hover:bg-accent-600 focus:ring-accent-400',
};

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};

const Button = forwardRef(({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  className = '',
  ...props
}, ref) => (
  <button
    ref={ref}
    disabled={disabled || loading}
    className={`
      inline-flex items-center justify-center gap-2 font-medium rounded-lg
      transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2
      disabled:opacity-50 disabled:cursor-not-allowed
      ${variants[variant]} ${sizes[size]}
      ${fullWidth ? 'w-full' : ''}
      ${className}
    `}
    {...props}
  >
    {loading && <Spinner size="sm" color="current" />}
    {children}
  </button>
));

Button.displayName = 'Button';
export default Button;
