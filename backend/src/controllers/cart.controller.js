const Cart         = require('../models/Cart.model');
const Product      = require('../models/Product.model');
const AppError     = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

// ── GET /api/v1/cart ──────────────────────────────────────────────────────────
exports.getCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user.id })
    .populate({ path: 'items.product', select: 'name images price stock isActive slug' });

  if (!cart) {
    return res.status(200).json({
      status: 'success',
      cart:   { items: [], totalPrice: 0, itemCount: 0 },
    });
  }

  res.status(200).json({ status: 'success', cart });
});

// ── POST /api/v1/cart ─────────────────────────────────────────────────────────
// Add item or increment quantity if already in cart
exports.addToCart = asyncHandler(async (req, res, next) => {
  const { productId, quantity = 1 } = req.body;

  if (!productId) return next(new AppError('Product ID is required.', 400));
  if (quantity < 1) return next(new AppError('Quantity must be at least 1.', 400));

  // Validate product exists and is available
  const product = await Product.findById(productId);
  if (!product)       return next(new AppError('Product not found.', 404));
  if (!product.inStock) return next(new AppError('Product is out of stock.', 400));
  if (product.stock < quantity) {
    return next(new AppError(`Only ${product.stock} unit(s) available.`, 400));
  }

  let cart = await Cart.findOne({ user: req.user.id });

  if (!cart) {
    // First item — create the cart
    cart = await Cart.create({
      user:  req.user.id,
      items: [{ product: productId, quantity, price: product.price }],
    });
  } else {
    const existingIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId
    );

    if (existingIndex > -1) {
      // Item already in cart — increment quantity
      const newQty = cart.items[existingIndex].quantity + quantity;
      if (newQty > product.stock) {
        return next(new AppError(`Only ${product.stock} unit(s) available.`, 400));
      }
      cart.items[existingIndex].quantity = newQty;
      // Update price snapshot in case price changed since last add
      cart.items[existingIndex].price = product.price;
    } else {
      cart.items.push({ product: productId, quantity, price: product.price });
    }

    await cart.save();
  }

  await cart.populate({ path: 'items.product', select: 'name images price stock slug' });

  res.status(200).json({ status: 'success', cart });
});

// ── PATCH /api/v1/cart/:itemId ────────────────────────────────────────────────
// Update quantity of a specific cart item
exports.updateCartItem = asyncHandler(async (req, res, next) => {
  const { quantity } = req.body;

  if (!quantity || quantity < 1) {
    return next(new AppError('Quantity must be at least 1. To remove, use DELETE.', 400));
  }

  const cart = await Cart.findOne({ user: req.user.id });
  if (!cart) return next(new AppError('Cart not found.', 404));

  const item = cart.items.id(req.params.itemId);
  if (!item) return next(new AppError('Cart item not found.', 404));

  // Re-validate stock
  const product = await Product.findById(item.product);
  if (!product || product.stock < quantity) {
    return next(new AppError(`Only ${product?.stock ?? 0} unit(s) available.`, 400));
  }

  item.quantity = quantity;
  item.price    = product.price; // refresh price snapshot
  await cart.save();

  await cart.populate({ path: 'items.product', select: 'name images price stock slug' });
  res.status(200).json({ status: 'success', cart });
});

// ── DELETE /api/v1/cart/:itemId ───────────────────────────────────────────────
// Remove a single item from cart
exports.removeCartItem = asyncHandler(async (req, res, next) => {
  const cart = await Cart.findOne({ user: req.user.id });
  if (!cart) return next(new AppError('Cart not found.', 404));

  cart.items = cart.items.filter(
    (item) => item._id.toString() !== req.params.itemId
  );
  await cart.save();

  await cart.populate({ path: 'items.product', select: 'name images price stock slug' });
  res.status(200).json({ status: 'success', cart });
});

// ── DELETE /api/v1/cart ───────────────────────────────────────────────────────
// Clear entire cart (called after successful order creation)
exports.clearCart = asyncHandler(async (req, res) => {
  await Cart.findOneAndUpdate(
    { user: req.user.id },
    { items: [] },
    { new: true }
  );
  res.status(200).json({ status: 'success', message: 'Cart cleared.' });
});
