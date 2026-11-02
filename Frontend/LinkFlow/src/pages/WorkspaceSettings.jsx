import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  getWorkspace,
  updateWorkspace,
  deleteWorkspace,
  getWorkspaceMembers,
  addWorkspaceMember,
  updateMemberRole,
  removeWorkspaceMember,
} from "../api/workspace.api";

export default function WorkspaceSettings() {
  const { workspaceId } = useParams();
  const navigate = useNavigate();

  // Workspace states
  const [workspace, setWorkspace] = useState(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");

  // Member states
  const [members, setMembers] = useState([]);
  const [memberEmail, setMemberEmail] = useState("");
  const [memberRole, setMemberRole] = useState("VIEWER");

  // Loading states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [addingMember, setAddingMember] = useState(false);
  const [updatingMemberId, setUpdatingMemberId] = useState(null);
  const [removingMemberId, setRemovingMemberId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Message states
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Fetch workspace details and members
  useEffect(() => {
    async function fetchWorkspaceData() {
      try {
        setLoading(true);
        setError("");

        const [workspaceData, membersData] = await Promise.all([
          getWorkspace(workspaceId),
          getWorkspaceMembers(workspaceId),
        ]);

        setWorkspace(workspaceData.workspace);
        setName(workspaceData.workspace.name);
        setSlug(workspaceData.workspace.slug);

        setMembers(membersData.members);
      } catch (error) {
        setError(error.message || "Failed to load workspace");
      } finally {
        setLoading(false);
      }
    }

    fetchWorkspaceData();
  }, [workspaceId]);

  // Update workspace
  async function handleWorkspaceSubmit(e) {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const data = await updateWorkspace(workspaceId, {
        name,
        slug,
      });

      setWorkspace(data.workspace);
      setSuccess("Workspace updated successfully");
    } catch (error) {
      setError(error.message || "Failed to update workspace");
    } finally {
      setSaving(false);
    }
  }

  // Add a new member
  async function handleAddMember(e) {
    e.preventDefault();

    try {
      setAddingMember(true);
      setError("");
      setSuccess("");

      const data = await addWorkspaceMember(workspaceId, {
        email: memberEmail,
        role: memberRole,
      });

      setMembers((currentMembers) => [
        ...currentMembers,
        data.member,
      ]);

      setMemberEmail("");
      setMemberRole("VIEWER");

      setSuccess("Member added successfully");
    } catch (error) {
      setError(error.message || "Failed to add member");
    } finally {
      setAddingMember(false);
    }
  }

  // Change member role
  async function handleRoleChange(userId, role) {
    try {
      setUpdatingMemberId(userId);
      setError("");
      setSuccess("");

      const data = await updateMemberRole(workspaceId, userId, {
        role,
      });

      setMembers((currentMembers) =>
        currentMembers.map((member) =>
          member.userId === userId
            ? { ...member, role: data.member.role }
            : member
        )
      );

      setSuccess("Member role updated successfully");
    } catch (error) {
      setError(error.message || "Failed to update member role");
    } finally {
      setUpdatingMemberId(null);
    }
  }

  // Remove a member
  async function handleRemoveMember(userId) {
    const confirmed = window.confirm(
      "Are you sure you want to remove this member from the workspace?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setRemovingMemberId(userId);
      setError("");
      setSuccess("");

      await removeWorkspaceMember(workspaceId, userId);

      setMembers((currentMembers) =>
        currentMembers.filter(
          (member) => member.userId !== userId
        )
      );

      setSuccess("Member removed successfully");
    } catch (error) {
      setError(error.message || "Failed to remove member");
    } finally {
      setRemovingMemberId(null);
    }
  }

  // Delete workspace
  async function handleDeleteWorkspace() {
    const confirmed = window.confirm(
      "Are you sure you want to delete this workspace? This action cannot be undone."
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeleting(true);
      setError("");

      await deleteWorkspace(workspaceId);

      navigate("/dashboard");
    } catch (error) {
      setError(error.message || "Failed to delete workspace");
      setDeleting(false);
    }
  }

  if (loading) {
    return <div>Loading workspace...</div>;
  }

  // OWNER and ADMIN can add members
  const canManageMembers =
    workspace?.role === "OWNER" ||
    workspace?.role === "ADMIN";

  // Check whether the current user can manage a specific member
  const canManageSpecificMember = (member) => {
    // OWNER can manage everyone except another OWNER
    if (workspace?.role === "OWNER") {
      return member.role !== "OWNER";
    }

    // ADMIN can only manage EDITOR and VIEWER
    if (workspace?.role === "ADMIN") {
      return (
        member.role !== "OWNER" &&
        member.role !== "ADMIN"
      );
    }

    return false;
  };

  return (
    <div>
      <button onClick={() => navigate("/dashboard")}>
        ← Back to Dashboard
      </button>

      <h1>Workspace Settings</h1>

      {workspace && (
        <p>
          Your role: <strong>{workspace.role}</strong>
        </p>
      )}

      {error && <p>{error}</p>}
      {success && <p>{success}</p>}

      {/* Workspace Details */}
      <section>
        <h2>Workspace Details</h2>

        <form onSubmit={handleWorkspaceSubmit}>
          <div>
            <label>Workspace Name</label>

            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter workspace name"
              required
            />
          </div>

          <div>
            <label>Workspace Slug</label>

            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="Enter workspace slug"
              required
            />
          </div>

          <button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </section>

      {/* Members Section */}
      <section>
        <h2>Members</h2>

        {/* Add member form */}
        {canManageMembers && (
          <form onSubmit={handleAddMember}>
            <div>
              <label>Member Email</label>

              <input
                type="email"
                value={memberEmail}
                onChange={(e) =>
                  setMemberEmail(e.target.value)
                }
                placeholder="Enter member email"
                required
              />
            </div>

            <div>
              <label>Role</label>

              <select
                value={memberRole}
                onChange={(e) =>
                  setMemberRole(e.target.value)
                }
              >
                <option value="ADMIN">Admin</option>
                <option value="EDITOR">Editor</option>
                <option value="VIEWER">Viewer</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={addingMember}
            >
              {addingMember ? "Adding..." : "Add Member"}
            </button>
          </form>
        )}

        {/* Members list */}
        <div>
          {members.length === 0 ? (
            <p>No members found.</p>
          ) : (
            members.map((member) => (
              <div key={member.userId}>
                <div>
                  <strong>{member.name}</strong>
                  <p>{member.email}</p>
                </div>

                <div>
                  {/* Role management */}
                  {canManageSpecificMember(member) ? (
                    <select
                      value={member.role}
                      disabled={
                        updatingMemberId === member.userId
                      }
                      onChange={(e) =>
                        handleRoleChange(
                          member.userId,
                          e.target.value
                        )
                      }
                    >
                      <option value="ADMIN">
                        Admin
                      </option>
                      <option value="EDITOR">
                        Editor
                      </option>
                      <option value="VIEWER">
                        Viewer
                      </option>
                    </select>
                  ) : (
                    <span>{member.role}</span>
                  )}

                  {/* Remove member */}
                  {canManageSpecificMember(member) && (
                    <button
                      type="button"
                      onClick={() =>
                        handleRemoveMember(member.userId)
                      }
                      disabled={
                        removingMemberId === member.userId
                      }
                    >
                      {removingMemberId === member.userId
                        ? "Removing..."
                        : "Remove"}
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Danger Zone - Only visible to OWNER */}
      {workspace?.role === "OWNER" && (
        <section>
          <h2>Danger Zone</h2>

          <p>
            Deleting a workspace is permanent and cannot
            be undone.
          </p>

          <button
            type="button"
            onClick={handleDeleteWorkspace}
            disabled={deleting}
          >
            {deleting
              ? "Deleting..."
              : "Delete Workspace"}
          </button>
        </section>
      )}
    </div>
  );
}