import React, { useState, useEffect, useCallback } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import Flash from "../../components/FlashMessage";
import ConfirmationModal from "../../components/ConfirmationModal";

const AdminHotels = ({ user, onLogout }) => {
  const [hotels, setHotels] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingHotel, setEditingHotel] = useState(null);
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    id: null,
    name: "",
  });
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [showRoomForm, setShowRoomForm] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  // const [roomDeleteModal, setRoomDeleteModal] = useState({ isOpen: false, id: null, name: "" });

  // Form state for hotel
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    address: "",
    phone: "",
    rating: 0,
    distance: 0,
    amenities: "",
    image: null,
    check_in_time: "12:00 PM",
    check_out_time: "11:00 AM",
    dest_id: "",
  });

  // Form state for room
  const [roomFormData, setRoomFormData] = useState({
    room_type: "",
    bed_type: "",
    price_per_night: 0,
    max_guests: 2,
    meals_included: "None",
    has_ac: true,
    available_rooms: 0,
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

  // Fetch hotels and destinations
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

      // Fetch hotels
      const hotelRes = await fetch("http://localhost:5000/api/admin/hotels", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const hotelData = await hotelRes.json();
      if (hotelData.success) setHotels(hotelData.hotels);
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

  // Hotel form handlers
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setFormData((prev) => ({ ...prev, image: e.target.files[0] }));
  };

  const handleAmenitiesChange = (e) => {
    setFormData((prev) => ({ ...prev, amenities: e.target.value }));
  };

  const handleSubmitHotel = async (e) => {
    e.preventDefault();
    const form = new FormData();
    Object.keys(formData).forEach((key) => {
      if (formData[key] !== null) form.append(key, formData[key]);
    });

    try {
      const token = localStorage.getItem("token");
      const url = editingHotel
        ? `http://localhost:5000/api/admin/hotels/${editingHotel.id}`
        : "http://localhost:5000/api/admin/hotels";
      const method = editingHotel ? "PUT" : "POST";

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
          editingHotel ? "Hotel updated" : "Hotel created",
        );
        setShowForm(false);
        setEditingHotel(null);
        resetForm();
        fetchData();
      }
    } catch (error) {
      console.error("Error saving hotel:", error);
      showFlash("error", "Error", "Failed to save hotel");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      address: "",
      phone: "",
      rating: 0,
      distance: 0,
      amenities: "",
      image: null,
      check_in_time: "12:00 PM",
      check_out_time: "11:00 AM",
      dest_id: "",
    });
  };

  const handleDeleteClick = (id, name) => {
    setDeleteModal({ isOpen: true, id, name });
  };

  const confirmDelete = async () => {
    if (!deleteModal.id) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `http://localhost:5000/api/admin/hotels/${deleteModal.id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await res.json();
      if (data.success) {
        showFlash("success", "Success", "Hotel deleted");
        fetchData();
      }
    } catch (error) {
      console.error("Error deleting hotel:", error);
      showFlash("error", "Error", "Failed to delete hotel");
    } finally {
      setDeleteModal({ isOpen: false, id: null, name: "" });
    }
  };

  const editHotel = (hotel) => {
    setEditingHotel(hotel);
    setFormData({
      name: hotel.name,
      description: hotel.description || "",
      address: hotel.address,
      phone: hotel.phone,
      rating: hotel.rating,
      distance: hotel.distance,
      amenities: Array.isArray(hotel.amenities)
        ? hotel.amenities.join(", ")
        : hotel.amenities,
      image: null,
      check_in_time: hotel.check_in_time || "12:00 PM",
      check_out_time: hotel.check_out_time || "11:00 AM",
      dest_id: hotel.dest_id,
    });
    setShowForm(true);
  };

  // Room management functions
  const handleRoomInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setRoomFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleAddRoom = (hotel) => {
    setSelectedHotel(hotel);
    setEditingRoom(null);
    setRoomFormData({
      room_type: "",
      bed_type: "",
      price_per_night: 0,
      max_guests: 2,
      meals_included: "None",
      has_ac: true,
      available_rooms: 0,
    });
    setShowRoomForm(true);
  };

  const handleEditRoom = (hotel, room) => {
    setSelectedHotel(hotel);
    setEditingRoom(room);
    setRoomFormData({
      room_type: room.type,
      bed_type: room.bed,
      price_per_night: room.price,
      max_guests: room.max_guests,
      meals_included: room.meals,
      has_ac: room.ac,
      available_rooms: room.available,
    });
    setShowRoomForm(true);
  };

  const handleSubmitRoom = async (e) => {
    e.preventDefault();
    if (!selectedHotel) return;

    try {
      const token = localStorage.getItem("token");
      const url = editingRoom
        ? `http://localhost:5000/api/admin/hotels/${selectedHotel.id}/rooms/${editingRoom.id}`
        : `http://localhost:5000/api/admin/hotels/${selectedHotel.id}/rooms`;
      const method = editingRoom ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(roomFormData),
      });
      const data = await res.json();
      if (data.success) {
        showFlash(
          "success",
          "Success",
          editingRoom ? "Room updated" : "Room added",
        );
        setShowRoomForm(false);
        setSelectedHotel(null);
        setEditingRoom(null);
        fetchData();
      }
    } catch (error) {
      console.error("Error saving room:", error);
      showFlash("error", "Error", "Failed to save room");
    }
  };

  const handleDeleteRoom = async (hotelId, roomId, roomName) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `http://localhost:5000/api/admin/hotels/${hotelId}/rooms/${roomId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await res.json();
      if (data.success) {
        showFlash("success", "Success", "Room deleted");
        fetchData();
      }
    } catch (error) {
      console.error("Error deleting room:", error);
      showFlash("error", "Error", "Failed to delete room");
    }
  };

  if (loading) {
    return (
      <AdminLayout user={user} onLogout={onLogout} title="Hotel Management">
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout user={user} onLogout={onLogout} title="Hotel Management">
      <Flash
        isOpen={flash.isOpen}
        onClose={() => setFlash((prev) => ({ ...prev, isOpen: false }))}
        type={flash.type}
        title={flash.title}
        message={flash.message}
      />

      {/* Delete Confirmation Modal for Hotel */}
      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, id: null, name: "" })}
        onConfirm={confirmDelete}
        title="Delete Hotel"
        message={`Are you sure you want to delete "${deleteModal.name}"? This will also delete all rooms.`}
        confirmText="Delete"
        cancelText="Cancel"
      />

      {/* Room Form Modal */}
      {showRoomForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-bold mb-4">
                {editingRoom ? "✏️ Edit Room" : "➕ Add Room"} -{" "}
                {selectedHotel?.name}
              </h3>
              <form onSubmit={handleSubmitRoom}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Room Type <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="room_type"
                      value={roomFormData.room_type}
                      onChange={handleRoomInputChange}
                      placeholder="e.g., Deluxe, Standard, Suite"
                      className="w-full p-2 border rounded-lg"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bed Type <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="bed_type"
                      value={roomFormData.bed_type}
                      onChange={handleRoomInputChange}
                      placeholder="e.g., King, Queen, Twin"
                      className="w-full p-2 border rounded-lg"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Price per Night (Tk){" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="price_per_night"
                      value={roomFormData.price_per_night}
                      onChange={handleRoomInputChange}
                      placeholder="e.g., 5000"
                      className="w-full p-2 border rounded-lg"
                      min="0"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Max Guests <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="max_guests"
                      value={roomFormData.max_guests}
                      onChange={handleRoomInputChange}
                      placeholder="e.g., 2"
                      className="w-full p-2 border rounded-lg"
                      min="1"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Meals Included
                    </label>
                    <select
                      name="meals_included"
                      value={roomFormData.meals_included}
                      onChange={handleRoomInputChange}
                      className="w-full p-2 border rounded-lg"
                    >
                      <option value="None">None</option>
                      <option value="Breakfast">Breakfast Only</option>
                      <option value="Half Board">
                        Half Board (Breakfast + Dinner)
                      </option>
                      <option value="Full Board">Full Board (All Meals)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Available Rooms <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="available_rooms"
                      value={roomFormData.available_rooms}
                      onChange={handleRoomInputChange}
                      placeholder="e.g., 10"
                      className="w-full p-2 border rounded-lg"
                      min="0"
                      required
                    />
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="has_ac"
                      checked={roomFormData.has_ac}
                      onChange={handleRoomInputChange}
                      className="h-4 w-4 text-indigo-600 rounded"
                    />
                    <label className="ml-2 text-sm text-gray-700">
                      Air Conditioning Available
                    </label>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    type="submit"
                    className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700"
                  >
                    {editingRoom ? "Update Room" : "Add Room"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowRoomForm(false);
                      setSelectedHotel(null);
                      setEditingRoom(null);
                    }}
                    className="flex-1 border border-gray-300 py-2 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Add Hotel Button */}
      <button
        onClick={() => {
          setShowForm(!showForm);
          setEditingHotel(null);
          resetForm();
        }}
        className="mb-4 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
      >
        {showForm ? "Cancel" : "+ Add Hotel"}
      </button>

      {/* Hotel Form */}
      {showForm && (
        <form
          onSubmit={handleSubmitHotel}
          className="mb-6 p-6 border rounded-lg bg-gray-50"
        >
          <h3 className="text-lg font-bold mb-4">
            {editingHotel ? "✏️ Edit Hotel" : "➕ Add New Hotel"}
          </h3>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hotel Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g., Hotel Sea Crown"
                className="w-full p-2 border rounded-lg"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Destination <span className="text-red-500">*</span>
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
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="e.g., Beach Road, Kolatoli"
                className="w-full p-2 border rounded-lg"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="e.g., 01712345678"
                className="w-full p-2 border rounded-lg"
                required
              />
            </div>

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
                className="w-full p-2 border rounded-lg"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Distance from Center (km){" "}
                <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="distance"
                value={formData.distance}
                onChange={handleInputChange}
                placeholder="e.g., 2.5"
                step="0.1"
                className="w-full p-2 border rounded-lg"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Check-in Time
              </label>
              <input
                type="text"
                name="check_in_time"
                value={formData.check_in_time}
                onChange={handleInputChange}
                placeholder="e.g., 2:00 PM"
                className="w-full p-2 border rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Check-out Time
              </label>
              <input
                type="text"
                name="check_out_time"
                value={formData.check_out_time}
                onChange={handleInputChange}
                placeholder="e.g., 12:00 PM"
                className="w-full p-2 border rounded-lg"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amenities (comma separated)
              </label>
              <input
                type="text"
                name="amenities"
                value={formData.amenities}
                onChange={handleAmenitiesChange}
                placeholder="e.g., WiFi, Pool, Restaurant, Parking"
                className="w-full p-2 border rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hotel Image
              </label>
              <input
                type="file"
                name="image"
                onChange={handleFileChange}
                className="w-full border rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                accept="image/*"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe the hotel..."
                className="w-full p-2 border rounded-lg"
                rows="3"
              />
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="submit"
              className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700"
            >
              {editingHotel ? "Update Hotel" : "Save Hotel"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditingHotel(null);
                resetForm();
              }}
              className="flex-1 border border-gray-300 py-2 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Hotels List */}
      <div className="space-y-6">
        {hotels.map((hotel) => (
          <div
            key={hotel.id}
            className="border rounded-lg p-4 hover:shadow-lg transition"
          >
            <div className="flex flex-col md:flex-row gap-4">
              {/* Hotel Image */}
              <div className="md:w-32 h-32 bg-gray-100 rounded-lg overflow-hidden">
                {hotel.image ? (
                  <img
                    src={`http://localhost:5000${hotel.image}`}
                    alt={hotel.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl text-gray-400">
                    🏨
                  </div>
                )}
              </div>

              {/* Hotel Details */}
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-bold">{hotel.name}</h3>
                    <p className="text-sm text-gray-600">{hotel.address}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      📍 {hotel.distance} km from center · ⭐ {hotel.rating}
                    </p>
                    <p className="text-xs text-gray-500">📞 {hotel.phone}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => editHotel(hotel)}
                      className="text-blue-600 text-sm hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteClick(hotel.id, hotel.name)}
                      className="text-red-600 text-sm hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {/* Amenities */}
                {hotel.amenities && hotel.amenities.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {hotel.amenities.slice(0, 5).map((item, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs"
                      >
                        {item}
                      </span>
                    ))}
                    {hotel.amenities.length > 5 && (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">
                        +{hotel.amenities.length - 5} more
                      </span>
                    )}
                  </div>
                )}

                {/* Rooms Section */}
                <div className="mt-4">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-semibold">
                      Rooms ({hotel.rooms?.length || 0})
                    </h4>
                    <button
                      onClick={() => handleAddRoom(hotel)}
                      className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700"
                    >
                      + Add Room
                    </button>
                  </div>

                  {hotel.rooms && hotel.rooms.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {hotel.rooms.map((room) => (
                        <div
                          key={room.id}
                          className="border rounded p-3 text-sm"
                        >
                          <div className="flex justify-between">
                            <div>
                              <p className="font-medium">
                                {room.type} - {room.bed}
                              </p>
                              <p className="text-xs text-gray-500">
                                Max {room.max_guests} guests
                              </p>
                              <p className="text-xs text-indigo-600 font-bold">
                                {room.price} Tk/night
                              </p>
                              <p className="text-xs text-gray-500">
                                {room.available} rooms available
                              </p>
                              {room.meals !== "None" && (
                                <p className="text-xs text-green-600">
                                  ✓ {room.meals}
                                </p>
                              )}
                              {room.ac && (
                                <p className="text-xs text-blue-600">✓ AC</p>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleEditRoom(hotel, room)}
                                className="text-blue-600 text-xs hover:underline"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() =>
                                  handleDeleteRoom(hotel.id, room.id, room.type)
                                }
                                className="text-red-600 text-xs hover:underline"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 italic">
                      No rooms added yet
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
};

export default AdminHotels;
