import React, { useState, useEffect, useCallback } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Flash from "../components/FlashMessage";

const Booking = ({ user, onLogout }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  // Payment form state
  const [paymentMethod, setPaymentMethod] = useState("bkash");
  const [transactionId, setTransactionId] = useState("");

  // Flash message
  // Flash message state
  const [flash, setFlash] = useState({
    isOpen: false,
    type: "info",
    title: "",
    message: "",
  });

  // Standard showFlash function - consistent with other pages
  const showFlash = (type, title, message) => {
    setFlash({ isOpen: true, type, title, message });
    setTimeout(() => setFlash((prev) => ({ ...prev, isOpen: false })), 3000);
  };

  const fetchTripDetails = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`http://localhost:5000/api/user/trips/${id}`);
      const data = await res.json();

      if (data.success) {
        setTrip(data.trip);
      } else {
        showFlash("error", "Error", "Failed to load trip details");
      }
    } catch (error) {
      console.error("Error fetching trip:", error);
      showFlash("error", "Network Error", "Could not connect to server");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    fetchTripDetails();
  }, [user, navigate, fetchTripDetails]);

  const handlePaymentMethodChange = (method) => {
    setPaymentMethod(method);
  };

  const handleSubmitBooking = async (e) => {
    e.preventDefault();

    if (!transactionId.trim()) {
      showFlash("error", "Missing Information", "Please enter transaction ID");
      return;
    }

    setProcessing(true);

    try {
      const response = await fetch("http://localhost:5000/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: id,
          userId: user.id,
          paymentMethod: paymentMethod,
          transactionId: transactionId.trim(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        showFlash(
          "success",
          "Booking Confirmed!",
          "Your trip has been booked successfully.",
        );
        navigate("/my-trips");
      } else {
        showFlash(
          "error",
          "Booking Failed",
          data.error || "Something went wrong",
        );
      }
    } catch (error) {
      console.error("Error booking trip:", error);
      showFlash("error", "Network Error", "Could not connect to server");
    } finally {
      setProcessing(false);
    }
  };

  const formatCurrency = (amount) => {
    return `Tk ${new Intl.NumberFormat("en-BD").format(amount)}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
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

  if (trip.status !== "planned") {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar user={user} onLogout={onLogout} />
        <div className="container mx-auto px-4 py-12 max-w-2xl">
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
            <p className="text-yellow-700">
              This trip is already {trip.status}. You cannot book it again.
            </p>
          </div>
          <Link
            to="/my-trips"
            className="text-indigo-600 hover:text-indigo-800"
          >
            ← Back to My Trips
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const amountToPay = (trip.costs?.hotel || 0) + (trip.costs?.transport || 0);

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

      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 text-white">
        <div className="container mx-auto px-4 py-12">
          <Link
            to={`/trip/${id}`}
            className="text-white/80 hover:text-white mb-4 inline-block"
          >
            ← Back to Trip Details
          </Link>
          <h1 className="text-4xl font-bold mb-2">Complete Your Booking</h1>
          <p className="text-xl text-indigo-100">{trip.name}</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Booking Summary */}
          <div>
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-6">Booking Summary</h2>

              {/* Trip Info */}
              <div className="space-y-4 mb-6">
                <div className="flex justify-between pb-2 border-b">
                  <span className="text-gray-600">Destination</span>
                  <span className="font-medium">{trip.destination?.name}</span>
                </div>
                <div className="flex justify-between pb-2 border-b">
                  <span className="text-gray-600">Travel Date</span>
                  <span className="font-medium">
                    {formatDate(trip.travelDate)}
                  </span>
                </div>
                <div className="flex justify-between pb-2 border-b">
                  <span className="text-gray-600">Duration</span>
                  <span className="font-medium">{trip.durationDays} days</span>
                </div>
                <div className="flex justify-between pb-2 border-b">
                  <span className="text-gray-600">Travelers</span>
                  <span className="font-medium">{trip.people} people</span>
                </div>
              </div>

              {/* Selected Options */}
              <h3 className="font-semibold mb-3">Your Selections</h3>
              <div className="space-y-3 mb-6">
                {trip.hotel && (
                  <div className="bg-indigo-50 p-3 rounded-lg">
                    <p className="font-medium text-indigo-700">🏨 Hotel</p>
                    <p className="text-sm">{trip.hotel.name}</p>
                    <p className="text-xs text-gray-500">
                      {trip.room?.type} · {trip.room?.bed}
                    </p>
                  </div>
                )}
                {trip.transport && (
                  <div className="bg-green-50 p-3 rounded-lg">
                    <p className="font-medium text-green-700">🚌 Transport</p>
                    <p className="text-sm">{trip.transport.company}</p>
                    <p className="text-xs text-gray-500">
                      {trip.transport.type} · {trip.transport.duration}
                    </p>
                  </div>
                )}
                {trip.food && (
                  <div className="bg-yellow-50 p-3 rounded-lg">
                    <p className="font-medium text-yellow-700">🍽️ Food</p>
                    <p className="text-sm">{trip.food.name} Meals</p>
                  </div>
                )}
              </div>

              {/* Cost Breakdown */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-3">Payment Breakdown</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>🏨 Hotel</span>
                    <span>{formatCurrency(trip.costs?.hotel || 0)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>🚌 Transport</span>
                    <span>{formatCurrency(trip.costs?.transport || 0)}</span>
                  </div>
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between font-bold">
                      <span>Total to Pay</span>
                      <span className="text-green-600">
                        {formatCurrency(amountToPay)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Food and activities can be paid during your trip
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Form */}
          <div>
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-6">Payment Details</h2>

              <form onSubmit={handleSubmitBooking} className="space-y-6">
                {/* Payment Method */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Select Payment Method
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {["bkash", "nagad", "rocket"].map((method) => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => handlePaymentMethodChange(method)}
                        className={`p-3 border rounded-lg text-center capitalize transition ${
                          paymentMethod === method
                            ? "border-indigo-600 bg-indigo-50 text-indigo-600"
                            : "border-gray-200 hover:border-indigo-300"
                        }`}
                      >
                        {method === "bkash" && "📱 bKash"}
                        {method === "nagad" && "💳 Nagad"}
                        {method === "rocket" && "🚀 Rocket"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Payment Instructions */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-800 mb-2">
                    Send {formatCurrency(amountToPay)} to this number:
                  </p>
                  <p className="font-mono bg-white p-2 rounded border text-center font-bold">
                    {paymentMethod === "bkash" && "017XXXXXXXX"}
                    {paymentMethod === "nagad" && "018XXXXXXXX"}
                    {paymentMethod === "rocket" && "019XXXXXXXX"}
                  </p>
                  <p className="text-xs text-blue-600 mt-2">
                    After sending money, enter the transaction ID below
                  </p>
                </div>

                {/* Transaction ID */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Transaction ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    placeholder="Enter transaction ID (e.g., 8N7A2D9F)"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={processing || !transactionId.trim()}
                  className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {processing ? (
                    <span className="flex items-center justify-center">
                      <svg
                        className="animate-spin h-5 w-5 mr-2"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Processing...
                    </span>
                  ) : (
                    `Confirm Payment (${formatCurrency(amountToPay)})`
                  )}
                </button>

                <p className="text-xs text-gray-400 text-center">
                  Your booking will be confirmed immediately after payment
                  verification
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Booking;
