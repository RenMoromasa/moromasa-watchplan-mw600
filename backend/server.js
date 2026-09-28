const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const DATA_FILE = path.join(__dirname, 'movies.json');

// Middleware
app.use(cors());
app.use(express.json());

// Helper: Read movies from JSON file
function readMovies() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2));
      return [];
    }
    const rawData = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(rawData || '[]');
  } catch (error) {
    console.error('Error reading movies file:', error.message);
    return [];
  }
}

// Helper: Write movies to JSON file
function writeMovies(movies) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(movies, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing to movies file:', error.message);
    return false;
  }
}

// ==========================================
// 1. Root & Documentation Route
// ==========================================
app.get('/', (req, res) => {
  res.json({
    message: '🎬 WatchPlan Movie & Series API is online!',
    endpoints: {
      movies: {
        getAll: 'GET /api/movies (query params: ?search=&genre=&type=&status=)',
        getOne: 'GET /api/movies/:id',
        create: 'POST /api/movies (body: { title, type, genre, releaseYear, status, rating })',
        update: 'PUT /api/movies/:id (or PATCH /api/movies/:id)',
        delete: 'DELETE /api/movies/:id'
      },
      externalApi: {
        search: 'GET /api/external/movies?query=batman',
        import: 'POST /api/external/import (body: { query: "batman" } or { externalId: 1234 })'
      }
    }
  });
});

// ==========================================
// 2. External Movie API Integration
// ==========================================

/**
 * GET /api/external/movies
 * Search movies & TV shows from a public external API.
 * Uses TVMaze by default (zero API key needed).
 * Falls back to OMDb if OMDB_API_KEY is configured in .env.
 */
app.get('/api/external/movies', async (req, res) => {
  const query = req.query.query || req.query.q;

  if (!query) {
    return res.status(400).json({
      success: false,
      message: 'Query parameter is required. Example: /api/external/movies?query=matrix'
    });
  }

  try {
    // If OMDB_API_KEY is set, use OMDb
    if (process.env.OMDB_API_KEY) {
      const omdbUrl = `https://www.omdbapi.com/?apikey=${process.env.OMDB_API_KEY}&s=${encodeURIComponent(query)}`;
      const response = await fetch(omdbUrl);
      const data = await response.json();

      if (data.Response === 'False') {
        return res.status(404).json({ success: false, message: data.Error });
      }

      const formatted = (data.Search || []).map(item => ({
        externalId: item.imdbID,
        title: item.Title,
        type: item.Type === 'series' ? 'Series' : 'Movie',
        releaseYear: parseInt(item.Year, 10) || null,
        poster: item.Poster,
        source: 'OMDb'
      }));

      return res.json({ success: true, count: formatted.length, source: 'OMDb', data: formatted });
    }

    // Default: TVMaze Public API (no API key needed)
    const tvmazeUrl = `https://api.tvmaze.com/search/shows?q=${encodeURIComponent(query)}`;
    const response = await fetch(tvmazeUrl);

    if (!response.ok) {
      throw new Error(`External API responded with status ${response.status}`);
    }

    const data = await response.json();
    const formatted = data.map(({ show }) => ({
      externalId: show.id,
      title: show.name,
      type: show.type === 'Scripted' || show.type === 'Animation' ? 'Series' : 'Movie',
      genre: (show.genres && show.genres.length > 0) ? show.genres.join(', ') : 'Drama',
      releaseYear: show.premiered ? new Date(show.premiered).getFullYear() : null,
      rating: show.rating?.average ? Math.round(show.rating.average / 2) : 4,
      synopsis: show.summary ? show.summary.replace(/<[^>]*>?/gm, '') : '',
      poster: show.image?.medium || show.image?.original || null,
      source: 'TVMaze (Public API)'
    }));

    res.json({
      success: true,
      count: formatted.length,
      source: 'TVMaze',
      data: formatted
    });
  } catch (error) {
    console.error('External API search error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch movies from external API',
      error: error.message
    });
  }
});

/**
 * POST /api/external/import
 * Fetch movie details from external API and directly insert into local database.
 */
app.post('/api/external/import', async (req, res) => {
  const { externalId, query, status = 'Plan to Watch' } = req.body;

  if (!externalId && !query) {
    return res.status(400).json({
      success: false,
      message: 'Please provide either "externalId" or "query" in the request body.'
    });
  }

  try {
    let itemData = null;

    if (externalId) {
      const response = await fetch(`https://api.tvmaze.com/shows/${externalId}`);
      if (!response.ok) {
        return res.status(404).json({ success: false, message: 'Show not found on external API' });
      }
      const show = await response.json();
      itemData = {
        title: show.name,
        type: 'Series',
        genre: (show.genres && show.genres.length > 0) ? show.genres.join(', ') : 'Drama',
        releaseYear: show.premiered ? new Date(show.premiered).getFullYear() : 2024,
        status: status,
        rating: show.rating?.average ? Math.round(show.rating.average / 2) : 4,
        externalId: show.id
      };
    } else {
      const response = await fetch(`https://api.tvmaze.com/search/shows?q=${encodeURIComponent(query)}`);
      const results = await response.json();
      if (!results || results.length === 0) {
        return res.status(404).json({ success: false, message: `No external results found for "${query}"` });
      }
      const show = results[0].show;
      itemData = {
        title: show.name,
        type: 'Series',
        genre: (show.genres && show.genres.length > 0) ? show.genres.join(', ') : 'Drama',
        releaseYear: show.premiered ? new Date(show.premiered).getFullYear() : 2024,
        status: status,
        rating: show.rating?.average ? Math.round(show.rating.average / 2) : 4,
        externalId: show.id
      };
    }

    const movies = readMovies();

    // Check if already exists
    const existing = movies.find(m =>
      (itemData.externalId && m.externalId === itemData.externalId) ||
      m.title.toLowerCase() === itemData.title.toLowerCase()
    );

    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Movie/Series already exists in your list',
        movie: existing
      });
    }

    const nextId = movies.length > 0 ? Math.max(...movies.map(m => Number(m.id) || 0)) + 1 : 1;
    const now = new Date().toISOString();

    const newMovie = {
      id: nextId,
      ...itemData,
      createdAt: now,
      updatedAt: now
    };

    movies.push(newMovie);
    writeMovies(movies);

    res.status(201).json({
      success: true,
      message: 'Movie/Series imported and inserted successfully!',
      movie: newMovie
    });
  } catch (error) {
    console.error('Import error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to import from external API',
      error: error.message
    });
  }
});

// ==========================================
// 3. Local Movies CRUD
// ==========================================

/**
 * GET /api/movies
 * Read all movies with optional filters (search, genre, type, status)
 */
app.get('/api/movies', (req, res) => {
  const { search, genre, type, status } = req.query;
  let movies = readMovies();

  if (search) {
    const term = search.toLowerCase();
    movies = movies.filter(m =>
      (m.title && m.title.toLowerCase().includes(term)) ||
      (m.genre && m.genre.toLowerCase().includes(term))
    );
  }

  if (genre) {
    const genreTerm = genre.toLowerCase();
    movies = movies.filter(m => m.genre && m.genre.toLowerCase().includes(genreTerm));
  }

  if (type) {
    movies = movies.filter(m => m.type && m.type.toLowerCase() === type.toLowerCase());
  }

  if (status) {
    movies = movies.filter(m => m.status && m.status.toLowerCase() === status.toLowerCase());
  }

  res.json({
    success: true,
    count: movies.length,
    data: movies
  });
});

/**
 * GET /api/movies/:id
 * Read a single movie by ID
 */
app.get('/api/movies/:id', (req, res) => {
  const movies = readMovies();
  const movie = movies.find(m => String(m.id) === String(req.params.id));

  if (!movie) {
    return res.status(404).json({
      success: false,
      message: `Movie with ID ${req.params.id} not found`
    });
  }

  res.json({
    success: true,
    data: movie
  });
});

/**
 * POST /api/movies
 * Create / Insert a new movie/series
 */
app.post('/api/movies', (req, res) => {
  const { title, type, genre, releaseYear, status, rating } = req.body;

  if (!title || typeof title !== 'string' || !title.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Validation error: "title" is required and cannot be empty.'
    });
  }

  const movies = readMovies();
  const nextId = movies.length > 0 ? Math.max(...movies.map(m => Number(m.id) || 0)) + 1 : 1;
  const now = new Date().toISOString();

  const newMovie = {
    id: nextId,
    title: title.trim(),
    type: type || 'Movie',
    genre: genre ? genre.trim() : 'Drama',
    releaseYear: releaseYear ? parseInt(releaseYear, 10) : new Date().getFullYear(),
    status: status || 'Plan to Watch',
    rating: rating !== undefined ? Number(rating) : 0,
    createdAt: now,
    updatedAt: now
  };

  movies.push(newMovie);
  writeMovies(movies);

  res.status(201).json({
    success: true,
    message: 'Movie/Series created successfully',
    data: newMovie
  });
});

/**
 * PUT /api/movies/:id and PATCH /api/movies/:id
 * Update an existing movie/series
 */
const handleUpdate = (req, res) => {
  const movies = readMovies();
  const index = movies.findIndex(m => String(m.id) === String(req.params.id));

  if (index === -1) {
    return res.status(404).json({
      success: false,
      message: `Movie with ID ${req.params.id} not found`
    });
  }

  const existing = movies[index];
  const { title, type, genre, releaseYear, status, rating } = req.body;

  const updatedMovie = {
    ...existing,
    title: title !== undefined ? String(title).trim() : existing.title,
    type: type !== undefined ? type : existing.type,
    genre: genre !== undefined ? String(genre).trim() : existing.genre,
    releaseYear: releaseYear !== undefined ? parseInt(releaseYear, 10) : existing.releaseYear,
    status: status !== undefined ? status : existing.status,
    rating: rating !== undefined ? Number(rating) : existing.rating,
    updatedAt: new Date().toISOString()
  };

  movies[index] = updatedMovie;
  writeMovies(movies);

  res.json({
    success: true,
    message: 'Movie updated successfully',
    data: updatedMovie
  });
};

app.put('/api/movies/:id', handleUpdate);
app.patch('/api/movies/:id', handleUpdate);

/**
 * DELETE /api/movies/:id
 * Delete a movie/series by ID
 */
app.delete('/api/movies/:id', (req, res) => {
  const movies = readMovies();
  const index = movies.findIndex(m => String(m.id) === String(req.params.id));

  if (index === -1) {
    return res.status(404).json({
      success: false,
      message: `Movie with ID ${req.params.id} not found`
    });
  }

  const [deletedMovie] = movies.splice(index, 1);
  writeMovies(movies);

  res.json({
    success: true,
    message: 'Movie deleted successfully',
    data: deletedMovie
  });
});

// ==========================================
// 4. 404 & Global Error Handlers
// ==========================================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.url}`
  });
});

app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: err.message
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`🎬 WatchPlan Backend Server is running!`);
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log(`📚 Documentation & Status: http://localhost:${PORT}/`);
  console.log(`🎥 Movies API: http://localhost:${PORT}/api/movies`);
  console.log(`🌐 External Search: http://localhost:${PORT}/api/external/movies?query=batman`);
  console.log(`===============================================`);
});
