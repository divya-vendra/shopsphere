import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { orderApi } from '../../api/orderApi';
import { paymentApi } from '../../api/paymentApi';
import toast from 'react-hot-toast';

export const createOrder = createAsyncThunk(
  'orders/create',
  async (orderData, { rejectWithValue }) => {
    try {
      const { data } = await orderApi.create(orderData);
      return data.order;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to create order');
    }
  }
);

export const fetchMyOrders = createAsyncThunk(
  'orders/fetchMine',
  async (params, { rejectWithValue }) => {
    try {
      const { data } = await orderApi.getMyOrders(params);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load orders');
    }
  }
);

export const fetchOrderById = createAsyncThunk(
  'orders/fetchById',
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await orderApi.getById(id);
      return data.order;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Order not found');
    }
  }
);

export const fetchAllOrders = createAsyncThunk(
  'orders/fetchAll',
  async (params, { rejectWithValue }) => {
    try {
      const { data } = await orderApi.getAll(params);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load orders');
    }
  }
);

export const updateOrderStatus = createAsyncThunk(
  'orders/updateStatus',
  async ({ id, data: statusData }, { rejectWithValue }) => {
    try {
      const { data } = await orderApi.updateStatus(id, statusData);
      return data.order;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to update status');
    }
  }
);

export const createCheckoutSession = createAsyncThunk(
  'orders/checkout',
  async (orderId, { rejectWithValue }) => {
    try {
      const { data } = await paymentApi.createCheckoutSession(orderId);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Checkout failed');
    }
  }
);

export const verifyPayment = createAsyncThunk(
  'orders/verifyPayment',
  async (sessionId, { rejectWithValue }) => {
    try {
      const { data } = await paymentApi.getSessionStatus(sessionId);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to verify payment');
    }
  }
);

const orderSlice = createSlice({
  name: 'orders',
  initialState: {
    items:        [],
    currentOrder: null,
    pagination:   { total: 0, page: 1, pages: 1 },
    status:       'idle',
    error:        null,
  },
  reducers: {
    clearCurrentOrder(state) { state.currentOrder = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createOrder.pending,   (state) => { state.status = 'loading'; })
      .addCase(createOrder.fulfilled, (state, { payload }) => {
        state.status       = 'succeeded';
        state.currentOrder = payload;
      })
      .addCase(createOrder.rejected, (state, { payload }) => {
        state.status = 'failed';
        state.error  = payload;
        toast.error(payload);
      })

      .addCase(fetchMyOrders.pending,   (state) => { state.status = 'loading'; })
      .addCase(fetchMyOrders.fulfilled, (state, { payload }) => {
        state.status     = 'succeeded';
        state.items      = payload.orders;
        state.pagination = { total: payload.total, page: payload.page, pages: payload.pages };
      })
      .addCase(fetchMyOrders.rejected, (state, { payload }) => {
        state.status = 'failed';
        state.error  = payload;
      })

      .addCase(fetchOrderById.fulfilled, (state, { payload }) => {
        state.currentOrder = payload;
      })

      .addCase(fetchAllOrders.pending,   (state) => { state.status = 'loading'; })
      .addCase(fetchAllOrders.fulfilled, (state, { payload }) => {
        state.status     = 'succeeded';
        state.items      = payload.orders;
        state.pagination = { total: payload.total, page: payload.page, pages: payload.pages };
      })

      .addCase(updateOrderStatus.fulfilled, (state, { payload }) => {
        const idx = state.items.findIndex((o) => o._id === payload._id);
        if (idx !== -1) state.items[idx] = payload;
        if (state.currentOrder?._id === payload._id) state.currentOrder = payload;
        toast.success('Order status updated.');
      })
      .addCase(updateOrderStatus.rejected, (_, { payload }) => { toast.error(payload); })

      .addCase(verifyPayment.fulfilled, (state, { payload }) => {
        state.currentOrder = payload.order;
      });
  },
});

export const { clearCurrentOrder } = orderSlice.actions;
export default orderSlice.reducer;
