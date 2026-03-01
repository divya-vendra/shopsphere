import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { ShoppingBagIcon } from '@heroicons/react/24/outline';
import { fetchCart } from '../features/cart/cartSlice';
import useCart from '../hooks/useCart';
import useAuth from '../hooks/useAuth';
import CartItem    from '../components/cart/CartItem';
import CartSummary from '../components/cart/CartSummary';
import Button      from '../components/ui/Button';
import Spinner     from '../components/ui/Spinner';

export default function CartPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { items, isLoading } = useCart();

  useEffect(() => {
    if (isAuthenticated) dispatch(fetchCart());
  }, [dispatch, isAuthenticated]);

  if (isLoading) {
    return <div className="flex justify-center py-24"><Spinner size="lg" /></div>;
  }

  if (items.length === 0) {
    return (
      <div className="section flex flex-col items-center justify-center py-24 text-center">
        <ShoppingBagIcon className="w-20 h-20 text-gray-200 mb-4" />
        <h2 className="text-xl font-semibold text-gray-700">Your cart is empty</h2>
        <p className="text-gray-400 mt-2 mb-6">Add some products to get started.</p>
        <Button onClick={() => navigate('/')}>Continue Shopping</Button>
      </div>
    );
  }

  return (
    <div className="section">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">
        Shopping Cart <span className="text-base font-normal text-gray-400">({items.length} item{items.length !== 1 ? 's' : ''})</span>
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 card p-6">
          {items.map((item) => (
            <CartItem key={item._id} item={item} />
          ))}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
              ← Continue Shopping
            </Button>
          </div>
        </div>

        <div>
          <CartSummary
            items={items}
            onCheckout={() => isAuthenticated ? navigate('/checkout') : navigate('/login', { state: { from: { pathname: '/checkout' } } })}
          />
        </div>
      </div>
    </div>
  );
}
