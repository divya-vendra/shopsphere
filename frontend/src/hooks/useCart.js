import { useSelector, useDispatch } from 'react-redux';
import { addItem, removeItem, updateItem } from '../features/cart/cartSlice';

export default function useCart() {
  const dispatch = useDispatch();
  const { items, status } = useSelector((state) => state.cart);

  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const itemCount  = items.reduce((sum, item) => sum + item.quantity, 0);

  return {
    items,
    totalPrice,
    itemCount,
    isLoading: status === 'loading',
    addItem:    (productId, quantity) => dispatch(addItem({ productId, quantity })),
    removeItem: (itemId) => dispatch(removeItem(itemId)),
    updateItem: (itemId, quantity) => dispatch(updateItem({ itemId, quantity })),
  };
}
