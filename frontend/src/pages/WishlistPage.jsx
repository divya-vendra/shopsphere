import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { HeartIcon } from '@heroicons/react/24/outline';
import { fetchWishlist } from '../features/wishlist/wishlistSlice';
import ProductGrid from '../components/products/ProductGrid';
import Spinner     from '../components/ui/Spinner';

export default function WishlistPage() {
  const dispatch = useDispatch();
  const { items, status } = useSelector((s) => s.wishlist);

  useEffect(() => { dispatch(fetchWishlist()); }, [dispatch]);

  if (status === 'loading' || status === 'idle') {
    return <div className="flex justify-center py-24"><Spinner size="lg" /></div>;
  }

  return (
    <div className="section">
      <div className="flex items-center gap-3 mb-8">
        <HeartIcon className="w-7 h-7 text-red-500" />
        <h1 className="text-2xl font-bold text-gray-900">
          My Wishlist <span className="text-base font-normal text-gray-400">({items.length} items)</span>
        </h1>
      </div>
      <ProductGrid products={items} status={status} />
    </div>
  );
}
