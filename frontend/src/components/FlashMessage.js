import React, { useEffect } from "react";

const FlashMessage = ({
  isOpen,
  onClose,
  type,
  title,
  message,
  duration = 3000,
}) => {
  useEffect(() => {
    if (isOpen && duration) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [isOpen, duration, onClose]);

  if (!isOpen) return null;

  // Colors based on type
  const colors = {
    success: {
      bg: "from-green-500 to-green-600",
      iconBg: "text-green-500",
      button: "bg-green-600 hover:bg-green-700",
      icon: (
        <svg
          className="w-12 h-12 text-green-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      ),
    },
    error: {
      bg: "from-red-500 to-red-600",
      iconBg: "text-red-500",
      button: "bg-red-600 hover:bg-red-700",
      icon: (
        <svg
          className="w-12 h-12 text-red-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      ),
    },
    info: {
      bg: "from-blue-500 to-blue-600",
      iconBg: "text-blue-500",
      button: "bg-blue-600 hover:bg-blue-700",
      icon: (
        <svg
          className="w-12 h-12 text-blue-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
  };

  const color = colors[type] || colors.info;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all animate-fade-in">
        {/* Header with gradient */}
        <div
          className={`bg-gradient-to-r ${color.bg} rounded-t-2xl p-6 text-center`}
        >
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-2">
            {color.icon}
          </div>
          <h2 className="text-2xl font-bold text-white">{title}</h2>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-600 text-center mb-6">{message}</p>

          {/* Close Button */}
          <button
            onClick={onClose}
            className={`w-full px-4 py-2 text-white rounded-lg transition font-medium ${color.button}`}
          >
            {type === "error" ? "Try Again" : "Got It"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FlashMessage;