import React, { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { updateUserRole } from "../../services/adminApi";
import { User as AppUser } from "../../types/User";
import { useToast } from "../../hooks/useToast";
import PaginationControls from "../../components/PaginationControls/PaginationControls";
import { PaginatedResponse } from "../../types/PaginationTypes";
import Loading from "../../components/Loading/Loading";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

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
  ? `${rawUrl}/api/admin`
  : "http://localhost:3000/api/admin";

const roleStyles: Record<string, string> = {
  user: "text-foreground",
  admin: "text-primary font-medium",
  banned: "text-destructive font-medium",
};

const ManageUsers: React.FC = () => {
  const [displaySearch, setDisplaySearch] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 20;
  const queryClient = useQueryClient();
  const { showNotification } = useToast();

  useEffect(() => {
    const controller = new AbortController();

    const timer = setTimeout(() => {
      setActiveSearch(displaySearch);
      setCurrentPage(1);
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [displaySearch]);

  const { data, isLoading, error } = useQuery<PaginatedUsersResponse>({
    queryKey: ["admin-users", currentPage, activeSearch],
    queryFn: async ({ signal }) => {
      const res = await fetch(
        `${API_URL}/users?page=${currentPage}&limit=${usersPerPage}&search=${activeSearch}`,
        {
          credentials: "include",
          signal,
        },
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
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-medium text-foreground">
        Manage users
      </h1>

      {error && (
        <div className="mb-4 rounded border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {(error as Error).message}
        </div>
      )}

      <Input
        type="text"
        placeholder="Search users by email or username..."
        className="mb-4"
        value={displaySearch}
        onChange={(e) => setDisplaySearch(e.target.value)}
      />

      {users.length === 0 && !isLoading && !error ? (
        <div className="rounded border border-border bg-muted px-4 py-3 text-sm text-muted-foreground">
          No users found to manage.
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded border border-border">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-border bg-muted">
                  <th className="px-4 py-3 text-left font-medium text-foreground">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-foreground">
                    Username
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-foreground">
                    Role
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-foreground">
                    Created at
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-foreground">
                    Change role
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 text-foreground">{u.email}</td>
                    <td className="px-4 py-3 text-foreground">{u.username}</td>
                    <td className={cn("px-4 py-3", roleStyles[u.role])}>
                      {u.role}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <Select
                        value={u.role}
                        onValueChange={(value) => {
                          if (value) {
                            handleRoleChange(
                              u.id,
                              u.username,
                              value as "user" | "admin" | "banned",
                            );
                          }
                        }}
                      >
                        <SelectTrigger className="h-8 w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">User</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="banned">Banned</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mb-12 mt-6">
            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default ManageUsers;