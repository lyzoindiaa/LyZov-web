import { createSlice } from "@reduxjs/toolkit";

const getInitialTheme = () => {
  if (typeof window === "undefined") return "light";
  const stored = window.localStorage?.getItem("lyzov-theme");
  if (stored) return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

const uiSlice = createSlice({
  name: "ui",
  initialState: {
    theme: getInitialTheme(),
    isMobileMenuOpen: false,
    isFilterDrawerOpen: false,
  },
  reducers: {
    toggleTheme: (state) => {
      const next = state.theme === "light" ? "dark" : "light";
      state.theme = next;
      if (typeof window !== "undefined") {
        window.localStorage?.setItem("lyzov-theme", next);
        document.documentElement.classList.toggle("dark", next === "dark");
      }
    },
    setTheme: (state, action) => {
      state.theme = action.payload;
      if (typeof window !== "undefined") {
        window.localStorage?.setItem("lyzov-theme", action.payload);
        document.documentElement.classList.toggle("dark", action.payload === "dark");
      }
    },
    toggleMobileMenu: (state) => {
      state.isMobileMenuOpen = !state.isMobileMenuOpen;
    },
    closeMobileMenu: (state) => {
      state.isMobileMenuOpen = false;
    },
    toggleFilterDrawer: (state) => {
      state.isFilterDrawerOpen = !state.isFilterDrawerOpen;
    },
    closeFilterDrawer: (state) => {
      state.isFilterDrawerOpen = false;
    },
  },
});

export const {
  toggleTheme,
  setTheme,
  toggleMobileMenu,
  closeMobileMenu,
  toggleFilterDrawer,
  closeFilterDrawer,
} = uiSlice.actions;

export default uiSlice.reducer;