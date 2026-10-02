<?php
/**
 * Movies & Series CRUD
 *
 * GET    media.php            -> list all (optional ?search=&type=&status=)
 * GET    media.php?id=1       -> get one
 * POST   media.php            -> create  { title, type, genre, releaseYear, status, rating }
 * PUT    media.php?id=1       -> update  (same body as create)
 * DELETE media.php?id=1       -> delete  (related tasks are deleted by the FK cascade)
 */
require_once __DIR__ . '/../bootstrap.php';

const MEDIA_TYPES = ['Movie', 'Series'];
const MEDIA_STATUSES = ['Plan to Watch', 'Watching', 'Completed'];

function format_media(array $row): array
{
    return [
        'id' => (int) $row['id'],
        'title' => $row['title'],
        'type' => $row['type'],
        'genre' => $row['genre'],
        'releaseYear' => (int) $row['release_year'],
        'status' => $row['status'],
        'rating' => (float) $row['rating'],
        'createdAt' => $row['created_at'],
        'updatedAt' => $row['updated_at'],
    ];
}

function find_media(int $id): ?array
{
    $stmt = db()->prepare('SELECT * FROM media WHERE id = ?');
    $stmt->execute([$id]);
    $row = $stmt->fetch();
    return $row ? format_media($row) : null;
}

function validate_media(array $data): array
{
    $releaseYear = filter_var($data['releaseYear'] ?? null, FILTER_VALIDATE_INT, [
        'options' => ['min_range' => 1888, 'max_range' => 2100],
    ]);
    if ($releaseYear === false) {
        fail(422, 'Validation error: "releaseYear" must be a year between 1888 and 2100.');
    }

    $rating = filter_var($data['rating'] ?? 0, FILTER_VALIDATE_FLOAT);
    if ($rating === false || $rating < 0 || $rating > 5) {
        fail(422, 'Validation error: "rating" must be a number from 0 to 5.');
    }

    return [
        'title' => require_string($data, 'title', 'title'),
        'type' => require_enum($data, 'type', MEDIA_TYPES, 'Movie'),
        'genre' => require_string($data, 'genre', 'genre'),
        'release_year' => $releaseYear,
        'status' => require_enum($data, 'status', MEDIA_STATUSES, 'Plan to Watch'),
        'rating' => round($rating, 1),
    ];
}

$id = request_id();

switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        if ($id !== null) {
            $media = find_media($id);
            if (!$media) {
                fail(404, "Movie/Series with ID $id not found.");
            }
            respond(200, ['success' => true, 'data' => $media]);
        }

        $where = [];
        $params = [];
        if (!empty($_GET['search'])) {
            $where[] = '(title LIKE ? OR genre LIKE ?)';
            $params[] = '%' . $_GET['search'] . '%';
            $params[] = '%' . $_GET['search'] . '%';
        }
        if (!empty($_GET['type'])) {
            $where[] = 'type = ?';
            $params[] = $_GET['type'];
        }
        if (!empty($_GET['status'])) {
            $where[] = 'status = ?';
            $params[] = $_GET['status'];
        }

        $sql = 'SELECT * FROM media' . ($where ? ' WHERE ' . implode(' AND ', $where) : '') . ' ORDER BY id';
        $stmt = db()->prepare($sql);
        $stmt->execute($params);
        $rows = array_map('format_media', $stmt->fetchAll());
        respond(200, ['success' => true, 'count' => count($rows), 'data' => $rows]);

    case 'POST':
        $m = validate_media(json_body());
        $stmt = db()->prepare(
            'INSERT INTO media (title, type, genre, release_year, status, rating) VALUES (?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([$m['title'], $m['type'], $m['genre'], $m['release_year'], $m['status'], $m['rating']]);
        respond(201, [
            'success' => true,
            'message' => 'Movie/Series created successfully.',
            'data' => find_media((int) db()->lastInsertId()),
        ]);

    case 'PUT':
    case 'PATCH':
        if ($id === null) {
            fail(400, 'The "id" parameter is required to update a record.');
        }
        if (!find_media($id)) {
            fail(404, "Movie/Series with ID $id not found.");
        }
        $m = validate_media(json_body());
        $stmt = db()->prepare(
            'UPDATE media SET title = ?, type = ?, genre = ?, release_year = ?, status = ?, rating = ? WHERE id = ?'
        );
        $stmt->execute([$m['title'], $m['type'], $m['genre'], $m['release_year'], $m['status'], $m['rating'], $id]);
        respond(200, [
            'success' => true,
            'message' => 'Movie/Series updated successfully.',
            'data' => find_media($id),
        ]);

    case 'DELETE':
        if ($id === null) {
            fail(400, 'The "id" parameter is required to delete a record.');
        }
        $media = find_media($id);
        if (!$media) {
            fail(404, "Movie/Series with ID $id not found.");
        }
        db()->prepare('DELETE FROM media WHERE id = ?')->execute([$id]);
        respond(200, [
            'success' => true,
            'message' => 'Movie/Series and its related tasks deleted successfully.',
            'data' => $media,
        ]);

    default:
        fail(405, 'Method not allowed.');
}
