import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Phiên người mua sau khi nhập đúng mã gửi qua email (khác hẳn phiên seller trong use-auth.ts).
// Dùng chung cho mọi shop: email là của người mua, không phải của shop.
interface BuyerSessionState {
  email: string | null;
  token: string | null;
  signIn: (email: string, token: string) => void;
  signOut: () => void;
}

export const useBuyerSession = create<BuyerSessionState>()(
  persist(
    (set) => ({
      email: null,
      token: null,
      signIn: (email, token) => set({ email, token }),
      signOut: () => set({ email: null, token: null }),
    }),
    { name: 'buyer-session' },
  ),
);
