import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const Home = ({ user, onLogout }) => {
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [heroImages, setHeroImages] = useState([]);

  useEffect(() => {
    fetchDestinations();
  }, []);

  useEffect(() => {
    if (destinations.length > 0) {
      // Extract images for hero slideshow
      const images = destinations
        .filter((dest) => dest.image)
        .map((dest) => ({
          url: `http://localhost:5000${dest.image}`,
          name: dest.name,
          location: dest.location,
          description: dest.description,
        }));
      setHeroImages(images);
    }
  }, [destinations]);

  // Auto-slide effect for hero section
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
        setDestinations(data.destinations.slice(0, 8));
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

  // Get images for gallery (excluding the first few used in hero)
  const galleryImages = destinations.slice(3, 11).filter((dest) => dest.image);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar user={user} onLogout={onLogout} />

      {/* Hero Section with Slideshow */}
      <div className="relative h-[90vh] min-h-[600px] overflow-hidden">
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
                <div className="absolute inset-0 bg-black/50 z-10"></div>
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
        {heroImages.length > 0 && (
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20 flex gap-2">
            {heroImages.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentSlide
                    ? "bg-white w-8"
                    : "bg-white/50 hover:bg-white/80"
                }`}
              />
            ))}
          </div>
        )}

        {/* Hero Content */}
        <div className="relative z-20 container mx-auto px-4 h-full flex items-center">
          <div className="max-w-3xl text-white">
            <h1 className="text-5xl md:text-6xl font-bold mb-4 animate-fade-in">
              Plan Your Perfect Trip in Bangladesh
            </h1>
            <p className="text-xl text-white/90 mb-8 animate-fade-in-delayed">
              Get personalized recommendations based on your budget, duration,
              and interests
            </p>
            <Link
              to="/plan-trip"
              className="inline-flex items-center gap-2 bg-white text-indigo-600 px-8 py-3 rounded-lg font-semibold hover:bg-indigo-50 transition-all transform hover:scale-105 shadow-lg animate-fade-in-delayed"
            >
              <span>Start Planning</span>
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
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
              className="bg-white p-6 rounded-xl shadow-lg text-center transition-all transform hover:scale-105 hover:shadow-xl"
            >
              <div className="text-5xl mb-3">{f.icon}</div>
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
              {destinations.slice(0, 6).map((dest) => (
                <Link
                  key={dest.id}
                  to={`/destination/${dest.id}`}
                  state={{ from: "/", label: "Home" }}
                  className="group bg-gray-50 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                >
                  <div className="h-48 bg-indigo-200 relative overflow-hidden">
                    {dest.image ? (
                      <img
                        src={`http://localhost:5000${dest.image}`}
                        alt={dest.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl">
                        🏝️
                      </div>
                    )}
                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-2 py-1 rounded-full text-sm font-semibold">
                      ⭐ {dest.rating}
                    </div>
                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-2 py-1 rounded-full text-sm font-semibold">
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

      {/* Image Gallery / Album Section */}
      <div className="py-16 bg-gradient-to-br from-gray-50 to-indigo-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              Travel Inspiration Gallery
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Explore beautiful destinations across Bangladesh through our
              curated collection
            </p>
          </div>

          {galleryImages.length > 0 ? (
            <>
              {/* Featured Large Image */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div className="relative h-96 rounded-xl overflow-hidden group cursor-pointer">
                  <img
                    src={`http://localhost:5000${galleryImages[0].image}`}
                    // src={galleryImages[0]?.url}
                    alt={galleryImages[0]?.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition duration-300">
                    <div className="absolute bottom-0 left-0 p-6 text-white">
                      <p className="text-sm opacity-90">Featured</p>
                      <p className="text-2xl font-bold">
                        {galleryImages[0]?.name}
                      </p>
                      <p className="text-sm opacity-80">
                        {galleryImages[0]?.location}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  {galleryImages.slice(1, 3).map((image, idx) => (
                    <div
                      key={idx}
                      className="relative h-96 rounded-xl overflow-hidden group cursor-pointer"
                    >
                      <img
                        // src={image.url}
                        src={`http://localhost:5000${image.image}`}
                        alt={image.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition duration-300">
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
                {galleryImages.slice(3, 11).map((image, idx) => (
                  <div
                    key={idx}
                    className="relative h-64 rounded-xl overflow-hidden group cursor-pointer"
                  >
                    <img
                      src={`http://localhost:5000${image.image}`}
                      alt={image.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition duration-300 flex items-center justify-center">
                      <div className="text-center text-white">
                        <p className="font-bold text-lg">{image.name}</p>
                        <p className="text-sm">{image.location}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-12 bg-white rounded-xl">
              <p className="text-gray-500">Gallery images coming soon...</p>
            </div>
          )}
        </div>
      </div>

      {/* Stats Section*/}
      <div className="bg-indigo-600 py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 text-center text-white">
            <div>
              <div className="text-4xl font-bold mb-2">50+</div>
              <p className="text-indigo-100">Destinations</p>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">200+</div>
              <p className="text-indigo-100">Hotels</p>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">1000+</div>
              <p className="text-indigo-100">Happy Travelers</p>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">24/7</div>
              <p className="text-indigo-100">Support</p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Home;
