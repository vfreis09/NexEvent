const API_URL = "http://localhost:3000/api/admin";

export async function getUsers() {
  const res = await fetch(`${API_URL}/users`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch users");
  return res.json();
}

export async function updateUserRole(id: string, role: string) {
  const res = await fetch(`${API_URL}/users/${id}/role`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role }),
  });
  if (!res.ok) throw new Error("Failed to update user role");
  return res.json();
}

export async function getStats() {
  const res = await fetch(`${API_URL}/stats`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch stats");
  return res.json();
}
