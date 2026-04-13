import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const Home = ({ user, onLogout }) => {
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDestinations();
  }, []);

  const fetchDestinations = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/destinations");
      const data = await res.json();
      if (data.success) {
        // Show only top 6 destinations
        setDestinations(data.destinations.slice(0, 6));
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      icon: "💰",
      title: "Budget Planning",
      desc: "Plan trips within your budget",
    },
    {
      icon: "🏨",
      title: "Hotel Options",
      desc: "Compare prices and amenities",
    },
    {
      icon: "🚌",
      title: "Transport Choices",
      desc: "Bus, train, flight options",
    },
    { icon: "🎯", title: "Personalized", desc: "Based on your interests" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar user={user} onLogout={onLogout} />

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 text-white">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Plan Your Perfect Trip in Bangladesh
            </h1>
            <p className="text-xl text-indigo-100 mb-8">
              Get personalized recommendations based on your budget, duration,
              and interests
            </p>
            <Link
              to="/plan-trip"
              className="bg-white text-indigo-600 px-8 py-3 rounded-lg font-semibold hover:bg-indigo-50 transition-all transform hover:scale-105 shadow-lg inline-block"
            >
              Start Planning →
            </Link>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">
          Why Choose Smart Tourism?
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f, i) => (
            <div
              key={i}
              className="bg-white p-6 rounded-xl shadow-lg text-center transition-all transform hover:scale-105"
            >
              <div className="text-4xl mb-3">{f.icon}</div>
              <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
              <p className="text-gray-600">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Popular Destinations */}
      <div className="bg-white py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Popular Destinations
          </h2>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {destinations.map((dest) => (
                <Link
                  key={dest.id}
                  to={`/destination/${dest.id}`}
                  state={{ from: "/", label: "Home" }}
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
                    <p className="text-gray-600 text-sm mb-2">
                      {dest.location}
                    </p>
                    <p className="text-indigo-600 font-medium">
                      {dest.distance} km from Dhaka
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}

          <div className="w-full flex justify-center items-center mt-12">
            <Link
              to="/destinations"
              className="bg-indigo-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-all transform hover:scale-105 shadow-lg inline-block"
            >
              Browse All Destinations
            </Link>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-indigo-50 py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Explore?</h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Tell us your budget and interests, and we'll find the perfect
            destination for you
          </p>
          <Link
            to="/plan-trip"
            className="bg-indigo-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-all transform hover:scale-105 shadow-lg inline-block"
          >
            Plan Your Trip Now
          </Link>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Home;
