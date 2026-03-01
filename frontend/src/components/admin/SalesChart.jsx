import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import { formatCurrency } from '../../utils/formatCurrency';

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg px-4 py-3 text-sm">
      <p className="font-medium text-gray-700 mb-1">{label}</p>
      <p className="text-primary-600">{formatCurrency(payload[0].value)}</p>
      <p className="text-gray-500">{payload[1]?.value} orders</p>
    </div>
  );
};

export default function SalesChart({ data = [] }) {
  const chartData = data.map((d) => ({
    month:   `${MONTH_NAMES[d._id.month - 1]} ${d._id.year}`,
    revenue: parseFloat(d.revenue.toFixed(2)),
    orders:  d.orders,
  }));

  return (
    <div className="card p-6">
      <h3 className="font-semibold text-gray-900 mb-6">Revenue (Last 12 Months)</h3>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} />
          <YAxis
            tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
            tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone" dataKey="revenue" name="Revenue"
            stroke="#6366f1" strokeWidth={2}
            fill="url(#revenueGrad)"
          />
          <Area
            type="monotone" dataKey="orders" name="Orders"
            stroke="#fb923c" strokeWidth={2} fill="none"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
