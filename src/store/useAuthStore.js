import { create } from 'zustand';

const useAuthStore = create((set) => ({
  // Estado inicial
  user: null,          // Guardará { nombre, rol, localId }
  token: null,         // El JWT para el backend
  isAuthenticated: false,

  // Acciones
  login: (userData, jwtToken) => set({
    user: userData,
    token: jwtToken,
    isAuthenticated: true,
  }),

  logout: () => set({
    user: null,
    token: null,
    isAuthenticated: false,
  }),

  updateUser: (newData) => set((state) => ({
    user: { ...state.user, ...newData }
  }))
}));

export default useAuthStore;
