import React, { useEffect, useState, useCallback } from "react";
import { Container, Table, Alert, Form, Spinner } from "react-bootstrap";
import { updateUserRole } from "../../services/adminApi";
import { User as AppUser } from "../../types/User";
import { useToast } from "../../hooks/useToast";
import AppToast from "../../components/ToastComponent/ToastComponent";
import { useTheme } from "../../context/ThemeContext";
import PaginationControls from "../../components/PaginationControls/PaginationControls";
import { PaginatedResponse } from "../../types/PaginationTypes";
import "./ManageUsers.css";

interface AdminUser extends AppUser {
  created_at: string;
}

interface PaginatedUsersResponse {
  users: AdminUser[];
  pagination: PaginatedResponse["pagination"] & {
    totalEvents: number;
    limit: number;
  };
}

const ManageUsers: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const usersPerPage = 20;
  const { showToast, toastInfo, showNotification, hideToast } = useToast();

  useTheme();

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);

    const url = `http://localhost:3000/api/admin/users?page=${currentPage}&limit=${usersPerPage}`;

    try {
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch users");

      const data: PaginatedUsersResponse = await res.json();

      setUsers(data.users);
      setCurrentPage(data.pagination.currentPage);
      setTotalPages(data.pagination.totalPages);
    } catch (err: any) {
      console.error("Failed to fetch users. Full Error Details:", err);
      const errorMessage = err.message || "Could not connect to the user API.";
      setError(errorMessage);
      showNotification("Failed to fetch users.", "Error", "danger");
      setUsers([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [currentPage, showNotification]);

  useEffect(() => {
    fetchUsers();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [fetchUsers]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleRoleChange = async (
    id: number,
    username: string,
    role: "user" | "admin" | "banned"
  ) => {
    try {
      const updatedUser = await updateUserRole(id.toString(), role);
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, role: updatedUser.role } : u))
      );
      showNotification(
        `User '${username}' role changed to '${role}'.`,
        "Success",
        "success"
      );
    } catch (err: any) {
      setError(err.message);
      showNotification(
        `Failed to change role for user '${username}'.`,
        "Error",
        "danger"
      );
    }
  };

  if (loading)
    return (
      <div className="manage-loading">
        <Spinner animation="border" variant="primary" />
      </div>
    );

  return (
    <>
      {showToast && toastInfo && (
        <AppToast
          show={showToast}
          message={toastInfo.message}
          header={toastInfo.header}
          bg={toastInfo.bg}
          textColor={toastInfo.textColor}
          onClose={hideToast}
        />
      )}
      <Container className="manage-users">
        <h1 className="page-title">Manage Users</h1>

        {error && <Alert variant="danger">{error}</Alert>}

        {Array.isArray(users) && users.length === 0 && !error ? (
          <Alert variant="info">No users found to manage.</Alert>
        ) : (
          <>
            <Table
              striped
              bordered
              hover
              responsive
              variant="dark"
              className="user-table shadow-sm"
            >
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Username</th>
                  <th>Role</th>
                  <th>Created At</th>
                  <th>Change Role</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>{u.email}</td>
                    <td>{u.username}</td>
                    <td className={`role-text ${u.role}`}>{u.role}</td>
                    <td>{new Date(u.created_at).toLocaleDateString()}</td>
                    <td>
                      <Form.Select
                        value={u.role}
                        onChange={(e) =>
                          handleRoleChange(
                            u.id,
                            u.username,
                            e.target.value as "user" | "admin" | "banned"
                          )
                        }
                        size="sm"
                        className="text-white bg-dark border-secondary"
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                        <option value="banned">Banned</option>
                      </Form.Select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
            <div className="mb-5">
              <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          </>
        )}
      </Container>
    </>
  );
};

export default ManageUsers;
