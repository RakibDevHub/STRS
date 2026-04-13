import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const Destinations = ({ user, onLogout }) => {
  const [destinations, setDestinations] = useState([]);
  const [filteredDestinations, setFilteredDestinations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRating, setSelectedRating] = useState("all");
  const [selectedMonth, setSelectedMonth] = useState("all");
  const [maxDistance, setMaxDistance] = useState(500);
  const [sortBy, setSortBy] = useState("rating");

  // Apply filters whenever filter states change
  useEffect(() => {
    const applyFilters = () => {
      let filtered = [...destinations];

      // Search filter
      if (searchTerm) {
        filtered = filtered.filter(
          (dest) =>
            dest.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            dest.location.toLowerCase().includes(searchTerm.toLowerCase()),
        );
      }

      // Rating filter - FIXED HERE
      if (selectedRating !== "all") {
        const minRating = parseFloat(selectedRating);
        filtered = filtered.filter((dest) => dest.rating >= minRating);
      }

      // Distance filter
      filtered = filtered.filter((dest) => dest.distance <= maxDistance);

      // Month filter
      if (selectedMonth !== "all") {
        filtered = filtered.filter((dest) => {
          const bestTime = dest.best_time || "";
          return bestTime.toLowerCase().includes(selectedMonth.toLowerCase());
        });
      }

      // Sorting
      filtered = sortDestinations(filtered, sortBy);

      setFilteredDestinations(filtered);
    };

    applyFilters();
  }, [
    destinations,
    searchTerm,
    selectedRating,
    selectedMonth,
    maxDistance,
    sortBy,
  ]);

  const fetchDestinations = async () => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:5000/api/destinations");
      const data = await response.json();

      if (data.success) {
        setDestinations(data.destinations);
        setFilteredDestinations(data.destinations);
      }
    } catch (error) {
      console.error("Error fetching destinations:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch all destinations
  useEffect(() => {
    fetchDestinations();
  }, []);

  const sortDestinations = (dests, sortType) => {
    switch (sortType) {
      case "rating":
        return dests.sort((a, b) => b.rating - a.rating);
      case "distance-asc":
        return dests.sort((a, b) => a.distance - b.distance);
      case "distance-desc":
        return dests.sort((a, b) => b.distance - a.distance);
      case "name":
        return dests.sort((a, b) => a.name.localeCompare(b.name));
      default:
        return dests;
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedRating("all");
    setSelectedMonth("all");
    setMaxDistance(500);
    setSortBy("rating");
  };

  // Months for filter
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
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
          <h1 className="text-4xl font-bold mb-2">Explore All Destinations</h1>
          <p className="text-xl text-indigo-100">
            Discover amazing places across Bangladesh
          </p>
        </div>
      </div>

      {/* Filters Section */}
      <div className="container mx-auto px-4 -mt-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by name or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 pl-10"
                />
                <span className="absolute left-3 top-2.5 text-gray-400">
                  🔍
                </span>
              </div>
            </div>

            {/* Rating Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Min. Rating
              </label>
              <select
                value={selectedRating}
                onChange={(e) => setSelectedRating(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All Ratings</option>
                <option value="4.5">4.5+ ★</option>
                <option value="4.0">4.0+ ★</option>
                <option value="3.5">3.5+ ★</option>
                <option value="3.0">3.0+ ★</option>
              </select>
            </div>

            {/* Month Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Best Time
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">Any Month</option>
                {months.map((month) => (
                  <option key={month} value={month}>
                    {month}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="rating">Top Rated</option>
                <option value="distance-asc">Nearest First</option>
                <option value="distance-desc">Farthest First</option>
                <option value="name">Name A-Z</option>
              </select>
            </div>
          </div>

          {/* Distance Slider */}
          <div className="mt-4">
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-gray-700">
                Max Distance from Dhaka: {maxDistance} km
              </label>
              <button
                onClick={clearFilters}
                className="text-sm text-indigo-600 hover:text-indigo-800"
              >
                Clear Filters
              </button>
            </div>
            <input
              type="range"
              min="50"
              max="500"
              step="50"
              value={maxDistance}
              onChange={(e) => setMaxDistance(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>50 km</span>
              <span>250 km</span>
              <span>500 km</span>
            </div>
          </div>

          {/* Results Count */}
          <div className="mt-4 flex justify-between items-center">
            <p className="text-sm text-gray-600">
              Found{" "}
              <span className="font-bold text-indigo-600">
                {filteredDestinations.length}
              </span>{" "}
              destinations
            </p>
          </div>
        </div>
      </div>

      {/* Destinations Grid */}
      <div className="container mx-auto px-4 py-8">
        {filteredDestinations.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center">
            <div className="text-6xl mb-4">😢</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              No destinations found
            </h3>
            <p className="text-gray-500 mb-6">Try adjusting your filters</p>
            <button
              onClick={clearFilters}
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700"
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDestinations.map((dest) => (
              <Link
                key={dest.id}
                to={`/destination/${dest.id}`}
                state={{ from: "/destinations", label: "Destinations" }}
                className="bg-gray-50 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
              >
                <div className="h-48 bg-indigo-200 relative">
                  {dest.image ? (
                    <img
                      src={`http://localhost:5000${dest.image}`}
                      alt={dest.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl">
                      🏝️
                    </div>
                  )}
                  <div className="absolute top-4 right-4 bg-white px-2 py-1 rounded-full text-sm font-semibold">
                    ⭐ {dest.rating}
                  </div>
                  <div className="absolute top-4 left-4 bg-white px-2 py-1 rounded-full text-sm font-semibold">
                    📅 {dest.best_time}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-lg">{dest.name}</h3>
                  <p className="text-gray-600 text-sm mb-2">{dest.location}</p>
                  <p className="text-indigo-600 font-medium">
                    {dest.distance} km from Dhaka
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default Destinations;
