import { useState } from "react";
import { Link } from "react-router-dom";

import { api } from "../api";
import ConfirmDialog from "../components/ConfirmDialog";
import type { Media, Task } from "../types";

interface DashboardProps {
  media: Media[];
  tasks: Task[];
  loading: boolean;
  error: string;
  refresh: () => Promise<void>;
}

interface PendingDelete {
  kind: "media" | "task";
  id: number;
  message: string;
}

function Dashboard({
  media,
  tasks,
  loading,
  error,
  refresh,
}: DashboardProps) {
  const [actionError, setActionError] = useState("");
  const [pendingDelete, setPendingDelete] =
    useState<PendingDelete | null>(null);
  const [deleting, setDeleting] = useState(false);

  const deleteMedia = (id: number) => {
    const item = media.find((media) => media.id === id);

    if (!item) return;

    const relatedTasks = tasks.filter((task) => task.mediaId === id).length;
    setPendingDelete({
      kind: "media",
      id,
      message:
        `Are you sure you want to delete "${item.title}"?` +
        (relatedTasks > 0
          ? ` Its ${relatedTasks} related task(s) will also be deleted.`
          : ""),
    });
  };

  const deleteTask = (id: number) => {
    const task = tasks.find((task) => task.id === id);

    if (!task) return;

    setPendingDelete({
      kind: "task",
      id,
      message: `Are you sure you want to delete "${task.taskName}"?`,
    });
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;

    setDeleting(true);

    try {
      // Deleting a movie/series also removes its tasks in the database.
      if (pendingDelete.kind === "media") {
        await api.deleteMedia(pendingDelete.id);
      } else {
        await api.deleteTask(pendingDelete.id);
      }
      setActionError("");
      await refresh();
    } catch (err) {
      setActionError((err as Error).message);
    } finally {
      setDeleting(false);
      setPendingDelete(null);
    }
  };

  const getMediaTitle = (mediaId: number) => {
    const item = media.find(
      (media) => media.id === mediaId
    );

    return item ? item.title : "Unknown";
  };

  return (
  <div className="container">
    <h1>WatchPlan</h1>
    <p className="page-subtitle">
      Keep track of what you want to watch.
    </p>

    {(error || actionError) && (
      <p className="error-message">{actionError || error}</p>
    )}

    {pendingDelete && (
      <ConfirmDialog
        message={pendingDelete.message}
        busy={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    )}

      <div className="section-header">
        <h2>Movies & Series</h2>

        <Link to="/add">
          Add Record
        </Link>
      </div>

      <table>
        <thead>
          <tr>
            <th>Title</th>
            <th>Type</th>
            <th>Genre</th>
            <th>Year</th>
            <th>Status</th>
            <th>Rating</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {media.length === 0 ? (
            <tr>
              <td colSpan={7}>
                {loading ? "Loading..." : "No movies or series found."}
              </td>
            </tr>
          ) : (
            media.map((item) => (
              <tr key={item.id}>
                <td>{item.title}</td>
                <td>{item.type}</td>
                <td>{item.genre}</td>
                <td>{item.releaseYear}</td>
                <td>{item.status}</td>
                <td>{item.rating}/5</td>

                <td>
                  <Link
                    to={`/edit/media/${item.id}`}
                  >
                    Edit
                  </Link>

                  {" | "}

                  <button
                    onClick={() =>
                      deleteMedia(item.id)
                    }
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <div className="section-header">
        <h2>Tasks</h2>

        <Link to="/add?type=task">
          Add Task
        </Link>
      </div>

      <table>
        <thead>
          <tr>
            <th>Task</th>
            <th>Related Media</th>
            <th>Priority</th>
            <th>Due Date</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {tasks.length === 0 ? (
            <tr>
              <td colSpan={6}>
                {loading ? "Loading..." : "No tasks found."}
              </td>
            </tr>
          ) : (
            tasks.map((task) => (
              <tr key={task.id}>
                <td>{task.taskName}</td>

                <td>
                  {getMediaTitle(task.mediaId)}
                </td>

                <td>{task.priority}</td>

                <td>{task.dueDate}</td>

                <td>{task.status}</td>

                <td>
                  <Link
                    to={`/edit/task/${task.id}`}
                  >
                    Edit
                  </Link>

                  {" | "}

                  <button
                    onClick={() =>
                      deleteTask(task.id)
                    }
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default Dashboard;