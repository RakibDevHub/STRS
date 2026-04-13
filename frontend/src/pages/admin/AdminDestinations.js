import React, { useState, useEffect, useCallback } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import Flash from "../../components/FlashMessage";
import ConfirmationModal from "../../components/ConfirmationModal";

const AdminDestinations = ({ user, onLogout }) => {
  const [destinations, setDestinations] = useState([]);
  const [interests, setInterests] = useState([]);
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingDest, setEditingDest] = useState(null);
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    id: null,
    name: "",
  });
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    description: "",
    best_time: "",
    image: null,
    distance: "",
    rating: 0,
  });

  const [flash, setFlash] = useState({
    isOpen: false,
    type: "success",
    title: "",
    message: "",
  });

  const showFlash = useCallback((type, title, message) => {
    setFlash({ isOpen: true, type, title, message });
    setTimeout(() => setFlash((prev) => ({ ...prev, isOpen: false })), 3000);
  }, []);

  const fetchInterests = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/admin/interests", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setInterests(data.interests);
    } catch (error) {
      console.error("Error fetching interests:", error);
      showFlash("error", "Error", "Failed to load interests");
    }
  }, [showFlash]);

  const fetchDestinations = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/admin/destinations", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setDestinations(data.destinations);
    } catch (error) {
      console.error("Error fetching destinations:", error);
      showFlash("error", "Error", "Failed to load destinations");
    } finally {
      setLoading(false);
    }
  }, [showFlash]);

  useEffect(() => {
    Promise.all([fetchDestinations(), fetchInterests()]);
  }, [fetchDestinations, fetchInterests]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setFormData((prev) => ({ ...prev, image: e.target.files[0] }));
  };

  const toggleInterest = (interestId) => {
    setSelectedInterests(prev => 
      prev.includes(interestId)
        ? prev.filter(id => id !== interestId)
        : [...prev, interestId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = new FormData();
    
    // Add all form fields
    Object.keys(formData).forEach((key) => {
      if (formData[key] !== null) form.append(key, formData[key]);
    });
    
    // Add selected interests as comma-separated string
    form.append('interestIds', selectedInterests.join(','));

    try {
      const token = localStorage.getItem("token");
      const url = editingDest
        ? `http://localhost:5000/api/admin/destinations/${editingDest.id}`
        : "http://localhost:5000/api/admin/destinations";
      const method = editingDest ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      const data = await res.json();
      if (data.success) {
        showFlash(
          "success",
          "Success",
          editingDest ? "Destination updated" : "Destination created",
        );
        setShowForm(false);
        setEditingDest(null);
        setSelectedInterests([]);
        setFormData({
          name: "",
          location: "",
          description: "",
          best_time: "",
          image: null,
          distance: "",
          rating: 0,
        });
        fetchDestinations();
      }
    } catch (error) {
      console.error("Error saving destination:", error);
      showFlash("error", "Error", "Failed to save destination");
    }
  };

  const handleDeleteClick = (id, name) => {
    setDeleteModal({ isOpen: true, id, name });
  };

  const confirmDelete = async () => {
    if (!deleteModal.id) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `http://localhost:5000/api/admin/destinations/${deleteModal.id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await res.json();
      if (data.success) {
        showFlash("success", "Success", "Destination deleted");
        fetchDestinations();
      }
    } catch (error) {
      console.error("Error deleting destination:", error);
      showFlash("error", "Error", "Failed to delete destination");
    } finally {
      setDeleteModal({ isOpen: false, id: null, name: "" });
    }
  };

  const editDestination = (dest) => {
    setEditingDest(dest);
    setFormData({
      name: dest.name,
      location: dest.location,
      description: dest.description,
      best_time: dest.best_time,
      image: null,
      distance: dest.distance,
      rating: dest.rating,
    });
    setSelectedInterests(dest.interests?.map(i => i.id) || []);
    setShowForm(true);
  };

  if (loading) {
    return (
      <AdminLayout user={user} onLogout={onLogout} title="Destination Management">
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout user={user} onLogout={onLogout} title="Destination Management">
      <Flash
        isOpen={flash.isOpen}
        onClose={() => setFlash((prev) => ({ ...prev, isOpen: false }))}
        type={flash.type}
        title={flash.title}
        message={flash.message}
      />

      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, id: null, name: "" })}
        onConfirm={confirmDelete}
        title="Delete Destination"
        message={`Are you sure you want to delete "${deleteModal.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
      />

      <button
        onClick={() => {
          setShowForm(!showForm);
          setEditingDest(null);
          setSelectedInterests([]);
          setFormData({
            name: "",
            location: "",
            description: "",
            best_time: "",
            image: null,
            distance: "",
            rating: 0,
          });
        }}
        className="mb-4 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
      >
        {showForm ? "Cancel" : "+ Add Destination"}
      </button>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-6 p-6 border rounded-lg bg-gray-50"
        >
          <h3 className="text-lg font-bold mb-4">
            {editingDest ? "✏️ Edit Destination" : "➕ Add New Destination"}
          </h3>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Destination Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g., Cox's Bazar"
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                placeholder="e.g., Chittagong Division"
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            {/* Best Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Best Time to Visit <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="best_time"
                value={formData.best_time}
                onChange={handleInputChange}
                placeholder="e.g., November to March"
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            {/* Distance */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Distance from Dhaka (km) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="distance"
                value={formData.distance}
                onChange={handleInputChange}
                placeholder="e.g., 250"
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            {/* Rating */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rating (0-5) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="rating"
                value={formData.rating}
                onChange={handleInputChange}
                placeholder="e.g., 4.5"
                step="0.1"
                min="0"
                max="5"
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            {/* Image */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Destination Image
              </label>
              <input
                type="file"
                name="image"
                onChange={handleFileChange}
                className="w-full border rounded-lg focus:ring-2 focus:ring-indigo-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                accept="image/*"
              />
              <p className="text-xs text-gray-500 mt-1">
                Upload JPG, PNG or GIF (max. 5MB)
              </p>
            </div>

            {/* Description - Full Width */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="e.g., Cox's Bazar is famous for its long natural sandy sea beach..."
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                rows="4"
                required
              />
            </div>

            {/* Interests - Full Width */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Interests <span className="text-gray-400">(select multiple)</span>
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {interests.map((interest) => (
                  <label
                    key={interest.id}
                    className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition ${
                      selectedInterests.includes(interest.id)
                        ? 'border-indigo-600 bg-indigo-50'
                        : 'border-gray-200 hover:border-indigo-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedInterests.includes(interest.id)}
                      onChange={() => toggleInterest(interest.id)}
                      className="sr-only"
                    />
                    <span className="text-2xl">{interest.icon}</span>
                    <span className="text-sm font-medium">{interest.name}</span>
                    {selectedInterests.includes(interest.id) && (
                      <span className="ml-auto text-indigo-600">✓</span>
                    )}
                  </label>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Selected: {selectedInterests.length} interests
              </p>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex gap-3 mt-6">
            <button
              type="submit"
              className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition font-medium"
            >
              {editingDest ? "✏️ Update Destination" : "💾 Save Destination"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditingDest(null);
                setSelectedInterests([]);
                setFormData({
                  name: "",
                  location: "",
                  description: "",
                  best_time: "",
                  image: null,
                  distance: "",
                  rating: 0,
                });
              }}
              className="flex-1 border border-gray-300 py-2 px-4 rounded-lg hover:bg-gray-50 transition font-medium"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {destinations.map((dest) => (
          <div
            key={dest.id}
            className="border rounded-lg p-4 hover:shadow-lg transition"
          >
            {dest.image && (
              <img
                src={`http://localhost:5000${dest.image}`}
                alt={dest.name}
                className="w-full h-32 object-cover rounded mb-3"
              />
            )}
            <h3 className="font-bold">{dest.name}</h3>
            <p className="text-sm text-gray-600">{dest.location}</p>
            
            {/* Display Interests */}
            {dest.interests && dest.interests.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {dest.interests.map(interest => (
                  <span
                    key={interest.id}
                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-xs"
                    title={interest.name}
                  >
                    <span>{interest.icon}</span>
                    <span>{interest.name}</span>
                  </span>
                ))}
              </div>
            )}

            <p className="text-xs text-gray-500 mt-2">
              ⭐ {dest.rating} · {dest.distance} km
            </p>
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => editDestination(dest)}
                className="text-blue-600 text-sm hover:underline"
              >
                Edit
              </button>
              <button
                onClick={() => handleDeleteClick(dest.id, dest.name)}
                className="text-red-600 text-sm hover:underline"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
};

export default AdminDestinations;