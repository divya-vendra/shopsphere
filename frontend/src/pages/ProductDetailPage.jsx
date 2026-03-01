import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { HeartIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolid } from '@heroicons/react/24/solid';
import { ShoppingCartIcon, MinusIcon, PlusIcon } from '@heroicons/react/24/outline';
import { fetchProductBySlug, clearCurrentProduct } from '../features/products/productSlice';
import { addItem } from '../features/cart/cartSlice';
import { toggleWishlist, fetchWishlist } from '../features/wishlist/wishlistSlice';
import { reviewApi } from '../api/reviewApi';
import useAuth from '../hooks/useAuth';
import StarRating from '../components/products/StarRating';
import Button     from '../components/ui/Button';
import Spinner    from '../components/ui/Spinner';
import Badge      from '../components/ui/Badge';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate } from '../utils/formatDate';
import toast from 'react-hot-toast';

export default function ProductDetailPage() {
  const { slug }   = useParams();
  const dispatch   = useDispatch();
  const navigate   = useNavigate();
  const { isAuthenticated } = useAuth();

  const { currentProduct: product, status } = useSelector((s) => s.products);
  const wishlistItems = useSelector((s) => s.wishlist.items);
  const inWishlist    = wishlistItems.some((p) => p._id === product?._id);

  const [quantity,     setQuantity]     = useState(1);
  const [activeImage,  setActiveImage]  = useState(0);
  const [reviews,      setReviews]      = useState([]);
  const [reviewForm,   setReviewForm]   = useState({ rating: 0, title: '', body: '' });
  const [submitting,   setSubmitting]   = useState(false);

  useEffect(() => {
    dispatch(fetchProductBySlug(slug));
    if (isAuthenticated) dispatch(fetchWishlist());
    return () => dispatch(clearCurrentProduct());
  }, [dispatch, slug, isAuthenticated]);

  useEffect(() => {
    if (product?._id) {
      reviewApi.getByProduct(product._id).then(({ data }) => setReviews(data.reviews));
    }
  }, [product?._id]);

  const handleAddToCart = () => {
    dispatch(addItem({ productId: product._id, quantity }));
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewForm.rating) return toast.error('Please select a rating.');
    setSubmitting(true);
    try {
      await reviewApi.create({ ...reviewForm, productId: product._id });
      toast.success('Review submitted!');
      setReviewForm({ rating: 0, title: '', body: '' });
      const { data } = await reviewApi.getByProduct(product._id);
      setReviews(data.reviews);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review.');
    } finally {
      setSubmitting(false);
    }
  };

  if (status === 'loading') {
    return <div className="flex justify-center py-24"><Spinner size="lg" /></div>;
  }
  if (!product && status === 'failed') {
    return (
      <div className="section text-center py-24">
        <h2 className="text-xl font-semibold text-gray-700">Product not found.</h2>
        <Button className="mt-4" onClick={() => navigate('/')}>Back to Shop</Button>
      </div>
    );
  }
  if (!product) return null;

  const discountPct = product.comparePrice
    ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
    : 0;

  return (
    <div className="section">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-400 mb-6">
        <button onClick={() => navigate('/')} className="hover:text-primary-600">Shop</button>
        <span className="mx-2">/</span>
        <span className="text-gray-700">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-14">
        {/* Images */}
        <div className="space-y-3">
          <div className="aspect-square rounded-2xl overflow-hidden bg-gray-100">
            <img
              src={product.images?.[activeImage]?.url || 'https://placehold.co/600x600?text=No+Image'}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>
          {product.images?.length > 1 && (
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                    i === activeImage ? 'border-primary-600' : 'border-transparent'
                  }`}
                >
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="space-y-5">
          <div>
            <p className="text-sm text-gray-400 uppercase tracking-wide mb-1">{product.brand}</p>
            <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
            <div className="flex items-center gap-3 mt-2">
              <StarRating rating={product.ratings} count={product.numReviews} size="md" />
              {product.inStock
                ? <Badge className="bg-green-100 text-green-700">In Stock ({product.stock})</Badge>
                : <Badge className="bg-red-100 text-red-700">Out of Stock</Badge>
              }
            </div>
          </div>

          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold text-gray-900">{formatCurrency(product.price)}</span>
            {product.comparePrice && (
              <>
                <span className="text-lg text-gray-400 line-through">{formatCurrency(product.comparePrice)}</span>
                <Badge className="bg-red-100 text-red-700">Save {discountPct}%</Badge>
              </>
            )}
          </div>

          <p className="text-gray-600 text-sm leading-relaxed">{product.description}</p>

          {product.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {product.tags.map((t) => (
                <span key={t} className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">{t}</span>
              ))}
            </div>
          )}

          {/* Quantity + CTA */}
          {product.inStock && (
            <div className="flex items-center gap-4">
              <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="p-2.5 hover:bg-gray-100 transition-colors"
                >
                  <MinusIcon className="w-4 h-4 text-gray-600" />
                </button>
                <span className="px-4 py-2 text-sm font-semibold text-gray-900 min-w-[3rem] text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                  className="p-2.5 hover:bg-gray-100 transition-colors"
                >
                  <PlusIcon className="w-4 h-4 text-gray-600" />
                </button>
              </div>
              <Button size="lg" className="flex-1" onClick={handleAddToCart}>
                <ShoppingCartIcon className="w-5 h-5" />
                Add to Cart
              </Button>
              {isAuthenticated && (
                <button
                  onClick={() => dispatch(toggleWishlist(product._id))}
                  className="p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {inWishlist
                    ? <HeartSolid className="w-5 h-5 text-red-500" />
                    : <HeartIcon  className="w-5 h-5 text-gray-500" />}
                </button>
              )}
            </div>
          )}

          {/* Meta */}
          <div className="text-xs text-gray-400 space-y-1 pt-2 border-t border-gray-100">
            <p>Category: <span className="text-gray-600">{product.category}</span></p>
            <p>SKU: <span className="text-gray-600">{product._id}</span></p>
          </div>
        </div>
      </div>

      {/* Reviews */}
      <div className="max-w-2xl">
        <h2 className="text-xl font-bold text-gray-900 mb-6">
          Customer Reviews ({product.numReviews})
        </h2>

        {/* Write review */}
        {isAuthenticated ? (
          <form onSubmit={handleSubmitReview} className="card p-6 mb-8 space-y-4">
            <h3 className="font-semibold text-gray-800">Write a Review</h3>
            <div>
              <label className="label">Your Rating</label>
              <StarRating
                rating={reviewForm.rating} size="lg" interactive
                onChange={(r) => setReviewForm((f) => ({ ...f, rating: r }))}
              />
            </div>
            <input
              value={reviewForm.title}
              onChange={(e) => setReviewForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Review title"
              className="w-full text-sm rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            />
            <textarea
              value={reviewForm.body}
              onChange={(e) => setReviewForm((f) => ({ ...f, body: e.target.value }))}
              placeholder="Share your experience with this product..."
              rows={3}
              className="w-full text-sm rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              required
            />
            <Button type="submit" loading={submitting} size="sm">Submit Review</Button>
          </form>
        ) : (
          <p className="text-sm text-gray-500 mb-8">
            <button onClick={() => navigate('/login')} className="text-primary-600 hover:underline">Sign in</button> to write a review.
          </p>
        )}

        {/* Review list */}
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review._id} className="card p-5">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold text-xs">
                    {review.user?.name?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{review.user?.name}</p>
                    {review.verified && (
                      <span className="text-xs text-green-600">✓ Verified Purchase</span>
                    )}
                  </div>
                </div>
                <span className="text-xs text-gray-400">{formatDate(review.createdAt)}</span>
              </div>
              <StarRating rating={review.rating} size="sm" />
              <p className="font-medium text-gray-900 text-sm mt-2">{review.title}</p>
              <p className="text-gray-600 text-sm mt-1">{review.body}</p>
            </div>
          ))}
          {reviews.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-8">No reviews yet. Be the first!</p>
          )}
        </div>
      </div>
    </div>
  );
}
