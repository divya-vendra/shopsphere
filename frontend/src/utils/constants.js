export const CATEGORIES = [
  'Electronics', 'Clothing', 'Footwear', 'Home & Garden',
  'Sports', 'Beauty', 'Books', 'Toys', 'Automotive', 'Other',
];

export const ORDER_STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

export const ORDER_STATUS_COLORS = {
  pending:    'bg-yellow-100 text-yellow-800',
  processing: 'bg-blue-100 text-blue-800',
  shipped:    'bg-purple-100 text-purple-800',
  delivered:  'bg-green-100 text-green-800',
  cancelled:  'bg-red-100 text-red-800',
};

export const PAYMENT_STATUS_COLORS = {
  pending:  'bg-yellow-100 text-yellow-800',
  paid:     'bg-green-100 text-green-800',
  failed:   'bg-red-100 text-red-800',
  refunded: 'bg-gray-100 text-gray-800',
};

export const ITEMS_PER_PAGE = 12;
