import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

const AdminDashboard = ({ user, onLogout }) => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalBookings: 0,
    totalTrips: 0,
    totalRevenue: 0,
    recentBookings: [],
    popularDestinations: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5000/api/admin/stats", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: "Total Users",
      value: stats.totalUsers,
      icon: "👥",
      color: "bg-blue-500",
      link: "/admin/users",
    },
    {
      title: "Total Bookings",
      value: stats.totalBookings,
      icon: "📅",
      color: "bg-green-500",
      link: "/admin/bookings",
    },
    {
      title: "Total Revenue",
      value: `৳${stats.totalRevenue.toLocaleString()}`,
      icon: "💰",
      color: "bg-yellow-500",
      link: "/admin/revenue",
    },
  ];

  const quickActions = [
    {
      title: "Manage Users",
      description: "View, edit, or disable user accounts",
      icon: "👥",
      color: "bg-blue-100 text-blue-600",
      link: "/admin/users",
    },
    {
      title: "Manage Interests",
      description: "Add or edit interest categories",
      icon: "🎯",
      color: "bg-purple-100 text-purple-600",
      link: "/admin/interests",
    },
    {
      title: "Manage Destinations",
      description: "Add, edit, or remove destinations",
      icon: "🏝️",
      color: "bg-green-100 text-green-600",
      link: "/admin/destinations",
    },
    {
      title: "Manage Hotels",
      description: "Add hotels, rooms, and amenities",
      icon: "🏨",
      color: "bg-indigo-100 text-indigo-600",
      link: "/admin/hotels",
    },
    {
      title: "Manage Transport",
      description: "Add buses, trains, and flights",
      icon: "🚌",
      color: "bg-yellow-100 text-yellow-600",
      link: "/admin/transport",
    },
    {
      title: "Manage Food",
      description: "Configure meal categories and prices",
      icon: "🍽️",
      color: "bg-red-100 text-red-600",
      link: "/admin/food",
    },
    {
      title: "Manage Activities",
      description: "Add activities and set pricing",
      icon: "🎯",
      color: "bg-pink-100 text-pink-600",
      link: "/admin/activities",
    },
    {
      title: "View Bookings",
      description: "See all bookings and their status",
      icon: "📊",
      color: "bg-orange-100 text-orange-600",
      link: "/admin/bookings",
    },
    {
      title: "Revenue Report",
      description: "View earnings and financial data",
      icon: "📈",
      color: "bg-teal-100 text-teal-600",
      link: "/admin/revenue",
    },
    {
      title: "Manage Ratings",
      description: "Manage user reviews",
      icon: "⭐",
      color: "bg-yellow-100 text-yellow-600",
      link: "/admin/ratings",
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar user={user} onLogout={onLogout} />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar user={user} onLogout={onLogout} />

      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 text-white">
        <div className="container mx-auto px-4 py-12">
          <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-xl text-indigo-100">
            Welcome back, {user?.name}! Manage your tourism platform here.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="container mx-auto px-4 -mt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat, index) => (
            <Link
              key={index}
              to={stat.link}
              className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition transform hover:-translate-y-1"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {stat.value}
                  </p>
                </div>
                <div
                  className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center text-2xl text-white`}
                >
                  {stat.icon}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div className="container mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => (
            <Link
              key={index}
              to={action.link}
              className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition transform hover:-translate-y-1"
            >
              <div
                className={`w-12 h-12 ${action.color} rounded-lg flex items-center justify-center text-2xl mb-4`}
              >
                {action.icon}
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">
                {action.title}
              </h3>
              <p className="text-sm text-gray-500">{action.description}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4">Recent Bookings</h2>
          {stats.recentBookings.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No recent bookings</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">User</th>
                    <th className="text-left py-2">Destination</th>
                    <th className="text-left py-2">Date</th>
                    <th className="text-left py-2">Amount</th>
                    <th className="text-left py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentBookings.map((booking) => (
                    <tr key={booking.id} className="border-b hover:bg-gray-50">
                      <td className="py-2">{booking.userName}</td>
                      <td className="py-2">{booking.destination}</td>
                      <td className="py-2">
                        {new Date(booking.date).toLocaleDateString()}
                      </td>
                      <td className="py-2">৳{booking.amount}</td>
                      <td className="py-2">
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            booking.status === "confirmed"
                              ? "bg-green-100 text-green-600"
                              : booking.status === "pending"
                              ? "bg-yellow-100 text-yellow-600"
                              : booking.status === "completed"
                              ? "bg-blue-100 text-blue-600"
                              : booking.status === "cancelled"
                              ? "bg-red-100 text-red-600"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {booking.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Popular Destinations */}
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4">Popular Destinations</h2>
          {stats.popularDestinations.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No data available</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stats.popularDestinations.map((dest, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{dest.icon || "🏝️"}</span>
                    <div>
                      <p className="font-medium">{dest.name}</p>
                      <p className="text-xs text-gray-500">
                        {dest.bookings} bookings
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-indigo-600">
                    ৳{dest.revenue?.toLocaleString() || 0}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default AdminDashboard;