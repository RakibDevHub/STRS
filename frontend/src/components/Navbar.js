import React from "react";
import { Link } from "react-router-dom";

const Navbar = ({ user, onLogout }) => {
  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="text-xl font-bold text-indigo-600">
            🏝️ SmartTour
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center space-x-4">
            <Link to="/" className="text-gray-700 hover:text-indigo-600">
              Home
            </Link>

            <Link
              to="/destinations"
              className="text-gray-700 hover:text-indigo-600"
            >
              Destinations
            </Link>

            {user ? (
              <>
                {/* Traveler-only links */}
                {user.role !== "admin" && (
                  <>
                    <Link
                      to="/my-trips"
                      className="text-gray-700 hover:text-indigo-600"
                    >
                      My Trips
                    </Link>

                    <Link
                      to="/profile"
                      className="text-gray-700 hover:text-indigo-600"
                    >
                      {user.name}
                    </Link>
                  </>
                )}

                {/* Admin-only link */}
                {user.role === "admin" && (
                  <Link
                    to="/admin"
                    className="text-gray-700 hover:text-indigo-600"
                  >
                    Dashboard
                  </Link>
                )}

                {/* Logout */}
                <button
                  onClick={onLogout}
                  className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-indigo-600"
                >
                  Login
                </Link>

                <Link
                  to="/register"
                  className="bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
