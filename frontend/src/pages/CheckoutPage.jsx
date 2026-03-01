import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { createOrder, createCheckoutSession } from '../features/orders/orderSlice';
import useCart from '../hooks/useCart';
import Input   from '../components/ui/Input';
import Button  from '../components/ui/Button';
import { formatCurrency } from '../utils/formatCurrency';
import toast from 'react-hot-toast';

export default function CheckoutPage() {
  const dispatch  = useDispatch();
  const { items } = useCart();
  const { status } = useSelector((s) => s.orders);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm();

  const subtotal     = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const shippingCost = subtotal >= 50 ? 0 : 9.99;
  const tax          = parseFloat((subtotal * 0.08).toFixed(2));
  const total        = parseFloat((subtotal + shippingCost + tax).toFixed(2));

  const onSubmit = async (formData) => {
    setLoading(true);
    try {
      // 1. Create order in our DB
      const orderResult = await dispatch(createOrder({ shippingAddress: formData })).unwrap();

      // 2. Create Stripe Checkout session
      const sessionResult = await dispatch(createCheckoutSession(orderResult._id)).unwrap();

      // 3. Redirect to Stripe hosted checkout
      window.location.href = sessionResult.checkoutUrl;
    } catch (err) {
      toast.error(err || 'Checkout failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="section max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Shipping form */}
        <form onSubmit={handleSubmit(onSubmit)} className="lg:col-span-3 space-y-5">
          <div className="card p-6">
            <h2 className="font-semibold text-gray-900 mb-5">Shipping Address</h2>
            <div className="space-y-4">
              <Input label="Full Name" error={errors.fullName?.message}
                {...register('fullName', { required: 'Full name is required' })} />
              <Input label="Street Address" error={errors.address?.message}
                {...register('address', { required: 'Address is required' })} />
              <div className="grid grid-cols-2 gap-4">
                <Input label="City" error={errors.city?.message}
                  {...register('city', { required: 'City is required' })} />
                <Input label="State" error={errors.state?.message}
                  {...register('state', { required: 'State is required' })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label="ZIP Code" error={errors.zipCode?.message}
                  {...register('zipCode', { required: 'ZIP code is required' })} />
                <Input label="Country" defaultValue="US" error={errors.country?.message}
                  {...register('country', { required: 'Country is required' })} />
              </div>
            </div>
          </div>

          <Button type="submit" fullWidth size="lg" loading={loading}>
            Pay with Stripe — {formatCurrency(total)}
          </Button>

          <p className="text-xs text-center text-gray-400">
            You will be securely redirected to Stripe to complete your payment.
          </p>
        </form>

        {/* Order summary */}
        <div className="lg:col-span-2 space-y-4">
          <div className="card p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Order Summary</h2>
            <div className="space-y-3 divide-y divide-gray-100">
              {items.map((item) => (
                <div key={item._id} className="flex gap-3 pt-3 first:pt-0">
                  <img
                    src={item.product?.images?.[0]?.url || 'https://placehold.co/48x48'}
                    className="w-12 h-12 rounded-lg object-cover bg-gray-100"
                    alt={item.product?.name}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-900 line-clamp-2">{item.product?.name}</p>
                    <p className="text-xs text-gray-400">Qty {item.quantity}</p>
                  </div>
                  <p className="text-xs font-semibold text-gray-900 flex-shrink-0">
                    {formatCurrency(item.price * item.quantity)}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100 space-y-2 text-sm">
              <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span className={shippingCost === 0 ? 'text-green-600' : ''}>{shippingCost === 0 ? 'FREE' : formatCurrency(shippingCost)}</span>
              </div>
              <div className="flex justify-between text-gray-600"><span>Tax (8%)</span><span>{formatCurrency(tax)}</span></div>
              <div className="flex justify-between font-bold text-gray-900 pt-2 border-t border-gray-100">
                <span>Total</span><span>{formatCurrency(total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
