import { formatCurrency } from '../../utils/formatCurrency';
import Button from '../ui/Button';

export default function CartSummary({ items, onCheckout, loading }) {
  const subtotal     = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const shippingCost = subtotal >= 50 ? 0 : 9.99;
  const tax          = parseFloat((subtotal * 0.08).toFixed(2));
  const total        = parseFloat((subtotal + shippingCost + tax).toFixed(2));

  return (
    <div className="card p-6 space-y-4">
      <h3 className="font-semibold text-gray-900">Order Summary</h3>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between text-gray-600">
          <span>Subtotal ({items.length} item{items.length !== 1 ? 's' : ''})</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
        <div className="flex justify-between text-gray-600">
          <span>Shipping</span>
          <span className={shippingCost === 0 ? 'text-green-600 font-medium' : ''}>
            {shippingCost === 0 ? 'FREE' : formatCurrency(shippingCost)}
          </span>
        </div>
        <div className="flex justify-between text-gray-600">
          <span>Tax (8%)</span>
          <span>{formatCurrency(tax)}</span>
        </div>
        {shippingCost > 0 && (
          <p className="text-xs text-primary-600">
            Add {formatCurrency(50 - subtotal)} more for free shipping
          </p>
        )}
      </div>

      <div className="divider" />

      <div className="flex justify-between font-semibold text-gray-900">
        <span>Total</span>
        <span className="text-lg">{formatCurrency(total)}</span>
      </div>

      <Button fullWidth onClick={onCheckout} loading={loading} size="lg">
        Proceed to Checkout
      </Button>

      <p className="text-xs text-gray-400 text-center flex items-center justify-center gap-1">
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
        </svg>
        Secure checkout powered by Stripe
      </p>
    </div>
  );
}
