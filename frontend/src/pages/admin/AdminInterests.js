// frontend/src/pages/admin/AdminInterests.js
import React, { useState, useEffect, useCallback } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import Flash from "../../components/FlashMessage";
import ConfirmationModal from "../../components/ConfirmationModal";

const AdminInterests = ({ user, onLogout }) => {
  const [interests, setInterests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [flash, setFlash] = useState({
    isOpen: false,
    type: "success",
    title: "",
    message: "",
  });
  const [showForm, setShowForm] = useState(false);
  const [editingInterest, setEditingInterest] = useState(null);
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    id: null,
    name: "",
  });
  const [formData, setFormData] = useState({ name: "", icon: "" });

  // Common icons for selection
  const iconOptions = [
    "🏔️",
    "🏖️",
    "🏛️",
    "🌿",
    "🛍️",
    "🍜",
    "🎭",
    "🏕️",
    "⛰️",
    "🏝️",
    "🎨",
    "📷",
    "🚣",
    "🏄",
    "🧗",
    "🦁",
    "🐘",
    "🕍",
    "⛩️",
    "🏯",
  ];

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
    } finally {
      setLoading(false);
    }
  }, [showFlash]);

  useEffect(() => {
    fetchInterests();
  }, [fetchInterests]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const url = editingInterest
        ? `http://localhost:5000/api/admin/interests/${editingInterest.id}`
        : "http://localhost:5000/api/admin/interests";
      const method = editingInterest ? "PUT" : "POST";

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
          editingInterest ? "Interest updated" : "Interest created",
        );
        setShowForm(false);
        setEditingInterest(null);
        setFormData({ name: "", icon: "" });
        fetchInterests();
      }
    } catch (error) {
      console.error("Error saving interest:", error);
      showFlash("error", "Error", "Failed to save interest");
    }
  };

  const handleDeleteClick = (id, name) => {
    setDeleteModal({ isOpen: true, id, name });
  };

  const confirmDelete = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `http://localhost:5000/api/admin/interests/${deleteModal.id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await res.json();
      if (data.success) {
        showFlash("success", "Success", "Interest deleted");
        fetchInterests();
      }
    } catch (error) {
      console.error("Error deleting interest:", error);
      showFlash("error", "Error", "Failed to delete interest");
    } finally {
      setDeleteModal({ isOpen: false, id: null, name: "" });
    }
  };

  const editInterest = (interest) => {
    setEditingInterest(interest);
    setFormData({ name: interest.name, icon: interest.icon });
    setShowForm(true);
  };

  if (loading) {
    return (
      <AdminLayout user={user} onLogout={onLogout} title="Interest Management">
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout user={user} onLogout={onLogout} title="Interest Management">
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
        title="Delete Interest"
        message={`Are you sure you want to delete "${deleteModal.name}"?`}
        confirmText="Delete"
        cancelText="Cancel"
      />

      <button
        onClick={() => {
          setShowForm(!showForm);
          setEditingInterest(null);
          setFormData({ name: "", icon: "" });
        }}
        className="mb-4 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
      >
        {showForm ? "Cancel" : "+ Add Interest"}
      </button>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-6 p-4 border rounded-lg bg-gray-50"
        >
          <h3 className="font-bold mb-4">
            {editingInterest ? "Edit" : "Add"} Interest
          </h3>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g., Adventure, Cultural"
                className="w-full p-2 border rounded"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Icon</label>
              <select
                value={formData.icon}
                onChange={(e) =>
                  setFormData({ ...formData, icon: e.target.value })
                }
                className="w-full p-2 border rounded"
                required
              >
                <option value="">Select an icon</option>
                {iconOptions.map((icon) => (
                  <option key={icon} value={icon}>
                    {icon}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
          >
            {editingInterest ? "Update" : "Save"}
          </button>
        </form>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {interests.map((interest) => (
          <div
            key={interest.id}
            className="border rounded-lg p-4 hover:shadow-lg transition"
          >
            <div className="text-4xl mb-2">{interest.icon}</div>
            <h3 className="font-bold">{interest.name}</h3>
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => editInterest(interest)}
                className="text-blue-600 text-sm"
              >
                Edit
              </button>
              <button
                onClick={() => handleDeleteClick(interest.id, interest.name)}
                className="text-red-600 text-sm"
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

export default AdminInterests;
