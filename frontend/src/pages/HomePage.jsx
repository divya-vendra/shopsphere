import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { fetchProducts } from '../features/products/productSlice';
import { fetchWishlist } from '../features/wishlist/wishlistSlice';
import { fetchCart } from '../features/cart/cartSlice';
import ProductGrid    from '../components/products/ProductGrid';
import ProductFilters from '../components/products/ProductFilters';
import Pagination     from '../components/ui/Pagination';
import useAuth from '../hooks/useAuth';
import useDebounce from '../hooks/useDebounce';
import { AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline';

export default function HomePage() {
  const dispatch   = useDispatch();
  const { isAuthenticated } = useAuth();
  const { items, pagination, status, error } = useSelector((s) => s.products);
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilters, setShowFilters]   = useState(false);

  const [filters, setFilters] = useState({
    search:      searchParams.get('search')   || '',
    category:    searchParams.get('category') || '',
    'price[gte]': searchParams.get('price[gte]') || '',
    'price[lte]': searchParams.get('price[lte]') || '',
    sort:        searchParams.get('sort')     || '-createdAt',
    page:        parseInt(searchParams.get('page'), 10) || 1,
  });

  const debouncedSearch = useDebounce(filters.search, 400);

  // Sync filters → URL params
  useEffect(() => {
    const params = {};
    Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v; });
    setSearchParams(params, { replace: true });
  }, [filters, setSearchParams]);

  // Fetch products when filters change
  useEffect(() => {
    const query = { ...filters, search: debouncedSearch };
    dispatch(fetchProducts(query));
  }, [dispatch, debouncedSearch, filters.category, filters['price[gte]'], filters['price[lte]'], filters.sort, filters.page]);

  // Load wishlist + cart for authenticated users
  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchWishlist());
      dispatch(fetchCart());
    }
  }, [dispatch, isAuthenticated]);

  const handlePageChange = (page) => {
    setFilters((f) => ({ ...f, page }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="section">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {filters.category || 'All Products'}
          </h1>
          {status === 'succeeded' && (
            <p className="text-sm text-gray-500 mt-0.5">
              {pagination.total} product{pagination.total !== 1 ? 's' : ''} found
            </p>
          )}
        </div>
        <button
          onClick={() => setShowFilters((v) => !v)}
          className="md:hidden flex items-center gap-2 px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          <AdjustmentsHorizontalIcon className="w-4 h-4" />
          Filters
        </button>
      </div>

      {/* Search bar — visible on mobile */}
      <div className="md:hidden mb-4">
        <input
          value={filters.search}
          onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value, page: 1 }))}
          placeholder="Search products..."
          className="w-full text-sm rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      <div className="flex gap-8">
        {/* Sidebar filters */}
        <div className={`
          md:block w-56 flex-shrink-0
          ${showFilters ? 'block' : 'hidden'}
        `}>
          <ProductFilters filters={filters} onChange={setFilters} />
        </div>

        {/* Product grid + pagination */}
        <div className="flex-1 min-w-0">
          <ProductGrid products={items} status={status} error={error} />
          <div className="flex justify-center mt-8">
            <Pagination
              page={pagination.page}
              pages={pagination.pages}
              onPageChange={handlePageChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
