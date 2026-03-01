import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchOrderById } from '../features/orders/orderSlice';
import Spinner from '../components/ui/Spinner';
import Badge   from '../components/ui/Badge';
import Button  from '../components/ui/Button';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDateTime } from '../utils/formatDate';
import { ORDER_STATUS_COLORS, PAYMENT_STATUS_COLORS } from '../utils/constants';

export default function OrderDetailPage() {
  const { id }     = useParams();
  const dispatch   = useDispatch();
  const navigate   = useNavigate();
  const { currentOrder: order, status } = useSelector((s) => s.orders);

  useEffect(() => { dispatch(fetchOrderById(id)); }, [dispatch, id]);

  if (status === 'loading' || !order) {
    return <div className="flex justify-center py-24"><Spinner size="lg" /></div>;
  }

  return (
    <div className="section max-w-3xl mx-auto">
      <button onClick={() => navigate('/orders')} className="text-sm text-primary-600 hover:underline mb-6 block">
        ← Back to Orders
      </button>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Order Details</h1>
          <p className="font-mono text-xs text-gray-400 mt-0.5">#{order._id}</p>
          <p className="text-sm text-gray-500 mt-1">{formatDateTime(order.createdAt)}</p>
        </div>
        <div className="flex gap-2">
          <Badge className={ORDER_STATUS_COLORS[order.orderStatus]}>{order.orderStatus}</Badge>
          <Badge className={PAYMENT_STATUS_COLORS[order.paymentStatus]}>{order.paymentStatus}</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Items */}
        <div className="card p-5 md:col-span-2">
          <h3 className="font-semibold text-gray-900 mb-4">Items</h3>
          <div className="divide-y divide-gray-100">
            {order.items.map((item, i) => (
              <div key={i} className="flex gap-3 py-3 first:pt-0 last:pb-0">
                {item.image && (
                  <img src={item.image} alt={item.name} className="w-14 h-14 rounded-lg object-cover bg-gray-100" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{item.name}</p>
                  <p className="text-xs text-gray-500">Qty: {item.quantity} × {formatCurrency(item.price)}</p>
                </div>
                <p className="text-sm font-semibold text-gray-900">
                  {formatCurrency(item.price * item.quantity)}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100 space-y-1.5 text-sm">
            <div className="flex justify-between text-gray-500"><span>Subtotal</span><span>{formatCurrency(order.subtotal)}</span></div>
            <div className="flex justify-between text-gray-500"><span>Shipping</span><span>{formatCurrency(order.shippingCost)}</span></div>
            <div className="flex justify-between text-gray-500"><span>Tax</span><span>{formatCurrency(order.tax)}</span></div>
            <div className="flex justify-between font-bold text-gray-900 pt-2 border-t border-gray-100">
              <span>Total</span><span>{formatCurrency(order.totalPrice)}</span>
            </div>
          </div>
        </div>

        {/* Shipping */}
        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 mb-3">Shipping Address</h3>
          <address className="text-sm text-gray-600 not-italic leading-relaxed">
            {order.shippingAddress.fullName}<br />
            {order.shippingAddress.address}<br />
            {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}<br />
            {order.shippingAddress.country}
          </address>
        </div>

        {/* Payment */}
        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 mb-3">Payment</h3>
          <div className="text-sm text-gray-600 space-y-1">
            <p>Method: <span className="capitalize">{order.paymentMethod}</span></p>
            {order.paidAt && <p>Paid: {formatDateTime(order.paidAt)}</p>}
            {order.trackingNumber && <p>Tracking: <span className="font-mono">{order.trackingNumber}</span></p>}
          </div>
        </div>
      </div>

      <Button variant="secondary" onClick={() => navigate('/')}>Continue Shopping</Button>
    </div>
  );
}
