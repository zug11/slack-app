"use client";

import { useEffect, useState } from "react";
import { PERMISSIONS } from "@/lib/permissions";

interface Role {
  id: string;
  name: string;
  color: string | null;
  permissions: string[];
  isDefault: boolean;
  isMentionable: boolean;
  sortOrder: number;
}

const PERMISSION_LIST = Object.entries(PERMISSIONS).map(([key, value]) => ({
  key,
  value,
  label: key
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/^\w/, (c) => c.toUpperCase()),
}));

const COLOR_PRESETS = [
  "#007a5a",
  "#1264a3",
  "#e01e5a",
  "#ecb22e",
  "#36c5f0",
  "#2eb67d",
  "#4a154b",
  "#e8912d",
];

export function RoleManager({ workspaceId }: { workspaceId: string }) {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);

  // Form state
  const [formName, setFormName] = useState("");
  const [formColor, setFormColor] = useState(COLOR_PRESETS[0]);
  const [formPermissions, setFormPermissions] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchRoles();
  }, [workspaceId]);

  async function fetchRoles() {
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/roles`);
      if (!res.ok) return;
      const data = await res.json();
      setRoles(data.roles || []);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setFormName("");
    setFormColor(COLOR_PRESETS[0]);
    setFormPermissions([]);
    setEditingRole(null);
    setShowForm(false);
  }

  function startEdit(role: Role) {
    setEditingRole(role);
    setFormName(role.name);
    setFormColor(role.color || COLOR_PRESETS[0]);
    setFormPermissions(role.permissions || []);
    setShowForm(true);
  }

  function togglePermission(perm: string) {
    setFormPermissions((prev) =>
      prev.includes(perm)
        ? prev.filter((p) => p !== perm)
        : [...prev, perm]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      if (editingRole) {
        // Update
        const res = await fetch(
          `/api/workspaces/${workspaceId}/roles/${editingRole.id}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: formName,
              color: formColor,
              permissions: formPermissions,
            }),
          }
        );
        if (res.ok) {
          const data = await res.json();
          setRoles((prev) =>
            prev.map((r) => (r.id === editingRole.id ? data.role : r))
          );
          resetForm();
        }
      } else {
        // Create
        const res = await fetch(`/api/workspaces/${workspaceId}/roles`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formName,
            color: formColor,
            permissions: formPermissions,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          setRoles((prev) => [...prev, data.role]);
          resetForm();
        }
      }
    } catch {
      // silently fail
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(roleId: string, roleName: string) {
    if (!confirm(`Delete the "${roleName}" role? This cannot be undone.`))
      return;

    try {
      const res = await fetch(
        `/api/workspaces/${workspaceId}/roles/${roleId}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        setRoles((prev) => prev.filter((r) => r.id !== roleId));
        if (editingRole?.id === roleId) resetForm();
      }
    } catch {
      // silently fail
    }
  }

  if (loading) {
    return (
      <div className="text-sm text-[#616061]">Loading roles...</div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-[#1d1c1d]">
          Roles ({roles.length})
        </h2>
        {!showForm && (
          <button
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className="px-4 py-2 bg-[#007a5a] text-white text-sm font-medium rounded-md hover:bg-[#005e44] transition-colors"
          >
            Create Role
          </button>
        )}
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <div className="border border-[#e0e0e0] rounded-lg p-5 mb-6 bg-[#f8f8f8]">
          <h3 className="text-sm font-bold text-[#1d1c1d] mb-4">
            {editingRole ? "Edit Role" : "New Role"}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-[#1d1c1d] mb-1">
                Role name
              </label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="w-full max-w-xs px-3 py-2 border border-[#e0e0e0] rounded-md text-sm text-[#1d1c1d] bg-white focus:outline-none focus:border-[#007a5a] focus:ring-1 focus:ring-[#007a5a]"
                placeholder="e.g. Moderator"
                required
              />
            </div>

            {/* Color Picker */}
            <div>
              <label className="block text-sm font-medium text-[#1d1c1d] mb-2">
                Color
              </label>
              <div className="flex gap-2">
                {COLOR_PRESETS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormColor(color)}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      formColor === color
                        ? "border-[#1d1c1d] scale-110"
                        : "border-transparent hover:border-[#e0e0e0]"
                    }`}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>

            {/* Permissions */}
            <div>
              <label className="block text-sm font-medium text-[#1d1c1d] mb-2">
                Permissions
              </label>
              <div className="grid grid-cols-2 gap-2">
                {PERMISSION_LIST.map((perm) => (
                  <label
                    key={perm.value}
                    className="flex items-center gap-2 text-sm text-[#1d1c1d] cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={formPermissions.includes(perm.value)}
                      onChange={() => togglePermission(perm.value)}
                      className="rounded border-[#e0e0e0] text-[#007a5a] focus:ring-[#007a5a]"
                    />
                    {perm.label}
                  </label>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={saving || !formName.trim()}
                className="px-4 py-2 bg-[#007a5a] text-white text-sm font-medium rounded-md hover:bg-[#005e44] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving
                  ? "Saving..."
                  : editingRole
                    ? "Update Role"
                    : "Create Role"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 border border-[#e0e0e0] text-sm font-medium text-[#1d1c1d] rounded-md hover:bg-[#f0f0f0] transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Role List */}
      <div className="space-y-2">
        {roles.map((role) => (
          <div
            key={role.id}
            className="flex items-center justify-between border border-[#e0e0e0] rounded-lg px-4 py-3 hover:bg-[#f8f8f8] transition-colors"
          >
            <div className="flex items-center gap-3">
              <div
                className="w-4 h-4 rounded-full shrink-0"
                style={{
                  backgroundColor: role.color || "#616061",
                }}
              />
              <div>
                <div className="text-sm font-medium text-[#1d1c1d]">
                  {role.name}
                </div>
                <div className="text-xs text-[#616061]">
                  {(role.permissions || []).length} permission
                  {(role.permissions || []).length !== 1 ? "s" : ""}
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => startEdit(role)}
                className="px-3 py-1 text-sm font-medium text-[#1d1c1d] border border-[#e0e0e0] rounded hover:bg-[#f0f0f0] transition-colors"
              >
                Edit
              </button>
              {!role.isDefault && (
                <button
                  onClick={() => handleDelete(role.id, role.name)}
                  className="px-3 py-1 text-sm font-medium text-white bg-[#e01e5a] rounded hover:bg-[#c4164d] transition-colors"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        ))}

        {roles.length === 0 && (
          <div className="text-center text-sm text-[#616061] py-8">
            No custom roles yet. Create one to get started.
          </div>
        )}
      </div>
    </div>
  );
}
