import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const Home = ({ user, onLogout }) => {
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    destinations: 0,
    hotels: 0,
    travelers: 0,
  });
  const [currentSlide, setCurrentSlide] = useState(0);
  const [heroImages, setHeroImages] = useState([]);

  useEffect(() => {
    fetchDestinations();
    fetchStats();
  }, []);

  useEffect(() => {
    if (destinations.length > 0) {
      const images = destinations
        .filter((dest) => dest.image)
        .slice(0, 8)
        .map((dest) => ({
          url: `http://localhost:5000${dest.image}`,
          name: dest.name,
          location: dest.location,
        }));
      setHeroImages(images);
    }
  }, [destinations]);

  useEffect(() => {
    if (heroImages.length === 0) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [heroImages.length]);

  const fetchDestinations = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/destinations");
      const data = await res.json();
      if (data.success) {
        setDestinations(data.destinations);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/stats");
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const features = [
    { icon: "💰", title: "Budget Planning", desc: "Plan trips within your budget" },
    { icon: "🏨", title: "Hotel Options", desc: "Compare prices and amenities" },
    { icon: "🚌", title: "Transport Choices", desc: "Bus, train, flight options" },
    { icon: "🎯", title: "Personalized", desc: "Based on your interests" },
  ];

  const galleryImages = destinations
    .slice(0, 10)
    .filter((dest) => dest.image && dest.image.trim() !== "")
    .map((dest) => ({
      url: `http://localhost:5000${dest.image}`,
      name: dest.name,
      location: dest.location,
    }));

  // Featured image for hero gallery
  const featuredImage = galleryImages[0];
  const secondaryImages = galleryImages.slice(1, 3);
  const gridImages = galleryImages.slice(3, 11);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar user={user} onLogout={onLogout} />

      {/* Hero Section with Slideshow */}
      <div className="relative h-[85vh] min-h-[600px] overflow-hidden">
        {/* Background Slideshow */}
        <div className="absolute inset-0 z-0">
          {heroImages.length > 0 ? (
            heroImages.map((image, index) => (
              <div
                key={index}
                className={`absolute inset-0 transition-opacity duration-1000 ${
                  index === currentSlide ? "opacity-100" : "opacity-0"
                }`}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/30 z-10"></div>
                <img
                  src={image.url}
                  alt={image.name}
                  className="w-full h-full object-cover"
                />
              </div>
            ))
          ) : (
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-indigo-800">
              <div className="absolute inset-0 bg-black/40"></div>
            </div>
          )}
        </div>

        {/* Slide Indicators */}
        {heroImages.length > 1 && (
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20 flex gap-2">
            {heroImages.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  index === currentSlide
                    ? "bg-white w-8"
                    : "bg-white/50 w-4 hover:bg-white/70"
                }`}
              />
            ))}
          </div>
        )}

        {/* Hero Content */}
        <div className="relative z-20 container mx-auto px-4 h-full flex items-center">
          <div className="max-w-3xl text-white">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-4 leading-tight">
              Plan Your Perfect Trip in Bangladesh
            </h1>
            <p className="text-lg md:text-xl text-white/90 mb-8 max-w-2xl">
              Get personalized recommendations based on your budget, duration, and interests
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to="/plan-trip"
                className="inline-flex items-center justify-center gap-2 bg-white text-indigo-600 px-8 py-3 rounded-lg font-semibold hover:bg-indigo-50 transition-all transform hover:scale-105 shadow-lg"
              >
                <span>Start Planning</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <Link
                to="/destinations"
                className="inline-flex items-center justify-center gap-2 bg-transparent border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/10 transition-all"
              >
                Explore Destinations
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-3">
            Why Choose Smart Tourism?
          </h2>
          <p className="text-gray-500 max-w-2xl mx-auto">
            We make trip planning easy, personalized, and budget-friendly
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f, i) => (
            <div
              key={i}
              className="bg-white p-6 rounded-2xl shadow-lg text-center transition-all hover:shadow-xl hover:-translate-y-1"
            >
              <div className="text-5xl mb-4">{f.icon}</div>
              <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
              <p className="text-gray-500 text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Popular Destinations */}
      <div className="bg-white py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-3">
              Popular Destinations
            </h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              Discover the most loved places across Bangladesh
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
          ) : (
            <>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {destinations.slice(0, 6).map((dest) => (
                  <Link
                    key={dest.id}
                    to={`/destination/${dest.id}`}
                    className="group bg-gray-50 rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all hover:-translate-y-1"
                  >
                    <div className="h-52 bg-indigo-200 relative overflow-hidden">
                      {dest.image ? (
                        <img
                          src={`http://localhost:5000${dest.image}`}
                          alt={dest.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-5xl">
                          🏝️
                        </div>
                      )}
                      <div className="absolute top-3 right-3 bg-white/95 backdrop-blur px-2 py-1 rounded-full text-xs font-semibold shadow-sm">
                        ⭐ {dest.rating}
                      </div>
                    </div>
                    <div className="p-5">
                      <h3 className="font-bold text-xl mb-1">{dest.name}</h3>
                      <p className="text-gray-500 text-sm mb-2">{dest.location}</p>
                      <p className="text-indigo-600 font-medium text-sm">
                        📍 {dest.distance} km from Dhaka
                      </p>
                    </div>
                  </Link>
                ))}
              </div>

              <div className="text-center mt-12">
                <Link
                  to="/destinations"
                  className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-all hover:scale-105 shadow-md"
                >
                  <span>View All Destinations</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Travel Inspiration Gallery */}
      {galleryImages.length > 3 && (
        <div className="py-20 bg-gradient-to-br from-gray-50 to-indigo-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-3">
                Travel Inspiration
              </h2>
              <p className="text-gray-500 max-w-2xl mx-auto">
                Beautiful destinations waiting to be explored
              </p>
            </div>

            {/* Featured Gallery */}
            <div className="grid lg:grid-cols-2 gap-6 mb-6">
              {featuredImage && (
                <div className="relative h-80 lg:h-96 rounded-2xl overflow-hidden group cursor-pointer shadow-lg">
                  <img
                    src={featuredImage.url}
                    alt={featuredImage.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition duration-300">
                    <div className="absolute bottom-0 left-0 p-6 text-white">
                      <p className="text-sm uppercase tracking-wide opacity-90">Featured</p>
                      <p className="text-2xl font-bold">{featuredImage.name}</p>
                      <p className="text-sm opacity-80">{featuredImage.location}</p>
                    </div>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-6">
                {secondaryImages.map((image, idx) => (
                  <div key={idx} className="relative h-80 lg:h-96 rounded-2xl overflow-hidden group cursor-pointer shadow-lg">
                    <img
                      src={image.url}
                      alt={image.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition duration-300">
                      <div className="absolute bottom-0 left-0 p-6 text-white">
                        <p className="text-xl font-bold">{image.name}</p>
                        <p className="text-sm opacity-80">{image.location}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Gallery Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {gridImages.map((image, idx) => (
                <div key={idx} className="relative h-56 rounded-xl overflow-hidden group cursor-pointer shadow-md">
                  <img
                    src={image.url}
                    alt={image.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition duration-300 flex items-center justify-center">
                    <div className="text-center text-white px-3">
                      <p className="font-bold text-base">{image.name}</p>
                      <p className="text-xs opacity-90">{image.location}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Stats Section */}
      <div className="bg-indigo-600 py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center text-white">
            <div>
              <div className="text-4xl md:text-5xl font-bold mb-2">{stats.destinations}+</div>
              <p className="text-indigo-100 text-sm uppercase tracking-wide">Destinations</p>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold mb-2">{stats.hotels}+</div>
              <p className="text-indigo-100 text-sm uppercase tracking-wide">Hotels</p>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold mb-2">{stats.travelers}+</div>
              <p className="text-indigo-100 text-sm uppercase tracking-wide">Happy Travelers</p>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold mb-2">24/7</div>
              <p className="text-indigo-100 text-sm uppercase tracking-wide">Support</p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Home;