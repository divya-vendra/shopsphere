import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CurrencyDollarIcon, ShoppingBagIcon,
  UsersIcon, CubeIcon,
} from '@heroicons/react/24/outline';
import { adminApi } from '../../api/adminApi';
import StatsCard  from '../../components/admin/StatsCard';
import SalesChart from '../../components/admin/SalesChart';
import Spinner    from '../../components/ui/Spinner';
import Badge      from '../../components/ui/Badge';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate }     from '../../utils/formatDate';
import { ORDER_STATUS_COLORS } from '../../utils/constants';

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    adminApi.getAnalytics()
      .then(({ data }) => setAnalytics(data.analytics))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex justify-center py-24"><Spinner size="lg" /></div>;
  }

  return (
    <div className="section">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <div className="flex gap-3">
          <Link to="/admin/products" className="text-sm font-medium text-primary-600 hover:underline">Products</Link>
          <Link to="/admin/orders"   className="text-sm font-medium text-primary-600 hover:underline">Orders</Link>
          <Link to="/admin/users"    className="text-sm font-medium text-primary-600 hover:underline">Users</Link>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard
          title="Total Revenue" icon={CurrencyDollarIcon} color="primary"
          value={formatCurrency(analytics?.totalRevenue || 0)}
          subtitle={`${formatCurrency(analytics?.monthlyRevenue || 0)} this month`}
        />
        <StatsCard
          title="Total Orders" icon={ShoppingBagIcon} color="blue"
          value={analytics?.totalOrders || 0}
          subtitle={`${analytics?.monthlyOrders || 0} this month`}
        />
        <StatsCard
          title="Total Users" icon={UsersIcon} color="green"
          value={analytics?.totalUsers || 0}
        />
        <StatsCard
          title="Active Products" icon={CubeIcon} color="orange"
          value={analytics?.totalProducts || 0}
        />
      </div>

      {/* Sales chart */}
      <div className="mb-8">
        <SalesChart data={analytics?.salesByMonth || []} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent orders */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Recent Orders</h3>
            <Link to="/admin/orders" className="text-xs text-primary-600 hover:underline">View all</Link>
          </div>
          <div className="space-y-3">
            {analytics?.recentOrders?.map((order) => (
              <div key={order._id} className="flex items-center justify-between text-sm">
                <div>
                  <p className="font-medium text-gray-900">{order.user?.name}</p>
                  <p className="text-xs text-gray-400">{formatDate(order.createdAt)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={ORDER_STATUS_COLORS[order.orderStatus]}>{order.orderStatus}</Badge>
                  <span className="font-semibold">{formatCurrency(order.totalPrice)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top products */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Top Products</h3>
            <Link to="/admin/products" className="text-xs text-primary-600 hover:underline">View all</Link>
          </div>
          <div className="space-y-3">
            {analytics?.topProducts?.map((p, i) => (
              <div key={p._id || i} className="flex items-center gap-3 text-sm">
                <span className="text-xs font-bold text-gray-400 w-5">#{i + 1}</span>
                {p.image && <img src={p.image} alt={p.name} className="w-8 h-8 rounded-lg object-cover bg-gray-100" />}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 line-clamp-1">{p.name}</p>
                  <p className="text-xs text-gray-400">{p.totalSold} sold</p>
                </div>
                <span className="font-semibold text-gray-900">{formatCurrency(p.totalRevenue)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
