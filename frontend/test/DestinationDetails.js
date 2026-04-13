import React, { useState, useEffect, useCallback } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Flash from "../components/FlashMessage";

const DestinationDetails = ({ user, onLogout }) => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [destination, setDestination] = useState(null);
  const [hotels, setHotels] = useState([]);
  const [transport, setTransport] = useState([]);
  const [foodCategories, setFoodCategories] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userInput, setUserInput] = useState(null);
  const [travelDate, setTravelDate] = useState("");

  // Flash message state
  const [flash, setFlash] = useState({
    isOpen: false,
    type: "info",
    title: "",
    message: "",
    duration: 3000,
  });

  // Selections
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedTransport, setSelectedTransport] = useState(null);
  const [selectedFoodCategory, setSelectedFoodCategory] = useState(null);
  const [selectedActivities, setSelectedActivities] = useState([]);

  // Cost calculation
  const [totalCost, setTotalCost] = useState(0);
  const [remainingBudget, setRemainingBudget] = useState(0);
  const [saving, setSaving] = useState(false);

  // Calculate rooms needed based on people and room capacity
  const calculateRoomsNeeded = useCallback(
    (maxGuests) => {
      if (!userInput) return 1;
      return Math.ceil(userInput.people / maxGuests);
    },
    [userInput],
  );

  // Show flash message function
  const showFlash = (
    type,
    title,
    message,
    onCloseAction = null,
    duration = 3000,
  ) => {
    setFlash({
      isOpen: true,
      type,
      title,
      message,
      duration,
    });

    if (onCloseAction) {
      setTimeout(() => {
        setFlash((prev) => ({ ...prev, isOpen: false }));
        onCloseAction();
      }, duration);
    }
  };

  const closeFlash = () => {
    setFlash((prev) => ({ ...prev, isOpen: false }));
  };

  // Fetch destination details
  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);

        // Get user input from session
        const saved = sessionStorage.getItem("tripPlanner");
        const userInputData = saved ? JSON.parse(saved) : null;
        setUserInput(userInputData);

        const response = await fetch(
          "http://localhost:5000/api/destination-details",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              destId: id,
              budget: userInputData?.budget,
              days: userInputData?.days,
              people: userInputData?.people,
            }),
          },
        );

        const data = await response.json();

        if (data.success) {
          setDestination(data.destination);

          // Filter hotels that have at least one room with available rooms
          const hotelsWithRooms =
            data.hotels?.filter(
              (hotel) =>
                hotel.rooms &&
                hotel.rooms.length > 0 &&
                hotel.rooms.some((room) => room.available > 0),
            ) || [];

          // For each hotel, sort rooms by price (lowest first)
          const hotelsWithSortedRooms = hotelsWithRooms
            .map((hotel) => ({
              ...hotel,
              rooms: hotel.rooms
                ?.filter((room) => room.available > 0)
                .sort((a, b) => a.price - b.price),
            }))
            .filter((hotel) => hotel.rooms.length > 0);

          // Sort hotels by their cheapest room price (lowest first)
          const sortedHotels = hotelsWithSortedRooms.sort((a, b) => {
            const aMinPrice = Math.min(...a.rooms.map((r) => r.price));
            const bMinPrice = Math.min(...b.rooms.map((r) => r.price));
            return aMinPrice - bMinPrice;
          });

          setHotels(sortedHotels);
          setTransport(data.transport || []);
          setFoodCategories(data.foodCategories || []);
          setActivities(data.activities || []);
        }
      } catch (error) {
        console.error("Error fetching details:", error);
        showFlash(
          "error",
          "Error",
          "Failed to load destination details. Please try again.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [id]);

  // Calculate total whenever selections change
  useEffect(() => {
    const calculateTotal = () => {
      if (!userInput) return;

      const nights = Math.max(0, userInput.days - 1);
      const people = userInput.people;

      // Hotel cost: price * nights * roomsNeeded (FIXED)
      const hotelCost = selectedRoom
        ? selectedRoom.price *
          nights *
          calculateRoomsNeeded(selectedRoom.max_guests)
        : 0;

      // Transport cost (round trip)
      const transportCost = selectedTransport
        ? selectedTransport.price * people * 2
        : 0;

      // Food cost (if food category selected)
      const foodCost = selectedFoodCategory
        ? selectedFoodCategory.daily * userInput.days * people
        : 0;

      // Activities cost (optional)
      const activitiesCost = selectedActivities.reduce(
        (sum, activity) => sum + (activity.cost * people || 0),
        0,
      );

      const total = hotelCost + transportCost + foodCost + activitiesCost;
      setTotalCost(total);
      setRemainingBudget(userInput.budget - total);
    };

    calculateTotal();
  }, [
    selectedRoom,
    selectedTransport,
    selectedFoodCategory,
    selectedActivities,
    userInput,
    calculateRoomsNeeded,
  ]);

  const handleSelectHotel = (hotel, room) => {
    const roomsNeeded = calculateRoomsNeeded(room.max_guests);
    setSelectedHotel({
      ...hotel,
      roomsNeeded,
    });
    setSelectedRoom({
      ...room,
      roomsNeeded,
    });
  };

  const handleSelectTransport = (transportOption) => {
    setSelectedTransport(transportOption);
  };

  const handleSelectFoodCategory = (category) => {
    setSelectedFoodCategory(category);
  };

  const toggleActivity = (activity) => {
    setSelectedActivities((prev) => {
      const exists = prev.find((a) => a.id === activity.id);
      if (exists) {
        return prev.filter((a) => a.id !== activity.id);
      } else {
        return [...prev, activity];
      }
    });
  };

  // Save trip to database
  const handleSaveTrip = async () => {
    if (!user) {
      navigate("/login");
      return;
    }

    if (
      !selectedRoom ||
      !selectedTransport ||
      !selectedFoodCategory ||
      !travelDate
    ) {
      showFlash(
        "error",
        "Missing Information",
        "Please select hotel, transport, food preference, and travel date before saving.",
      );
      return;
    }

    setSaving(true);

    try {
      const nights = userInput.days - 1;
      const people = userInput.people;
      const roomsNeeded = calculateRoomsNeeded(selectedRoom.max_guests);

      const tripData = {
        userId: user.id,
        planName: `${destination.name} Trip - ${new Date().toLocaleDateString()}`,
        destinationId: destination.id,
        hotelId: selectedHotel?.id,
        roomId: selectedRoom?.id,
        transportId: selectedTransport?.id,
        foodCategoryId: selectedFoodCategory?.id,
        activityIds: selectedActivities.map((a) => a.id).join(","),
        travelDate: travelDate,
        durationDays: userInput.days,
        people: userInput.people,
        hotelCost: selectedRoom?.price * nights * roomsNeeded,
        transportCost: selectedTransport?.price * people * 2,
        foodCost: selectedFoodCategory?.daily * userInput.days * people,
        activitiesCost: selectedActivities.reduce(
          (sum, a) => sum + (a.cost * people || 0),
          0,
        ),
        totalCost: totalCost,
        bookingStatus: "planned",
      };

      const res = await fetch("http://localhost:5000/api/user/trip-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tripData),
      });

      const data = await res.json();

      if (data.success) {
        showFlash(
          "success",
          "Trip Saved Successfully!",
          'You can view and manage all your trips in the "My Trips" section.',
          () => navigate("/my-trips"),
          3000,
        );
      } else {
        showFlash(
          "error",
          "Save Failed",
          data.error || "Unknown error occurred while saving.",
        );
      }
    } catch (error) {
      console.error("Error saving trip:", error);
      showFlash(
        "error",
        "Network Error",
        "Failed to connect to server. Please check your connection and try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  const getTransportIcon = (type) => {
    const icons = {
      bus: "🚌",
      train: "🚂",
      flight: "✈️",
    };
    return icons[type?.toLowerCase()] || "🚗";
  };

  const formatCurrency = (amount) => {
    return `Tk ${new Intl.NumberFormat("en-BD", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)}`;
  };

  // Get tomorrow's date for min date input
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
        onClose={closeFlash}
        type={flash.type}
        title={flash.title}
        message={flash.message}
        duration={flash.duration}
      />

      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 text-white">
        <div className="container mx-auto px-4 py-12">
          <Link
            to="/recommendations"
            className="text-white/80 hover:text-white mb-4 inline-block"
          >
            ← Back to Recommendations
          </Link>
          <h1 className="text-4xl font-bold mb-2">{destination.name}</h1>
          <p className="text-xl text-indigo-100">{destination.location}</p>
        </div>
      </div>

      {/* Budget Summary */}
      {userInput && (
        <div className="container mx-auto px-4 -mt-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-white rounded-lg shadow-lg p-4">
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
                Select Travel Date <span className="text-red-500">*</span>
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
          </div>
        </div>
      )}

      {/* Hotels Section */}
      <div className="container mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-4">
          🏨 Select Hotel ({hotels.length} options){" "}
          <span className="text-red-500">*</span>
        </h2>

        {hotels.length === 0 ? (
          <div className="bg-yellow-50 rounded-lg p-6 text-center">
            <p className="text-yellow-700">
              No hotels available for this destination at the moment.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {hotels.map((hotel) => {
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
                            e.target.parentElement.innerHTML = `
                      <div class="w-full h-full flex flex-col items-center justify-center">
                        <span class="text-6xl mb-2">🏨</span>
                        <span class="text-sm text-gray-500">${hotel.name}</span>
                      </div>
                    `;
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

                      {/* Price Badge */}
                      <div className="absolute top-4 right-4 bg-indigo-600 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                        from {formatCurrency(minPrice)}/night
                      </div>

                      {/* Rating Badge */}
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
                      {hotel.amenities && hotel.amenities.length > 0 && (
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
                              room.price * (userInput.days - 1) * roomsNeeded;

                            return (
                              <div
                                key={room.id}
                                onClick={() => handleSelectHotel(hotel, room)}
                                className={`border rounded-lg p-4 transition flex flex-col justify-between ${
                                  selectedRoom?.id === room.id
                                    ? "border-indigo-600 bg-indigo-50"
                                    : "hover:border-indigo-300 hover:shadow-md cursor-pointer"
                                }`}
                              >
                                <div>
                                  <div className="flex justify-between items-start mb-2">
                                    <div>
                                      <p className="font-semibold">
                                        {room.type}
                                      </p>
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

                                  {/* Room Features */}
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

                                  {/* Room capacity warning/indicator */}
                                  {userInput &&
                                    userInput.people > room.max_guests && (
                                      <div className="mt-2 p-2 bg-yellow-50 rounded-lg">
                                        <p className="text-xs text-yellow-700 flex items-center">
                                          <span className="mr-1">⚠️</span>
                                          Need {roomsNeeded} rooms
                                        </p>
                                      </div>
                                    )}

                                  {/* Availability indicator */}
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

                                {/* Total cost display */}
                                <div className="mt-3 pt-2 border-t border-gray-100">
                                  <p className="text-xs font-medium text-indigo-600">
                                    Total for {userInput?.days} days /{" "}
                                    {userInput?.days - 1} nights:{" "}
                                    {formatCurrency(totalHotelCost)}
                                  </p>
                                </div>
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
          <span className="text-red-500 ml-1">*</span>
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
                onClick={() => handleSelectTransport(option)}
                className={`bg-white rounded-xl shadow-lg p-6 transition cursor-pointer hover:border-2 hover:border-indigo-300 hover:shadow-xl ${
                  selectedTransport?.id === option.id
                    ? "border-2 border-indigo-600 bg-indigo-50"
                    : ""
                }`}
              >
                <div className="flex justify-between">
                  <div>
                    {/* Company and Type with Icon */}
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">
                        {getTransportIcon(option.type)}
                      </span>
                      <h3 className="font-semibold text-indigo-700">
                        {option.company}
                      </h3>
                    </div>

                    {/* Type and Comfort Level */}
                    <p className="text-sm text-gray-600">
                      {option.type} · {option.comfort}
                    </p>

                    {/* Route and Duration */}
                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                      <span>📍</span>
                      <span>
                        {option.from || "Dhaka"} → Destination ·{" "}
                        {option.duration}
                      </span>
                    </p>

                    {/* Departure/Arrival Times with Badges */}
                    <div className="flex flex-wrap gap-2 mt-2">
                      {option.departure_time && (
                        <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs flex items-center gap-1">
                          <span>🚀</span>
                          <span>Depart: {option.departure_time}</span>
                        </span>
                      )}
                      {option.arrival_time && (
                        <span className="bg-green-50 text-green-700 px-2 py-1 rounded text-xs flex items-center gap-1">
                          <span>🏁</span>
                          <span>Arrive: {option.arrival_time}</span>
                        </span>
                      )}
                    </div>

                    {/* Availability */}
                    <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                      <span>✓</span>
                      <span>{option.seats || "Many"} seats available</span>
                    </p>
                  </div>

                  {/* Pricing Section */}
                  <div className="text-right">
                    <p className="text-2xl font-bold text-indigo-600">
                      {formatCurrency(option.price)}
                    </p>
                    <p className="text-xs text-gray-500">
                      per person (one way)
                    </p>
                    <p className="text-sm font-bold text-indigo-700 mt-1">
                      Round trip: {formatCurrency(option.price * 2)}
                    </p>
                  </div>
                </div>

                {/* Total Cost Display */}
                {userInput && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-sm font-medium text-indigo-600 flex items-center justify-between">
                      <span>
                        Total for {userInput.people}{" "}
                        {userInput.people === 1 ? "person" : "people"} (round
                        trip):
                      </span>
                      <span className="text-lg font-bold">
                        {formatCurrency(option.price * userInput.people * 2)}
                      </span>
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Food Section */}
      <div className="container mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-4">
          🍽️ Select Food Preference <span className="text-red-500">*</span>
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          Choose your meal budget for {userInput?.days} days
        </p>
        <div className="grid md:grid-cols-3 gap-4">
          {foodCategories.map((category, index) => {
            const colors = [
              {
                bg: "bg-green-50",
                border: "border-green-200",
                text: "text-green-700",
                badge: "bg-green-100",
                icon: "💰",
              },
              {
                bg: "bg-blue-50",
                border: "border-blue-200",
                text: "text-blue-700",
                badge: "bg-blue-100",
                icon: "🏪",
              },
              {
                bg: "bg-purple-50",
                border: "border-purple-200",
                text: "text-purple-700",
                badge: "bg-purple-100",
                icon: "🏨",
              },
            ];
            const color = colors[index];

            return (
              <div
                key={category.id}
                onClick={() => handleSelectFoodCategory(category)}
                className={`${color.bg} rounded-lg shadow-lg p-4 cursor-pointer transition flex flex-col justify-between ${
                  selectedFoodCategory?.id === category.id
                    ? "border-2 border-indigo-600 bg-indigo-50"
                    : "hover:border-2 hover:border-indigo-300"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xl">{color.icon}</span>
                    <span
                      className={`text-xs font-medium ${color.text} ${color.badge} px-3 py-1 rounded-full`}
                    >
                      {category.name}
                    </span>
                  </div>
                  <h3 className="font-bold text-lg mb-2 capitalize">
                    {category.name} Meals
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Breakfast:</span>
                      <span className="font-medium">
                        {formatCurrency(category.breakfast)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Lunch:</span>
                      <span className="font-medium">
                        {formatCurrency(category.lunch)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Dinner:</span>
                      <span className="font-medium">
                        {formatCurrency(category.dinner)}
                      </span>
                    </div>
                    <div className={`border-t ${color.border} mt-2 pt-2`}>
                      <div className="flex justify-between font-bold">
                        <span>Daily total:</span>
                        <span className={color.text}>
                          {formatCurrency(category.daily)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Total cost display */}
                {userInput && (
                  <div className="mt-2 pt-2 border-t border-gray-100">
                    <p className="text-xs font-medium text-indigo-600">
                      Total for {userInput.people} persons for {userInput.days}{" "}
                      days:{" "}
                      {formatCurrency(
                        category.daily * userInput.people * userInput.days,
                      )}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Activities Section */}
      <div className="container mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-4">🎯 Optional Activities</h2>
        <p className="text-sm text-gray-600 mb-4">
          Add activities to your trip (optional)
        </p>
        {activities.length === 0 ? (
          <p className="text-gray-500">
            No activities listed for this destination.
          </p>
        ) : (
          <div className="grid md:grid-cols-3 gap-4">
            {activities.map((activity) => (
              <div
                key={activity.id}
                onClick={() => toggleActivity(activity)}
                className={`bg-gray-50 rounded-lg shadow p-4 border cursor-pointer transition ${
                  selectedActivities.find((a) => a.id === activity.id)
                    ? "border-purple-600 bg-purple-50 ring-2 ring-purple-200"
                    : "border-gray-200 hover:border-purple-300"
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-gray-800">
                      {activity.name}
                    </p>
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
                {activity.cost > 0 &&
                  userInput &&
                  activity.cost <= remainingBudget / userInput.people && (
                    <p className="text-xs text-green-600 mt-2">
                      ✓ Within your remaining budget
                    </p>
                  )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Summary & Save Trip */}
      <div className="container mx-auto px-4 py-8">
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 rounded-xl shadow-lg p-6 text-white">
          <h2 className="text-xl font-bold mb-4">Trip Summary</h2>

          {/* Summary of selections */}
          <div className="space-y-2 mb-4 text-white/90">
            {selectedRoom && selectedHotel && userInput && (
              <div className="flex justify-between text-sm">
                <span>
                  🏨 {selectedHotel.name} - {selectedRoom.type}, Dur:{" "}
                  {userInput.days} Days / {userInput.days - 1} nights
                </span>
                <span className="font-bold">
                  {formatCurrency(
                    selectedRoom.price *
                      (userInput.days - 1) *
                      calculateRoomsNeeded(selectedRoom.max_guests),
                  )}
                </span>
              </div>
            )}
            {selectedTransport && userInput && (
              <div className="flex justify-between text-sm">
                <span>
                  🚌 {selectedTransport.company} ({selectedTransport.type}),
                  Round Trip for {userInput.people} people
                </span>
                <span className="font-bold">
                  {formatCurrency(
                    selectedTransport.price * userInput.people * 2,
                  )}
                </span>
              </div>
            )}
            {selectedFoodCategory && userInput && (
              <div className="flex justify-between text-sm">
                <span>
                  🍽️ {selectedFoodCategory.name} Meals for {userInput.people}{" "}
                  people for {userInput.days} days
                </span>
                <span className="font-bold">
                  {formatCurrency(
                    selectedFoodCategory.daily *
                      userInput.days *
                      userInput.people,
                  )}
                </span>
              </div>
            )}
            {selectedActivities.length > 0 && userInput && (
              <div className="text-sm">
                <span>
                  🎯 {selectedActivities.length} activities for{" "}
                  {userInput.people} people
                </span>
                <span className="float-right font-bold">
                  {formatCurrency(
                    selectedActivities.reduce(
                      (sum, a) => sum + (a.cost * userInput.people || 0),
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
          </div>

          <button
            onClick={handleSaveTrip}
            disabled={
              !selectedRoom ||
              !selectedTransport ||
              !selectedFoodCategory ||
              !travelDate ||
              saving
            }
            className="w-full bg-white text-indigo-600 py-3 rounded-lg font-semibold hover:bg-indigo-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {saving ? (
              <>
                <svg
                  className="animate-spin h-5 w-5 mr-2 text-indigo-600"
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
                Saving Trip...
              </>
            ) : (
              "💾 Save Trip to My Trips"
            )}
          </button>

          <p className="text-xs text-gray-300 mt-3 text-center">
            You can view and book this trip later from the "My Trips" page.
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default DestinationDetails;
