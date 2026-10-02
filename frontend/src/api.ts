import type { Media, Task } from "./types";

// Base URL of the PHP API served by XAMPP's Apache.
// Override with VITE_API_URL in frontend/.env if your folder name differs.
const API_URL =
  import.meta.env.VITE_API_URL ?? "http://localhost/watchplan/api";

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${API_URL}/${path}`, {
      ...options,
      headers: { "Content-Type": "application/json", ...options.headers },
    });
  } catch {
    throw new Error(
      "Cannot reach the API. Make sure Apache and MySQL are running in XAMPP."
    );
  }

  const body = (await response.json().catch(() => null)) as
    | ApiResponse<T>
    | null;

  if (!response.ok || !body?.success) {
    throw new Error(body?.message ?? `Request failed (${response.status})`);
  }

  return body.data;
}

export type MediaInput = Omit<Media, "id">;
export type TaskInput = Omit<Task, "id">;

export const api = {
  getMedia: () => request<Media[]>("media.php"),
  getMediaById: (id: number) => request<Media>(`media.php?id=${id}`),
  createMedia: (data: MediaInput) =>
    request<Media>("media.php", { method: "POST", body: JSON.stringify(data) }),
  updateMedia: (id: number, data: MediaInput) =>
    request<Media>(`media.php?id=${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  deleteMedia: (id: number) =>
    request<Media>(`media.php?id=${id}`, { method: "DELETE" }),

  getTasks: () => request<Task[]>("tasks.php"),
  getTaskById: (id: number) => request<Task>(`tasks.php?id=${id}`),
  createTask: (data: TaskInput) =>
    request<Task>("tasks.php", { method: "POST", body: JSON.stringify(data) }),
  updateTask: (id: number, data: TaskInput) =>
    request<Task>(`tasks.php?id=${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  deleteTask: (id: number) =>
    request<Task>(`tasks.php?id=${id}`, { method: "DELETE" }),
};
