import React, { useState, useEffect, useCallback } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import Flash from "../../components/FlashMessage";
import ConfirmationModal from "../../components/ConfirmationModal";

const AdminTransport = ({ user, onLogout }) => {
  const [transport, setTransport] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [flash, setFlash] = useState({
    isOpen: false,
    type: "success",
    title: "",
    message: "",
  });
  const [showForm, setShowForm] = useState(false);
  const [editingTransport, setEditingTransport] = useState(null);
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    id: null,
    name: "",
  });

  // Form state
  const [formData, setFormData] = useState({
    type: "bus",
    company: "",
    price_per_person: "",
    duration: "",
    comfort_level: "Standard",
    departure_city: "Dhaka",
    available_seats: "",
    departure_time: "",
    arrival_time: "",
    dest_id: "",
  });

  // Transport types
  const transportTypes = [
    { value: "bus", label: "Bus", icon: "🚌" },
    { value: "train", label: "Train", icon: "🚂" },
    { value: "flight", label: "Flight", icon: "✈️" },
    { value: "launch", label: "Launch", icon: "⛴️" },
    { value: "car", label: "Car", icon: "🚗" },
  ];

  // Comfort levels
  const comfortLevels = [
    "Economy",
    "Standard",
    "Business",
    "First Class",
    "Luxury",
  ];

  // Standard showFlash function
  const showFlash = useCallback((type, title, message) => {
    setFlash({ isOpen: true, type, title, message });
    setTimeout(() => setFlash((prev) => ({ ...prev, isOpen: false })), 3000);
  }, []);

  // Fetch transport and destinations
  const fetchData = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");

      // Fetch destinations for dropdown
      const destRes = await fetch(
        "http://localhost:5000/api/admin/destinations",
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const destData = await destRes.json();
      if (destData.success) setDestinations(destData.destinations);

      // Fetch transport
      const transportRes = await fetch(
        "http://localhost:5000/api/admin/transport",
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const transportData = await transportRes.json();
      if (transportData.success) setTransport(transportData.transport);
    } catch (error) {
      console.error("Error fetching data:", error);
      showFlash("error", "Error", "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [showFlash]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
      type: "bus",
      company: "",
      price_per_person: "",
      duration: "",
      comfort_level: "Standard",
      departure_city: "Dhaka",
      available_seats: "",
      departure_time: "",
      arrival_time: "",
      dest_id: "",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem("token");
      const url = editingTransport
        ? `http://localhost:5000/api/admin/transport/${editingTransport.id}`
        : "http://localhost:5000/api/admin/transport";
      const method = editingTransport ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (data.success) {
        showFlash(
          "success",
          "Success",
          editingTransport ? "Transport updated" : "Transport created",
        );
        setShowForm(false);
        setEditingTransport(null);
        resetForm();
        fetchData();
      }
    } catch (error) {
      console.error("Error saving transport:", error);
      showFlash("error", "Error", "Failed to save transport");
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
        `http://localhost:5000/api/admin/transport/${deleteModal.id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await res.json();
      if (data.success) {
        showFlash("success", "Success", "Transport deleted");
        fetchData();
      }
    } catch (error) {
      console.error("Error deleting transport:", error);
      showFlash("error", "Error", "Failed to delete transport");
    } finally {
      setDeleteModal({ isOpen: false, id: null, name: "" });
    }
  };

  const editTransport = (item) => {
    setEditingTransport(item);
    
    setFormData({
      type: item.type?.toLowerCase() || "bus",
      company: item.company || "",
      price_per_person: item.price || "",
      duration: item.duration || "",
      comfort_level: item.comfort || "Standard",
      departure_city: item.from || "Dhaka",
      available_seats: item.seats || "",
      departure_time: item.departure_time || "",
      arrival_time: item.arrival_time || "",
      dest_id: item.dest_id || "",
    });
    setShowForm(true);
  };

  const getTransportIcon = (type) => {
    const icons = {
      bus: "🚌",
      train: "🚂",
      flight: "✈️",
      launch: "⛴️",
      car: "🚗",
    };
    return icons[type?.toLowerCase()] || "🚗";
  };

  // Get destination name by ID
  const getDestinationName = (destId) => {
    const dest = destinations.find(d => d.id === destId);
    return dest ? dest.name : "Unknown";
  };

  if (loading) {
    return (
      <AdminLayout user={user} onLogout={onLogout} title="Transport Management">
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout user={user} onLogout={onLogout} title="Transport Management">
      <Flash
        isOpen={flash.isOpen}
        onClose={() => setFlash((prev) => ({ ...prev, isOpen: false }))}
        type={flash.type}
        title={flash.title}
        message={flash.message}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, id: null, name: "" })}
        onConfirm={confirmDelete}
        title="Delete Transport"
        message={`Are you sure you want to delete "${deleteModal.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
      />

      {/* Add Transport Button */}
      <button
        onClick={() => {
          setShowForm(!showForm);
          setEditingTransport(null);
          resetForm();
        }}
        className="mb-4 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
      >
        {showForm ? "Cancel" : "+ Add Transport"}
      </button>

      {/* Transport Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-6 p-6 border rounded-lg bg-gray-50"
        >
          <h3 className="text-lg font-bold mb-4">
            {editingTransport ? "✏️ Edit Transport" : "➕ Add New Transport"}
          </h3>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Transport Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Transport Type <span className="text-red-500">*</span>
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                className="w-full p-2 border rounded-lg"
                required
              >
                {transportTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.icon} {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Company Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="company"
                value={formData.company}
                onChange={handleInputChange}
                placeholder="e.g., Green Line, Bangladesh Biman"
                className="w-full p-2 border rounded-lg"
                required
              />
            </div>

            {/* From Location (Departure City) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                From Location <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="departure_city"
                value={formData.departure_city}
                onChange={handleInputChange}
                placeholder="e.g., Dhaka"
                className="w-full p-2 border rounded-lg"
                required
              />
              <p className="text-xs text-gray-400 mt-1">Departure city/station</p>
            </div>

            {/* To Location (Destination) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                To Location <span className="text-red-500">*</span>
              </label>
              <select
                name="dest_id"
                value={formData.dest_id}
                onChange={handleInputChange}
                className="w-full p-2 border rounded-lg"
                required
              >
                <option value="">Select Destination</option>
                {destinations.map((dest) => (
                  <option key={dest.id} value={dest.id}>
                    {dest.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-400 mt-1">Destination city</p>
            </div>

            {/* Price per Person */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price per Person (Tk) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="price_per_person"
                value={formData.price_per_person}
                onChange={handleInputChange}
                placeholder="e.g., 1200"
                className="w-full p-2 border rounded-lg"
                min="0"
                required
              />
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Duration <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="duration"
                value={formData.duration}
                onChange={handleInputChange}
                placeholder="e.g., 6 hours"
                className="w-full p-2 border rounded-lg"
                required
              />
            </div>

            {/* Comfort Level */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Comfort Level <span className="text-red-500">*</span>
              </label>
              <select
                name="comfort_level"
                value={formData.comfort_level}
                onChange={handleInputChange}
                className="w-full p-2 border rounded-lg"
                required
              >
                {comfortLevels.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </div>

            {/* Available Seats */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Available Seats <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="available_seats"
                value={formData.available_seats}
                onChange={handleInputChange}
                placeholder="e.g., 40"
                className="w-full p-2 border rounded-lg"
                min="0"
                required
              />
            </div>

            {/* Departure Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Departure Time
              </label>
              <input
                type="text"
                name="departure_time"
                value={formData.departure_time}
                onChange={handleInputChange}
                placeholder="e.g., 08:00 AM"
                className="w-full p-2 border rounded-lg"
              />
            </div>

            {/* Arrival Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Arrival Time
              </label>
              <input
                type="text"
                name="arrival_time"
                value={formData.arrival_time}
                onChange={handleInputChange}
                placeholder="e.g., 02:00 PM"
                className="w-full p-2 border rounded-lg"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex gap-3 mt-6">
            <button
              type="submit"
              className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700"
            >
              {editingTransport ? "Update Transport" : "Save Transport"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditingTransport(null);
                resetForm();
              }}
              className="flex-1 border border-gray-300 py-2 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Transport List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {transport.map((item) => (
          <div
            key={item.id}
            className="border rounded-lg p-4 hover:shadow-lg transition"
          >
            <div className="flex justify-between items-start">
              <div className="flex items-start gap-3">
                <span className="text-3xl">{getTransportIcon(item.type)}</span>
                <div>
                  <h3 className="font-bold">{item.company}</h3>
                  <p className="text-sm text-gray-600">
                    {item.type} · {item.comfort}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    <span className="font-medium">From:</span> {item.from} · <span className="font-medium">To:</span> {getDestinationName(item.dest_id)}
                  </p>
                  <p className="text-xs text-gray-500">
                    <span className="font-medium">Duration:</span> {item.duration}
                  </p>
                  {item.departure_time && item.arrival_time && (
                    <p className="text-xs text-blue-600 mt-1">
                      🕒 {item.departure_time} - {item.arrival_time}
                    </p>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-indigo-600">
                  ৳{item.price}
                </p>
                <p className="text-xs text-gray-500">per person</p>
                <p className="text-xs text-green-600 mt-1">
                  {item.seats} seats
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 mt-3 pt-2 border-t">
              <button
                onClick={() => editTransport(item)}
                className="text-blue-600 text-sm hover:underline"
              >
                Edit
              </button>
              <button
                onClick={() => handleDeleteClick(item.id, item.company)}
                className="text-red-600 text-sm hover:underline"
              >
                Delete
              </button>
            </div>
          </div>
        ))}

        {transport.length === 0 && !loading && (
          <div className="col-span-2 text-center py-12 text-gray-500">
            No transport options found. Add your first transport option!
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminTransport;