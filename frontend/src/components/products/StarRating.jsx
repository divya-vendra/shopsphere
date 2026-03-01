import { StarIcon } from '@heroicons/react/24/solid';
import { StarIcon as StarOutline } from '@heroicons/react/24/outline';

export default function StarRating({ rating = 0, count, size = 'sm', interactive = false, onChange }) {
  const sizeMap = { sm: 'w-4 h-4', md: 'w-5 h-5', lg: 'w-6 h-6' };

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= Math.round(rating);
        const Icon   = filled ? StarIcon : StarOutline;
        return (
          <button
            key={star}
            type={interactive ? 'button' : undefined}
            onClick={interactive ? () => onChange?.(star) : undefined}
            className={`${sizeMap[size]} ${filled ? 'text-yellow-400' : 'text-gray-300'}
              ${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'}`}
          >
            <Icon className="w-full h-full" />
          </button>
        );
      })}
      {count !== undefined && (
        <span className="text-xs text-gray-500 ml-1">({count})</span>
      )}
    </div>
  );
}
