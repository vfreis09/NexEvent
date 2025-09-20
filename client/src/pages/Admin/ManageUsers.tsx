import React, { useEffect, useState } from "react";
import { Container, Table, Alert, Form, Spinner } from "react-bootstrap";
import { getUsers, updateUserRole } from "../../services/adminApi";
import { User as AppUser } from "../../types/User";
import "./ManageUsers.css";

interface AdminUser extends AppUser {
  created_at: string;
}

const ManageUsers: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getUsers()
      .then(setUsers)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleRoleChange = async (
    id: number,
    role: "user" | "admin" | "banned"
  ) => {
    try {
      const updatedUser = await updateUserRole(id.toString(), role);
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, role: updatedUser.role } : u))
      );
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading)
    return (
      <div className="manage-loading">
        <Spinner animation="border" variant="primary" />
      </div>
    );

  return (
    <Container className="manage-users">
      <h1 className="page-title">Manage Users</h1>

      {error && <Alert variant="danger">{error}</Alert>}

      <Table striped bordered hover responsive className="user-table shadow-sm">
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
              <td className="role-text">{u.role}</td>
              <td>{new Date(u.created_at).toLocaleDateString()}</td>
              <td>
                <Form.Select
                  value={u.role}
                  onChange={(e) =>
                    handleRoleChange(
                      u.id,
                      e.target.value as "user" | "admin" | "banned"
                    )
                  }
                  size="sm"
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
    </Container>
  );
};

export default ManageUsers;
