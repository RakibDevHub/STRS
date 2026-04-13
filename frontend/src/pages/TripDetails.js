import React, { useState, useEffect, useCallback } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Flash from "../components/FlashMessage";
import ConfirmationModal from "../components/ConfirmationModal";
import RatingModal from "../components/RatingModal";

const TripDetails = ({ user, onLogout }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDestinationRating, setShowDestinationRating] = useState(false);
  const [showHotelRating, setShowHotelRating] = useState(false);
  const [hasRatedDestination, setHasRatedDestination] = useState(false);
  const [hasRatedHotel, setHasRatedHotel] = useState(false);

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

  // Cancel modal state
  const [cancelModal, setCancelModal] = useState({
    isOpen: false,
    tripId: null,
    tripName: "",
  });

  // Delete modal state (for draft trips ONLY)
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    tripId: null,
    tripName: "",
  });

  const checkExistingRatings = useCallback(
    async (destId, hotelId) => {
      try {
        const destRes = await fetch(
          `http://localhost:5000/api/ratings/check?userId=${user.id}&destId=${destId}`,
        );
        const destData = await destRes.json();
        setHasRatedDestination(destData.exists);

        if (hotelId) {
          const hotelRes = await fetch(
            `http://localhost:5000/api/hotel-ratings/check?userId=${user.id}&hotelId=${hotelId}`,
          );
          const hotelData = await hotelRes.json();
          setHasRatedHotel(hotelData.exists);
        }
      } catch (error) {
        console.error("Error checking ratings:", error);
      }
    },
    [user],
  );

  const fetchTripDetails = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`http://localhost:5000/api/user/trips/${id}`);
      const data = await res.json();

      if (data.success) {
        setTrip(data.trip);

        if (user && data.trip.destination?.id) {
          checkExistingRatings(data.trip.destination.id, data.trip.hotel?.id);
        }
      } else {
        showFlash("error", "Error", "Failed to load trip details");
      }
    } catch (error) {
      console.error("Error fetching trip:", error);
      showFlash("error", "Network Error", "Could not connect to server");
    } finally {
      setLoading(false);
    }
  }, [id, user, checkExistingRatings]);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    fetchTripDetails();
  }, [user, navigate, fetchTripDetails]);

  const handleBookNow = () => {
    navigate(`/booking/${id}`);
  };

  const handleEditClick = (destinationId, tripId) => {
    navigate(`/destination/${destinationId}?edit=${tripId}`);
  };

  const handleDeleteClick = (tripId, tripName) => {
    setDeleteModal({
      isOpen: true,
      tripId,
      tripName,
    });
  };

  const handleCancelClick = (tripId, tripName) => {
    setCancelModal({
      isOpen: true,
      tripId,
      tripName,
    });
  };

  const closeCancelModal = () => {
    setCancelModal({ isOpen: false, tripId: null, tripName: "" });
  };

  const closeDeleteModal = () => {
    setDeleteModal({ isOpen: false, tripId: null, tripName: "" });
  };

  const handleConfirmDelete = async () => {
    try {
      const res = await fetch(
        `http://localhost:5000/api/user/trips/${deleteModal.tripId}`,
        {
          method: "DELETE",
        },
      );
      const data = await res.json();

      if (data.success) {
        showFlash(
          "success",
          "Deleted",
          `Trip "${deleteModal.tripName}" has been deleted.`,
          () => navigate("/my-trips"),
          3000,
        );
        closeDeleteModal();
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
        `http://localhost:5000/api/user/trips/${cancelModal.tripId}`,
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
        setTrip({ ...trip, status: "cancelled" });

        const message = data.refund_requested
          ? `Your trip "${cancelModal.tripName}" has been cancelled. A refund request has been automatically submitted.`
          : `Your trip "${cancelModal.tripName}" has been cancelled.`;

        showFlash("success", "Trip Cancelled", message);
        closeCancelModal();
      } else {
        showFlash("error", "Error", data.error || "Failed to cancel trip");
      }
    } catch (error) {
      console.error("Error cancelling trip:", error);
      showFlash("error", "Network Error", "Could not connect to server");
    }
  };

  const handleDestinationRatingSubmit = async (rating, review) => {
    try {
      const res = await fetch("http://localhost:5000/api/ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          destId: trip.destination.id,
          rating,
          review,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setHasRatedDestination(true);
        setShowDestinationRating(false);
        showFlash(
          "success",
          "Thank You!",
          "Your destination review has been submitted.",
        );
        fetchTripDetails();
      } else {
        showFlash("error", "Error", data.error || "Failed to submit review");
      }
    } catch (error) {
      console.error("Error submitting rating:", error);
      showFlash("error", "Network Error", "Could not connect to server");
    }
  };

  const handleHotelRatingSubmit = async (rating, review) => {
    try {
      const res = await fetch("http://localhost:5000/api/hotel-ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          hotelId: trip.hotel.id,
          rating,
          review,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setHasRatedHotel(true);
        setShowHotelRating(false);
        showFlash(
          "success",
          "Thank You!",
          "Your hotel review has been submitted.",
        );
        fetchTripDetails();
      } else {
        showFlash("error", "Error", data.error || "Failed to submit review");
      }
    } catch (error) {
      console.error("Error submitting hotel rating:", error);
      showFlash("error", "Network Error", "Could not connect to server");
    }
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
      month: "long",
      day: "numeric",
    });
  };

  const isTripCompleted = () => {
    if (!trip) return false;
    const today = new Date();
    const travelDate = new Date(trip.travelDate);
    today.setHours(0, 0, 0, 0);
    travelDate.setHours(0, 0, 0, 0);
    return trip.status === "booked" && travelDate < today;
  };

  const isTripPending = () => {
    return trip?.status === "pending";
  };

  const getStatusBadge = (status) => {
    const badges = {
      planned: "bg-yellow-100 text-yellow-800",
      pending: "bg-orange-100 text-orange-800",
      booked: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
    };
    const icons = {
      planned: "📝",
      pending: "⏳",
      booked: "✅",
      cancelled: "❌",
    };
    return (
      <span
        className={`px-3 py-1 rounded-full text-sm font-medium ${badges[status] || badges.planned}`}
      >
        {icons[status]} {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getAmenitiesList = (amenities) => {
    if (!amenities) return [];
    if (Array.isArray(amenities)) return amenities;
    return amenities.split(",").map((item) => item.trim());
  };

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

  if (!trip) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar user={user} onLogout={onLogout} />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-500">Trip not found</p>
        </div>
        <Footer />
      </div>
    );
  }

  // Calculate totals
  const totalTripCost =
    trip.costs.hotel +
    trip.costs.transport +
    trip.costs.food +
    (trip.costs.activities || 0);
  const amountToPayNow = trip.costs.hotel + trip.costs.transport;
  const amountToPayLater = trip.costs.food + (trip.costs.activities || 0);
  const completed = isTripCompleted();
  const pending = isTripPending();

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

      {/* Cancel Trip Modal */}
      <ConfirmationModal
        isOpen={cancelModal.isOpen}
        onClose={closeCancelModal}
        onConfirm={handleConfirmCancel}
        title="Cancel Trip"
        message={`Are you sure you want to cancel "${cancelModal.tripName}"? This action cannot be undone.`}
        confirmText="Yes, Cancel Trip"
        cancelText="No, Keep"
        confirmButtonClass="bg-red-600 hover:bg-red-700"
      />

      {/* Delete Trip Modal (for drafts ONLY) */}
      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={closeDeleteModal}
        onConfirm={handleConfirmDelete}
        title="Delete Trip"
        message={`Are you sure you want to delete "${deleteModal.tripName}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        confirmButtonClass="bg-red-600 hover:bg-red-700"
      />

      {/* Destination Rating Modal */}
      <RatingModal
        isOpen={showDestinationRating}
        onClose={() => setShowDestinationRating(false)}
        onSubmit={handleDestinationRatingSubmit}
        title={`Rate ${trip.destination?.name}`}
        type="destination"
      />

      {/* Hotel Rating Modal */}
      <RatingModal
        isOpen={showHotelRating}
        onClose={() => setShowHotelRating(false)}
        onSubmit={handleHotelRatingSubmit}
        title={`Rate ${trip.hotel?.name}`}
        type="hotel"
      />

      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 text-white">
        <div className="container mx-auto px-4 py-12">
          <Link
            to="/my-trips"
            className="text-white/80 hover:text-white mb-4 inline-block"
          >
            ← Back to My Trips
          </Link>
          <h1 className="text-4xl font-bold mb-2">{trip.name}</h1>
          <div className="flex items-center gap-4">
            {getStatusBadge(trip.status)}
            <span className="text-indigo-100">
              {trip.destination?.location}
            </span>
            {completed && (
              <span className="bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-sm font-medium">
                ✨ Completed
              </span>
            )}
            {pending && (
              <span className="bg-orange-400 text-orange-900 px-3 py-1 rounded-full text-sm font-medium">
                ⏳ Awaiting Confirmation
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content - Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Destination Card */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="h-48 bg-gradient-to-r from-indigo-500 to-purple-500 relative">
                {trip.destination?.image ? (
                  <img
                    src={`http://localhost:5000${trip.destination.image}`}
                    alt={trip.destination.name}
                    className="w-full h-full object-cover opacity-40"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-6xl">🏝️</span>
                  </div>
                )}
                <div className="absolute bottom-4 left-4">
                  <h2 className="text-2xl font-bold text-white">
                    {trip.destination?.name}
                  </h2>
                  <p className="text-indigo-100">
                    {trip.destination?.location}
                  </p>
                </div>
              </div>
              <div className="p-6">
                <p className="text-gray-600">{trip.destination?.description}</p>
                <div className="mt-4 flex items-center gap-4 text-sm">
                  <span className="flex items-center text-gray-500">
                    <span className="mr-1">📏</span> Distance:{" "}
                    {trip.destination?.distance} km from Dhaka
                  </span>
                  <span className="flex items-center text-gray-500">
                    <span className="mr-1">⭐</span> Rating:{" "}
                    {trip.destination?.rating}
                  </span>
                  <span className="flex items-center text-gray-500">
                    <span className="mr-1">📅</span> Best Time to Visit:{" "}
                    {trip.destination?.best_time}
                  </span>
                </div>

                {/* Rating Button for Completed Trips */}
                {completed && !hasRatedDestination && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => setShowDestinationRating(true)}
                      className="flex items-center gap-2 text-yellow-600 hover:text-yellow-700 transition"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span>Rate this destination</span>
                    </button>
                  </div>
                )}

                {completed && hasRatedDestination && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-sm text-green-600 flex items-center gap-1">
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Thank you for rating this destination!
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Hotel Details */}
            {trip.hotel && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center">
                  <span className="mr-2">🏨</span> Hotel Details
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="font-semibold text-indigo-700 text-lg">
                      {trip.hotel.name}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {trip.hotel.address}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      ⭐ {trip.hotel.rating} · 📍 {trip.hotel.distance} km from
                      center
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      📞 {trip.hotel.phone}
                    </p>
                    {trip.hotel.amenities && (
                      <div className="mt-2 flex gap-4 text-sm">
                        <div className="flex flex-wrap gap-2">
                          {getAmenitiesList(trip.hotel.amenities).map(
                            (amenity, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-1 bg-blue-100 text-gray-700 rounded-full text-xs"
                              >
                                {amenity}
                              </span>
                            ),
                          )}
                        </div>
                      </div>
                    )}
                    <div className="mt-3 flex gap-4 text-sm">
                      <span className="flex items-center text-gray-600">
                        <span className="mr-1">🕒</span> Check-in:{" "}
                        {trip.hotel.check_in || "12:00 PM"}
                      </span>
                      <span className="flex items-center text-gray-600">
                        <span className="mr-1">🕒</span> Check-out:{" "}
                        {trip.hotel.check_out || "11:00 AM"}
                      </span>
                    </div>
                  </div>
                  <div className="bg-indigo-50 p-4 rounded-lg">
                    <p className="font-medium text-indigo-700">Room Details</p>
                    <div className="mt-2 space-y-2">
                      <p className="text-sm flex justify-between">
                        <span className="text-gray-600">Type:</span>
                        <span className="font-medium">
                          {trip.room?.type} - {trip.room?.bed}
                        </span>
                      </p>
                      <p className="text-sm flex justify-between">
                        <span className="text-gray-600">Price:</span>
                        <span className="font-bold text-indigo-600">
                          {formatCurrency(trip.room?.price)}/night
                        </span>
                      </p>
                      <p className="text-sm flex justify-between">
                        <span className="text-gray-600">Meals:</span>
                        <span className="font-medium">
                          {trip.room?.meals || "None"}
                        </span>
                      </p>
                      <p className="text-sm flex justify-between">
                        <span className="text-gray-600">AC:</span>
                        <span className="font-medium">
                          {trip.room?.ac ? "Yes" : "No"}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Hotel Rating Button for Completed Trips */}
                {completed && !hasRatedHotel && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => setShowHotelRating(true)}
                      className="flex items-center gap-2 text-yellow-600 hover:text-yellow-700 transition-all transform hover:scale-105 shadow-lg"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span>Rate this hotel</span>
                    </button>
                  </div>
                )}

                {completed && hasRatedHotel && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-sm text-green-600 flex items-center gap-1">
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Thank you for rating this hotel!
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Transport Details */}
            {trip.transport && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center">
                  <span className="mr-2">🚌</span> Transport Details
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="font-semibold text-indigo-700 text-lg">
                      {trip.transport.company}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {trip.transport.type} · {trip.transport.comfort}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Route: {trip.transport.from} → {trip.destination?.name}
                    </p>
                    <div className="mt-3 space-y-2">
                      <p className="text-sm flex items-center">
                        <span className="w-20 text-gray-500">Departure:</span>
                        <span className="font-medium text-blue-600">
                          {trip.transport.departure}
                        </span>
                      </p>
                      <p className="text-sm flex items-center">
                        <span className="w-20 text-gray-500">Arrival:</span>
                        <span className="font-medium text-green-600">
                          {trip.transport.arrival}
                        </span>
                      </p>
                      <p className="text-sm flex items-center">
                        <span className="w-20 text-gray-500">Duration:</span>
                        <span className="font-medium">
                          {trip.transport.duration}
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="font-medium text-green-700">Pricing</p>
                    <div className="mt-2 space-y-2">
                      <p className="text-sm flex justify-between">
                        <span className="text-gray-600">One way:</span>
                        <span className="font-medium">
                          {formatCurrency(trip.transport.price)}/person
                        </span>
                      </p>
                      <p className="text-sm flex justify-between">
                        <span className="text-gray-600">Round trip:</span>
                        <span className="font-bold text-green-600">
                          {formatCurrency(trip.transport.price * 2)}/person
                        </span>
                      </p>
                      <p className="text-sm flex justify-between">
                        <span className="text-gray-600">
                          Total for {trip.people} people:
                        </span>
                        <span className="font-bold text-indigo-600">
                          {formatCurrency(trip.costs.transport)}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Food Details Section */}
            {trip.food && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center">
                  <span className="mr-2">🍽️</span> Food Plan
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="font-semibold text-indigo-700 text-lg">
                      {trip.food.name} Meals
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      Daily meal budget per person
                    </p>
                    <div className="mt-4 grid grid-cols-3 gap-2">
                      <div className="bg-orange-50 p-2 rounded text-center">
                        <span className="text-sm block">🍳 Breakfast</span>
                        <span className="font-bold text-orange-600">
                          {formatCurrency(trip.food.breakfast || 0)}
                        </span>
                      </div>
                      <div className="bg-blue-50 p-2 rounded text-center">
                        <span className="text-sm block">🍱 Lunch</span>
                        <span className="font-bold text-blue-600">
                          {formatCurrency(trip.food.lunch || 0)}
                        </span>
                      </div>
                      <div className="bg-purple-50 p-2 rounded text-center">
                        <span className="text-sm block">🍛 Dinner</span>
                        <span className="font-bold text-purple-600">
                          {formatCurrency(trip.food.dinner || 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <p className="font-medium text-yellow-700">Food Budget</p>
                    <div className="mt-2 space-y-2">
                      <p className="text-sm flex justify-between">
                        <span className="text-gray-600">Daily per person:</span>
                        <span className="font-bold">
                          {formatCurrency(trip.food.dailyCost)}
                        </span>
                      </p>
                      <p className="text-sm flex justify-between">
                        <span className="text-gray-600">
                          For {trip.durationDays} days:
                        </span>
                        <span className="font-bold">
                          {formatCurrency(
                            trip.food.dailyCost * trip.durationDays,
                          )}
                          /person
                        </span>
                      </p>
                      <p className="text-sm flex justify-between pt-2 border-t">
                        <span className="font-medium">
                          Total for {trip.people} people:
                        </span>
                        <span className="font-bold text-indigo-600">
                          {formatCurrency(trip.costs.food)}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Activities Section */}
            {trip.activities && trip.activities.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center">
                  <span className="mr-2">🎯</span> Planned Activities (
                  {trip.activities.length})
                </h3>
                <div className="space-y-3">
                  {trip.activities.map((activity, idx) => (
                    <div
                      key={idx}
                      className="border rounded-lg p-4 hover:shadow-md transition"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-gray-800">
                              {activity.name}
                            </p>
                            {activity.cost === 0 && (
                              <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs">
                                FREE
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {activity.description}
                          </p>
                          <div className="flex gap-4 mt-2 text-xs text-gray-500">
                            <span>⏱️ Duration: {activity.duration} hours</span>
                          </div>
                        </div>
                        <div className="text-right">
                          {activity.cost > 0 ? (
                            <>
                              <p className="text-lg font-bold text-purple-600">
                                {formatCurrency(activity.cost)}
                              </p>
                              <p className="text-xs text-gray-500">
                                per person
                              </p>
                              <p className="text-sm font-medium text-indigo-600 mt-1">
                                Total:{" "}
                                {formatCurrency(activity.cost * trip.people)}
                              </p>
                            </>
                          ) : (
                            <span className="text-green-600 font-medium">
                              Free
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Summary & Actions */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-4">
              <h3 className="text-xl font-bold mb-4">Trip Summary</h3>

              {/* Trip Info */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Travel Date</span>
                  <span className="font-medium">
                    {formatDate(trip.travelDate)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Duration</span>
                  <span className="font-medium">{trip.durationDays} days</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Travelers</span>
                  <span className="font-medium">
                    {trip.people} {trip.people === 1 ? "person" : "people"}
                  </span>
                </div>
              </div>

              {/* Complete Cost Breakdown */}
              <div className="border-t border-gray-200 pt-4 mb-6">
                <h4 className="font-semibold mb-3">Complete Cost Breakdown</h4>

                {/* All costs */}
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">🏨 Hotel</span>
                    <span className="font-medium">
                      {formatCurrency(trip.costs.hotel)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">🚌 Transport</span>
                    <span className="font-medium">
                      {formatCurrency(trip.costs.transport)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">🍽️ Food</span>
                    <span className="font-medium">
                      {formatCurrency(trip.costs.food)}
                    </span>
                  </div>
                  {trip.costs.activities > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">🎯 Activities</span>
                      <span className="font-medium">
                        {formatCurrency(trip.costs.activities)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Total Trip Cost */}
                <div className="bg-indigo-50 p-3 rounded-lg mb-3">
                  <div className="flex justify-between items-center">
                    <span className="font-bold">Total Trip Cost</span>
                    <span className="text-xl font-bold text-indigo-600">
                      {formatCurrency(totalTripCost)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Total amount you need to keep for the entire trip
                  </p>
                </div>

                {/* Payment Breakdown */}
                <div className="border-t border-gray-200 pt-3 mt-3">
                  <p className="text-xs font-medium text-gray-500 mb-2">
                    Payment Breakdown:
                  </p>

                  <div className="bg-green-50 p-2 rounded mb-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-green-700">Pay at booking:</span>
                      <span className="font-bold text-green-600">
                        {formatCurrency(amountToPayNow)}
                      </span>
                    </div>
                  </div>

                  <div className="bg-yellow-50 p-2 rounded">
                    <div className="flex justify-between text-sm">
                      <span className="text-yellow-700">Pay during trip:</span>
                      <span className="font-bold text-yellow-600">
                        {formatCurrency(amountToPayLater)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons - Based on Trip Status */}
              <div className="space-y-2">
                {/* For Planned/Draft trips - Show Book Now, Edit, Delete */}
                {trip.status === "planned" && (
                  <>
                    <button
                      onClick={handleBookNow}
                      className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-all transform hover:scale-105 shadow-lg"
                    >
                      Book Now
                    </button>
                    <button
                      onClick={() =>
                        handleEditClick(trip.destination.id, trip.id)
                      }
                      className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-all transform hover:scale-105 shadow-lg"
                    >
                      Edit Trip Details
                    </button>
                    <button
                      onClick={() => handleDeleteClick(trip.id, trip.name)}
                      className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition-all transform hover:scale-105 shadow-lg"
                    >
                      Delete Trip
                    </button>
                  </>
                )}

                {/* For Pending/Booked trips - Show Cancel button only */}
                {(trip.status === "pending" ||
                  trip.status === "booked" ||
                  trip.status === "confirmed") &&
                  !completed && (
                    <>
                      {trip.status === "pending" && (
                        <div className="bg-orange-50 p-3 rounded-lg mb-3 text-center">
                          <p className="text-orange-700 font-medium">
                            ⏳ Payment Pending
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Awaiting admin confirmation
                          </p>
                        </div>
                      )}
                      {trip.status === "booked" && !completed && (
                        <div className="bg-green-50 p-3 rounded-lg mb-3 text-center">
                          <p className="text-green-700 font-medium">
                            ✅ Booking Confirmed
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Enjoy your trip!
                          </p>
                        </div>
                      )}
                      <button
                        onClick={() => handleCancelClick(trip.id, trip.name)}
                        className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition-all transform hover:scale-105 shadow-lg"
                      >
                        Cancel Trip
                      </button>
                    </>
                  )}

                {/* For Completed trips - Show status only */}
                {completed && (
                  <div className="mt-4 p-3 bg-yellow-50 rounded-lg text-center">
                    <p className="text-yellow-700 font-medium">
                      ✨ Trip Completed
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Thank you for traveling with us!
                    </p>
                  </div>
                )}

                {/* For Cancelled trips - Show detailed refund status */}
                {trip.status === "cancelled" && (
                  <div className="bg-red-50 p-4 rounded-lg text-center mb-4">
                    <p className="text-red-700 font-medium mb-2">
                      ❌ Trip Cancelled
                    </p>

                    {trip.refund?.display === "refunded" && (
                      <div className="bg-green-100 text-green-700 p-3 rounded-lg">
                        <p className="font-medium">✅ Refund Processed</p>
                        <p className="text-xs mt-1">
                          Amount:{" "}
                          {formatCurrency(
                            trip.refund.amount || trip.costs.total,
                          )}
                        </p>
                      </div>
                    )}

                    {trip.refund?.display === "processing" && (
                      <div className="bg-yellow-100 text-yellow-700 p-3 rounded-lg">
                        <p className="font-medium">⏳ Refund Processing</p>
                        <p className="text-xs mt-1">
                          Your refund request is being reviewed by admin.
                        </p>
                      </div>
                    )}

                    {trip.refund?.display === "rejected" && (
                      <div className="bg-red-100 text-red-700 p-3 rounded-lg">
                        <p className="font-medium">❌ Refund Rejected</p>
                        {trip.refund.reason && (
                          <p className="text-xs mt-1">
                            Reason: {trip.refund.reason}
                          </p>
                        )}
                      </div>
                    )}

                    {!trip.refund?.requested && (
                      <p className="text-sm text-gray-600">
                        No refund was requested for this cancellation.
                        {trip.refund?.display}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default TripDetails;
