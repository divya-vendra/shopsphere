const { z } = require('zod');

const shippingAddressSchema = z.object({
  fullName: z.string().trim().min(2, 'Full name is required'),
  address:  z.string().trim().min(5, 'Address is required'),
  city:     z.string().trim().min(2, 'City is required'),
  state:    z.string().trim().min(2, 'State is required'),
  zipCode:  z.string().trim().min(3, 'Zip code is required'),
  country:  z.string().trim().min(2, 'Country is required').default('US'),
});

exports.createOrderSchema = z.object({
  shippingAddress: shippingAddressSchema,
});

exports.updateOrderStatusSchema = z.object({
  orderStatus: z.enum(
    ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
    { errorMap: () => ({ message: 'Invalid order status' }) }
  ),
  trackingNumber: z.string().trim().optional(),
  notes:          z.string().trim().optional(),
});
