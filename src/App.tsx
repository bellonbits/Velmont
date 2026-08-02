import { useEffect } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import { Splash } from "./pages/Splash";
import { Home } from "./pages/Home";
import { Product } from "./pages/Product";
import { SignIn } from "./pages/SignIn";
import { SignUp } from "./pages/SignUp";
import { ForgotPassword } from "./pages/ForgotPassword";
import { Account } from "./pages/Account";
import { Favourites } from "./pages/Favourites";
import { Cart } from "./pages/Cart";
import { Checkout } from "./pages/Checkout";
import { Chat } from "./pages/Chat";
import { Stores } from "./pages/Stores";
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { AdminInventory } from "./pages/admin/AdminInventory";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AdminRoute } from "./components/AdminRoute";
import { api } from "./lib/api";
import { getClientSessionId } from "./lib/clientSession";

function useVisitTracking() {
  const location = useLocation();

  useEffect(() => {
    api
      .post("/track", { sessionId: getClientSessionId(), path: location.pathname })
      .catch(() => {});
  }, [location.pathname]);
}

function App() {
  useVisitTracking();

  return (
    <Routes>
      <Route path="/" element={<Splash />} />
      <Route path="/home" element={<Home />} />
      <Route path="/product/:id" element={<Product />} />
      <Route path="/signin" element={<SignIn />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route
        path="/account"
        element={
          <ProtectedRoute>
            <Account />
          </ProtectedRoute>
        }
      />
      <Route
        path="/favourites"
        element={
          <ProtectedRoute>
            <Favourites />
          </ProtectedRoute>
        }
      />
      <Route path="/stores" element={<Stores />} />
      <Route path="/cart" element={<Cart />} />
      <Route path="/chat" element={<Chat />} />
      <Route
        path="/checkout"
        element={
          <ProtectedRoute>
            <Checkout />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/inventory"
        element={
          <AdminRoute>
            <AdminInventory />
          </AdminRoute>
        }
      />
    </Routes>
  );
}

export default App;
