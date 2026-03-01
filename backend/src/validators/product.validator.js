const { z } = require('zod');

const CATEGORIES = [
  'Electronics', 'Clothing', 'Footwear', 'Home & Garden',
  'Sports', 'Beauty', 'Books', 'Toys', 'Automotive', 'Other',
];

exports.createProductSchema = z.object({
  name: z
    .string({ required_error: 'Product name is required' })
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(200, 'Name cannot exceed 200 characters'),

  description: z
    .string({ required_error: 'Description is required' })
    .trim()
    .min(10, 'Description must be at least 10 characters')
    .max(2000, 'Description cannot exceed 2000 characters'),

  price: z
    .number({ required_error: 'Price is required', invalid_type_error: 'Price must be a number' })
    .min(0, 'Price cannot be negative'),

  comparePrice: z
    .number({ invalid_type_error: 'Compare price must be a number' })
    .min(0, 'Compare price cannot be negative')
    .optional()
    .nullable(),

  category: z
    .enum(CATEGORIES, { errorMap: () => ({ message: 'Invalid category' }) }),

  brand: z
    .string({ required_error: 'Brand is required' })
    .trim()
    .min(1, 'Brand is required')
    .max(100, 'Brand cannot exceed 100 characters'),

  stock: z
    .number({ required_error: 'Stock is required', invalid_type_error: 'Stock must be a number' })
    .int('Stock must be an integer')
    .min(0, 'Stock cannot be negative'),

  tags: z.array(z.string().trim().toLowerCase()).optional(),

  isFeatured: z.boolean().optional(),
});

exports.updateProductSchema = exports.createProductSchema.partial();

exports.reviewSchema = z.object({
  rating: z
    .number({ required_error: 'Rating is required', invalid_type_error: 'Rating must be a number' })
    .int('Rating must be a whole number')
    .min(1, 'Rating must be at least 1')
    .max(5, 'Rating cannot exceed 5'),

  title: z
    .string({ required_error: 'Review title is required' })
    .trim()
    .min(3, 'Title must be at least 3 characters')
    .max(100, 'Title cannot exceed 100 characters'),

  body: z
    .string({ required_error: 'Review body is required' })
    .trim()
    .min(10, 'Review must be at least 10 characters')
    .max(1000, 'Review cannot exceed 1000 characters'),
});
