import React from "react";
import { Link, useLocation } from "react-router-dom";
import Navbar from "../Navbar";
import Footer from "../Footer";

const AdminLayout = ({ user, onLogout, children, title }) => {
  const location = useLocation();

  const navigation = [
    { name: "Dashboard", href: "/admin", icon: "📊" },
    { name: "Users", href: "/admin/users", icon: "👥" },
    { name: "Interests", href: "/admin/interests", icon: "🎯" },
    { name: "Destinations", href: "/admin/destinations", icon: "🏝️" },
    { name: "Hotels", href: "/admin/hotels", icon: "🏨" },
    { name: "Transport", href: "/admin/transport", icon: "🚌" },
    { name: "Food Categories", href: "/admin/food", icon: "🍽️" },
    { name: "Activities", href: "/admin/activities", icon: "🎯" },
    { name: "Bookings", href: "/admin/bookings", icon: "📅" },
    { name: "Revenue", href: "/admin/revenue", icon: "💰" },
    { name: "Manage Ratings", href: "/admin/ratings", icon: "⭐" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar user={user} onLogout={onLogout} />

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar */}
          <div className="md:w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-lg p-4 sticky top-4">
              <h3 className="font-bold text-gray-800 mb-4 px-2">Admin Menu</h3>
              <nav className="space-y-1">
                {navigation.map((item) => (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg transition ${
                      location.pathname === item.href
                        ? "bg-indigo-50 text-indigo-600"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <span className="text-xl">{item.icon}</span>
                    <span className="text-sm font-medium">{item.name}</span>
                  </Link>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <div className="bg-white rounded-lg shadow-lg p-6">
              {title && <h1 className="text-2xl font-bold mb-6">{title}</h1>}
              {children}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default AdminLayout;
