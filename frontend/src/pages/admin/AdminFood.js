import React, { useState, useEffect, useCallback } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import Flash from "../../components/FlashMessage";
import ConfirmationModal from "../../components/ConfirmationModal";

const AdminFood = ({ user, onLogout }) => {
  const [foodCategories, setFoodCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [flash, setFlash] = useState({
    isOpen: false,
    type: "success",
    title: "",
    message: "",
  });
  const [showForm, setShowForm] = useState(false);
  const [editingFood, setEditingFood] = useState(null);
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    id: null,
    name: "",
  });

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    breakfast_cost: "",
    lunch_cost: "",
    dinner_cost: "",
    daily_cost_per_person: "",
  });

  // Standard showFlash function
  const showFlash = useCallback((type, title, message) => {
    setFlash({ isOpen: true, type, title, message });
    setTimeout(() => setFlash((prev) => ({ ...prev, isOpen: false })), 3000);
  }, []);

  // Fetch food categories
  const fetchData = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await fetch("http://localhost:5000/api/admin/food", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setFoodCategories(data.foodCategories);
    } catch (error) {
      console.error("Error fetching food categories:", error);
      showFlash("error", "Error", "Failed to load food categories");
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
    
    // Auto-calculate daily total when any meal cost changes
    if (name === "breakfast_cost" || name === "lunch_cost" || name === "dinner_cost") {
      const breakfast = parseFloat(name === "breakfast_cost" ? value : formData.breakfast_cost) || 0;
      const lunch = parseFloat(name === "lunch_cost" ? value : formData.lunch_cost) || 0;
      const dinner = parseFloat(name === "dinner_cost" ? value : formData.dinner_cost) || 0;
      const dailyTotal = breakfast + lunch + dinner;
      setFormData((prev) => ({ ...prev, daily_cost_per_person: dailyTotal }));
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      breakfast_cost: "",
      lunch_cost: "",
      dinner_cost: "",
      daily_cost_per_person: "",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Calculate daily total if not auto-calculated
    const breakfast = parseFloat(formData.breakfast_cost) || 0;
    const lunch = parseFloat(formData.lunch_cost) || 0;
    const dinner = parseFloat(formData.dinner_cost) || 0;
    const dailyTotal = breakfast + lunch + dinner;

    const submitData = {
      ...formData,
      daily_cost_per_person: dailyTotal,
    };

    try {
      const token = localStorage.getItem("token");
      const url = editingFood
        ? `http://localhost:5000/api/admin/food/${editingFood.id}`
        : "http://localhost:5000/api/admin/food";
      const method = editingFood ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(submitData),
      });

      const data = await res.json();
      if (data.success) {
        showFlash(
          "success",
          "Success",
          editingFood ? "Food category updated" : "Food category created",
        );
        setShowForm(false);
        setEditingFood(null);
        resetForm();
        fetchData();
      }
    } catch (error) {
      console.error("Error saving food category:", error);
      showFlash("error", "Error", "Failed to save food category");
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
        `http://localhost:5000/api/admin/food/${deleteModal.id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await res.json();
      if (data.success) {
        showFlash("success", "Success", "Food category deleted");
        fetchData();
      }
    } catch (error) {
      console.error("Error deleting food category:", error);
      showFlash("error", "Error", "Failed to delete food category");
    } finally {
      setDeleteModal({ isOpen: false, id: null, name: "" });
    }
  };

  const editFood = (item) => {
    setEditingFood(item);
    setFormData({
      name: item.name || "",
      breakfast_cost: item.breakfast || "",
      lunch_cost: item.lunch || "",
      dinner_cost: item.dinner || "",
      daily_cost_per_person: item.daily || "",
    });
    setShowForm(true);
  };

  const getMealIcon = (mealType) => {
    const icons = {
      breakfast: "🍳",
      lunch: "🍱",
      dinner: "🍛",
    };
    return icons[mealType] || "🍽️";
  };

  if (loading) {
    return (
      <AdminLayout user={user} onLogout={onLogout} title="Food Categories">
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout user={user} onLogout={onLogout} title="Food Categories">
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
        title="Delete Food Category"
        message={`Are you sure you want to delete "${deleteModal.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
      />

      {/* Add Food Category Button */}
      <button
        onClick={() => {
          setShowForm(!showForm);
          setEditingFood(null);
          resetForm();
        }}
        className="mb-4 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
      >
        {showForm ? "Cancel" : "+ Add Food Category"}
      </button>

      {/* Food Category Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-6 p-6 border rounded-lg bg-gray-50"
        >
          <h3 className="text-lg font-bold mb-4">
            {editingFood ? "✏️ Edit Food Category" : "➕ Add New Food Category"}
          </h3>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Category Name */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g., Budget, Standard, Premium"
                className="w-full p-2 border rounded-lg"
                required
              />
              <p className="text-xs text-gray-400 mt-1">
                Examples: Economy Meals, Standard Meals, Premium Dining
              </p>
            </div>

            {/* Breakfast Cost */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {getMealIcon("breakfast")} Breakfast Cost (Tk)
              </label>
              <input
                type="number"
                name="breakfast_cost"
                value={formData.breakfast_cost}
                onChange={handleInputChange}
                placeholder="e.g., 150"
                className="w-full p-2 border rounded-lg"
                min="0"
                step="10"
              />
            </div>

            {/* Lunch Cost */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {getMealIcon("lunch")} Lunch Cost (Tk)
              </label>
              <input
                type="number"
                name="lunch_cost"
                value={formData.lunch_cost}
                onChange={handleInputChange}
                placeholder="e.g., 250"
                className="w-full p-2 border rounded-lg"
                min="0"
                step="10"
              />
            </div>

            {/* Dinner Cost */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {getMealIcon("dinner")} Dinner Cost (Tk)
              </label>
              <input
                type="number"
                name="dinner_cost"
                value={formData.dinner_cost}
                onChange={handleInputChange}
                placeholder="e.g., 300"
                className="w-full p-2 border rounded-lg"
                min="0"
                step="10"
              />
            </div>

            {/* Daily Total (Auto-calculated) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                📊 Daily Total per Person (Tk)
              </label>
              <input
                type="number"
                name="daily_cost_per_person"
                value={formData.daily_cost_per_person}
                readOnly
                className="w-full p-2 border rounded-lg bg-gray-100 text-gray-700"
                placeholder="Auto-calculated"
              />
              <p className="text-xs text-gray-400 mt-1">
                Auto-calculated from breakfast + lunch + dinner
              </p>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex gap-3 mt-6">
            <button
              type="submit"
              className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700"
            >
              {editingFood ? "Update Category" : "Save Category"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditingFood(null);
                resetForm();
              }}
              className="flex-1 border border-gray-300 py-2 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Food Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {foodCategories.map((item) => (
          <div
            key={item.id}
            className="border rounded-lg overflow-hidden hover:shadow-lg transition"
          >
            {/* Colored Header based on category */}
            <div className={`p-3 text-white font-bold ${
              item.name?.toLowerCase().includes("budget") ? "bg-green-600" :
              item.name?.toLowerCase().includes("standard") ? "bg-blue-600" :
              item.name?.toLowerCase().includes("premium") ? "bg-purple-600" :
              "bg-indigo-600"
            }`}>
              <h3 className="text-lg">{item.name} Meals</h3>
            </div>

            {/* Meal Costs */}
            <div className="p-4 space-y-3">
              <div className="flex justify-between items-center border-b pb-2">
                <span className="flex items-center gap-2">
                  <span className="text-xl">{getMealIcon("breakfast")}</span>
                  <span className="text-sm text-gray-600">Breakfast</span>
                </span>
                <span className="font-bold text-indigo-600">৳{item.breakfast}</span>
              </div>

              <div className="flex justify-between items-center border-b pb-2">
                <span className="flex items-center gap-2">
                  <span className="text-xl">{getMealIcon("lunch")}</span>
                  <span className="text-sm text-gray-600">Lunch</span>
                </span>
                <span className="font-bold text-indigo-600">৳{item.lunch}</span>
              </div>

              <div className="flex justify-between items-center border-b pb-2">
                <span className="flex items-center gap-2">
                  <span className="text-xl">{getMealIcon("dinner")}</span>
                  <span className="text-sm text-gray-600">Dinner</span>
                </span>
                <span className="font-bold text-indigo-600">৳{item.dinner}</span>
              </div>

              <div className="flex justify-between items-center pt-2 mt-2 border-t-2 border-dashed">
                <span className="font-semibold">Daily Total</span>
                <span className="text-lg font-bold text-green-600">৳{item.daily}</span>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 mt-4 pt-2 border-t">
                <button
                  onClick={() => editFood(item)}
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

        {foodCategories.length === 0 && !loading && (
          <div className="col-span-3 text-center py-12 text-gray-500">
            No food categories found. Add your first food category!
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminFood;