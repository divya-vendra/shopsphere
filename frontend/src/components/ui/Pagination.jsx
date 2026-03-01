import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

export default function Pagination({ page, pages, onPageChange }) {
  if (pages <= 1) return null;

  // Build visible page numbers with ellipsis
  const getPages = () => {
    const range = [];
    const delta = 2;
    for (let i = Math.max(2, page - delta); i <= Math.min(pages - 1, page + delta); i++) {
      range.push(i);
    }
    if (page - delta > 2)      range.unshift('...');
    if (page + delta < pages - 1) range.push('...');
    range.unshift(1);
    if (pages > 1) range.push(pages);
    return range;
  };

  const btnBase = 'flex items-center justify-center w-9 h-9 rounded-lg text-sm font-medium transition-colors';

  return (
    <nav className="flex items-center gap-1" aria-label="Pagination">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        className={`${btnBase} text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed`}
      >
        <ChevronLeftIcon className="w-4 h-4" />
      </button>

      {getPages().map((p, i) =>
        p === '...' ? (
          <span key={`ellipsis-${i}`} className={`${btnBase} text-gray-400`}>…</span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`${btnBase} ${
              p === page
                ? 'bg-primary-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {p}
          </button>
        )
      )}

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page === pages}
        className={`${btnBase} text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed`}
      >
        <ChevronRightIcon className="w-4 h-4" />
      </button>
    </nav>
  );
}
