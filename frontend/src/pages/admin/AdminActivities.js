import React, { useState, useEffect, useCallback } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import Flash from "../../components/FlashMessage";
import ConfirmationModal from "../../components/ConfirmationModal";

const AdminActivities = ({ user, onLogout }) => {
  const [activities, setActivities] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [interests, setInterests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [flash, setFlash] = useState({
    isOpen: false,
    type: "success",
    title: "",
    message: "",
  });
  const [showForm, setShowForm] = useState(false);
  const [editingActivity, setEditingActivity] = useState(null);
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    id: null,
    name: "",
  });

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    cost_per_person: "",
    duration_hours: "",
    interest_type: "",
    image: null,
    dest_id: "",
  });

  // Standard showFlash function
  const showFlash = useCallback((type, title, message) => {
    setFlash({ isOpen: true, type, title, message });
    setTimeout(() => setFlash((prev) => ({ ...prev, isOpen: false })), 3000);
  }, []);

  // Fetch activities, destinations, and interests
  const fetchData = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");

      // Fetch destinations for dropdown
      const destRes = await fetch("http://localhost:5000/api/admin/destinations", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const destData = await destRes.json();
      if (destData.success) setDestinations(destData.destinations);

      // Fetch interests for dropdown
      const intRes = await fetch("http://localhost:5000/api/admin/interests", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const intData = await intRes.json();
      if (intData.success) setInterests(intData.interests);

      // Fetch activities
      const actRes = await fetch("http://localhost:5000/api/admin/activities", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const actData = await actRes.json();
      if (actData.success) setActivities(actData.activities);
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

  const handleFileChange = (e) => {
    setFormData((prev) => ({ ...prev, image: e.target.files[0] }));
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      cost_per_person: "",
      duration_hours: "",
      interest_type: "",
      image: null,
      dest_id: "",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const form = new FormData();
    Object.keys(formData).forEach(key => {
      if (formData[key] !== null) form.append(key, formData[key]);
    });

    try {
      const token = localStorage.getItem("token");
      const url = editingActivity
        ? `http://localhost:5000/api/admin/activities/${editingActivity.id}`
        : "http://localhost:5000/api/admin/activities";
      const method = editingActivity ? "PUT" : "POST";

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
          editingActivity ? "Activity updated" : "Activity created",
        );
        setShowForm(false);
        setEditingActivity(null);
        resetForm();
        fetchData();
      }
    } catch (error) {
      console.error("Error saving activity:", error);
      showFlash("error", "Error", "Failed to save activity");
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
        `http://localhost:5000/api/admin/activities/${deleteModal.id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await res.json();
      if (data.success) {
        showFlash("success", "Success", "Activity deleted");
        fetchData();
      }
    } catch (error) {
      console.error("Error deleting activity:", error);
      showFlash("error", "Error", "Failed to delete activity");
    } finally {
      setDeleteModal({ isOpen: false, id: null, name: "" });
    }
  };

  const editActivity = (item) => {
    setEditingActivity(item);
    setFormData({
      name: item.name || "",
      description: item.description || "",
      cost_per_person: item.cost || "",
      duration_hours: item.duration || "",
      interest_type: item.interest || "",
      image: null,
      dest_id: item.dest_id || "",
    });
    setShowForm(true);
  };

  const getInterestIcon = (interest) => {
    const icons = {
      adventure: "🏔️",
      cultural: "🏛️",
      beach: "🏖️",
      hiking: "🥾",
      food: "🍜",
      shopping: "🛍️",
      wildlife: "🦁",
      religious: "🕍",
    };
    return icons[interest?.toLowerCase()] || "🎯";
  };

  if (loading) {
    return (
      <AdminLayout user={user} onLogout={onLogout} title="Activity Management">
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout user={user} onLogout={onLogout} title="Activity Management">
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
        title="Delete Activity"
        message={`Are you sure you want to delete "${deleteModal.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
      />

      {/* Add Activity Button */}
      <button
        onClick={() => {
          setShowForm(!showForm);
          setEditingActivity(null);
          resetForm();
        }}
        className="mb-4 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
      >
        {showForm ? "Cancel" : "+ Add Activity"}
      </button>

      {/* Activity Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-6 p-6 border rounded-lg bg-gray-50"
        >
          <h3 className="text-lg font-bold mb-4">
            {editingActivity ? "✏️ Edit Activity" : "➕ Add New Activity"}
          </h3>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Activity Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Activity Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g., Scuba Diving, Museum Tour"
                className="w-full p-2 border rounded-lg"
                required
              />
            </div>

            {/* Destination */}
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

            {/* Cost per Person */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cost per Person (Tk) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="cost_per_person"
                value={formData.cost_per_person}
                onChange={handleInputChange}
                placeholder="e.g., 1500 (0 for free)"
                className="w-full p-2 border rounded-lg"
                min="0"
                required
              />
            </div>

            {/* Duration Hours */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Duration (hours) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="duration_hours"
                value={formData.duration_hours}
                onChange={handleInputChange}
                placeholder="e.g., 2.5"
                className="w-full p-2 border rounded-lg"
                min="0.5"
                step="0.5"
                required
              />
            </div>

            {/* Interest Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Interest Type <span className="text-red-500">*</span>
              </label>
              <select
                name="interest_type"
                value={formData.interest_type}
                onChange={handleInputChange}
                className="w-full p-2 border rounded-lg"
                required
              >
                <option value="">Select Interest</option>
                {interests.map((interest) => (
                  <option key={interest.id} value={interest.name}>
                    {interest.icon} {interest.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Activity Image */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Activity Image
              </label>
              <input
                type="file"
                name="image"
                onChange={handleFileChange}
                className="w-full border rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                accept="image/*"
              />
              <p className="text-xs text-gray-400 mt-1">Upload JPG, PNG or GIF (max. 5MB)</p>
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
                placeholder="Describe the activity..."
                className="w-full p-2 border rounded-lg"
                rows="3"
                required
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex gap-3 mt-6">
            <button
              type="submit"
              className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700"
            >
              {editingActivity ? "Update Activity" : "Save Activity"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditingActivity(null);
                resetForm();
              }}
              className="flex-1 border border-gray-300 py-2 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Activities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {activities.map((item) => (
          <div
            key={item.id}
            className="border rounded-lg overflow-hidden hover:shadow-lg transition"
          >
            {/* Activity Image */}
            <div className="h-40 bg-gray-100 relative">
              {item.image ? (
                <img
                  src={`http://localhost:5000${item.image}`}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-5xl text-gray-400">
                  {getInterestIcon(item.interest)}
                </div>
              )}
              {/* Price Badge */}
              <div className="absolute top-2 right-2 bg-indigo-600 text-white px-2 py-1 rounded-full text-xs font-bold">
                {item.cost === 0 ? "FREE" : `৳${item.cost}`}
              </div>
            </div>

            {/* Activity Details */}
            <div className="p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-gray-800">{item.name}</h3>
                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                  {item.duration} hrs
                </span>
              </div>

              <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                {item.description}
              </p>

              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">{getInterestIcon(item.interest)}</span>
                <span className="text-xs text-gray-500">{item.interest}</span>
              </div>

              <div className="text-xs text-gray-500 mb-3">
                📍 {item.destination_name}
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-2 border-t">
                <button
                  onClick={() => editActivity(item)}
                  className="text-blue-600 text-sm hover:underline"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteClick(item.id, item.name)}
                  className="text-red-600 text-sm hover:underline"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}

        {activities.length === 0 && !loading && (
          <div className="col-span-3 text-center py-12 text-gray-500">
            No activities found. Add your first activity!
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminActivities;