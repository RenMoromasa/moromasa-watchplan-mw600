import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { api } from "../api";
import ConfirmDialog from "../components/ConfirmDialog";
import type {
  Media,
  MediaStatus,
  MediaType,
  TaskPriority,
  TaskStatus,
} from "../types";

interface EditRecordProps {
  kind: "media" | "task";
  media: Media[];
  refresh: () => Promise<void>;
}

function EditRecord({ kind, media, refresh }: EditRecordProps) {
  const { id } = useParams();
  const recordId = Number(id);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Media fields
  const [title, setTitle] = useState("");
  const [type, setType] = useState<MediaType>("Movie");
  const [genre, setGenre] = useState("");
  const [releaseYear, setReleaseYear] = useState("");
  const [status, setStatus] = useState<MediaStatus>("Plan to Watch");
  const [rating, setRating] = useState("0");

  // Task fields
  const [taskName, setTaskName] = useState("");
  const [mediaId, setMediaId] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("Medium");
  const [dueDate, setDueDate] = useState("");
  const [taskStatus, setTaskStatus] = useState<TaskStatus>("Pending");

  // Load the current record from the database.
  useEffect(() => {
    const load = async () => {
      try {
        if (kind === "media") {
          const item = await api.getMediaById(recordId);
          setTitle(item.title);
          setType(item.type);
          setGenre(item.genre);
          setReleaseYear(String(item.releaseYear));
          setStatus(item.status);
          setRating(String(item.rating));
        } else {
          const task = await api.getTaskById(recordId);
          setTaskName(task.taskName);
          setMediaId(String(task.mediaId));
          setPriority(task.priority);
          setDueDate(task.dueDate ?? "");
          setTaskStatus(task.status);
        }
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [kind, recordId]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);

    try {
      if (kind === "media") {
        await api.updateMedia(recordId, {
          title,
          type,
          genre,
          releaseYear: Number(releaseYear),
          status,
          rating: Number(rating),
        });
      } else {
        await api.updateTask(recordId, {
          mediaId: Number(mediaId),
          taskName,
          priority,
          dueDate,
          status: taskStatus,
        });
      }

      await refresh();
      navigate("/");
    } catch (err) {
      setError((err as Error).message);
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);

    try {
      if (kind === "media") {
        await api.deleteMedia(recordId);
      } else {
        await api.deleteTask(recordId);
      }

      await refresh();
      navigate("/");
    } catch (err) {
      setError((err as Error).message);
      setDeleting(false);
      setConfirmOpen(false);
    }
  };

  return (
    <div className="container">
      <h1>{kind === "media" ? "Edit Movie / Series" : "Edit Task"}</h1>

      <Link to="/">Back to Dashboard</Link>

      {error && <p className="error-message">{error}</p>}

      {loading ? (
        <p className="page-subtitle">Loading record...</p>
      ) : (
        <form onSubmit={handleSubmit}>
          {kind === "media" ? (
            <>
              <label>
                Title
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </label>

              <label>
                Type
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as MediaType)}
                >
                  <option value="Movie">Movie</option>
                  <option value="Series">Series</option>
                </select>
              </label>

              <label>
                Genre
                <input
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  required
                />
              </label>

              <label>
                Release Year
                <input
                  type="number"
                  value={releaseYear}
                  onChange={(e) => setReleaseYear(e.target.value)}
                  required
                />
              </label>

              <label>
                Status
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as MediaStatus)}
                >
                  <option value="Plan to Watch">Plan to Watch</option>
                  <option value="Watching">Watching</option>
                  <option value="Completed">Completed</option>
                </select>
              </label>

              <label>
                Rating
                <input
                  type="number"
                  min="0"
                  max="5"
                  step="0.5"
                  value={rating}
                  onChange={(e) => setRating(e.target.value)}
                />
              </label>
            </>
          ) : (
            <>
              <label>
                Task
                <input
                  value={taskName}
                  onChange={(e) => setTaskName(e.target.value)}
                  required
                />
              </label>

              <label>
                Related Movie / Series
                <select
                  value={mediaId}
                  onChange={(e) => setMediaId(e.target.value)}
                  required
                >
                  <option value="">Select a title</option>

                  {media.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.title}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Priority
                <select
                  value={priority}
                  onChange={(e) =>
                    setPriority(e.target.value as TaskPriority)
                  }
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </label>

              <label>
                Due Date
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </label>

              <label>
                Status
                <select
                  value={taskStatus}
                  onChange={(e) =>
                    setTaskStatus(e.target.value as TaskStatus)
                  }
                >
                  <option value="Pending">Pending</option>
                  <option value="Completed">Completed</option>
                </select>
              </label>
            </>
          )}

          <button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Update Record"}
          </button>

          <button
            type="button"
            className="danger-button"
            onClick={() => setConfirmOpen(true)}
            disabled={saving}
          >
            Delete Record
          </button>
        </form>
      )}

      {confirmOpen && (
        <ConfirmDialog
          message={
            kind === "media"
              ? `Are you sure you want to delete "${title}"? Its related tasks will also be deleted.`
              : `Are you sure you want to delete "${taskName}"?`
          }
          busy={deleting}
          onConfirm={handleDelete}
          onCancel={() => setConfirmOpen(false)}
        />
      )}
    </div>
  );
}

export default EditRecord;
