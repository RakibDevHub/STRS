import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import Booking from "./pages/Booking";
import MyTrips from "./pages/MyTrips";
import TripPlanner from "./pages/TripPlanner";
import TripDetails from "./pages/TripDetails";
import Destinations from "./pages/Destinations";
import Recommendations from "./pages/Recommendations";
import DestinationDetails from "./pages/DestinationDetails";

import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminDestinations from "./pages/admin/AdminDestinations";
import AdminHotels from "./pages/admin/AdminHotels";
import AdminTransport from "./pages/admin/AdminTransport";
import AdminFood from "./pages/admin/AdminFood";
import AdminActivities from "./pages/admin/AdminActivities";
import AdminBookings from "./pages/admin/AdminBookings";
import AdminInterests from "./pages/admin/AdminInterests";
import AdminRevenue from "./pages/admin/AdminRevenue";
import AdminRatings from "./pages/admin/AdminRatings";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ================================
  // Check if user is logged in (on page refresh)
  // ================================
  useEffect(() => {
    verifyUser();
  }, []);

  const verifyUser = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const data = await res.json();

      if (!data.success) {
        localStorage.removeItem("token");
        setLoading(false);
        return;
      }

      // Fetch full user data
      const userRes = await fetch(
        `http://localhost:5000/api/users/${data.user.userId}`,
      );
      const userData = await userRes.json();

      if (userData.success) {
        setUser(userData.user);
      } else {
        localStorage.removeItem("token");
      }
    } catch (error) {
      console.error("Auth error:", error);
      localStorage.removeItem("token");
    } finally {
      setLoading(false);
    }
  };

  // ================================
  // Handle Login
  // ================================
  const handleLogin = async (userData, token) => {
    localStorage.setItem("token", token);

    try {
      const userRes = await fetch(
        `http://localhost:5000/api/users/${userData.id}`,
      );
      const fullUserData = await userRes.json();

      if (fullUserData.success) {
        setUser(fullUserData.user);
      } else {
        setUser(userData);
      }
    } catch (error) {
      console.error("Error fetching full user:", error);
      setUser(userData);
    }
  };

  // ================================
  // Handle Logout
  // ================================
  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  // ================================
  // Route Protection Components
  // ================================

  const ProtectedRoute = ({ children }) => {
    if (!user) {
      return <Navigate to="/login" replace />;
    }

    // Block admin from traveler pages
    if (user.role === "admin") {
      return <Navigate to="/admin" replace />;
    }

    return children;
  };

  const AdminRoute = ({ children }) => {
    if (!user) {
      return <Navigate to="/login" replace />;
    }

    if (user.role !== "admin") {
      return <Navigate to="/" replace />;
    }

    return children;
  };

  // ================================
  // Loading Screen
  // ================================
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // ================================
  // Routes
  // ================================
  return (
    <BrowserRouter>
      <Routes>
        {/* Home */}
        <Route
          path="/"
          element={<Home user={user} onLogout={handleLogout} />}
        />

        {/* Public Routes */}
        <Route
          path="/login"
          element={
            user ? (
              <Navigate to={user.role === "admin" ? "/admin" : "/"} replace />
            ) : (
              <Login onLogin={handleLogin} />
            )
          }
        />
        <Route
          path="/register"
          element={
            user ? (
              <Navigate to={user.role === "admin" ? "/admin" : "/"} replace />
            ) : (
              <Register />
            )
          }
        />

        {/* Protected User Routes */}
        <Route
          path="/plan-trip"
          element={
            <ProtectedRoute>
              <TripPlanner user={user} onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-trips"
          element={
            <ProtectedRoute>
              <MyTrips user={user} onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-trip/:id"
          element={
            <ProtectedRoute>
              <TripDetails user={user} onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/booking/:id"
          element={
            <ProtectedRoute>
              <Booking user={user} onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile
                user={user}
                onLogout={handleLogout}
                onUpdateUser={setUser}
              />
            </ProtectedRoute>
          }
        />

        {/* Public Browsing Routes */}
        <Route
          path="/destinations"
          element={<Destinations user={user} onLogout={handleLogout} />}
        />
        <Route
          path="/destination/:id"
          element={
            <DestinationDetails
              user={user}
              onLogout={handleLogout}
              mode="browse"
            />
          }
        />
        <Route
          path="/recommendations"
          element={<Recommendations user={user} onLogout={handleLogout} />}
        />
        <Route
          path="/recommendation/destination/:id"
          element={
            <DestinationDetails
              user={user}
              onLogout={handleLogout}
              mode="recommendation"
            />
          }
        />

        {/* Admin Route */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminDashboard user={user} onLogout={handleLogout} />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <AdminRoute user={user}>
              <AdminUsers user={user} onLogout={handleLogout} />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/interests"
          element={
            <AdminRoute user={user}>
              <AdminInterests user={user} onLogout={handleLogout} />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/destinations"
          element={
            <AdminRoute user={user}>
              <AdminDestinations user={user} onLogout={handleLogout} />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/hotels"
          element={
            <AdminRoute user={user}>
              <AdminHotels user={user} onLogout={handleLogout} />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/transport"
          element={
            <AdminRoute user={user}>
              <AdminTransport user={user} onLogout={handleLogout} />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/food"
          element={
            <AdminRoute user={user}>
              <AdminFood user={user} onLogout={handleLogout} />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/activities"
          element={
            <AdminRoute user={user}>
              <AdminActivities user={user} onLogout={handleLogout} />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/bookings"
          element={
            <AdminRoute user={user}>
              <AdminBookings user={user} onLogout={handleLogout} />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/revenue"
          element={
            <AdminRoute user={user}>
              <AdminRevenue user={user} onLogout={handleLogout} />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/ratings"
          element={
            <AdminRoute user={user}>
              <AdminRatings user={user} onLogout={handleLogout} />
            </AdminRoute>
          }
        />

        {/* Catch All */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
