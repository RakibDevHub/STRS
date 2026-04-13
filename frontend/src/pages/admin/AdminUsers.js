import React, { useState, useEffect, useCallback } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import Flash from "../../components/FlashMessage";
import ConfirmationModal from "../../components/ConfirmationModal";

const AdminUsers = ({ user, onLogout }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    id: null,
    name: "",
  });

  const fetchUsers = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/admin/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setUsers(data.users);
    } catch (error) {
      console.error("Error fetching users:", error);
      showFlash("error", "Error", "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, []);

  const [flash, setFlash] = useState({
    isOpen: false,
    type: "success",
    title: "",
    message: "",
  });

  const showFlash = (type, title, message) => {
    setFlash({ isOpen: true, type, title, message });
    setTimeout(() => setFlash((prev) => ({ ...prev, isOpen: false })), 3000);
  };

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleRoleChange = async (userId, newRole) => {
    // Prevent admin from changing their own role
    if (userId === user.id) {
      showFlash("error", "Cannot Change", "You cannot change your own role");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `http://localhost:5000/api/admin/users/${userId}/role`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ role: newRole }),
        },
      );
      const data = await res.json();
      if (data.success) {
        showFlash("success", "Success", "User role updated");
        fetchUsers();
      }
    } catch (error) {
      console.error("Error updating role:", error);
      showFlash("error", "Error", "Failed to update role");
    }
  };

  const handleDeleteClick = (userId, userName) => {
    setDeleteModal({ isOpen: true, id: userId, name: userName });
  };

  const confirmDelete = async () => {
    if (!deleteModal.id) return;

    // Prevent admin from deleting themselves
    if (deleteModal.id === user.id) {
      showFlash("error", "Cannot Delete", "You cannot delete your own account");
      setDeleteModal({ isOpen: false, id: null, name: "" });
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `http://localhost:5000/api/admin/users/${deleteModal.id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await res.json();
      if (data.success) {
        showFlash("success", "Success", "User deleted");
        fetchUsers();
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      showFlash("error", "Error", "Failed to delete user");
    } finally {
      setDeleteModal({ isOpen: false, id: null, name: "" });
    }
  };

  if (loading) {
    return (
      <AdminLayout user={user} onLogout={onLogout} title="User Management">
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout user={user} onLogout={onLogout} title="User Management">
      <Flash
        isOpen={flash.isOpen}
        onClose={() => setFlash((prev) => ({ ...prev, isOpen: false }))}
        type={flash.type}
        title={flash.title}
        message={flash.message}
      />

      {/* Users Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3">ID</th>
              <th className="text-left py-3">Name</th>
              <th className="text-left py-3">Email</th>
              <th className="text-left py-3">Phone</th>
              <th className="text-left py-3">Role</th>
              <th className="text-left py-3">Joined</th>
              <th className="text-left py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr
                key={u.id}
                className={`border-b hover:bg-gray-50 ${u.id === user.id ? "bg-indigo-50" : ""}`}
              >
                <td className="py-3">{u.id}</td>
                <td className="py-3">
                  {u.name}
                  {u.id === user.id && (
                    <span className="ml-2 px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded-full">
                      You
                    </span>
                  )}
                </td>
                <td className="py-3">{u.email}</td>
                <td className="py-3">{u.phone || "—"}</td>
                <td className="py-3">
                  <select
                    value={u.role}
                    onChange={(e) => handleRoleChange(u.id, e.target.value)}
                    disabled={u.id === user.id} // Disable role change for self
                    className={`px-2 py-1 border rounded text-sm ${
                      u.id === user.id ? "bg-gray-100 cursor-not-allowed" : ""
                    }`}
                  >
                    <option value="traveler">Traveler</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
                <td className="py-3">
                  {new Date(u.joined).toLocaleDateString()}
                </td>
                <td className="py-3">
                  <button
                    onClick={() => handleDeleteClick(u.id, u.name)}
                    className={`text-sm ${
                      u.id === user.id
                        ? "text-gray-400 cursor-not-allowed"
                        : "text-red-600 hover:text-red-800"
                    }`}
                    disabled={u.id === user.id}
                    title={
                      u.id === user.id
                        ? "Cannot delete your own account"
                        : "Delete user"
                    }
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, id: null, name: "" })}
        onConfirm={confirmDelete}
        title="Delete User"
        message={`Are you sure you want to delete "${deleteModal.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
      />
    </AdminLayout>
  );
};

export default AdminUsers;
