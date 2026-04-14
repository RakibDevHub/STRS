import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const Navbar = ({ user, onLogout }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate("/");
  };

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-2xl">🌍</span>
            <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-indigo-800 bg-clip-text text-transparent">
              SmartTour
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <NavLink to="/">Home</NavLink>
            <NavLink to="/destinations">Destinations</NavLink>

            {user ? (
              <>
                {user.role !== "admin" && (
                  <>
                    <NavLink to="/my-trips">My Trips</NavLink>
                    <NavLink to="/profile">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-medium">
                          {user.name?.charAt(0).toUpperCase()}
                        </div>
                        <span>{user.name?.split(" ")[0]}</span>
                      </div>
                    </NavLink>
                  </>
                )}

                {user.role === "admin" && (
                  <NavLink to="/admin">Dashboard</NavLink>
                )}

                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all transform hover:scale-105 shadow-md text-sm font-medium"
                >
                  Logout
                </button>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="px-4 py-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition font-medium"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all transform hover:scale-105 shadow-md font-medium"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition"
          >
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-100">
            <div className="flex flex-col space-y-3">
              <MobileNavLink to="/" onClick={() => setIsMobileMenuOpen(false)}>Home</MobileNavLink>
              <MobileNavLink to="/destinations" onClick={() => setIsMobileMenuOpen(false)}>Destinations</MobileNavLink>

              {user ? (
                <>
                  {user.role !== "admin" && (
                    <>
                      <MobileNavLink to="/my-trips" onClick={() => setIsMobileMenuOpen(false)}>My Trips</MobileNavLink>
                      <MobileNavLink to="/profile" onClick={() => setIsMobileMenuOpen(false)}>Profile</MobileNavLink>
                    </>
                  )}

                  {user.role === "admin" && (
                    <MobileNavLink to="/admin" onClick={() => setIsMobileMenuOpen(false)}>Dashboard</MobileNavLink>
                  )}

                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition text-left"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="px-4 py-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-center"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

// Helper component for desktop navigation links
const NavLink = ({ to, children }) => (
  <Link
    to={to}
    className="text-gray-600 hover:text-indigo-600 transition font-medium"
  >
    {children}
  </Link>
);

// Helper component for mobile navigation links
const MobileNavLink = ({ to, onClick, children }) => (
  <Link
    to={to}
    onClick={onClick}
    className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition"
  >
    {children}
  </Link>
);

export default Navbar;