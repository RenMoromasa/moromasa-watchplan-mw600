import { Link } from "react-router-dom";

import type { Media, Task } from "../types";

interface DashboardProps {
  media: Media[];
  tasks: Task[];
  setMedia: React.Dispatch<React.SetStateAction<Media[]>>;
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
}

function Dashboard({
  media,
  tasks,
  setMedia,
  setTasks,
}: DashboardProps) {
  const deleteMedia = (id: number) => {
    const item = media.find((media) => media.id === id);

    if (!item) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete "${item.title}"?`
    );

    if (!confirmed) return;

    setMedia((currentMedia) =>
      currentMedia.filter((media) => media.id !== id)
    );

    // Also remove tasks associated with this movie/series.
    setTasks((currentTasks) =>
      currentTasks.filter((task) => task.mediaId !== id)
    );
  };

  const deleteTask = (id: number) => {
    const task = tasks.find((task) => task.id === id);

    if (!task) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete "${task.taskName}"?`
    );

    if (!confirmed) return;

    setTasks((currentTasks) =>
      currentTasks.filter((task) => task.id !== id)
    );
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
                No movies or series found.
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

        <Link to="/add">
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
                No tasks found.
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