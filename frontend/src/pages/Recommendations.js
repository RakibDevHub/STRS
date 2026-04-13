import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const Recommendations = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState([]);
  const [userInput, setUserInput] = useState(null);

  useEffect(() => {
    const saved = sessionStorage.getItem("tripPlanner");
    if (!saved) {
      navigate("/plan");
      return;
    }
    setUserInput(JSON.parse(saved));
  }, [navigate]);

  useEffect(() => {
    if (!userInput) return;

    const fetchRecommendations = async () => {
      setLoading(true);
      try {
        const apiData = {
          budget: Number(userInput.budget),
          days: Number(userInput.days),
          people: Number(userInput.people),
          interests: userInput.selectedInterests,
        };

        const res = await fetch("http://localhost:5000/api/recommendations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(apiData),
        });

        const data = await res.json();

        if (data.success) {
          setRecommendations(data.recommendations);
        }
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [userInput]);

  const handleSelectDestination = (destination) => {
    sessionStorage.setItem(
      "selectedDestination",
      JSON.stringify({
        destination,
        userInput,
      }),
    );
    navigate(`/recommendation/destination/${destination.id}`);
  };

  const formatCurrency = (amount) => {
    return `Tk ${new Intl.NumberFormat("en-BD", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar user={user} onLogout={onLogout} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-indigo-600"></div>
            </div>
            <p className="mt-4 text-gray-600 font-medium">
              Finding your perfect destinations...
            </p>
            <p className="text-sm text-gray-400 mt-2">
              This may take a few moments
            </p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar user={user} onLogout={onLogout} />

      {/* Header with gradient and stats */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 text-white">
        <div className="container mx-auto px-4 py-12">
          <h1 className="text-4xl font-bold mb-2">
            Your Personalized Recommendations
          </h1>
          <p className="text-xl text-indigo-100 mb-6">
            Based on your preferences
          </p>

          {/* Budget Summary Card */}
          {userInput && (
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 inline-block">
              <div className="flex flex-wrap gap-6">
                <div>
                  <p className="text-indigo-200 text-sm">Total Budget</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(userInput.budget)}
                  </p>
                </div>
                <div>
                  <p className="text-indigo-200 text-sm">Duration</p>
                  <p className="text-2xl font-bold">{userInput.days} Days</p>
                </div>
                <div>
                  <p className="text-indigo-200 text-sm">Travelers</p>
                  <p className="text-2xl font-bold">
                    {userInput.people}{" "}
                    {userInput.people === 1 ? "Person" : "People"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Results Section */}
      <div className="container mx-auto px-4 py-8">
        {recommendations.length === 0 ? (
          <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl p-12 text-center">
            <div className="text-7xl mb-4">😢</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              No Destinations Found
            </h2>
            <p className="text-gray-500 mb-6">
              We couldn't find any destinations matching your interests and
              budget. Try adjusting your budget or selecting different
              interests.
            </p>
            <Link
              to="/plan"
              className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
            >
              ← Plan Again
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Results Count */}
            <div className="flex justify-between items-center">
              <p className="text-gray-600">
                Found{" "}
                <span className="font-bold text-indigo-600">
                  {recommendations.length}
                </span>{" "}
                destinations
              </p>
              <Link
                to="/plan-trip"
                className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
              >
                ← Adjust Preferences
              </Link>
            </div>

            {/* Recommendations List */}
            {recommendations.map((rec, index) => (
              <div
                key={rec.destination.id}
                className={`bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 ${
                  index === 0 && rec.stats.withinBudget
                    ? "ring-2 ring-green-500 ring-offset-2"
                    : ""
                }`}
              >
                {/* Best Match Badge */}
                {index === 0 && rec.stats.withinBudget && (
                  <div className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 text-sm font-semibold flex items-center">
                    <span className="mr-2">🏆</span>
                    Best Match - Perfect for Your Budget
                  </div>
                )}

                <div className="md:flex">
                  {/* Image Section */}
                  <div className="md:w-2/5 h-64 md:h-auto relative bg-indigo-100">
                    {rec.destination.image ? (
                      <img
                        src={`http://localhost:5000${rec.destination.image}`}
                        alt={rec.destination.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-6xl">🏝️</span>
                      </div>
                    )}

                    {/* Rating Badge */}
                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full shadow-lg">
                      <span className="flex items-center text-sm font-semibold">
                        <span className="text-yellow-400 mr-1">★</span>
                        {rec.destination.rating}
                      </span>
                    </div>

                    {/* Best Time Badge */}
                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full shadow-lg">
                      <span className="flex items-center text-sm font-semibold">
                        <span className="text-yellow-400 mr-1">📅</span>
                        {rec.destination.best_time}
                      </span>
                    </div>

                    {/* Distance Badge */}
                    {rec.destination.distance && (
                      <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur text-white px-3 py-1 rounded-full text-sm">
                        📍 {rec.destination.distance} km from Dhaka
                      </div>
                    )}
                  </div>

                  {/* Content Section */}
                  <div className="md:w-3/5 p-6">
                    {/* Header */}
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">
                          {rec.destination.name}
                        </h2>
                        <p className="text-gray-500 flex items-center mt-1">
                          <span className="mr-1">📍</span>{" "}
                          {rec.destination.location}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-indigo-600">
                          {formatCurrency(rec.stats.minimumTotal)}
                        </div>
                        <p
                          className={`text-sm font-medium mt-1 ${rec.stats.minimumTotal <= userInput.budget ? "text-green-600" : "text-red-600"}`}
                        >
                          {rec.stats.minimumTotal <= userInput.budget
                            ? `✓ ${formatCurrency(userInput.budget - rec.stats.minimumTotal)} remaining for activities`
                            : `⚠ Need ${formatCurrency(rec.stats.minimumTotal - userInput.budget)} more`}
                        </p>
                      </div>
                    </div>

                    {/* Main Cost Breakdown */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      {/* Hotel Card */}
                      <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-lg">🏨</span>
                          <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                            {rec.stats.hotels.total} options
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">
                          Hotel ({userInput.days - 1} nights)
                        </p>
                        <p className="text-xl font-bold text-blue-700">
                          {rec.stats.minHotelPrice > 0
                            ? `from ${formatCurrency(rec.stats.minHotelPrice)}/night`
                            : "No hotels"}
                        </p>
                        <div className="mt-2 text-xs text-gray-500">
                          {rec.stats.hotels.budget > 0 && (
                            <span className="inline-block bg-green-100 text-green-700 px-2 py-0.5 rounded mr-1">
                              {rec.stats.hotels.budget} budget
                            </span>
                          )}
                          {rec.stats.hotels.mid > 0 && (
                            <span className="inline-block bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded mr-1">
                              {rec.stats.hotels.mid} mid
                            </span>
                          )}
                          {rec.stats.hotels.premium > 0 && (
                            <span className="inline-block bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                              {rec.stats.hotels.premium} premium
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Transport Card */}
                      <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-lg">🚌</span>
                          <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded-full">
                            {rec.stats.transport.total} options
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">
                          Transport (round trip)
                        </p>
                        <p className="text-xl font-bold text-green-700">
                          {rec.stats.minTransportPrice > 0
                            ? `from ${formatCurrency(rec.stats.minTransportPrice)}/person`
                            : "No transport"}
                        </p>
                        <div className="mt-2 text-xs text-gray-500">
                          {rec.stats.transport.budget > 0 && (
                            <span className="inline-block bg-green-100 text-green-700 px-2 py-0.5 rounded mr-1">
                              {rec.stats.transport.budget} budget
                            </span>
                          )}
                          {rec.stats.transport.standard > 0 && (
                            <span className="inline-block bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                              {rec.stats.transport.standard} standard
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Food Card */}
                      <div className="bg-orange-50 rounded-lg p-4 border border-orange-100">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-lg">🍽️</span>
                          <span className="text-xs font-medium text-orange-600 bg-orange-100 px-2 py-1 rounded-full">
                            estimated
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">
                          Food ({userInput.days} days)
                        </p>
                        <p className="text-xl font-bold text-orange-700">
                          {formatCurrency(userInput.budget * 0.15)}-
                          {formatCurrency(userInput.budget * 0.2)}
                        </p>
                        <p className="mt-2 text-xs text-gray-500">
                          ~{" "}
                          {formatCurrency(
                            (userInput.budget * 0.15) /
                              userInput.days /
                              userInput.people,
                          )}
                          /person/day
                        </p>
                      </div>
                    </div>

                    {/* Remaining Budget for Activities */}
                    <div className="bg-purple-50 rounded-lg p-4 border border-purple-100 mb-4">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <span className="text-2xl mr-3">🎯</span>
                          <div>
                            <p className="font-medium text-gray-800">
                              Budget for Activities
                            </p>
                            <p className="text-sm text-gray-600">
                              After hotel & transport (food excluded)
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-purple-700">
                            {formatCurrency(
                              userInput.budget - rec.stats.minimumTotal,
                            )}
                          </p>
                          <p className="text-xs text-gray-500">
                            {rec.stats.activities.total} activities available
                            {rec.stats.activities.free > 0 &&
                              ` (${rec.stats.activities.free} free)`}
                          </p>
                        </div>
                      </div>

                      {/* Sample Activities */}
                      {rec.options.activities.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-purple-200">
                          <p className="text-xs font-medium text-gray-600 mb-2">
                            Suggested activities:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {rec.options.activities
                              .slice(0, 3)
                              .map((activity) => (
                                <span
                                  key={activity.id}
                                  className={`text-xs px-2 py-1 rounded-full ${
                                    activity.isFree
                                      ? "bg-green-100 text-green-700"
                                      : "bg-purple-100 text-purple-700"
                                  }`}
                                >
                                  {activity.name}{" "}
                                  {!activity.isFree &&
                                    `(${formatCurrency(activity.cost)})`}
                                </span>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Quick Stats Row (compact) */}
                    <div className="grid grid-cols-4 gap-2 text-xs text-gray-500 mb-4">
                      <div className="text-center">
                        <span className="font-medium text-gray-700">Hotel</span>
                        <p>{rec.stats.hotels.total} options</p>
                      </div>
                      <div className="text-center">
                        <span className="font-medium text-gray-700">
                          Transport
                        </span>
                        <p>{rec.stats.transport.total} options</p>
                      </div>
                      <div className="text-center">
                        <span className="font-medium text-gray-700">Food</span>
                        <p>{formatCurrency(userInput.budget * 0.15)} est.</p>
                      </div>
                      <div className="text-center">
                        <span className="font-medium text-gray-700">
                          Activities
                        </span>
                        <p>{rec.stats.activities.total} total</p>
                      </div>
                    </div>

                    {/* Interest Chips */}
                    {rec.destination.interests &&
                      rec.destination.interests.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-4">
                          {rec.destination.interests.map((interest) => (
                            <span
                              key={interest.id}
                              className="inline-flex items-center px-2 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs"
                            >
                              <span className="mr-1">{interest.icon}</span>
                              {interest.name}
                            </span>
                          ))}
                        </div>
                      )}

                    {/* Single Action Button */}
                    <button
                      onClick={() => handleSelectDestination(rec.destination)}
                      className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg hover:bg-indigo-700 transition font-medium flex items-center justify-center"
                    >
                      <span>View Full Details & Select</span>
                      <span className="ml-2">→</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default Recommendations;