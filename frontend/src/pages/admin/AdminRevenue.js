import React, { useState, useEffect, useCallback } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import Flash from "../../components/FlashMessage";

const AdminRevenue = ({ user, onLogout }) => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalBookings: 0,
    averageBookingValue: 0,
    monthlyData: [],
    destinationRevenue: [],
    statusBreakdown: {},
    topDestinations: []
  });
  const [dateRange, setDateRange] = useState("6months");
  const [flash, setFlash] = useState({
    isOpen: false,
    type: "success",
    title: "",
    message: "",
  });

  const showFlash = useCallback((type, title, message) => {
    setFlash({ isOpen: true, type, title, message });
    setTimeout(() => setFlash((prev) => ({ ...prev, isOpen: false })), 3000);
  }, []);

  const fetchRevenueData = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `http://localhost:5000/api/admin/revenue?range=${dateRange}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Error fetching revenue data:", error);
      showFlash("error", "Error", "Failed to load revenue data");
    } finally {
      setLoading(false);
    }
  }, [dateRange, showFlash]);

  useEffect(() => {
    fetchRevenueData();
  }, [fetchRevenueData]);

  const formatCurrency = (amount) => {
    return `৳${amount?.toLocaleString() || 0}`;
  };

  // Simple bar chart component (using div heights as bars)
  const MonthlyChart = ({ data }) => {
    if (!data || data.length === 0) return <p className="text-gray-500 text-center py-8">No data available</p>;

    const maxRevenue = Math.max(...data.map(d => d.revenue));

    return (
      <div className="mt-6">
        <div className="flex items-end justify-between h-48 gap-2">
          {data.map((month, index) => {
            const height = maxRevenue > 0 ? (month.revenue / maxRevenue) * 100 : 0;
            return (
              <div key={index} className="flex-1 flex flex-col items-center group">
                <div className="relative w-full">
                  <div
                    className="bg-indigo-500 rounded-t hover:bg-indigo-600 transition-all cursor-pointer"
                    style={{ height: `${height}%`, minHeight: '4px' }}
                  >
                    <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                      {formatCurrency(month.revenue)}
                    </div>
                  </div>
                </div>
                <span className="text-xs text-gray-500 mt-2 rotate-45 origin-left">
                  {month.month}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Destination revenue list
  const DestinationList = ({ data }) => {
    if (!data || data.length === 0) return <p className="text-gray-500 text-center py-4">No data available</p>;

    return (
      <div className="space-y-3">
        {data.map((dest, index) => (
          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
            <div className="flex items-center gap-3">
              <span className="text-lg font-medium text-gray-500 w-6">{index + 1}.</span>
              <div>
                <p className="font-medium">{dest.name}</p>
                <p className="text-xs text-gray-500">{dest.bookings} bookings</p>
              </div>
            </div>
            <span className="font-bold text-indigo-600">{formatCurrency(dest.revenue)}</span>
          </div>
        ))}
      </div>
    );
  };

  // Status breakdown cards
  const StatusCards = ({ data }) => {
    const statusColors = {
      pending: "bg-yellow-100 text-yellow-800",
      confirmed: "bg-green-100 text-green-800",
      completed: "bg-blue-100 text-blue-800",
      cancelled: "bg-red-100 text-red-800",
      failed: "bg-gray-100 text-gray-800"
    };

    return (
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {Object.entries(data).map(([status, info]) => (
          <div key={status} className={`p-3 rounded-lg text-center ${statusColors[status] || 'bg-gray-100'}`}>
            <p className="text-xs uppercase font-semibold mb-1">{status}</p>
            <p className="text-lg font-bold">{info.count}</p>
            <p className="text-xs mt-1">{formatCurrency(info.revenue)}</p>
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <AdminLayout user={user} onLogout={onLogout} title="Revenue Reports">
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout user={user} onLogout={onLogout} title="Revenue Reports">
      <Flash
        isOpen={flash.isOpen}
        onClose={() => setFlash((prev) => ({ ...prev, isOpen: false }))}
        type={flash.type}
        title={flash.title}
        message={flash.message}
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg shadow-lg p-6 text-white">
          <p className="text-sm opacity-90 mb-1">Total Revenue</p>
          <p className="text-3xl font-bold">{formatCurrency(stats.totalRevenue)}</p>
          <p className="text-xs opacity-75 mt-2">Lifetime earnings</p>
        </div>
        
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
          <p className="text-sm opacity-90 mb-1">Total Bookings</p>
          <p className="text-3xl font-bold">{stats.totalBookings}</p>
          <p className="text-xs opacity-75 mt-2">Confirmed + Completed</p>
        </div>
        
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
          <p className="text-sm opacity-90 mb-1">Average Booking Value</p>
          <p className="text-3xl font-bold">{formatCurrency(stats.averageBookingValue)}</p>
          <p className="text-xs opacity-75 mt-2">Per booking</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-wrap gap-3">
          <span className="text-sm font-medium text-gray-700 py-2">Date Range:</span>
          <button
            onClick={() => setDateRange("30days")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              dateRange === "30days"
                ? "bg-indigo-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Last 30 Days
          </button>
          <button
            onClick={() => setDateRange("6months")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              dateRange === "6months"
                ? "bg-indigo-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Last 6 Months
          </button>
          <button
            onClick={() => setDateRange("1year")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              dateRange === "1year"
                ? "bg-indigo-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Last Year
          </button>
          <button
            onClick={() => setDateRange("all")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              dateRange === "all"
                ? "bg-indigo-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            All Time
          </button>
        </div>
      </div>

      {/* Monthly Revenue Chart */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">Monthly Revenue</h2>
          <button
            onClick={() => {
              // Export chart data as CSV
              const csv = stats.monthlyData.map(m => `${m.month},${m.revenue},${m.bookings}`).join('\n');
              const blob = new Blob([`Month,Revenue,Bookings\n${csv}`], { type: 'text/csv' });
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `revenue-${dateRange}.csv`;
              a.click();
            }}
            className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
          >
            <span>📥</span> Export CSV
          </button>
        </div>
        <MonthlyChart data={stats.monthlyData} />
      </div>

      {/* Two Column Layout */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Revenue by Destination */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-bold mb-4">Revenue by Destination</h2>
          <DestinationList data={stats.destinationRevenue} />
        </div>

        {/* Top Selling Destinations */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-bold mb-4">Top Selling Destinations</h2>
          <DestinationList data={stats.topDestinations} />
        </div>
      </div>

      {/* Status Breakdown */}
      <div className="bg-white rounded-lg shadow p-6 mt-6">
        <h2 className="text-lg font-bold mb-4">Revenue by Booking Status</h2>
        <StatusCards data={stats.statusBreakdown} />
      </div>
    </AdminLayout>
  );
};

export default AdminRevenue;