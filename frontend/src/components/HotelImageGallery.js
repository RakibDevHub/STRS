import React, { useState } from "react";

const HotelImageGallery = ({ images, hotelName }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  if (!images || images.length === 0) {
    // Fallback if no images
    return (
      <div className="w-full h-full bg-gradient-to-br from-indigo-100 to-purple-100 flex flex-col items-center justify-center">
        <span className="text-6xl mb-2">🏨</span>
        <span className="text-sm text-gray-500">{hotelName}</span>
      </div>
    );
  }

  const currentImage = `http://localhost:5000${images[currentIndex]}`;

  return (
    <div className="relative w-full h-full group">
      {/* Main Image */}
      <img
        src={currentImage}
        alt={`${hotelName} - View ${currentIndex + 1}`}
        className="w-full h-full object-cover"
        onError={(e) => {
          e.target.onerror = null;
          // If image fails to load, try next image or show fallback
          if (currentIndex < images.length - 1) {
            setCurrentIndex(currentIndex + 1);
          } else {
            e.target.style.display = 'none';
            e.target.parentElement.innerHTML = `
              <div class="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-indigo-100 to-purple-100">
                <span class="text-6xl mb-2">🏨</span>
                <span class="text-sm text-gray-500">${hotelName}</span>
              </div>
            `;
          }
        }}
      />

      {/* Image Navigation Arrows (only if multiple images) */}
      {images.length > 1 && (
        <>
          <button
            onClick={() => setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1))}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition hover:bg-black/70"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={() => setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0))}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition hover:bg-black/70"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      {/* Image Indicators (dots) */}
      {images.length > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
          {images.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`w-2 h-2 rounded-full transition ${
                idx === currentIndex ? 'bg-white w-4' : 'bg-white/50'
              }`}
            />
          ))}
        </div>
      )}

      {/* Image Counter */}
      {images.length > 1 && (
        <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
          {currentIndex + 1} / {images.length}
        </div>
      )}
    </div>
  );
};

export default HotelImageGallery;