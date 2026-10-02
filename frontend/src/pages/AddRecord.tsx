import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { api } from "../api";
import type { Media } from "../types";

interface AddRecordProps {
  media: Media[];
  refresh: () => Promise<void>;
}

function AddRecord({ media, refresh }: AddRecordProps) {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const [recordType, setRecordType] = useState<"media" | "task">(
    "media"
  );

  // Media fields
  const [title, setTitle] = useState("");
  const [type, setType] = useState<"Movie" | "Series">("Movie");
  const [genre, setGenre] = useState("");
  const [releaseYear, setReleaseYear] = useState("");
  const [status, setStatus] =
    useState<"Plan to Watch" | "Watching" | "Completed">(
      "Plan to Watch"
    );
  const [rating, setRating] = useState("0");

  // Task fields
  const [taskName, setTaskName] = useState("");
  const [mediaId, setMediaId] = useState("");
  const [priority, setPriority] =
    useState<"Low" | "Medium" | "High">("Medium");
  const [dueDate, setDueDate] = useState("");
  const [taskStatus, setTaskStatus] =
    useState<"Pending" | "Completed">("Pending");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);

    try {
      if (recordType === "media") {
        await api.createMedia({
          title,
          type,
          genre,
          releaseYear: Number(releaseYear),
          status,
          rating: Number(rating),
        });
      } else {
        await api.createTask({
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

  return (
    <div className="container">
      <h1>Add Record</h1>

      <Link to="/">Back to Dashboard</Link>

      <div className="record-selector">
        <button
          type="button"
          onClick={() => setRecordType("media")}
        >
          Movie / Series
        </button>

        <button
          type="button"
          onClick={() => setRecordType("task")}
        >
          Task
        </button>
      </div>

      {error && <p className="error-message">{error}</p>}

      <form onSubmit={handleSubmit}>
        {recordType === "media" ? (
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
                onChange={(e) =>
                  setType(e.target.value as "Movie" | "Series")
                }
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
                onChange={(e) =>
                  setReleaseYear(e.target.value)
                }
                required
              />
            </label>

            <label>
              Status
              <select
                value={status}
                onChange={(e) =>
                  setStatus(
                    e.target.value as
                      | "Plan to Watch"
                      | "Watching"
                      | "Completed"
                  )
                }
              >
                <option value="Plan to Watch">
                  Plan to Watch
                </option>

                <option value="Watching">
                  Watching
                </option>

                <option value="Completed">
                  Completed
                </option>
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
                onChange={(e) =>
                  setTaskName(e.target.value)
                }
                required
              />
            </label>

            <label>
              Related Movie / Series
              <select
                value={mediaId}
                onChange={(e) =>
                  setMediaId(e.target.value)
                }
                required
              >
                <option value="">Select a title</option>

                {media.map((item) => (
                  <option
                    key={item.id}
                    value={item.id}
                  >
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
                  setPriority(
                    e.target.value as
                      | "Low"
                      | "Medium"
                      | "High"
                  )
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
                onChange={(e) =>
                  setDueDate(e.target.value)
                }
              />
            </label>

            <label>
              Status
              <select
                value={taskStatus}
                onChange={(e) =>
                  setTaskStatus(
                    e.target.value as
                      | "Pending"
                      | "Completed"
                  )
                }
              >
                <option value="Pending">Pending</option>
                <option value="Completed">Completed</option>
              </select>
            </label>
          </>
        )}

        <button type="submit" disabled={saving}>
          {saving ? "Saving..." : "Save Record"}
        </button>
      </form>
    </div>
  );
}

export default AddRecord;