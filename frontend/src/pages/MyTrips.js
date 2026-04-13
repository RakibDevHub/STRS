import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Flash from "../components/FlashMessage";
import ConfirmationModal from "../components/ConfirmationModal";

const MyTrips = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  // Flash message
  const [flash, setFlash] = useState({
    isOpen: false,
    type: "info",
    title: "",
    message: "",
  });

  const showFlash = (type, title, message) => {
    setFlash({ isOpen: true, type, title, message });
    setTimeout(() => setFlash((prev) => ({ ...prev, isOpen: false })), 3000);
  };

  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    tripId: null,
    tripName: "",
    action: "delete", // 'delete' or 'cancel'
  });

  const fetchTrips = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `http://localhost:5000/api/user/trips?userId=${user.id}`,
      );
      const data = await res.json();

      if (data.success) {
        setTrips(data.trips);
      } else {
        showFlash("error", "Error", "Failed to load trips");
      }
    } catch (error) {
      console.error("Error fetching trips:", error);
      showFlash("error", "Network Error", "Could not connect to server");
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    fetchTrips();
  }, [user, navigate, fetchTrips]);

  const handleDeleteClick = (tripId, tripName) => {
    setConfirmModal({
      isOpen: true,
      tripId,
      tripName,
      action: "delete",
    });
  };

  const handleCancelClick = (tripId, tripName) => {
    setConfirmModal({
      isOpen: true,
      tripId,
      tripName,
      action: "cancel",
    });
  };

  const handleConfirmAction = async () => {
    if (confirmModal.action === "delete") {
      await handleConfirmDelete();
    } else if (confirmModal.action === "cancel") {
      await handleConfirmCancel();
    }
  };

  const handleConfirmDelete = async () => {
    try {
      const res = await fetch(
        `http://localhost:5000/api/user/trips/${confirmModal.tripId}`,
        {
          method: "DELETE",
        },
      );
      const data = await res.json();

      if (data.success) {
        setTrips(trips.filter((t) => t.id !== confirmModal.tripId));
        showFlash(
          "success",
          "Deleted",
          `Trip "${confirmModal.tripName}" has been deleted.`,
        );
      } else {
        showFlash("error", "Error", data.error || "Failed to delete trip");
      }
    } catch (error) {
      console.error("Error deleting trip:", error);
      showFlash("error", "Network Error", "Could not connect to server");
    }
  };

  const handleConfirmCancel = async () => {
    try {
      const res = await fetch(
        `http://localhost:5000/api/user/trips/${confirmModal.tripId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: "cancelled",
            userId: user.id,
          }),
        },
      );
      const data = await res.json();

      if (data.success) {
        // Update the trip status in the list
        setTrips(
          trips.map((trip) =>
            trip.id === confirmModal.tripId
              ? { ...trip, status: "cancelled" }
              : trip,
          ),
        );

        const message = data.refund_requested
          ? `Your trip "${confirmModal.tripName}" has been cancelled. A refund request has been automatically submitted.`
          : `Your trip "${confirmModal.tripName}" has been cancelled.`;

        showFlash("success", "Cancelled", message);
      } else {
        showFlash("error", "Error", data.error || "Failed to cancel trip");
      }
    } catch (error) {
      console.error("Error cancelling trip:", error);
      showFlash("error", "Network Error", "Could not connect to server");
    }
  };

  const handleBookNow = (trip) => {
    navigate(`/booking/${trip.id}`);
  };

  const handleEditClick = (destinationId, tripId) => {
    navigate(`/destination/${destinationId}?edit=${tripId}`);
  };

  const closeConfirmModal = () => {
    setConfirmModal({
      isOpen: false,
      tripId: null,
      tripName: "",
      action: "delete",
    });
  };

  const formatCurrency = (amount) => {
    return `Tk ${new Intl.NumberFormat("en-BD", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Helper function to get smart trip status
  const getSmartStatus = (trip) => {
    const today = new Date();
    const travelDate = new Date(trip.travelDate);
    today.setHours(0, 0, 0, 0);
    travelDate.setHours(0, 0, 0, 0);

    if (trip.status === "cancelled") return "cancelled";
    if (trip.status === "planned") return "planned";
    if (trip.status === "booked" || trip.status === "confirmed") {
      if (travelDate > today) return "upcoming";
      if (travelDate.getTime() === today.getTime()) return "ongoing";
      if (travelDate < today) return "completed";
    }
    if (trip.status === "pending") return "pending";
    return trip.status;
  };

  // Get badge for smart status
  const getSmartStatusBadge = (trip) => {
    const smartStatus = getSmartStatus(trip);

    const badges = {
      planned: "bg-yellow-100 text-yellow-800 border-yellow-200",
      pending: "bg-orange-100 text-orange-800 border-orange-200",
      upcoming: "bg-blue-100 text-blue-800 border-blue-200",
      ongoing: "bg-purple-100 text-purple-800 border-purple-200",
      completed: "bg-green-100 text-green-800 border-green-200",
      cancelled: "bg-red-100 text-red-800 border-red-200",
    };

    const icons = {
      planned: "📝",
      pending: "⏳",
      upcoming: "🔜",
      ongoing: "🎒",
      completed: "✅",
      cancelled: "❌",
    };

    const labels = {
      planned: "Draft",
      pending: "Pending",
      upcoming: "Upcoming",
      ongoing: "Ongoing",
      completed: "Completed",
      cancelled: "Cancelled",
    };

    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-medium border ${badges[smartStatus]}`}
      >
        {icons[smartStatus]} {labels[smartStatus]}
      </span>
    );
  };

  // Get counts for each smart status
  const getStatusCounts = () => {
    const counts = {
      all: trips.length,
      planned: trips.filter((t) => getSmartStatus(t) === "planned").length,
      pending: trips.filter((t) => getSmartStatus(t) === "pending").length,
      upcoming: trips.filter((t) => getSmartStatus(t) === "upcoming").length,
      ongoing: trips.filter((t) => getSmartStatus(t) === "ongoing").length,
      completed: trips.filter((t) => getSmartStatus(t) === "completed").length,
      cancelled: trips.filter((t) => getSmartStatus(t) === "cancelled").length,
    };
    return counts;
  };

  const filteredTrips =
    filter === "all"
      ? trips
      : trips.filter((t) => getSmartStatus(t) === filter);

  const counts = getStatusCounts();

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

      {/* Flash Message */}
      <Flash
        isOpen={flash.isOpen}
        onClose={() => setFlash((prev) => ({ ...prev, isOpen: false }))}
        type={flash.type}
        title={flash.title}
        message={flash.message}
      />

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={closeConfirmModal}
        onConfirm={handleConfirmAction}
        title={confirmModal.action === "delete" ? "Delete Trip" : "Cancel Trip"}
        message={
          confirmModal.action === "delete"
            ? `Are you sure you want to delete "${confirmModal.tripName}"? This action cannot be undone.`
            : `Are you sure you want to cancel "${confirmModal.tripName}"? This action cannot be undone.`
        }
        confirmText={
          confirmModal.action === "delete" ? "Delete" : "Yes, Cancel"
        }
        cancelText="No, Keep"
        confirmButtonClass="bg-red-600 hover:bg-red-700"
      />

      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 text-white">
        <div className="container mx-auto px-4 py-12">
          <h1 className="text-4xl font-bold mb-2">My Trips</h1>
          <p className="text-xl text-indigo-100 mb-4">
            {trips.length} {trips.length === 1 ? "trip" : "trips"}
          </p>
          <Link
            to="/plan-trip"
            className="bg-white text-indigo-600 px-8 py-3 rounded-lg font-semibold hover:bg-indigo-50 transition-all transform hover:scale-105 shadow-lg inline-block"
          >
            Plan New Trip →
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {trips.length === 0 ? (
          // Empty State
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center max-w-2xl mx-auto">
            <div className="text-8xl mb-4">🗺️</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              No Trips Planned Yet
            </h2>
            <p className="text-gray-500 mb-6">
              Start by exploring destinations and saving your favorite trips!
            </p>
            <Link
              to="/plan-trip"
              className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
            >
              Plan Your First Trip →
            </Link>
          </div>
        ) : (
          <>
            {/* Smart Filter Tabs */}
            <div className="flex flex-wrap gap-4 mb-6">
              <button
                onClick={() => setFilter("all")}
                className={`px-4 py-2 rounded-lg font-medium transition-all transform hover:scale-105 shadow-lg ${
                  filter === "all"
                    ? "bg-indigo-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-100"
                }`}
              >
                All Trips ({counts.all})
              </button>
              <button
                onClick={() => setFilter("planned")}
                className={`px-4 py-2 rounded-lg font-medium transition-all transform hover:scale-105 shadow-lg ${
                  filter === "planned"
                    ? "bg-yellow-500 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-100"
                }`}
              >
                📝 Draft ({counts.planned})
              </button>
              <button
                onClick={() => setFilter("pending")}
                className={`px-4 py-2 rounded-lg font-medium transition-all transform hover:scale-105 shadow-lg ${
                  filter === "pending"
                    ? "bg-orange-500 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-100"
                }`}
              >
                ⏳ Pending ({counts.pending})
              </button>
              <button
                onClick={() => setFilter("upcoming")}
                className={`px-4 py-2 rounded-lg font-medium transition-all transform hover:scale-105 shadow-lg ${
                  filter === "upcoming"
                    ? "bg-blue-500 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-100"
                }`}
              >
                🔜 Upcoming ({counts.upcoming})
              </button>
              <button
                onClick={() => setFilter("ongoing")}
                className={`px-4 py-2 rounded-lg font-medium transition-all transform hover:scale-105 shadow-lg ${
                  filter === "ongoing"
                    ? "bg-purple-500 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-100"
                }`}
              >
                🎒 Ongoing ({counts.ongoing})
              </button>
              <button
                onClick={() => setFilter("completed")}
                className={`px-4 py-2 rounded-lg font-medium transition-all transform hover:scale-105 shadow-lg ${
                  filter === "completed"
                    ? "bg-green-500 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-100"
                }`}
              >
                ✅ Completed ({counts.completed})
              </button>
              <button
                onClick={() => setFilter("cancelled")}
                className={`px-4 py-2 rounded-lg font-medium transition-all transform hover:scale-105 shadow-lg ${
                  filter === "cancelled"
                    ? "bg-red-500 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-100"
                }`}
              >
                ❌ Cancelled ({counts.cancelled})
              </button>
            </div>

            {/* Trips Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTrips.map((trip) => {
                const smartStatus = getSmartStatus(trip);
                const today = new Date();
                const travelDate = new Date(trip.travelDate);
                today.setHours(0, 0, 0, 0);
                travelDate.setHours(0, 0, 0, 0);
                const daysUntil = Math.ceil(
                  (travelDate - today) / (1000 * 60 * 60 * 24),
                );

                return (
                  <div
                    key={trip.id}
                    className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition group flex flex-col h-full"
                  >
                    {/* Trip Header Image */}
                    <div className="h-32 bg-gradient-to-r from-indigo-500 to-purple-500 relative flex-shrink-0">
                      {trip.destination?.image ? (
                        <img
                          src={`http://localhost:5000${trip.destination.image}`}
                          alt={trip.destination.name}
                          className="w-full h-full object-cover opacity-40"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-4xl">🏝️</span>
                        </div>
                      )}

                      {/* Smart Status Badge */}
                      <div className="absolute top-3 right-3">
                        {getSmartStatusBadge(trip)}
                      </div>

                      {/* Special badges for upcoming/ongoing */}
                      {smartStatus === "upcoming" && daysUntil <= 7 && (
                        <div className="absolute top-3 left-3">
                          <span className="px-2 py-1 bg-orange-500 text-white text-xs rounded-full shadow-lg">
                            🔥 {daysUntil} {daysUntil === 1 ? "day" : "days"} to
                            go!
                          </span>
                        </div>
                      )}

                      {smartStatus === "ongoing" && (
                        <div className="absolute top-3 left-3">
                          <span className="px-2 py-1 bg-green-500 text-white text-xs rounded-full shadow-lg animate-pulse">
                            🎒 Traveling Today!
                          </span>
                        </div>
                      )}

                      {/* Trip Name */}
                      <div className="absolute bottom-3 left-3 right-3">
                        <h3 className="text-white font-bold text-lg truncate">
                          {trip.name}
                        </h3>
                        <p className="text-indigo-100 text-sm">
                          {trip.destination?.name}
                        </p>
                      </div>
                    </div>

                    {/* Trip Details */}
                    <div className="p-4 flex flex-col flex-grow">
                      {/* Content section */}
                      <div className="flex-grow">
                        {/* Quick Info */}
                        <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                          <span className="flex items-center">
                            <span className="mr-1">📅</span>{" "}
                            {formatDate(trip.travelDate)}
                          </span>
                          <span className="flex items-center">
                            <span className="mr-1">👥</span> {trip.people}{" "}
                            {trip.people === 1 ? "person" : "people"}
                          </span>
                          <span className="flex items-center">
                            <span className="mr-1">⏱️</span> {trip.durationDays}{" "}
                            days
                          </span>
                        </div>

                        {/* Cost Summary */}
                        <div className="bg-gray-50 rounded-lg p-3 mb-3">
                          {/* Items to book now */}
                          <div className="mb-2 pb-2 border-b border-gray-200">
                            <p className="text-xs font-medium text-gray-700 mb-1">
                              Pay at booking:
                            </p>
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-xs text-gray-500">
                                🏨 Hotel
                              </span>
                              <span className="text-sm font-medium text-indigo-600">
                                {formatCurrency(trip.costs.hotel)}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-gray-500">
                                🚌 Transport
                              </span>
                              <span className="text-sm font-medium text-indigo-600">
                                {formatCurrency(trip.costs.transport)}
                              </span>
                            </div>
                          </div>

                          {/* Items to pay later */}
                          <div className="mb-2">
                            <p className="text-xs font-medium text-gray-700 mb-1">
                              Pay during trip:
                            </p>
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-xs text-gray-500">
                                🍽️ Food
                              </span>
                              <span className="text-sm font-medium text-gray-600">
                                {formatCurrency(trip.costs.food)}
                              </span>
                            </div>
                            {trip.costs.activities > 0 && (
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-500">
                                  🎯 Activities
                                </span>
                                <span className="text-sm font-medium text-gray-600">
                                  {formatCurrency(trip.costs.activities)}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Total to pay now */}
                          <div className="border-t border-gray-200 pt-2 mt-2">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-bold">
                                Total to pay now
                              </span>
                              <span className="text-lg font-bold text-green-600">
                                {formatCurrency(
                                  trip.costs.hotel + trip.costs.transport,
                                )}
                              </span>
                            </div>
                            <p className="text-xs text-gray-400 mt-1">
                              Food & activities can be paid during your trip
                            </p>
                          </div>
                        </div>

                        {/* Selected Options Preview */}
                        <div className="space-y-2 mb-3">
                          <p className="text-xs text-gray-500">Selected:</p>
                          <div className="flex flex-wrap gap-1">
                            <span className="inline-flex items-center px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs">
                              🏨 Hotel
                            </span>
                            <span className="inline-flex items-center px-2 py-0.5 bg-green-100 text-green-800 rounded text-xs">
                              🚌 Transport
                            </span>
                            <span className="inline-flex items-center px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded text-xs">
                              🍽️ Food
                            </span>
                          </div>
                        </div>

                        {/* Activities List */}
                        <div className="mb-4">
                          {trip.activities && trip.activities.length > 0 ? (
                            <>
                              <p className="text-xs text-gray-500 mb-1 flex items-center">
                                <span className="mr-1">🎯</span> Activities (
                                {trip.activities.length}):
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {trip.activities.map((activity, idx) => (
                                  <span
                                    key={idx}
                                    className="inline-flex items-center px-2 py-0.5 bg-purple-100 text-purple-800 rounded text-xs"
                                    title={
                                      activity.cost > 0
                                        ? `Cost: ${formatCurrency(activity.cost)}`
                                        : "Free"
                                    }
                                  >
                                    {activity.name}
                                    {activity.cost > 0 && (
                                      <span className="ml-1 text-purple-600">
                                        ({formatCurrency(activity.cost)})
                                      </span>
                                    )}
                                  </span>
                                ))}
                              </div>
                            </>
                          ) : (
                            <p className="text-xs text-gray-400 italic">
                              No activities selected
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Footer section - always at bottom */}
                      <div className="mt-auto">
                        {/* Smart status message */}
                        {smartStatus === "completed" && (
                          <p className="text-xs text-green-600 mb-2 text-center">
                            ✨ Trip completed! Share your experience.
                          </p>
                        )}

                        {smartStatus === "upcoming" &&
                          daysUntil > 0 &&
                          daysUntil <= 7 && (
                            <p className="text-xs text-orange-600 mb-2 text-center">
                              ⏰ Get ready! Your trip starts in {daysUntil}{" "}
                              days.
                            </p>
                          )}

                        {smartStatus === "pending" && (
                          <p className="text-xs text-orange-600 mb-2 text-center">
                            ⏳ Awaiting admin confirmation
                          </p>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-2">
                          <Link
                            to={`/my-trip/${trip.id}`}
                            className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition-all transform hover:scale-105 shadow-lg text-sm text-center leading-loose"
                          >
                            View Details
                          </Link>

                          {/* For Planned/Draft trips - Show Book Now, Edit, and Delete */}
                          {smartStatus === "planned" && (
                            <>
                              <button
                                onClick={() => handleBookNow(trip)}
                                className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-all transform hover:scale-105 shadow-lg text-sm"
                              >
                                Book Now
                              </button>
                              <button
                                onClick={() =>
                                  handleEditClick(trip.destination.id, trip.id)
                                }
                                className="px-3 py-2 border border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50 transition-all transform hover:scale-105 shadow-lg"
                                title="Edit Trip"
                              >
                                ✏️
                              </button>
                              <button
                                onClick={() =>
                                  handleDeleteClick(trip.id, trip.name)
                                }
                                className="px-3 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-all transform hover:scale-105 shadow-lg"
                                title="Delete Trip"
                              >
                                🗑️
                              </button>
                            </>
                          )}

                          {/* For Pending/Upcoming/Ongoing trips - Show Cancel button only */}
                          {(smartStatus === "pending" ||
                            smartStatus === "upcoming" ||
                            smartStatus === "ongoing") && (
                            <button
                              onClick={() =>
                                handleCancelClick(trip.id, trip.name)
                              }
                              className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition-all transform hover:scale-105 shadow-lg text-sm"
                            >
                              Cancel Trip
                            </button>
                          )}

                          {/* For Cancelled trips - Show refund status */}
                          {smartStatus === "cancelled" && (
                            <div className="flex-1">
                              {trip.refund?.display === "refunded" && (
                                <div className="bg-green-50 text-green-600 py-2 rounded-lg text-sm text-center border border-green-200">
                                  ✅ Refunded
                                </div>
                              )}
                              {trip.refund?.display === "processing" && (
                                <div className="bg-yellow-50 text-yellow-600 py-2 rounded-lg text-sm text-center border border-yellow-200">
                                  ⏳ Refund Processing
                                </div>
                              )}
                              {trip.refund?.display === "rejected" && (
                                <div className="bg-red-50 text-red-600 py-2 rounded-lg text-sm text-center border border-red-200">
                                  ❌ Refund Rejected
                                </div>
                              )}
                              {!trip.refund?.requested && (
                                <div className="bg-gray-50 text-gray-600 py-2 rounded-lg text-sm text-center border border-gray-200">
                                  Cancelled
                                </div>
                              )}
                            </div>
                            
                          )}
                        </div>

                        {/* Created Date */}
                        <p className="text-xs text-gray-400 mt-3 text-center">
                          Saved on {formatDate(trip.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default MyTrips;
