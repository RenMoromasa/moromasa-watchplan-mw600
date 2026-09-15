export type MediaType = "Movie" | "Series";

export type MediaStatus =
  | "Plan to Watch"
  | "Watching"
  | "Completed";

export type TaskPriority = "Low" | "Medium" | "High";

export type TaskStatus = "Pending" | "Completed";

export interface Media {
  id: number;
  title: string;
  type: MediaType;
  genre: string;
  releaseYear: number;
  status: MediaStatus;
  rating: number;
}

export interface Task {
  id: number;
  mediaId: number;
  taskName: string;
  priority: TaskPriority;
  dueDate: string;
  status: TaskStatus;
}