import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const TripPlanner = ({ user }) => {
  const navigate = useNavigate();
  const [interests, setInterests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [formData, setFormData] = useState({
    budget: 5000,
    days: 3,
    people: 2,
    selectedInterests: [],
  });

  // Budget presets
  const budgetPresets = [
    { label: "Budget", value: 5000, icon: "💰" },
    { label: "Standard", value: 15000, icon: "🏨" },
    { label: "Premium", value: 30000, icon: "✨" },
    { label: "Luxury", value: 50000, icon: "👑" },
  ];

  // Fetch interests on page load
  useEffect(() => {
    fetchInterests();
  }, []);

  const fetchInterests = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/interests");
      const data = await res.json();
      if (data.success) {
        setInterests(data.interests);
      }
    } catch (error) {
      console.error("Error fetching interests:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Handle interest toggle
  const toggleInterest = (interestId) => {
    setFormData((prev) => ({
      ...prev,
      selectedInterests: prev.selectedInterests.includes(interestId)
        ? prev.selectedInterests.filter((id) => id !== interestId)
        : [...prev.selectedInterests, interestId],
    }));
  };

  // Handle budget preset click
  const handleBudgetPreset = (value) => {
    setFormData((prev) => ({
      ...prev,
      budget: value,
    }));
  };

  // Handle form submit
  const handleSubmit = (e) => {
    e.preventDefault();

    if (formData.selectedInterests.length === 0) {
      // Show error with animation instead of alert
      const interestSection = document.getElementById("interests-section");
      interestSection?.scrollIntoView({ behavior: "smooth" });
      interestSection?.classList.add("animate-shake");
      setTimeout(() => interestSection?.classList.remove("animate-shake"), 500);
      return;
    }

    // Save to sessionStorage
    sessionStorage.setItem("tripPlanner", JSON.stringify(formData));

    // Navigate to recommendations page
    navigate("/recommendations");
  };

  // Calculate budget suggestions
  const getBudgetSuggestion = () => {
    if (formData.budget < 8000) return "budget";
    if (formData.budget < 20000) return "standard";
    if (formData.budget < 35000) return "premium";
    return "luxury";
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100">
      <Navbar user={user} />

      {/* Header with Wave Effect */}
      <div className="relative bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="absolute -bottom-10 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="white" fillOpacity="0.1"/>
          </svg>
        </div>
        <div className="container mx-auto px-4 py-16 relative z-10">
          <h1 className="text-5xl font-bold mb-4">Plan Your Perfect Trip</h1>
          <p className="text-xl text-indigo-100 max-w-2xl">
            Tell us your preferences and we'll recommend the best destinations tailored just for you
          </p>
        </div>
      </div>

      {/* Main Form */}
      <div className="container mx-auto px-4 py-12 max-w-3xl relative z-20">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Progress Steps */}
          <div className="bg-gray-50 px-8 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between max-w-md mx-auto">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold">1</div>
                <span className="ml-2 text-sm font-medium text-indigo-600">Budget</span>
              </div>
              <div className="w-12 h-0.5 bg-indigo-200"></div>
              <div className="flex items-center">
                <div className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold">2</div>
                <span className="ml-2 text-sm font-medium text-indigo-600">Duration</span>
              </div>
              <div className="w-12 h-0.5 bg-indigo-200"></div>
              <div className="flex items-center">
                <div className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold">3</div>
                <span className="ml-2 text-sm font-medium text-indigo-600">People</span>
              </div>
              <div className="w-12 h-0.5 bg-indigo-200"></div>
              <div className="flex items-center">
                <div className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold">4</div>
                <span className="ml-2 text-sm font-medium text-indigo-600">Interests</span>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-16">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-600 border-t-transparent mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading your options...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-8 space-y-8">
              {/* Budget Section */}
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-800 mb-1">1. What's your budget?</h2>
                  <p className="text-sm text-gray-500">Set your total trip budget in BDT</p>
                </div>

                {/* Budget Presets */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {budgetPresets.map((preset) => (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => handleBudgetPreset(preset.value)}
                      className={`p-3 rounded-xl border-2 transition-all transform hover:scale-105 ${
                        formData.budget === preset.value
                          ? "border-indigo-600 bg-indigo-50"
                          : "border-gray-200 hover:border-indigo-300"
                      }`}
                    >
                      <div className="text-2xl mb-1">{preset.icon}</div>
                      <div className="font-semibold text-sm">{preset.label}</div>
                      <div className="text-xs text-gray-500">৳{preset.value.toLocaleString()}</div>
                    </button>
                  ))}
                </div>

                {/* Budget Slider */}
                <div className="pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">
                      Adjust your budget
                    </label>
                    <span className="text-2xl font-bold text-indigo-600">
                      ৳{formData.budget.toLocaleString()}
                    </span>
                  </div>
                  <input
                    type="range"
                    name="budget"
                    min="2000"
                    max="50000"
                    step="500"
                    value={formData.budget}
                    onChange={handleChange}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-2">
                    <span>৳2,000</span>
                    <span>৳25,000</span>
                    <span>৳50,000</span>
                  </div>
                </div>

                {/* Budget Suggestion */}
                <div className={`p-3 rounded-lg ${
                  getBudgetSuggestion() === "budget" ? "bg-green-50" :
                  getBudgetSuggestion() === "standard" ? "bg-blue-50" :
                  getBudgetSuggestion() === "premium" ? "bg-purple-50" : "bg-yellow-50"
                }`}>
                  <p className="text-sm flex items-center gap-2">
                    <span className="text-xl">
                      {getBudgetSuggestion() === "budget" ? "💰" :
                       getBudgetSuggestion() === "standard" ? "🏨" :
                       getBudgetSuggestion() === "premium" ? "✨" : "👑"}
                    </span>
                    <span className={
                      getBudgetSuggestion() === "budget" ? "text-green-700" :
                      getBudgetSuggestion() === "standard" ? "text-blue-700" :
                      getBudgetSuggestion() === "premium" ? "text-purple-700" : "text-yellow-700"
                    }>
                      {getBudgetSuggestion() === "budget" && "Great for budget travelers! We'll find affordable options."}
                      {getBudgetSuggestion() === "standard" && "Perfect for a comfortable trip with good amenities."}
                      {getBudgetSuggestion() === "premium" && "Premium budget! You'll enjoy better hotels and services."}
                      {getBudgetSuggestion() === "luxury" && "Luxury traveler! We'll recommend the best experiences."}
                    </span>
                  </p>
                </div>
              </div>

              {/* Duration & People - Two Column Layout */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Duration */}
                <div>
                  <h2 className="text-xl font-bold text-gray-800 mb-3">2. Trip Duration</h2>
                  <div className="relative">
                    <select
                      name="days"
                      value={formData.days}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none bg-white"
                    >
                      {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                        <option key={day} value={day}>
                          {day} {day === 1 ? "Day" : "Days"}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-3 top-3 text-gray-400 pointer-events-none">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {formData.days === 1 ? "Perfect for a quick getaway!" : `${formData.days} days gives you ${formData.days - 1} nights of stay`}
                  </p>
                </div>

                {/* People */}
                <div>
                  <h2 className="text-xl font-bold text-gray-800 mb-3">3. Number of People</h2>
                  <div className="relative">
                    <select
                      name="people"
                      value={formData.people}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none bg-white"
                    >
                      {[1, 2, 3, 4, 5, 6].map((num) => (
                        <option key={num} value={num}>
                          {num} {num === 1 ? "Person" : "People"}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-3 top-3 text-gray-400 pointer-events-none">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {formData.people === 1 ? "Solo traveler" : `Group of ${formData.people}`}
                  </p>
                </div>
              </div>

              {/* Interests Section */}
              <div id="interests-section" className="space-y-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-800 mb-1">4. Select Your Interests</h2>
                  <p className="text-sm text-gray-500">Choose what you'd like to experience</p>
                </div>

                <div className="flex flex-wrap gap-3">
                  {interests.map((interest) => (
                    <button
                      key={interest.id}
                      type="button"
                      onClick={() => toggleInterest(interest.id)}
                      className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all transform hover:scale-105 flex items-center gap-2 ${
                        formData.selectedInterests.includes(interest.id)
                          ? "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200"
                      }`}
                    >
                      <span className="text-lg">{interest.icon}</span>
                      <span>{interest.name}</span>
                      {formData.selectedInterests.includes(interest.id) && (
                        <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>

                {/* Selected Count */}
                {formData.selectedInterests.length > 0 && (
                  <div className="text-sm text-indigo-600 font-medium">
                    {formData.selectedInterests.length} interest{formData.selectedInterests.length > 1 ? 's' : ''} selected
                  </div>
                )}

                {/* Error Message */}
                {formData.selectedInterests.length === 0 && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    Please select at least one interest
                  </p>
                )}
              </div>

              {/* Trip Summary Card */}
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-xl border border-indigo-100">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Trip Summary
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Budget</p>
                    <p className="font-bold text-indigo-600">৳{formData.budget.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Duration</p>
                    <p className="font-bold text-indigo-600">{formData.days} days</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Travelers</p>
                    <p className="font-bold text-indigo-600">{formData.people} people</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Interests</p>
                    <p className="font-bold text-indigo-600">{formData.selectedInterests.length} selected</p>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={formData.selectedInterests.length === 0}
                className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 text-white py-4 rounded-xl font-semibold hover:from-indigo-700 hover:to-indigo-800 transition-all transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed shadow-lg flex items-center justify-center gap-2 text-lg"
              >
                <span>Get Personalized Recommendations</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            </form>
          )}
        </div>

        {/* Trust Badges */}
        <div className="flex justify-center gap-8 mt-8 text-sm text-gray-500">
          <span className="flex items-center gap-2">
            <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Secure Planning
          </span>
          <span className="flex items-center gap-2">
            <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Real-time Availability
          </span>
          <span className="flex items-center gap-2">
            <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
            </svg>
            Best Price Guarantee
          </span>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default TripPlanner;