import { forwardRef } from 'react';

const Input = forwardRef(({
  label,
  error,
  hint,
  className = '',
  containerClass = '',
  ...props
}, ref) => (
  <div className={`flex flex-col gap-1 ${containerClass}`}>
    {label && (
      <label className="label" htmlFor={props.id || props.name}>
        {label}
      </label>
    )}
    <input
      ref={ref}
      className={`
        block w-full rounded-lg border px-3 py-2 text-sm shadow-sm
        placeholder:text-gray-400 transition-colors
        focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
        disabled:bg-gray-50 disabled:cursor-not-allowed
        ${error
          ? 'border-red-400 text-red-900 focus:ring-red-400'
          : 'border-gray-300 text-gray-900'}
        ${className}
      `}
      {...props}
    />
    {error && <p className="text-xs text-red-600 mt-0.5">{error}</p>}
    {hint && !error && <p className="text-xs text-gray-500 mt-0.5">{hint}</p>}
  </div>
));

Input.displayName = 'Input';
export default Input;
