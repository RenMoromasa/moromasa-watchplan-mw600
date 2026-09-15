import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState } from "react";

import Dashboard from "./pages/dashboard";
import AddRecord from "./pages/AddRecord";
import EditRecord from "./pages/EditRecord";

import type { Media, Task } from "./types";

function App() {
  const [media, setMedia] = useState<Media[]>([
    {
      id: 1,
      title: "Interstellar",
      type: "Movie",
      genre: "Sci-Fi",
      releaseYear: 2014,
      status: "Completed",
      rating: 5,
    },
    {
      id: 2,
      title: "Stranger Things",
      type: "Series",
      genre: "Sci-Fi",
      releaseYear: 2016,
      status: "Watching",
      rating: 4,
    },
  ]);

  const [tasks, setTasks] = useState<Task[]>([
    {
      id: 1,
      mediaId: 2,
      taskName: "Watch Stranger Things",
      priority: "High",
      dueDate: "2026-09-20",
      status: "Pending",
    },
  ]);

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <Dashboard
              media={media}
              tasks={tasks}
              setMedia={setMedia}
              setTasks={setTasks}
            />
          }
        />

        <Route
          path="/add"
          element={
            <AddRecord
              media={media}
              tasks={tasks}
              setMedia={setMedia}
              setTasks={setTasks}
            />
          }
        />

        <Route
          path="/edit/media/:id"
          element={
            <EditRecord
              media={media}
              tasks={tasks}
              setMedia={setMedia}
              setTasks={setTasks}
            />
          }
        />

        <Route
          path="/edit/task/:id"
          element={
            <EditRecord
              media={media}
              tasks={tasks}
              setMedia={setMedia}
              setTasks={setTasks}
            />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;