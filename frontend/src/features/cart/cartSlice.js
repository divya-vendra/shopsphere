import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { cartApi } from '../../api/cartApi';
import toast from 'react-hot-toast';

export const fetchCart = createAsyncThunk(
  'cart/fetch',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await cartApi.getCart();
      return data.cart;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load cart');
    }
  }
);

export const addItem = createAsyncThunk(
  'cart/addItem',
  async ({ productId, quantity = 1 }, { rejectWithValue }) => {
    try {
      const { data } = await cartApi.addItem(productId, quantity);
      return data.cart;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to add item');
    }
  }
);

export const updateItem = createAsyncThunk(
  'cart/updateItem',
  async ({ itemId, quantity }, { rejectWithValue }) => {
    try {
      const { data } = await cartApi.updateItem(itemId, quantity);
      return data.cart;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to update item');
    }
  }
);

export const removeItem = createAsyncThunk(
  'cart/removeItem',
  async (itemId, { rejectWithValue }) => {
    try {
      const { data } = await cartApi.removeItem(itemId);
      return data.cart;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to remove item');
    }
  }
);

export const clearCart = createAsyncThunk(
  'cart/clear',
  async (_, { rejectWithValue }) => {
    try {
      await cartApi.clearCart();
      return { items: [] };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message);
    }
  }
);

const syncCart = (state, cart) => {
  state.items      = cart.items      ?? [];
  state.totalPrice = cart.totalPrice ?? 0;
  state.itemCount  = cart.itemCount  ?? 0;
};

const cartSlice = createSlice({
  name: 'cart',
  initialState: {
    items:      [],
    totalPrice: 0,
    itemCount:  0,
    status:     'idle',
    error:      null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCart.pending,  (state) => { state.status = 'loading'; })
      .addCase(fetchCart.fulfilled, (state, { payload }) => {
        state.status = 'succeeded';
        syncCart(state, payload);
      })
      .addCase(fetchCart.rejected, (state, { payload }) => {
        state.status = 'failed';
        state.error  = payload;
      })
      .addCase(addItem.pending,  (state) => { state.status = 'loading'; })
      .addCase(addItem.fulfilled, (state, { payload }) => {
        state.status = 'succeeded';
        syncCart(state, payload);
        toast.success('Added to cart!');
      })
      .addCase(addItem.rejected, (_, { payload }) => { toast.error(payload); })
      .addCase(updateItem.fulfilled, (state, { payload }) => { syncCart(state, payload); })
      .addCase(updateItem.rejected,  (_, { payload }) => { toast.error(payload); })
      .addCase(removeItem.fulfilled, (state, { payload }) => {
        syncCart(state, payload);
        toast.success('Item removed.');
      })
      .addCase(removeItem.rejected, (_, { payload }) => { toast.error(payload); })
      .addCase(clearCart.fulfilled, (state) => {
        state.items      = [];
        state.totalPrice = 0;
        state.itemCount  = 0;
      });
  },
});

export default cartSlice.reducer;
