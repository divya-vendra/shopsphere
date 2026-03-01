import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMyOrders } from '../features/orders/orderSlice';
import Spinner    from '../components/ui/Spinner';
import Badge      from '../components/ui/Badge';
import Pagination from '../components/ui/Pagination';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate }     from '../utils/formatDate';
import { ORDER_STATUS_COLORS, PAYMENT_STATUS_COLORS } from '../utils/constants';

export default function OrderHistoryPage() {
  const dispatch = useDispatch();
  const { items: orders, pagination, status } = useSelector((s) => s.orders);

  useEffect(() => { dispatch(fetchMyOrders()); }, [dispatch]);

  const handlePageChange = (page) => dispatch(fetchMyOrders({ page }));

  if (status === 'loading') {
    return <div className="flex justify-center py-24"><Spinner size="lg" /></div>;
  }

  return (
    <div className="section max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Order History</h1>

      {orders.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg font-medium">No orders yet.</p>
          <Link to="/" className="text-primary-600 text-sm mt-2 inline-block hover:underline">Start shopping →</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Link key={order._id} to={`/orders/${order._id}`} className="card p-5 hover:shadow-md transition-shadow block">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="font-mono text-xs text-gray-400">#{order._id.slice(-8).toUpperCase()}</p>
                  <p className="text-sm text-gray-500 mt-0.5">{formatDate(order.createdAt)}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    {order.items?.length} item{order.items?.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <Badge className={ORDER_STATUS_COLORS[order.orderStatus]}>
                    {order.orderStatus}
                  </Badge>
                  <Badge className={PAYMENT_STATUS_COLORS[order.paymentStatus]}>
                    {order.paymentStatus}
                  </Badge>
                  <span className="font-semibold text-gray-900">{formatCurrency(order.totalPrice)}</span>
                </div>
              </div>
            </Link>
          ))}
          <div className="flex justify-center mt-6">
            <Pagination page={pagination.page} pages={pagination.pages} onPageChange={handlePageChange} />
          </div>
        </div>
      )}
    </div>
  );
}
