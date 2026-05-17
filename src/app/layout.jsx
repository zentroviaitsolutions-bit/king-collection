import "./globals.css";
import { Toaster } from "react-hot-toast";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { UserProductProvider } from "@/context/UserProductContext";
import { WishlistProvider } from "@/context/WishlistContext";

export const metadata = {
  title: {
    default: "King Collection",
    template: "%s | King Collection",
  },
  description:
    "King Collection is a premium Meesho-inspired fashion ecommerce platform with smooth shopping, secure checkout, order tracking, and admin management.",
  keywords: [
    "King Collection",
    "fashion ecommerce",
    "online shopping",
    "kurta",
    "ethnic wear",
    "razorpay",
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className="bg-[#faf7f2] text-black antialiased"
        suppressHydrationWarning
      >
        <AuthProvider>
          <UserProductProvider>
            <WishlistProvider>
              <CartProvider>
                <Navbar />
                {children}
                <Footer />
                <Toaster position="top-right" />
              </CartProvider>
            </WishlistProvider>
          </UserProductProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
