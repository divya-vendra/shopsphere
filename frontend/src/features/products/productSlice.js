import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { productApi } from '../../api/productApi';
import { adminApi } from '../../api/adminApi';
import toast from 'react-hot-toast';

export const fetchProducts = createAsyncThunk(
  'products/fetchAll',
  async (params, { rejectWithValue }) => {
    try {
      const { data } = await productApi.getAll(params);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load products');
    }
  }
);

/** Fetches all products for admin (including inactive). Use on admin products page only. */
export const fetchAdminProducts = createAsyncThunk(
  'products/fetchAdminAll',
  async (params, { rejectWithValue }) => {
    try {
      const { data } = await adminApi.getProducts(params);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load products');
    }
  }
);

export const fetchFeaturedProducts = createAsyncThunk(
  'products/fetchFeatured',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await productApi.getFeatured();
      return data.products;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load featured products');
    }
  }
);

export const fetchProductBySlug = createAsyncThunk(
  'products/fetchBySlug',
  async (slug, { rejectWithValue }) => {
    try {
      const { data } = await productApi.getBySlug(slug);
      return data.product;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Product not found');
    }
  }
);

export const createProduct = createAsyncThunk(
  'products/create',
  async (formData, { rejectWithValue }) => {
    try {
      const { data } = await productApi.create(formData);
      return data.product;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to create product');
    }
  }
);

export const updateProduct = createAsyncThunk(
  'products/update',
  async ({ id, formData }, { rejectWithValue }) => {
    try {
      const { data } = await productApi.update(id, formData);
      return data.product;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to update product');
    }
  }
);

export const deleteProduct = createAsyncThunk(
  'products/delete',
  async (id, { rejectWithValue }) => {
    try {
      await productApi.delete(id);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to delete product');
    }
  }
);

const productSlice = createSlice({
  name: 'products',
  initialState: {
    items:         [],
    featured:      [],
    currentProduct: null,
    pagination:    { total: 0, page: 1, pages: 1 },
    status:        'idle',
    error:         null,
  },
  reducers: {
    clearCurrentProduct(state) { state.currentProduct = null; },
    clearError(state)          { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      // fetchProducts
      .addCase(fetchProducts.pending,   (state) => { state.status = 'loading'; })
      .addCase(fetchProducts.fulfilled, (state, { payload }) => {
        state.status     = 'succeeded';
        state.items      = payload.products;
        state.pagination = { total: payload.total, page: payload.page, pages: payload.pages };
      })
      .addCase(fetchProducts.rejected,  (state, { payload }) => {
        state.status = 'failed';
        state.error  = payload;
      })
      // fetchAdminProducts (same state shape as fetchProducts)
      .addCase(fetchAdminProducts.pending,   (state) => { state.status = 'loading'; })
      .addCase(fetchAdminProducts.fulfilled, (state, { payload }) => {
        state.status     = 'succeeded';
        state.items      = payload.products;
        state.pagination = { total: payload.total, page: payload.page, pages: payload.pages };
      })
      .addCase(fetchAdminProducts.rejected,  (state, { payload }) => {
        state.status = 'failed';
        state.error  = payload;
      })
      // fetchFeatured
      .addCase(fetchFeaturedProducts.fulfilled, (state, { payload }) => {
        state.featured = payload;
      })
      // fetchBySlug
      .addCase(fetchProductBySlug.pending,   (state) => { state.status = 'loading'; state.currentProduct = null; })
      .addCase(fetchProductBySlug.fulfilled, (state, { payload }) => {
        state.status         = 'succeeded';
        state.currentProduct = payload;
      })
      .addCase(fetchProductBySlug.rejected,  (state, { payload }) => {
        state.status = 'failed';
        state.error  = payload;
      })
      // createProduct
      .addCase(createProduct.fulfilled, (state, { payload }) => {
        state.items.unshift(payload);
        toast.success('Product created successfully.');
      })
      .addCase(createProduct.rejected, (_, { payload }) => { toast.error(payload); })
      // updateProduct
      .addCase(updateProduct.fulfilled, (state, { payload }) => {
        const idx = state.items.findIndex((p) => p._id === payload._id);
        if (idx !== -1) state.items[idx] = payload;
        if (state.currentProduct?._id === payload._id) state.currentProduct = payload;
        toast.success('Product updated successfully.');
      })
      .addCase(updateProduct.rejected, (_, { payload }) => { toast.error(payload); })
      // deleteProduct
      .addCase(deleteProduct.fulfilled, (state, { payload }) => {
        state.items = state.items.filter((p) => p._id !== payload);
        toast.success('Product deleted.');
      })
      .addCase(deleteProduct.rejected, (_, { payload }) => { toast.error(payload); });
  },
});

export const { clearCurrentProduct, clearError } = productSlice.actions;
export default productSlice.reducer;
