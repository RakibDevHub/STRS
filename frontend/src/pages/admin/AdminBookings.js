import React, { useState, useEffect, useCallback } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import Flash from "../../components/FlashMessage";
import ConfirmationModal from "../../components/ConfirmationModal";

const AdminBookings = ({ user, onLogout }) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [flash, setFlash] = useState({
    isOpen: false,
    type: "success",
    title: "",
    message: "",
  });
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [statusModal, setStatusModal] = useState({
    isOpen: false,
    id: null,
    currentStatus: "",
  });
  const [refundModal, setRefundModal] = useState({
    isOpen: false,
    id: null,
    action: "approve", // 'approve' or 'reject'
  });

  // Standard showFlash function
  const showFlash = useCallback((type, title, message) => {
    setFlash({ isOpen: true, type, title, message });
    setTimeout(() => setFlash((prev) => ({ ...prev, isOpen: false })), 3000);
  }, []);

  // Fetch bookings
  const fetchBookings = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/admin/bookings", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setBookings(data.bookings);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      showFlash("error", "Error", "Failed to load bookings");
    } finally {
      setLoading(false);
    }
  }, [showFlash]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // Filter bookings
  const filteredBookings = bookings.filter((booking) => {
    // Filter by status
    if (filter !== "all" && booking.status !== filter) return false;
    
    // Search by user name, destination, or transaction ID
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        booking.userName?.toLowerCase().includes(term) ||
        booking.destination?.toLowerCase().includes(term) ||
        booking.transactionId?.toLowerCase().includes(term) ||
        booking.confirmationNumber?.toLowerCase().includes(term)
      );
    }
    
    return true;
  });

  const handleStatusChange = async () => {
    if (!statusModal.id) return;
    
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `http://localhost:5000/api/admin/bookings/${statusModal.id}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: statusModal.currentStatus }),
        }
      );
      const data = await res.json();
      if (data.success) {
        showFlash("success", "Success", "Booking status updated");
        fetchBookings();
      }
    } catch (error) {
      console.error("Error updating status:", error);
      showFlash("error", "Error", "Failed to update status");
    } finally {
      setStatusModal({ isOpen: false, id: null, currentStatus: "" });
    }
  };

  const handleRefundAction = async () => {
    if (!refundModal.id) return;
    
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `http://localhost:5000/api/admin/bookings/${refundModal.id}/refund`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ action: refundModal.action }),
        }
      );
      const data = await res.json();
      if (data.success) {
        showFlash("success", "Success", `Refund ${refundModal.action}d successfully`);
        fetchBookings();
      }
    } catch (error) {
      console.error("Error processing refund:", error);
      showFlash("error", "Error", "Failed to process refund");
    } finally {
      setRefundModal({ isOpen: false, id: null, action: "approve" });
    }
  };

  const viewDetails = (booking) => {
    setSelectedBooking(booking);
    setShowDetailsModal(true);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatCurrency = (amount) => {
    return `৳${amount?.toLocaleString() || 0}`;
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: "bg-yellow-100 text-yellow-800",
      confirmed: "bg-green-100 text-green-800",
      completed: "bg-blue-100 text-blue-800",
      failed: "bg-red-100 text-red-800",
      cancelled: "bg-gray-100 text-gray-800",
    };
    const icons = {
      pending: "⏳",
      confirmed: "✅",
      completed: "✨",
      failed: "❌",
      cancelled: "🚫",
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badges[status] || badges.pending}`}>
        {icons[status]} {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getRefundStatusBadge = (refundStatus) => {
    if (!refundStatus) return null;
    
    const badges = {
      pending: "bg-yellow-100 text-yellow-800",
      approved: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
    };
    return (
      <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${badges[refundStatus]}`}>
        Refund: {refundStatus}
      </span>
    );
  };

  // Statistics
  const stats = {
    total: bookings.length,
    pending: bookings.filter(b => b.status === "pending").length,
    confirmed: bookings.filter(b => b.status === "confirmed").length,
    completed: bookings.filter(b => b.status === "completed").length,
    failed: bookings.filter(b => b.status === "failed").length,
    cancelled: bookings.filter(b => b.status === "cancelled").length,
    refundRequests: bookings.filter(b => b.refundRequested === 1 && b.refundStatus === "pending").length,
    totalRevenue: bookings
      .filter(b => b.status === "confirmed" || b.status === "completed")
      .reduce((sum, b) => sum + (b.totalCost || 0), 0),
  };

  if (loading) {
    return (
      <AdminLayout user={user} onLogout={onLogout} title="Booking Management">
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout user={user} onLogout={onLogout} title="Booking Management">
      <Flash
        isOpen={flash.isOpen}
        onClose={() => setFlash((prev) => ({ ...prev, isOpen: false }))}
        type={flash.type}
        title={flash.title}
        message={flash.message}
      />

      {/* Status Update Modal */}
      <ConfirmationModal
        isOpen={statusModal.isOpen}
        onClose={() => setStatusModal({ isOpen: false, id: null, currentStatus: "" })}
        onConfirm={handleStatusChange}
        title="Update Booking Status"
        message={`Are you sure you want to change status to "${statusModal.currentStatus}"?`}
        confirmText="Update"
        cancelText="Cancel"
      />

      {/* Refund Action Modal */}
      <ConfirmationModal
        isOpen={refundModal.isOpen}
        onClose={() => setRefundModal({ isOpen: false, id: null, action: "approve" })}
        onConfirm={handleRefundAction}
        title={refundModal.action === "approve" ? "Approve Refund" : "Reject Refund"}
        message={`Are you sure you want to ${refundModal.action} this refund request?`}
        confirmText={refundModal.action === "approve" ? "Approve" : "Reject"}
        cancelText="Cancel"
        confirmButtonClass={refundModal.action === "approve" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
      />

      {/* Booking Details Modal */}
      {showDetailsModal && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold">Booking Details</h3>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                {/* Booking Reference */}
                <div className="bg-indigo-50 p-4 rounded-lg">
                  <p className="text-xs text-indigo-600 mb-1">Booking Reference</p>
                  <p className="text-lg font-bold text-indigo-800">
                    {selectedBooking.confirmationNumber || `BK${selectedBooking.id}`}
                  </p>
                </div>

                {/* Customer Info */}
                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-3">Customer Information</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-gray-500">Name</p>
                      <p className="font-medium">{selectedBooking.userName}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Email</p>
                      <p className="font-medium">{selectedBooking.userEmail}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Phone</p>
                      <p className="font-medium">{selectedBooking.userPhone || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Travelers</p>
                      <p className="font-medium">{selectedBooking.people}</p>
                    </div>
                  </div>
                </div>

                {/* Trip Details */}
                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-3">Trip Details</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Destination</span>
                      <span className="font-medium">{selectedBooking.destination}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Travel Date</span>
                      <span className="font-medium">{formatDate(selectedBooking.travelDate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Duration</span>
                      <span className="font-medium">{selectedBooking.durationDays} days</span>
                    </div>
                    {selectedBooking.hotel && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Hotel</span>
                        <span className="font-medium">{selectedBooking.hotel}</span>
                      </div>
                    )}
                    {selectedBooking.transport && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Transport</span>
                        <span className="font-medium">{selectedBooking.transport}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Payment Details */}
                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-3">Payment Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Total Cost</span>
                      <span className="font-bold text-indigo-600">
                        {formatCurrency(selectedBooking.totalCost)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Payment Method</span>
                      <span className="font-medium capitalize">{selectedBooking.paymentMethod}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Transaction ID</span>
                      <span className="font-medium">{selectedBooking.transactionId || "N/A"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Booking Date</span>
                      <span className="font-medium">{formatDate(selectedBooking.bookingDate)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">Status</span>
                      {getStatusBadge(selectedBooking.status)}
                    </div>
                  </div>
                </div>

                {/* Refund Information */}
                {selectedBooking.refundRequested === 1 && (
                  <div className="border rounded-lg p-4 bg-yellow-50">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <span>💰 Refund Information</span>
                      {getRefundStatusBadge(selectedBooking.refundStatus)}
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Refund Amount</span>
                        <span className="font-medium">{formatCurrency(selectedBooking.refundAmount || selectedBooking.totalCost)}</span>
                      </div>
                      {selectedBooking.refundReason && (
                        <div>
                          <span className="text-gray-600">Reason</span>
                          <p className="font-medium mt-1 p-2 bg-white rounded">{selectedBooking.refundReason}</p>
                        </div>
                      )}
                      {selectedBooking.refundDate && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Processed Date</span>
                          <span className="font-medium">{formatDate(selectedBooking.refundDate)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Total</p>
          <p className="text-2xl font-bold text-indigo-600">{stats.total}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Confirmed</p>
          <p className="text-2xl font-bold text-green-600">{stats.confirmed}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Pending</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Completed</p>
          <p className="text-2xl font-bold text-blue-600">{stats.completed}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Failed</p>
          <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Cancelled</p>
          <p className="text-2xl font-bold text-gray-600">{stats.cancelled}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Refund Req</p>
          <p className="text-2xl font-bold text-purple-600">{stats.refundRequests}</p>
        </div>
      </div>

      {/* Revenue Card */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg shadow p-4 mb-6 text-white">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm opacity-90">Total Revenue</p>
            <p className="text-3xl font-bold">{formatCurrency(stats.totalRevenue)}</p>
          </div>
          <div className="text-4xl">💰</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by user, destination, transaction ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-2 border rounded-lg"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-2 rounded-lg ${filter === "all" ? "bg-indigo-600 text-white" : "bg-gray-100"}`}
            >
              All
            </button>
            <button
              onClick={() => setFilter("pending")}
              className={`px-4 py-2 rounded-lg ${filter === "pending" ? "bg-yellow-600 text-white" : "bg-gray-100"}`}
            >
              Pending
            </button>
            <button
              onClick={() => setFilter("confirmed")}
              className={`px-4 py-2 rounded-lg ${filter === "confirmed" ? "bg-green-600 text-white" : "bg-gray-100"}`}
            >
              Confirmed
            </button>
            <button
              onClick={() => setFilter("completed")}
              className={`px-4 py-2 rounded-lg ${filter === "completed" ? "bg-blue-600 text-white" : "bg-gray-100"}`}
            >
              Completed
            </button>
            <button
              onClick={() => setFilter("failed")}
              className={`px-4 py-2 rounded-lg ${filter === "failed" ? "bg-red-600 text-white" : "bg-gray-100"}`}
            >
              Failed
            </button>
            <button
              onClick={() => setFilter("cancelled")}
              className={`px-4 py-2 rounded-lg ${filter === "cancelled" ? "bg-gray-600 text-white" : "bg-gray-100"}`}
            >
              Cancelled
            </button>
          </div>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Destination</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Travel Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Refund</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredBookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">{booking.id}</td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-sm font-medium">{booking.userName}</p>
                      <p className="text-xs text-gray-500">{booking.userEmail}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">{booking.destination}</td>
                  <td className="px-4 py-3 text-sm">{formatDate(booking.travelDate)}</td>
                  <td className="px-4 py-3 text-sm font-medium text-indigo-600">
                    {formatCurrency(booking.totalCost)}
                  </td>
                  <td className="px-4 py-3">{getStatusBadge(booking.status)}</td>
                  <td className="px-4 py-3">
                    {booking.refundRequested === 1 ? (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        booking.refundStatus === "pending" ? "bg-yellow-100 text-yellow-800" :
                        booking.refundStatus === "approved" ? "bg-green-100 text-green-800" :
                        "bg-red-100 text-red-800"
                      }`}>
                        {booking.refundStatus}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => viewDetails(booking)}
                        className="text-blue-600 text-sm hover:underline"
                      >
                        View
                      </button>
                      
                      {/* Status Update Dropdown - Only for non-cancelled/completed */}
                      {booking.status !== "cancelled" && booking.status !== "completed" && (
                        <select
                          value={booking.status}
                          onChange={(e) => setStatusModal({
                            isOpen: true,
                            id: booking.id,
                            currentStatus: e.target.value,
                          })}
                          className="text-xs border rounded px-2 py-1"
                        >
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="failed">Failed</option>
                        </select>
                      )}

                      {/* Refund Actions - Only for pending refunds */}
                      {booking.refundRequested === 1 && booking.refundStatus === "pending" && (
                        <div className="flex gap-1">
                          <button
                            onClick={() => setRefundModal({ isOpen: true, id: booking.id, action: "approve" })}
                            className="text-green-600 text-xs hover:underline"
                            title="Approve Refund"
                          >
                            ✅
                          </button>
                          <button
                            onClick={() => setRefundModal({ isOpen: true, id: booking.id, action: "reject" })}
                            className="text-red-600 text-xs hover:underline"
                            title="Reject Refund"
                          >
                            ❌
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredBookings.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No bookings found.
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminBookings;