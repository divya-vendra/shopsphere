import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import AppRouter from './routes/AppRouter';
import { fetchCart } from './features/cart/cartSlice';
import { loadUser } from './features/auth/authSlice';

export default function App() {
  const dispatch = useDispatch();

  // On mount, rehydrate auth state from localStorage and fetch cart
  // if the user is already logged in (persisted token).
  useEffect(() => {
    dispatch(loadUser());
  }, [dispatch]);

  return <AppRouter />;
}
