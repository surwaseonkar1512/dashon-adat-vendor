import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface VendorState {
  id: string;
  tenantId: string;
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
  status: string;
  subscriptionEnd: string;
  logo?: string;
  address?: string;
  gstNumber?: string;
}

interface AuthState {
  isAuthenticated: boolean;
  vendor: VendorState | null;
  token: string | null;
  isFirstLogin: boolean; // Managed locally to trigger wizard
}

const initialState: AuthState = {
  isAuthenticated: false,
  vendor: null,
  token: null,
  isFirstLogin: true,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginSuccess: (state, action: PayloadAction<{ vendor: VendorState; token: string }>) => {
      state.isAuthenticated = true;
      state.vendor = action.payload.vendor;
      state.token = action.payload.token;
      // If setup is already finished, set isFirstLogin to false
      state.isFirstLogin = action.payload.vendor.status === 'Trial' || action.payload.vendor.status === 'Active';
      localStorage.setItem('vendorToken', action.payload.token);
      localStorage.setItem('vendorData', JSON.stringify(action.payload.vendor));
    },
    completeSetup: (state) => {
      state.isFirstLogin = false;
      if (state.vendor) {
        state.vendor.status = 'Active';
        localStorage.setItem('vendorData', JSON.stringify(state.vendor));
      }
    },
    updateVendorProfile: (state, action: PayloadAction<Partial<VendorState>>) => {
      if (state.vendor) {
        state.vendor = { ...state.vendor, ...action.payload };
        localStorage.setItem('vendorData', JSON.stringify(state.vendor));
      }
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.vendor = null;
      state.token = null;
      localStorage.removeItem('vendorToken');
      localStorage.removeItem('vendorData');
    },
  },
});

export const { loginSuccess, completeSetup, updateVendorProfile, logout } = authSlice.actions;
export default authSlice.reducer;
