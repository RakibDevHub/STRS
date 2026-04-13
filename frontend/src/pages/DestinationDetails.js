import React, { useState, useEffect, useCallback } from "react";
import { Link, useParams, useNavigate, useLocation } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Flash from "../components/FlashMessage";

const DestinationDetails = ({ user, onLogout, mode = "browse" }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Check if we're in edit mode
  const queryParams = new URLSearchParams(location.search);
  const editTripId = queryParams.get("edit");

  const [destination, setDestination] = useState(null);
  const [allHotels, setAllHotels] = useState([]);
  const [transport, setTransport] = useState([]);
  const [foodCategories, setFoodCategories] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userInput, setUserInput] = useState(null);
  const [tripData, setTripData] = useState(null);

  // State for planning
  const [showPlanner, setShowPlanner] = useState(
    mode === "recommendation" || editTripId,
  );
  const [travelDate, setTravelDate] = useState("");
  const [duration, setDuration] = useState(3);
  const [people, setPeople] = useState(2);

  // Selections
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedTransport, setSelectedTransport] = useState(null);
  const [selectedFoodCategory, setSelectedFoodCategory] = useState(null);
  const [selectedActivities, setSelectedActivities] = useState([]);

  // Cost calculation
  const [totalCost, setTotalCost] = useState(0);
  const [remainingBudget, setRemainingBudget] = useState(0);

  // UI state
  const [saving, setSaving] = useState(false);

  // Flash message state
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

  // Determine back link
  const getBackLink = () => {
    if (editTripId) return `/my-trip/${editTripId}`;
    if (mode === "recommendation") return "/recommendations";
    return location.state?.from || "/";
  };

  const getBackLabel = () => {
    if (editTripId) return "Trip Details";
    if (mode === "recommendation") return "Recommendations";
    return location.state?.label || "Home";
  };

  // Calculate rooms needed
  const calculateRoomsNeeded = useCallback(
    (maxGuests) => Math.ceil(people / maxGuests),
    [people],
  );

  // Fetch trip data if in edit mode
  useEffect(() => {
    const fetchTripData = async () => {
      if (!editTripId || !user) return;
      try {
        const res = await fetch(
          `http://localhost:5000/api/user/trips/${editTripId}`,
        );
        const data = await res.json();
        if (data.success) setTripData(data.trip);
      } catch (error) {
        console.error("Error fetching trip data:", error);
      }
    };
    if (editTripId && user) fetchTripData();
  }, [editTripId, user]);

  // Fetch user input from session if in recommendation mode
  useEffect(() => {
    if (mode === "recommendation") {
      const saved = sessionStorage.getItem("tripPlanner");
      const userInputData = saved ? JSON.parse(saved) : null;
      setUserInput(userInputData);
      if (userInputData) {
        setDuration(userInputData.days);
        setPeople(userInputData.people);
      }
    }
  }, [mode]);

  // Initialize selections with trip data
  useEffect(() => {
    if (
      !tripData ||
      allHotels.length === 0 ||
      transport.length === 0 ||
      foodCategories.length === 0
    )
      return;

    setShowPlanner(true);
    if (tripData.travelDate) {
      // Create date and adjust for timezone
      const date = new Date(tripData.travelDate);
      // Get local date components to avoid timezone shift
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      setTravelDate(`${year}-${month}-${day}`);
    }
    setDuration(tripData.durationDays);
    setPeople(tripData.people);

    // Find and set selected hotel and room
    if (tripData.hotel && tripData.room) {
      const hotel = allHotels.find((h) => h.id === tripData.hotel.id);
      if (hotel) {
        const room = hotel.rooms.find((r) => r.id === tripData.room.id);
        if (room) {
          const roomsNeeded = Math.ceil(tripData.people / room.max_guests);
          setSelectedHotel({ ...hotel, roomsNeeded });
          setSelectedRoom({ ...room, roomsNeeded });
        }
      }
    }

    // Find and set selected transport
    if (tripData.transport) {
      const transportOption = transport.find(
        (t) => t.id === tripData.transport.id,
      );
      if (transportOption) setSelectedTransport(transportOption);
    }

    // Find and set selected food category
    if (tripData.food) {
      const foodCategory = foodCategories.find(
        (f) => f.id === tripData.food.id,
      );
      if (foodCategory) setSelectedFoodCategory(foodCategory);
    }

    // Find and set selected activities
    if (tripData.activities && tripData.activities.length > 0) {
      const activityIds = tripData.activities.map((a) => a.id);
      const selectedActs = activities.filter((a) => activityIds.includes(a.id));
      setSelectedActivities(selectedActs);
    }
  }, [tripData, allHotels, transport, foodCategories, activities]);

  // Fetch destination details
  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          "http://localhost:5000/api/destination-details",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              destId: id,
              budget: userInput?.budget,
              days: userInput?.days,
              people: userInput?.people,
            }),
          },
        );

        const data = await response.json();

        if (data.success) {
          setDestination(data.destination);

          // Filter and sort hotels
          const hotelsWithRooms =
            data.hotels?.filter(
              (hotel) =>
                hotel.rooms &&
                hotel.rooms.length > 0 &&
                hotel.rooms.some((room) => room.available > 0),
            ) || [];

          const hotelsWithSortedRooms = hotelsWithRooms
            .map((hotel) => ({
              ...hotel,
              rooms: hotel.rooms
                ?.filter((room) => room.available > 0)
                .sort((a, b) => a.price - b.price),
            }))
            .filter((hotel) => hotel.rooms.length > 0);

          const sortedHotels = hotelsWithSortedRooms.sort((a, b) => {
            const aMinPrice = Math.min(...a.rooms.map((r) => r.price));
            const bMinPrice = Math.min(...b.rooms.map((r) => r.price));
            return aMinPrice - bMinPrice;
          });

          setAllHotels(sortedHotels);
          setTransport(data.transport || []);
          setFoodCategories(data.foodCategories || []);
          setActivities(data.activities || []);
        }
      } catch (error) {
        console.error("Error fetching details:", error);
        showFlash("error", "Error", "Failed to load destination details.");
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [id, userInput]);

  // Calculate total whenever selections change
  useEffect(() => {
    const nights = duration - 1;
    const hotelCost = selectedRoom
      ? selectedRoom.price *
        nights *
        calculateRoomsNeeded(selectedRoom.max_guests)
      : 0;
    const transportCost = selectedTransport
      ? selectedTransport.price * people * 2
      : 0;
    const foodCost = selectedFoodCategory
      ? selectedFoodCategory.daily * duration * people
      : 0;
    const activitiesCost = selectedActivities.reduce(
      (sum, a) => sum + (a.cost * people || 0),
      0,
    );
    const total = hotelCost + transportCost + foodCost + activitiesCost;
    setTotalCost(total);
    if (userInput) setRemainingBudget(userInput.budget - total);
  }, [
    selectedRoom,
    selectedTransport,
    selectedFoodCategory,
    selectedActivities,
    duration,
    people,
    calculateRoomsNeeded,
    userInput,
  ]);

  const handleSelectHotel = (hotel, room) => {
    const roomsNeeded = calculateRoomsNeeded(room.max_guests);
    setSelectedHotel({ ...hotel, roomsNeeded });
    setSelectedRoom({ ...room, roomsNeeded });
  };

  const handleSelectTransport = (option) => setSelectedTransport(option);
  const handleSelectFoodCategory = (category) =>
    setSelectedFoodCategory(category);

  const toggleActivity = (activity) => {
    setSelectedActivities((prev) => {
      const exists = prev.find((a) => a.id === activity.id);
      return exists
        ? prev.filter((a) => a.id !== activity.id)
        : [...prev, activity];
    });
  };

  const handleSaveTrip = async () => {
    if (!user) return navigate("/login");
    if (
      !selectedHotel ||
      !selectedRoom ||
      !selectedTransport ||
      !selectedFoodCategory ||
      !travelDate
    ) {
      return showFlash(
        "error",
        "Missing Information",
        "Please select hotel, transport, food preference, and travel date before saving.",
      );
    }

    setSaving(true);
    try {
      const nights = duration - 1;
      const roomsNeeded = calculateRoomsNeeded(selectedRoom.max_guests);
      const tripDataPayload = {
        userId: user.id,
        planName: `${destination.name} Trip - ${new Date().toLocaleDateString()}`,
        destinationId: destination.id,
        hotelId: selectedHotel?.id,
        roomId: selectedRoom?.id,
        transportId: selectedTransport?.id,
        foodCategoryId: selectedFoodCategory?.id,
        activityIds: selectedActivities.map((a) => a.id).join(","),
        travelDate,
        durationDays: duration,
        people,
        hotelCost: selectedRoom?.price * nights * roomsNeeded,
        transportCost: selectedTransport?.price * people * 2,
        foodCost: selectedFoodCategory?.daily * duration * people,
        activitiesCost: selectedActivities.reduce(
          (sum, a) => sum + (a.cost * people || 0),
          0,
        ),
        totalCost,
        bookingStatus: "planned",
      };

      const url = editTripId
        ? `http://localhost:5000/api/user/trip-plans/${editTripId}`
        : "http://localhost:5000/api/user/trip-plans";
      const method = editTripId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tripDataPayload),
      });
      const data = await res.json();

      if (data.success) {
        showFlash(
          "success",
          editTripId ? "Trip Updated!" : "Trip Saved!",
          editTripId
            ? "Your trip has been updated."
            : 'Your trip has been saved to "My Trips".',
        );
        setShowPlanner(false);
        navigate("/my-trips");
      } else {
        showFlash(
          "error",
          editTripId ? "Update Failed" : "Save Failed",
          data.error,
        );
      }
    } catch (error) {
      console.error("Error saving trip:", error);
      showFlash("error", "Network Error", "Failed to connect to server.");
    } finally {
      setSaving(false);
    }
  };

  const getTransportIcon = (type) => {
    const icons = { bus: "🚌", train: "🚂", flight: "✈️" };
    return icons[type?.toLowerCase()] || "🚗";
  };

  const formatCurrency = (amount) =>
    `Tk ${new Intl.NumberFormat("en-BD", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount)}`;
  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
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

  if (!destination) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar user={user} onLogout={onLogout} />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-500">Destination not found</p>
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

      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 text-white">
        <div className="container mx-auto px-4 py-12">
          <Link
            to={getBackLink()}
            className="text-white/80 hover:text-white mb-4 inline-block"
          >
            ← Back to {getBackLabel()}
          </Link>
          <h1 className="text-4xl font-bold mb-2">{destination.name}</h1>
          <p className="text-xl text-indigo-100">{destination.location}</p>
          {editTripId && (
            <div className="mt-2 inline-block bg-yellow-400 text-yellow-900 px-4 py-2 rounded-lg font-semibold">
              ✏️ Editing Trip
            </div>
          )}
        </div>
      </div>

      {/* Quick Info Bar */}
      <div className="container mx-auto px-4 -mt-6">
        <div className="bg-white rounded-lg shadow-lg p-4 flex justify-between">
          <div className="flex flex-wrap gap-6">
            <div>
              <p className="text-sm text-gray-500 mb-2">Rating</p>
              <p className="text-xl font-bold text-yellow-500">
                ⭐ {destination.rating}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-2">Best Time</p>
              <p className="text-xl font-bold text-indigo-600">
                {destination.best_time}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-2">Distance</p>
              <p className="text-xl font-bold text-gray-700">
                {destination.distance} km
              </p>
            </div>
          </div>

          {/* Budget Summary - Only in recommendation mode */}
          {mode === "recommendation" && userInput && (
            <>
              <div className="flex flex-wrap gap-6">
                <div>
                  <p className="text-sm text-gray-500 mb-2">Total Budget</p>
                  <p className="text-xl font-bold text-indigo-600">
                    {formatCurrency(userInput.budget)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-2">Duration</p>
                  <p className="text-xl font-bold">{userInput.days} Days</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-2">Travelers</p>
                  <p className="text-xl font-bold">{userInput.people} People</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-2">Selected Total</p>
                  <p
                    className={`text-xl font-bold ${totalCost <= userInput.budget ? "text-green-600" : "text-red-600"}`}
                  >
                    {formatCurrency(totalCost)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-2">Remaining</p>
                  <p className="text-xl font-bold text-purple-600">
                    {formatCurrency(remainingBudget)}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-2">
                  Travel Date <span className="text-red-500">*</span>
                </p>
                <input
                  type="date"
                  value={travelDate}
                  onChange={(e) => setTravelDate(e.target.value)}
                  min={getMinDate()}
                  className="w-full md:w-64 px-2 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Plan This Trip Button */}
      {user && user?.role !== "admin" && mode === "browse" && !editTripId && (
        <div className="container mx-auto px-4 py-6">
          <button
            onClick={() => setShowPlanner(!showPlanner)}
            className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition flex items-center gap-2"
          >
            {showPlanner ? "− Hide Trip Planner" : "+ Plan This Trip"}
          </button>
        </div>
      )}

      {/* Trip Planner */}
      {user && user?.role !== "admin" && mode === "browse" && showPlanner && (
        <div className="container mx-auto px-4 py-6">
          <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-indigo-200">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                {editTripId ? "✏️" : "📋"}
              </span>
              {editTripId
                ? `Edit Your Trip to ${destination.name}`
                : `Plan Your Trip to ${destination.name}`}
            </h2>
            <div className="grid md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Travel Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={travelDate}
                  onChange={(e) => setTravelDate(e.target.value)}
                  min={getMinDate()}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duration <span className="text-red-500">*</span>
                </label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value))}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                    <option key={d} value={d}>
                      {d} {d === 1 ? "Day" : "Days"}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Travelers <span className="text-red-500">*</span>
                </label>
                <select
                  value={people}
                  onChange={(e) => setPeople(parseInt(e.target.value))}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  {[1, 2, 3, 4, 5, 6].map((p) => (
                    <option key={p} value={p}>
                      {p} {p === 1 ? "Person" : "People"}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {selectedRoom && (
              <div className="mt-4 p-3 bg-indigo-50 rounded-lg">
                <p className="text-sm font-medium text-indigo-800">
                  Current Total: {formatCurrency(totalCost)}
                </p>
              </div>
            )}
            <p className="text-sm text-gray-500 mb-2">
              ⚡ Select your preferences below to build your trip
            </p>
          </div>
        </div>
      )}

      {/* Hotels Section */}
      <div className="container mx-auto px-4 py-6">
        <h2 className="text-2xl font-bold mb-4">
          🏨 Hotels ({allHotels.length})
          {showPlanner && <span className="text-red-500 ml-1">*</span>}
        </h2>
        {allHotels.length === 0 ? (
          <div className="bg-yellow-50 rounded-lg p-6 text-center">
            <p className="text-yellow-700">
              No hotels available for this destination at the moment.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {allHotels.map((hotel) => {
              const minPrice = Math.min(...hotel.rooms.map((r) => r.price));
              return (
                <div
                  key={hotel.id}
                  className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition"
                >
                  <div className="flex flex-col md:flex-row">
                    {/* Hotel Image Section */}
                    <div className="md:w-1/3 h-48 md:h-auto relative bg-gradient-to-br from-indigo-100 to-purple-100">
                      {hotel.image ? (
                        <img
                          src={`http://localhost:5000${hotel.image}`}
                          alt={hotel.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.style.display = "none";
                            e.target.parentElement.innerHTML = `<div class="w-full h-full flex flex-col items-center justify-center"><span class="text-6xl mb-2">🏨</span><span class="text-sm text-gray-500">${hotel.name}</span></div>`;
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center">
                          <span className="text-6xl mb-2">🏨</span>
                          <span className="text-sm text-gray-500">
                            {hotel.name}
                          </span>
                        </div>
                      )}
                      <div className="absolute top-4 right-4 bg-indigo-600 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                        from {formatCurrency(minPrice)}/night
                      </div>
                      {hotel.rating && (
                        <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1 shadow-lg">
                          <span className="text-yellow-400">⭐</span>
                          <span>{hotel.rating}</span>
                        </div>
                      )}
                    </div>

                    {/* Hotel Details */}
                    <div className="p-6 md:w-2/3">
                      <h3 className="text-xl font-bold text-indigo-700 mb-2">
                        {hotel.name}
                      </h3>
                      <p className="text-sm text-gray-600 mb-3">
                        {hotel.address}
                      </p>

                      {/* Hotel Features */}
                      <div className="flex flex-wrap gap-4 mb-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <span className="text-yellow-400">⭐</span>
                          <span>{hotel.rating} Rating</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <span>📍</span>
                          <span>{hotel.distance} km from center</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <span>🕒</span>
                          <span>
                            Check-in: {hotel.check_in_time || "12:00 PM"}
                          </span>
                        </span>
                        <span className="flex items-center gap-1">
                          <span>🕒</span>
                          <span>
                            Check-out: {hotel.check_out_time || "11:00 AM"}
                          </span>
                        </span>
                      </div>

                      {/* Amenities */}
                      {hotel.amenities?.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {hotel.amenities.slice(0, 4).map((amenity, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs"
                            >
                              {amenity}
                            </span>
                          ))}
                          {hotel.amenities.length > 4 && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                              +{hotel.amenities.length - 4} more
                            </span>
                          )}
                        </div>
                      )}

                      {/* Room Options */}
                      <div className="border-t border-gray-200 pt-4">
                        <h4 className="font-semibold mb-3">Available Rooms</h4>
                        <div className="grid md:grid-cols-3 gap-4">
                          {hotel.rooms?.map((room) => {
                            const roomsNeeded = calculateRoomsNeeded(
                              room.max_guests,
                            );
                            const totalHotelCost =
                              room.price * (duration - 1) * roomsNeeded;
                            return (
                              <div
                                key={room.id}
                                onClick={() =>
                                  showPlanner && handleSelectHotel(hotel, room)
                                }
                                className={`border rounded-lg p-4 transition ${showPlanner ? "cursor-pointer hover:border-indigo-300 hover:shadow-md" : "cursor-default"} ${selectedRoom?.id === room.id && showPlanner ? "border-indigo-600 bg-indigo-50" : ""}`}
                              >
                                <div className="flex justify-between items-start mb-2">
                                  <div>
                                    <p className="font-semibold">{room.type}</p>
                                    <p className="text-sm text-gray-500">
                                      {room.bed} Bed
                                    </p>
                                  </div>
                                  <span className="text-lg font-bold text-indigo-600">
                                    {formatCurrency(room.price)}
                                    <span className="text-xs font-normal text-gray-500">
                                      /night
                                    </span>
                                  </span>
                                </div>
                                <div className="space-y-1 mb-2">
                                  <p className="text-xs text-gray-500">
                                    👥 Max {room.max_guests} guests
                                  </p>
                                  {room.ac && (
                                    <p className="text-xs text-green-600">
                                      ✓ Air Conditioning
                                    </p>
                                  )}
                                  {room.meals !== "None" && (
                                    <p className="text-xs text-green-600">
                                      ✓ {room.meals} included
                                    </p>
                                  )}
                                </div>
                                {people > room.max_guests && (
                                  <div className="mt-2 p-2 bg-yellow-50 rounded-lg">
                                    <p className="text-xs text-yellow-700 flex items-center">
                                      <span className="mr-1">⚠️</span>Need{" "}
                                      {roomsNeeded} rooms
                                    </p>
                                    <p className="text-xs font-medium text-indigo-600 mt-1">
                                      Total: {formatCurrency(totalHotelCost)}
                                    </p>
                                  </div>
                                )}
                                {showPlanner && people <= room.max_guests && (
                                  <div className="mt-2 pt-2 border-t border-gray-100">
                                    <p className="text-xs font-medium text-indigo-600">
                                      Total: {formatCurrency(totalHotelCost)}
                                    </p>
                                  </div>
                                )}
                                {room.available > 0 ? (
                                  <p className="text-xs text-green-600 mt-2">
                                    ✓ {room.available} rooms available
                                  </p>
                                ) : (
                                  <p className="text-xs text-red-500 mt-2">
                                    ✕ Currently unavailable
                                  </p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Transport Section */}
      <div className="container mx-auto px-4 py-6">
        <h2 className="text-2xl font-bold mb-4">
          🚌 Transport Options ({transport.length})
          {showPlanner && <span className="text-red-500 ml-1">*</span>}
        </h2>
        {transport.length === 0 ? (
          <div className="bg-yellow-50 rounded-lg p-6 text-center">
            <p className="text-yellow-700">
              No transport options available for this destination at the moment.
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {transport.map((option) => (
              <div
                key={option.id}
                onClick={() => showPlanner && handleSelectTransport(option)}
                className={`bg-white rounded-xl shadow-lg p-6 transition ${showPlanner ? "cursor-pointer hover:border-2 hover:border-indigo-300" : "cursor-default"} ${selectedTransport?.id === option.id && showPlanner ? "border-2 border-indigo-600 bg-indigo-50" : ""}`}
              >
                <div className="flex justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">
                        {getTransportIcon(option.type)}
                      </span>
                      <h3 className="font-semibold text-indigo-700">
                        {option.company}
                      </h3>
                    </div>
                    <p className="text-sm text-gray-600">
                      {option.type} · {option.comfort}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {option.duration}
                    </p>
                    <div className="flex gap-4 mt-2 text-xs">
                      {option.departure_time && (
                        <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded">
                          🚀 {option.departure_time}
                        </span>
                      )}
                      {option.arrival_time && (
                        <span className="bg-green-50 text-green-700 px-2 py-1 rounded">
                          🏁 {option.arrival_time}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-indigo-600">
                      {formatCurrency(option.price)}
                    </p>
                    <p className="text-xs text-gray-500">per person</p>
                    <p className="text-sm font-medium text-indigo-600 mt-1">
                      Round trip: {formatCurrency(option.price * 2)}
                    </p>
                  </div>
                </div>
                {showPlanner && (
                  <div className="mt-2 pt-2 border-t border-gray-100">
                    <p className="text-xs font-medium text-indigo-600">
                      Total for {people} person (round trip):{" "}
                      {formatCurrency(option.price * people * 2)}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Food Section */}
      <div className="container mx-auto px-4 py-6">
        <h2 className="text-2xl font-bold mb-4">
          🍽️ Meal Options
          {showPlanner && <span className="text-red-500 ml-1">*</span>}
        </h2>
        <div className="grid md:grid-cols-3 gap-4">
          {foodCategories.map((category, index) => {
            const colors = [
              {
                bg: "bg-green-50",
                border: "border-green-200",
                text: "text-green-700",
              },
              {
                bg: "bg-blue-50",
                border: "border-blue-200",
                text: "text-blue-700",
              },
              {
                bg: "bg-purple-50",
                border: "border-purple-200",
                text: "text-purple-700",
              },
            ];
            const color = colors[index];
            return (
              <div
                key={category.id}
                onClick={() =>
                  showPlanner && handleSelectFoodCategory(category)
                }
                className={`${color.bg} rounded-xl shadow-lg p-6 transition ${showPlanner ? "cursor-pointer hover:border-2 hover:border-indigo-300" : "cursor-default"} ${selectedFoodCategory?.id === category.id && showPlanner ? "border-2 border-indigo-600" : ""}`}
              >
                <h3 className="font-bold text-lg mb-3">
                  {category.name} Meals
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>🍳 Breakfast:</span>
                    <span className="font-medium">
                      {formatCurrency(category.breakfast)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>🍱 Lunch:</span>
                    <span className="font-medium">
                      {formatCurrency(category.lunch)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>🍛 Dinner:</span>
                    <span className="font-medium">
                      {formatCurrency(category.dinner)}
                    </span>
                  </div>
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between font-bold">
                      <span>Daily total:</span>
                      <span className={color.text}>
                        {formatCurrency(category.daily)}
                      </span>
                    </div>
                  </div>
                </div>
                {showPlanner && (
                  <div className="mt-2 pt-2 border-t border-gray-100">
                    <p className="text-xs font-medium text-indigo-600">
                      Total for {people} persons for {duration} days:{" "}
                      {formatCurrency(category.daily * people * duration)}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Activities Section */}
      <div className="container mx-auto px-4 py-6">
        <h2 className="text-2xl font-bold mb-4">
          🎯 Activities ({activities.length})
        </h2>
        {activities.length === 0 ? (
          <p className="text-gray-500">
            No activities listed for this destination.
          </p>
        ) : (
          <div className="grid md:grid-cols-3 gap-4">
            {activities.map((activity) => (
              <div
                key={activity.id}
                onClick={() => showPlanner && toggleActivity(activity)}
                className={`bg-white rounded-xl shadow-lg p-6 transition ${showPlanner ? "cursor-pointer hover:border-2 hover:border-purple-300" : "cursor-default"} ${selectedActivities.find((a) => a.id === activity.id) && showPlanner ? "border-2 border-purple-600 bg-purple-50" : ""}`}
              >
                <div className="flex justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-800">
                      {activity.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {activity.duration} hours
                    </p>
                  </div>
                  {activity.cost > 0 ? (
                    <span className="text-lg font-bold text-purple-600">
                      {formatCurrency(activity.cost)}
                    </span>
                  ) : (
                    <span className="text-sm font-medium text-green-600">
                      FREE
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {activity.description}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Save/Update Button */}
      {showPlanner && (
        <div className="container mx-auto px-4 py-8">
          <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 rounded-xl shadow-lg p-6 text-white">
            <h3 className="text-xl font-bold mb-4">Trip Summary</h3>
            <div className="space-y-2 mb-4 text-white/90">
              {selectedRoom && selectedHotel && (
                <div className="flex justify-between text-sm">
                  <span>
                    🏨 {selectedHotel.name} - {selectedRoom.type}, {duration}{" "}
                    Days / {duration - 1} nights
                  </span>
                  <span className="font-bold">
                    {formatCurrency(
                      selectedRoom.price *
                        (duration - 1) *
                        calculateRoomsNeeded(selectedRoom.max_guests),
                    )}
                  </span>
                </div>
              )}
              {selectedTransport && (
                <div className="flex justify-between text-sm">
                  <span>
                    🚌 {selectedTransport.company}, Round Trip for {people}{" "}
                    people
                  </span>
                  <span className="font-bold">
                    {formatCurrency(selectedTransport.price * people * 2)}
                  </span>
                </div>
              )}
              {selectedFoodCategory && (
                <div className="flex justify-between text-sm">
                  <span>
                    🍽️ {selectedFoodCategory.name} Meals for {people} people
                  </span>
                  <span className="font-bold">
                    {formatCurrency(
                      selectedFoodCategory.daily * duration * people,
                    )}
                  </span>
                </div>
              )}
              {selectedActivities.length > 0 && (
                <div className="flex justify-between text-sm">
                  <span>🎯 {selectedActivities.length} activities</span>
                  <span className="font-bold">
                    {formatCurrency(
                      selectedActivities.reduce(
                        (sum, a) => sum + (a.cost * people || 0),
                        0,
                      ),
                    )}
                  </span>
                </div>
              )}
              <div className="border-t border-white/20 pt-2 mt-2">
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>{formatCurrency(totalCost)}</span>
                </div>
              </div>
              {mode === "recommendation" && userInput && (
                <div className="flex justify-between text-sm">
                  <span>Remaining Budget</span>
                  <span
                    className={
                      remainingBudget >= 0
                        ? "text-green-300 font-medium"
                        : "text-red-300 font-medium"
                    }
                  >
                    {formatCurrency(remainingBudget)}
                  </span>
                </div>
              )}
            </div>
            <button
              onClick={handleSaveTrip}
              disabled={
                !selectedHotel ||
                !selectedRoom ||
                !selectedTransport ||
                !selectedFoodCategory ||
                !travelDate ||
                saving
              }
              className="w-full bg-white text-indigo-600 py-3 rounded-lg font-bold hover:bg-indigo-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {saving
                ? editTripId
                  ? "Updating..."
                  : "Saving..."
                : editTripId
                  ? "✏️ Update Trip"
                  : "💾 Save Trip to My Trips"}
            </button>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default DestinationDetails;
