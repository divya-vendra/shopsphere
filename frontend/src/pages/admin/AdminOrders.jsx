import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAllOrders, updateOrderStatus } from '../../features/orders/orderSlice';
import Modal   from '../../components/ui/Modal';
import Button  from '../../components/ui/Button';
import Badge   from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';
import Pagination from '../../components/ui/Pagination';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate }     from '../../utils/formatDate';
import { ORDER_STATUS_COLORS, PAYMENT_STATUS_COLORS, ORDER_STATUSES } from '../../utils/constants';
import { paymentApi } from '../../api/paymentApi';
import toast from 'react-hot-toast';

export default function AdminOrders() {
  const dispatch = useDispatch();
  const { items: orders, pagination, status } = useSelector((s) => s.orders);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [newStatus,     setNewStatus]     = useState('');
  const [tracking,      setTracking]      = useState('');
  const [updating,      setUpdating]      = useState(false);
  const [filterStatus,  setFilterStatus]  = useState('');

  useEffect(() => {
    dispatch(fetchAllOrders({ orderStatus: filterStatus || undefined }));
  }, [dispatch, filterStatus]);

  const handleStatusUpdate = async () => {
    if (!newStatus) return;
    setUpdating(true);
    await dispatch(updateOrderStatus({
      id:   selectedOrder._id,
      data: { orderStatus: newStatus, trackingNumber: tracking || undefined },
    }));
    setUpdating(false);
    setSelectedOrder(null);
  };

  return (
    <div className="section">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="text-sm rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">All Statuses</option>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
      </div>

      {status === 'loading' ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : (
        <>
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                <tr>
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Payment</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map((order) => (
                  <tr key={order._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">
                      #{order._id.slice(-8).toUpperCase()}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{order.user?.name}</p>
                      <p className="text-xs text-gray-400">{order.user?.email}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{formatDate(order.createdAt)}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{formatCurrency(order.totalPrice)}</td>
                    <td className="px-4 py-3">
                      <Badge className={PAYMENT_STATUS_COLORS[order.paymentStatus]}>
                        {order.paymentStatus}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={ORDER_STATUS_COLORS[order.orderStatus]}>
                        {order.orderStatus}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-3">
                        <button
                          onClick={() => { setSelectedOrder(order); setNewStatus(order.orderStatus); setTracking(order.trackingNumber || ''); }}
                          className="text-xs font-medium text-primary-600 hover:underline"
                        >
                          Update
                        </button>
                        {order.paymentStatus === 'paid' && (
                          <button
                            onClick={async () => {
                              if (!window.confirm(`Issue full refund for order #${order._id.slice(-8).toUpperCase()}?`)) return;
                              try {
                                await paymentApi.createRefund(order._id, undefined, 'requested_by_customer');
                                toast.success('Refund issued successfully.');
                                dispatch(fetchAllOrders({ orderStatus: filterStatus || undefined }));
                              } catch (err) {
                                toast.error(err.response?.data?.message || 'Refund failed.');
                              }
                            }}
                            className="text-xs font-medium text-red-600 hover:underline"
                          >
                            Refund
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-center mt-6">
            <Pagination
              page={pagination.page} pages={pagination.pages}
              onPageChange={(p) => dispatch(fetchAllOrders({ page: p, orderStatus: filterStatus || undefined }))}
            />
          </div>
        </>
      )}

      {/* Update status modal */}
      <Modal
        isOpen={!!selectedOrder} onClose={() => setSelectedOrder(null)}
        title={`Update Order #${selectedOrder?._id?.slice(-8).toUpperCase()}`}
      >
        <div className="space-y-4">
          <div>
            <label className="label">Order Status</label>
            <select
              value={newStatus} onChange={(e) => setNewStatus(e.target.value)}
              className="w-full text-sm rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {ORDER_STATUSES.map((s) => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Tracking Number (optional)</label>
            <input
              value={tracking} onChange={(e) => setTracking(e.target.value)}
              placeholder="e.g. 1Z999AA10123456784"
              className="w-full text-sm rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setSelectedOrder(null)}>Cancel</Button>
            <Button onClick={handleStatusUpdate} loading={updating}>Save Changes</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
