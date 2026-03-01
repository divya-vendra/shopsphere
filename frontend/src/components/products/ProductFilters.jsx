import { CATEGORIES } from '../../utils/constants';

export default function ProductFilters({ filters, onChange }) {
  const { category = '', minPrice = '', maxPrice = '', sort = '-createdAt' } = filters;

  const update = (key, value) => onChange({ ...filters, [key]: value, page: 1 });

  return (
    <aside className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Sort By</h3>
        <select
          value={sort}
          onChange={(e) => update('sort', e.target.value)}
          className="w-full text-sm rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="-createdAt">Newest First</option>
          <option value="price">Price: Low → High</option>
          <option value="-price">Price: High → Low</option>
          <option value="-ratings">Top Rated</option>
        </select>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Category</h3>
        <ul className="space-y-1">
          <li>
            <button
              onClick={() => update('category', '')}
              className={`w-full text-left text-sm px-2 py-1.5 rounded-lg transition-colors ${
                !category ? 'bg-primary-50 text-primary-700 font-medium' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              All Categories
            </button>
          </li>
          {CATEGORIES.map((cat) => (
            <li key={cat}>
              <button
                onClick={() => update('category', cat)}
                className={`w-full text-left text-sm px-2 py-1.5 rounded-lg transition-colors ${
                  category === cat ? 'bg-primary-50 text-primary-700 font-medium' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {cat}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Price Range</h3>
        <div className="flex items-center gap-2">
          <input
            type="number" placeholder="Min" min={0} value={minPrice}
            onChange={(e) => update('price[gte]', e.target.value)}
            className="w-full text-sm rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <span className="text-gray-400 text-sm">–</span>
          <input
            type="number" placeholder="Max" min={0} value={maxPrice}
            onChange={(e) => update('price[lte]', e.target.value)}
            className="w-full text-sm rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      {/* Clear filters */}
      {(category || minPrice || maxPrice) && (
        <button
          onClick={() => onChange({ sort: '-createdAt', page: 1 })}
          className="w-full text-sm text-red-600 hover:text-red-700 font-medium py-2 rounded-lg hover:bg-red-50 transition-colors"
        >
          Clear Filters
        </button>
      )}
    </aside>
  );
}
