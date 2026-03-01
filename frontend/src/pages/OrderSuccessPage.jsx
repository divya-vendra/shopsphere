import { useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { verifyPayment } from '../features/orders/orderSlice';
import Spinner from '../components/ui/Spinner';
import Button  from '../components/ui/Button';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate } from '../utils/formatDate';

export default function OrderSuccessPage() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const dispatch  = useDispatch();
  const { currentOrder, status } = useSelector((s) => s.orders);

  useEffect(() => {
    if (sessionId) dispatch(verifyPayment(sessionId));
  }, [dispatch, sessionId]);

  if (status === 'loading' || (!currentOrder && status !== 'failed')) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="text-center">
          <Spinner size="lg" className="mx-auto mb-4" />
          <p className="text-gray-500 text-sm">Confirming your payment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="section max-w-lg mx-auto py-16 text-center">
      <CheckCircleIcon className="w-20 h-20 text-green-500 mx-auto mb-6" />
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Confirmed!</h1>
      <p className="text-gray-500 mb-8">
        Thank you for your purchase. A confirmation email has been sent to you.
      </p>

      {currentOrder && (
        <div className="card p-6 text-left mb-8">
          <div className="flex justify-between text-sm mb-4">
            <span className="text-gray-500">Order ID</span>
            <span className="font-mono text-xs text-gray-700">{currentOrder._id}</span>
          </div>
          <div className="flex justify-between text-sm mb-4">
            <span className="text-gray-500">Date</span>
            <span className="text-gray-700">{formatDate(currentOrder.createdAt)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Total</span>
            <span className="font-semibold text-gray-900">{formatCurrency(currentOrder.totalPrice)}</span>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
            {currentOrder.items?.map((item, i) => (
              <div key={i} className="flex justify-between text-sm text-gray-600">
                <span className="line-clamp-1">{item.name} × {item.quantity}</span>
                <span>{formatCurrency(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-3 justify-center">
        <Button variant="secondary" onClick={() => {}}>
          <Link to="/orders">View Orders</Link>
        </Button>
        <Button>
          <Link to="/">Continue Shopping</Link>
        </Button>
      </div>
    </div>
  );
}
