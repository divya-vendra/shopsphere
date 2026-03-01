import { Link } from 'react-router-dom';
import { TrashIcon, MinusIcon, PlusIcon } from '@heroicons/react/24/outline';
import { formatCurrency } from '../../utils/formatCurrency';
import useCart from '../../hooks/useCart';

export default function CartItem({ item }) {
  const { removeItem, updateItem } = useCart();
  const product = item.product;

  return (
    <div className="flex gap-4 py-4 border-b border-gray-100 last:border-0">
      <Link to={`/products/${product?.slug}`} className="flex-shrink-0">
        <img
          src={product?.images?.[0]?.url || 'https://placehold.co/80x80?text=?'}
          alt={item.name || product?.name}
          className="w-20 h-20 rounded-lg object-cover bg-gray-100"
        />
      </Link>

      <div className="flex-1 min-w-0">
        <Link to={`/products/${product?.slug}`}>
          <h4 className="text-sm font-medium text-gray-900 line-clamp-2 hover:text-primary-600 transition-colors">
            {product?.name || 'Product'}
          </h4>
        </Link>
        <p className="text-xs text-gray-500 mt-0.5">{formatCurrency(item.price)} each</p>

        <div className="flex items-center justify-between mt-3">
          {/* Quantity stepper */}
          <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() =>
                item.quantity === 1
                  ? removeItem(item._id)
                  : updateItem(item._id, item.quantity - 1)
              }
              className="p-1.5 hover:bg-gray-100 transition-colors"
            >
              {item.quantity === 1
                ? <TrashIcon className="w-3.5 h-3.5 text-red-500" />
                : <MinusIcon className="w-3.5 h-3.5 text-gray-600" />
              }
            </button>
            <span className="px-3 py-1 text-sm font-medium text-gray-900 min-w-[2rem] text-center">
              {item.quantity}
            </span>
            <button
              onClick={() => updateItem(item._id, item.quantity + 1)}
              disabled={item.quantity >= (product?.stock ?? 99)}
              className="p-1.5 hover:bg-gray-100 transition-colors disabled:opacity-40"
            >
              <PlusIcon className="w-3.5 h-3.5 text-gray-600" />
            </button>
          </div>

          <p className="text-sm font-semibold text-gray-900">
            {formatCurrency(item.price * item.quantity)}
          </p>
        </div>
      </div>
    </div>
  );
}
