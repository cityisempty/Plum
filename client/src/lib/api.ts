export type User = {
  id: number;
  email: string;
  username: string;
  points: number;
  createdAt: number;
  avatarUrl?: string;
};

export type Interpretation = {
  code: string;
  title: string;
  summary: string;
  psychology: string;
  audience: string;
  imagery: string;
  missing: boolean;
};

export type DivinePayload = {
  id: number;
  input: string;
  upper: string;
  lower: string;
  upperNature: string;
  lowerNature: string;
  hexagramOrder: number;
  hexagramName: string;
  movingLine: number;
  movingName: string;
  code: string;
  sixYao: boolean[];
  sixYaoNames: string[];
  range: [string, string];
  interpretation: Interpretation;
  pointsRemaining: number;
};

export type HistoryItem = {
  id: number;
  input: string;
  hexagramName: string;
  movingName: string;
  code: string;
  title: string;
  summary: string;
  createdAt: number;
};

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  const method = (init.method ?? "GET").toUpperCase();
  if (["POST", "PUT", "PATCH", "DELETE"].includes(method) && typeof document !== "undefined") {
    const csrf = document.cookie
      .split("; ")
      .find((item) => item.startsWith("plum_admin_csrf="))
      ?.split("=")[1];
    if (csrf) headers.set("X-CSRF-Token", decodeURIComponent(csrf));
  }
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const res = await fetch(path, {
    ...init,
    headers,
    credentials: "include",
  });
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.message || "请求失败") as Error & { status: number; code?: string };
    err.status = res.status;
    err.code = data.error;
    throw err;
  }
  return data as T;
}

export const api = {
  me: () => request<{ user: User }>("/api/auth/me"),
  register: (body: { email: string; username: string; password: string }) =>
    request<{ user: User }>("/api/auth/register", { method: "POST", body: JSON.stringify(body) }),
  login: (body: { email: string; password: string }) =>
    request<{ user: User }>("/api/auth/login", { method: "POST", body: JSON.stringify(body) }),
  logout: () => request<void>("/api/auth/logout", { method: "POST" }),
  wechatStart: (next = "/") => {
    const path = `/api/auth/wechat?next=${encodeURIComponent(next)}`;
    window.location.href = path;
  },
  divine: (number: string) =>
    request<DivinePayload>("/api/divinations", { method: "POST", body: JSON.stringify({ number }) }),
  history: (page = 1) =>
    request<{ items: HistoryItem[]; total: number; page: number; limit: number }>(
      `/api/divinations?page=${page}&limit=20`,
    ),
  record: (id: string) => request<DivinePayload & { interpretation: Interpretation }>(`/api/divinations/${id}`),
  adminChallenge: () => request<{ id: string; question: string }>("/api/admin/challenge"),
  adminLogin: (body: { username: string; password: string; challengeId: string; challengeAnswer: number }) =>
    request<{ admin: { id: number; username: string } }>("/api/admin/login", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  adminMe: () => request<{ admin: { id: number; username: string } }>("/api/admin/me"),
  adminOverview: () => request<{
    users: number;
    points: number;
    divinations: number;
    decisionSpends: number;
    plumSpends: number;
    model: { priority: string[]; localMock: boolean; models: Array<{ id: string; name: string; configured: boolean }> };
  }>("/api/admin/overview"),
  adminModel: () => request<{ priority: string[]; localMock: boolean; models: Array<{ id: string; name: string; configured: boolean }> }>("/api/admin/model"),
  adminLogout: () => request<void>("/api/admin/logout", { method: "POST" }),
  adminUsers: (search = "", page = 1) =>
    request<{
      items: Array<{ id: number; email: string; username: string; points: number; created_at: number; disabled_at: number | null }>;
      total: number;
    }>(`/api/admin/users?search=${encodeURIComponent(search)}&page=${page}`),
  recharge: (id: number, amount: number, note: string) =>
    request<{ pointsBalance: number }>(`/api/admin/users/${id}/recharge`, {
      method: "POST",
      body: JSON.stringify({ amount, note }),
    }),
  setUserStatus: (id: number, disabled: boolean) =>
    request<{ id: number; disabled: boolean }>(`/api/admin/users/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ disabled }),
    }),
  deleteUser: (id: number) => request<void>(`/api/admin/users/${id}`, { method: "DELETE" }),
};
