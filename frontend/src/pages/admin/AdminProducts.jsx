import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { fetchAdminProducts, deleteProduct } from '../../features/products/productSlice';
import Modal   from '../../components/ui/Modal';
import Button  from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import Pagination from '../../components/ui/Pagination';
import { formatCurrency } from '../../utils/formatCurrency';
import { productApi } from '../../api/productApi';
import { CATEGORIES } from '../../utils/constants';
import toast from 'react-hot-toast';

const emptyForm = {
  name: '', description: '', price: '', comparePrice: '',
  category: CATEGORIES[0], brand: '', stock: '', tags: '', isFeatured: false,
};

export default function AdminProducts() {
  const dispatch = useDispatch();
  const { items: products, pagination, status } = useSelector((s) => s.products);

  const [showModal,  setShowModal]  = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form,       setForm]       = useState(emptyForm);
  const [images,     setImages]     = useState([]);
  const [saving,     setSaving]     = useState(false);

  useEffect(() => {
    dispatch(fetchAdminProducts({ limit: 20 }));
  }, [dispatch]);

  const openCreate = () => { setEditTarget(null); setForm(emptyForm); setImages([]); setShowModal(true); };
  const openEdit   = (p)  => {
    setEditTarget(p);
    setForm({
      name: p.name, description: p.description, price: p.price,
      comparePrice: p.comparePrice || '', category: p.category,
      brand: p.brand, stock: p.stock,
      tags: p.tags?.join(', ') || '', isFeatured: p.isFeatured,
    });
    setImages([]);
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (k === 'tags') fd.append(k, v.split(',').map((t) => t.trim()).filter(Boolean));
        else fd.append(k, v);
      });
      images.forEach((file) => fd.append('images', file));

      if (editTarget) {
        await productApi.update(editTarget._id, fd);
        toast.success('Product updated.');
      } else {
        await productApi.create(fd);
        toast.success('Product created.');
      }
      setShowModal(false);
      dispatch(fetchAdminProducts({ limit: 20 }));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id) => {
    if (window.confirm('Soft-delete this product?')) dispatch(deleteProduct(id));
  };

  const f = (k) => (e) => setForm((prev) => ({
    ...prev, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value,
  }));

  const inputCls = 'w-full text-sm rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500';
  const labelCls = 'block text-sm font-medium text-gray-700 mb-1';

  return (
    <div className="section">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Products</h1>
        <Button onClick={openCreate} size="sm">
          <PlusIcon className="w-4 h-4" /> Add Product
        </Button>
      </div>

      {status === 'loading' ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : (
        <>
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                <tr>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Stock</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.map((p) => (
                  <tr key={p._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img src={p.images?.[0]?.url} alt={p.name}
                          className="w-10 h-10 rounded-lg object-cover bg-gray-100" />
                        <div>
                          <p className="font-medium text-gray-900 line-clamp-1">{p.name}</p>
                          <p className="text-xs text-gray-400">{p.brand}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{p.category}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{formatCurrency(p.price)}</td>
                    <td className="px-4 py-3">
                      <span className={`font-medium ${p.stock < 10 ? 'text-red-600' : 'text-green-600'}`}>
                        {p.stock}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(p)}
                          className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors">
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(p._id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-center mt-6">
            <Pagination
              page={pagination.page} pages={pagination.pages}
              onPageChange={(p) => dispatch(fetchAdminProducts({ limit: 20, page: p }))}
            />
          </div>
        </>
      )}

      {/* Create / Edit Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)}
        title={editTarget ? 'Edit Product' : 'Add Product'} size="lg">
        <form onSubmit={handleSave} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className={labelCls}>Product Name *</label>
            <input className={inputCls} value={form.name} onChange={f('name')} required />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Description *</label>
            <textarea className={inputCls} value={form.description} onChange={f('description')} rows={3} required />
          </div>
          <div>
            <label className={labelCls}>Price *</label>
            <input type="number" min="0" step="0.01" className={inputCls} value={form.price} onChange={f('price')} required />
          </div>
          <div>
            <label className={labelCls}>Compare Price</label>
            <input type="number" min="0" step="0.01" className={inputCls} value={form.comparePrice} onChange={f('comparePrice')} />
          </div>
          <div>
            <label className={labelCls}>Category *</label>
            <select className={inputCls} value={form.category} onChange={f('category')}>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Brand *</label>
            <input className={inputCls} value={form.brand} onChange={f('brand')} required />
          </div>
          <div>
            <label className={labelCls}>Stock *</label>
            <input type="number" min="0" className={inputCls} value={form.stock} onChange={f('stock')} required />
          </div>
          <div>
            <label className={labelCls}>Tags (comma separated)</label>
            <input className={inputCls} value={form.tags} onChange={f('tags')} placeholder="tag1, tag2" />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Images {editTarget ? '(leave empty to keep existing)' : '*'}</label>
            <input type="file" multiple accept="image/*"
              onChange={(e) => setImages(Array.from(e.target.files))}
              className="w-full text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:bg-primary-50 file:text-primary-700"
            />
          </div>
          <div className="sm:col-span-2 flex items-center gap-2">
            <input type="checkbox" id="isFeatured" checked={form.isFeatured} onChange={f('isFeatured')} className="rounded" />
            <label htmlFor="isFeatured" className="text-sm text-gray-700">Featured product</label>
          </div>
          <div className="sm:col-span-2 flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>{editTarget ? 'Save Changes' : 'Create Product'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
