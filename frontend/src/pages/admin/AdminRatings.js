import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "../../components/admin/AdminLayout";
import Flash from "../../components/FlashMessage";
import ConfirmationModal from "../../components/ConfirmationModal";

const AdminRatings = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState("destinations"); // 'destinations' or 'hotels'
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    average: 0,
    distribution: {},
  });
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    id: null,
    userName: "",
    itemName: "",
    type: "destination",
  });
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

  const fetchRatings = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const endpoint = activeTab === "destinations" 
        ? "http://localhost:5000/api/admin/ratings/destinations"
        : "http://localhost:5000/api/admin/ratings/hotels";
      
      const res = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setRatings(data.ratings);
        setStats(data.stats);
      }
    } catch (error) {
      console.error(`Error fetching ${activeTab} ratings:`, error);
      showFlash("error", "Error", `Failed to load ${activeTab} ratings`);
    } finally {
      setLoading(false);
    }
  }, [activeTab, showFlash]);

  useEffect(() => {
    fetchRatings();
  }, [fetchRatings]);

  const handleDeleteClick = (id, userName, itemName) => {
    setDeleteModal({
      isOpen: true,
      id,
      userName,
      itemName,
      type: activeTab,
    });
  };

  const confirmDelete = async () => {
    try {
      const token = localStorage.getItem("token");
      const endpoint = deleteModal.type === "destinations"
        ? `http://localhost:5000/api/admin/ratings/destinations/${deleteModal.id}`
        : `http://localhost:5000/api/admin/ratings/hotels/${deleteModal.id}`;
      
      const res = await fetch(endpoint, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        showFlash("success", "Success", `${deleteModal.type === "destinations" ? "Rating" : "Hotel rating"} deleted successfully`);
        fetchRatings();
      }
    } catch (error) {
      console.error("Error deleting rating:", error);
      showFlash("error", "Error", "Failed to delete rating");
    } finally {
      setDeleteModal({ isOpen: false, id: null, userName: "", itemName: "", type: "destination" });
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getRatingStars = (rating) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? "text-yellow-400" : "text-gray-300"
            }`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
        <span className="ml-1 text-xs text-gray-500">({rating})</span>
      </div>
    );
  };

  // Rating distribution chart
  const RatingDistribution = ({ distribution }) => {
    const maxCount = Math.max(...Object.values(distribution), 1);
    
    return (
      <div className="space-y-2">
        {[5, 4, 3, 2, 1].map((star) => (
          <div key={star} className="flex items-center gap-2">
            <span className="text-sm w-8">{star} ★</span>
            <div className="flex-1 h-4 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-yellow-400"
                style={{
                  width: `${(distribution[star] || 0) / maxCount * 100}%`,
                }}
              />
            </div>
            <span className="text-xs text-gray-500 w-12">
              {distribution[star] || 0}
            </span>
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <AdminLayout user={user} onLogout={onLogout} title="Manage Ratings">
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout user={user} onLogout={onLogout} title="Manage Ratings">
      <Flash
        isOpen={flash.isOpen}
        onClose={() => setFlash((prev) => ({ ...prev, isOpen: false }))}
        type={flash.type}
        title={flash.title}
        message={flash.message}
      />

      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, id: null, userName: "", itemName: "", type: "destination" })}
        onConfirm={confirmDelete}
        title={`Delete ${deleteModal.type === "destinations" ? "Rating" : "Hotel Rating"}`}
        message={`Are you sure you want to delete the rating from "${deleteModal.userName}" for "${deleteModal.itemName}"?`}
        confirmText="Delete"
        cancelText="Cancel"
      />

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex -mb-px">
          <button
            onClick={() => setActiveTab("destinations")}
            className={`py-2 px-4 font-medium text-sm border-b-2 transition ${
              activeTab === "destinations"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Destination Ratings
          </button>
          <button
            onClick={() => setActiveTab("hotels")}
            className={`py-2 px-4 font-medium text-sm border-b-2 transition ml-6 ${
              activeTab === "hotels"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Hotel Ratings
          </button>
        </nav>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-500 mb-1">
            {activeTab === "destinations" ? "Total Destination Ratings" : "Total Hotel Ratings"}
          </p>
          <p className="text-3xl font-bold text-indigo-600">{stats.total}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-500 mb-1">Average Rating</p>
          <p className="text-3xl font-bold text-yellow-500">{stats.average.toFixed(1)} ★</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-500 mb-1">5-Star Ratings</p>
          <p className="text-3xl font-bold text-green-600">{stats.distribution[5] || 0}</p>
        </div>
      </div>

      {/* Rating Distribution */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-bold mb-4">Rating Distribution</h2>
        <RatingDistribution distribution={stats.distribution} />
      </div>

      {/* Ratings Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  {activeTab === "destinations" ? "Destination" : "Hotel"}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rating</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Review</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {ratings.map((rating) => (
                <tr key={rating.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-sm font-medium">{rating.userName}</p>
                      <p className="text-xs text-gray-500">{rating.userEmail}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      to={activeTab === "destinations" 
                        ? `/destination/${rating.destinationId}`
                        : `/hotel/${rating.hotelId}`
                      }
                      className="text-sm text-indigo-600 hover:underline"
                      target="_blank"
                    >
                      {rating.itemName}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{getRatingStars(rating.rating)}</td>
                  <td className="px-4 py-3 max-w-xs">
                    <p className="text-sm text-gray-700 truncate" title={rating.review}>
                      {rating.review || <span className="text-gray-400 italic">No review</span>}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{formatDate(rating.date)}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleDeleteClick(rating.id, rating.userName, rating.itemName)}
                      className="text-red-600 text-sm hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {ratings.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No {activeTab === "destinations" ? "destination" : "hotel"} ratings found.
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminRatings;