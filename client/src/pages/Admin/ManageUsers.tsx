import React, { useState } from "react";
import { Container, Table, Alert, Form } from "react-bootstrap";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { updateUserRole } from "../../services/adminApi";
import { User as AppUser } from "../../types/User";
import { useToast } from "../../hooks/useToast";
import { useTheme } from "../../context/ThemeContext";
import PaginationControls from "../../components/PaginationControls/PaginationControls";
import { PaginatedResponse } from "../../types/PaginationTypes";
import Loading from "../../components/Loading/Loading";
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

const rawUrl = import.meta.env.VITE_PUBLIC_API_URL;
const API_URL = rawUrl
  ? `https://${rawUrl}/api/admin`
  : "http://localhost:3000/api/admin";

const ManageUsers: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 20;
  const queryClient = useQueryClient();
  const { showNotification } = useToast();

  useTheme();

  const { data, isLoading, error } = useQuery<PaginatedUsersResponse>({
    queryKey: ["admin-users", currentPage],
    queryFn: async () => {
      const res = await fetch(
        `${API_URL}/users?page=${currentPage}&limit=${usersPerPage}`,
        { credentials: "include" },
      );
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json();
    },
    staleTime: 1000 * 60 * 5,
  });

  const users: AdminUser[] = data?.users ?? [];
  const totalPages = data?.pagination.totalPages ?? 1;

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleRoleChange = async (
    id: number,
    username: string,
    role: "user" | "admin" | "banned",
  ) => {
    try {
      await updateUserRole(id.toString(), role);
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      showNotification(
        `User '${username}' role changed to '${role}'.`,
        "Success",
        "success",
      );
    } catch (err: any) {
      showNotification(
        `Failed to change role for user '${username}'.`,
        "Error",
        "danger",
      );
    }
  };

  if (isLoading) return <Loading variant="page" text="Loading users..." />;

  return (
    <>
      <Container className="manage-users">
        <h1 className="page-title">Manage Users</h1>

        {error && <Alert variant="danger">{(error as Error).message}</Alert>}

        {users.length === 0 && !isLoading && !error ? (
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
                            e.target.value as "user" | "admin" | "banned",
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
