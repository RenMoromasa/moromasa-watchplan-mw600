import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";

import Dashboard from "./pages/Dashboard";
import AddRecord from "./pages/AddRecord";
import EditRecord from "./pages/EditRecord";

import { api } from "./api";
import type { Media, Task } from "./types";

function App() {
  const [media, setMedia] = useState<Media[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Reload everything from the database.
  const refresh = useCallback(
    () =>
      Promise.all([api.getMedia(), api.getTasks()])
        .then(([mediaData, taskData]) => {
          setMedia(mediaData);
          setTasks(taskData);
          setError("");
        })
        .catch((err: Error) => setError(err.message))
        .finally(() => setLoading(false)),
    []
  );

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <Dashboard
              media={media}
              tasks={tasks}
              loading={loading}
              error={error}
              refresh={refresh}
            />
          }
        />

        <Route
          path="/add"
          element={<AddRecord media={media} refresh={refresh} />}
        />

        <Route
          path="/edit/media/:id"
          element={
            <EditRecord kind="media" media={media} refresh={refresh} />
          }
        />

        <Route
          path="/edit/task/:id"
          element={
            <EditRecord kind="task" media={media} refresh={refresh} />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
