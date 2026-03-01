import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { wishlistApi } from '../../api/wishlistApi';
import toast from 'react-hot-toast';

export const fetchWishlist = createAsyncThunk(
  'wishlist/fetch',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await wishlistApi.get();
      return data.wishlist.products ?? [];
    } catch (err) {
      return rejectWithValue(err.response?.data?.message);
    }
  }
);

export const toggleWishlist = createAsyncThunk(
  'wishlist/toggle',
  async (productId, { getState, rejectWithValue }) => {
    const inWishlist = getState().wishlist.items.some((p) => p._id === productId);
    try {
      if (inWishlist) {
        await wishlistApi.remove(productId);
        return { productId, action: 'removed' };
      } else {
        const { data } = await wishlistApi.add(productId);
        return { productId, action: 'added', products: data.wishlist.products };
      }
    } catch (err) {
      return rejectWithValue(err.response?.data?.message);
    }
  }
);

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState: { items: [], status: 'idle' },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchWishlist.fulfilled, (state, { payload }) => {
        state.items  = payload;
        state.status = 'succeeded';
      })
      .addCase(toggleWishlist.fulfilled, (state, { payload }) => {
        if (payload.action === 'removed') {
          state.items = state.items.filter((p) => p._id !== payload.productId);
          toast.success('Removed from wishlist.');
        } else {
          state.items = payload.products;
          toast.success('Added to wishlist!');
        }
      })
      .addCase(toggleWishlist.rejected, (_, { payload }) => {
        toast.error(payload || 'Wishlist action failed.');
      });
  },
});

export default wishlistSlice.reducer;
