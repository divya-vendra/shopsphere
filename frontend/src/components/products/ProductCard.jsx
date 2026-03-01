import { memo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { HeartIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolid } from '@heroicons/react/24/solid';
import { ShoppingCartIcon } from '@heroicons/react/24/outline';
import { addItem } from '../../features/cart/cartSlice';
import { toggleWishlist } from '../../features/wishlist/wishlistSlice';
import { useSelector } from 'react-redux';
import useAuth from '../../hooks/useAuth';
import StarRating from './StarRating';
import { formatCurrency } from '../../utils/formatCurrency';
import Badge from '../ui/Badge';

// memo: only re-renders when `product` prop or wishlist membership changes.
// Without memo, every Redux state update (e.g. cart badge count) would re-render
// all 12+ cards on the page simultaneously.
const ProductCard = memo(function ProductCard({ product }) {
  const dispatch     = useDispatch();
  const { isAuthenticated } = useAuth();
  const wishlistItems = useSelector((s) => s.wishlist.items);
  const inWishlist    = wishlistItems.some((p) => p._id === product._id);

  // useCallback: stable reference prevents child button re-renders
  const handleAddToCart = useCallback((e) => {
    e.preventDefault();
    dispatch(addItem({ productId: product._id, quantity: 1 }));
  }, [dispatch, product._id]);

  const handleWishlist = useCallback((e) => {
    e.preventDefault();
    if (isAuthenticated) dispatch(toggleWishlist(product._id));
  }, [dispatch, isAuthenticated, product._id]);

  const discountPct = product.comparePrice
    ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
    : 0;

  return (
    <Link
      to={`/products/${product.slug}`}
      className="card group flex flex-col hover:shadow-md transition-shadow duration-200"
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-gray-100">
        <img
          src={product.images?.[0]?.url || 'https://placehold.co/400x400?text=No+Image'}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        {discountPct > 0 && (
          <Badge className="absolute top-2 left-2 bg-red-500 text-white">
            -{discountPct}%
          </Badge>
        )}
        {!product.inStock && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="text-white font-semibold text-sm bg-black/60 px-3 py-1 rounded-full">
              Out of Stock
            </span>
          </div>
        )}
        {/* Wishlist button */}
        {isAuthenticated && (
          <button
            onClick={handleWishlist}
            className="absolute top-2 right-2 p-1.5 bg-white rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110"
          >
            {inWishlist
              ? <HeartSolid className="w-4 h-4 text-red-500" />
              : <HeartIcon   className="w-4 h-4 text-gray-500" />}
          </button>
        )}
      </div>

      {/* Info */}
      <div className="p-4 flex flex-col flex-1 gap-2">
        <p className="text-xs text-gray-400 uppercase tracking-wide">{product.brand}</p>
        <h3 className="text-sm font-medium text-gray-900 line-clamp-2 leading-snug">{product.name}</h3>
        <StarRating rating={product.ratings} count={product.numReviews} />

        <div className="flex items-center justify-between mt-auto pt-2">
          <div className="flex items-baseline gap-1.5">
            <span className="text-base font-semibold text-gray-900">{formatCurrency(product.price)}</span>
            {product.comparePrice && (
              <span className="text-xs text-gray-400 line-through">{formatCurrency(product.comparePrice)}</span>
            )}
          </div>
          <button
            onClick={handleAddToCart}
            disabled={!product.inStock}
            className="p-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ShoppingCartIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </Link>
  );
});

export default ProductCard;
