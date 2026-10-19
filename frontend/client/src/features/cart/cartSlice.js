import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { cartService } from "../../services/cartService";
import { toast } from "react-toastify";

export const fetchCart = createAsyncThunk("cart/fetch", async (_, { rejectWithValue }) => {
  try {
    const res = await cartService.getCart();
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const addToCart = createAsyncThunk("cart/addItem", async (payload, { rejectWithValue }) => {
  try {
    const res = await cartService.addItem(payload);
    return res.data;
  } catch (err) {
    const message = err.response?.data?.message || "Could not add item to cart";
    toast.error(message);
    return rejectWithValue(message);
  }
});

export const updateCartItem = createAsyncThunk(
  "cart/updateItem",
  async ({ itemId, quantity }, { rejectWithValue }) => {
    try {
      const res = await cartService.updateItem(itemId, quantity);
      return res.data;
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not update item");
      return rejectWithValue(err.response?.data?.message);
    }
  }
);

export const removeCartItem = createAsyncThunk("cart/removeItem", async (itemId, { rejectWithValue }) => {
  try {
    const res = await cartService.removeItem(itemId);
    toast.info("Item removed from cart");
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const applyCoupon = createAsyncThunk("cart/applyCoupon", async (code, { rejectWithValue }) => {
  try {
    const res = await cartService.applyCoupon(code);
    toast.success(`Coupon "${code.toUpperCase()}" applied`);
    return res.data;
  } catch (err) {
    const message = err.response?.data?.message || "Invalid coupon";
    toast.error(message);
    return rejectWithValue(message);
  }
});

export const removeCoupon = createAsyncThunk("cart/removeCoupon", async (_, { rejectWithValue }) => {
  try {
    const res = await cartService.removeCoupon();
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

const cartSlice = createSlice({
  name: "cart",
  initialState: {
    items: [],
    coupon: { code: null, discountType: null, discountValue: 0 },
    subtotal: 0,
    totalItems: 0,
    status: "idle",
    isMiniCartOpen: false,
  },
  reducers: {
    openMiniCart: (state) => {
      state.isMiniCartOpen = true;
    },
    closeMiniCart: (state) => {
      state.isMiniCartOpen = false;
    },
    resetCartLocal: (state) => {
      state.items = [];
      state.coupon = { code: null, discountType: null, discountValue: 0 };
      state.subtotal = 0;
      state.totalItems = 0;
    },
  },
  extraReducers: (builder) => {
    const applyCartData = (state, action) => {
      const incomingItems = action.payload?.items || [];
      const prevItems = state.items || [];
      state.items = incomingItems.map((newItem) => {
        const existing = prevItems.find(
          (oldItem) => String(oldItem._id) === String(newItem._id)
        );
        const resolvedGstRate =
          newItem.gstRate ||
          (typeof newItem.product === "object" && newItem.product !== null ? newItem.product?.gstRate : null) ||
          existing?.gstRate ||
          (typeof existing?.product === "object" && existing?.product !== null ? existing?.product?.gstRate : null) ||
          null;
        const resolvedProduct =
          typeof newItem.product === "object" && newItem.product !== null
            ? newItem.product
            : typeof existing?.product === "object" && existing?.product !== null
            ? existing.product
            : newItem.product;

        return {
          ...newItem,
          gstRate: resolvedGstRate,
          product: resolvedProduct,
        };
      });
      state.coupon = action.payload?.coupon || { code: null, discountType: null, discountValue: 0 };
      state.subtotal = action.payload?.subtotal || 0;
      state.totalItems = action.payload?.totalItems || 0;
      state.status = "succeeded";
    };

    builder
      .addCase(fetchCart.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchCart.fulfilled, applyCartData)
      .addCase(fetchCart.rejected, (state) => {
        state.status = "failed";
      })
      .addCase(addToCart.fulfilled, (state, action) => {
        applyCartData(state, action);
        state.isMiniCartOpen = true;
      })
      .addCase(updateCartItem.fulfilled, applyCartData)
      .addCase(removeCartItem.fulfilled, applyCartData)
      .addCase(applyCoupon.fulfilled, applyCartData)
      .addCase(removeCoupon.fulfilled, applyCartData);
  },
});

export const { openMiniCart, closeMiniCart, resetCartLocal } = cartSlice.actions;
export default cartSlice.reducer;
