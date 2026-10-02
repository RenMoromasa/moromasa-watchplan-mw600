<?php
/**
 * Tasks CRUD
 *
 * GET    tasks.php            -> list all (optional ?mediaId=&status=)
 * GET    tasks.php?id=1       -> get one
 * POST   tasks.php            -> create  { mediaId, taskName, priority, dueDate, status }
 * PUT    tasks.php?id=1       -> update  (same body as create)
 * DELETE tasks.php?id=1       -> delete
 */
require_once __DIR__ . '/../bootstrap.php';

const TASK_PRIORITIES = ['Low', 'Medium', 'High'];
const TASK_STATUSES = ['Pending', 'Completed'];

function format_task(array $row): array
{
    return [
        'id' => (int) $row['id'],
        'mediaId' => (int) $row['media_id'],
        'taskName' => $row['task_name'],
        'priority' => $row['priority'],
        'dueDate' => $row['due_date'] ?? '',
        'status' => $row['status'],
        'createdAt' => $row['created_at'],
        'updatedAt' => $row['updated_at'],
    ];
}

function find_task(int $id): ?array
{
    $stmt = db()->prepare('SELECT * FROM tasks WHERE id = ?');
    $stmt->execute([$id]);
    $row = $stmt->fetch();
    return $row ? format_task($row) : null;
}

function validate_task(array $data): array
{
    $mediaId = filter_var($data['mediaId'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
    if ($mediaId === false) {
        fail(422, 'Validation error: "mediaId" is required.');
    }
    $exists = db()->prepare('SELECT 1 FROM media WHERE id = ?');
    $exists->execute([$mediaId]);
    if (!$exists->fetchColumn()) {
        fail(422, "Validation error: Movie/Series with ID $mediaId does not exist.");
    }

    $dueDate = trim((string) ($data['dueDate'] ?? ''));
    if ($dueDate === '') {
        $dueDate = null;
    } else {
        $parsed = DateTime::createFromFormat('Y-m-d', $dueDate);
        if (!$parsed || $parsed->format('Y-m-d') !== $dueDate) {
            fail(422, 'Validation error: "dueDate" must be in YYYY-MM-DD format.');
        }
    }

    return [
        'media_id' => $mediaId,
        'task_name' => require_string($data, 'taskName', 'taskName'),
        'priority' => require_enum($data, 'priority', TASK_PRIORITIES, 'Medium'),
        'due_date' => $dueDate,
        'status' => require_enum($data, 'status', TASK_STATUSES, 'Pending'),
    ];
}

$id = request_id();

switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        if ($id !== null) {
            $task = find_task($id);
            if (!$task) {
                fail(404, "Task with ID $id not found.");
            }
            respond(200, ['success' => true, 'data' => $task]);
        }

        $where = [];
        $params = [];
        if (!empty($_GET['mediaId'])) {
            $where[] = 'media_id = ?';
            $params[] = (int) $_GET['mediaId'];
        }
        if (!empty($_GET['status'])) {
            $where[] = 'status = ?';
            $params[] = $_GET['status'];
        }

        $sql = 'SELECT * FROM tasks' . ($where ? ' WHERE ' . implode(' AND ', $where) : '') . ' ORDER BY id';
        $stmt = db()->prepare($sql);
        $stmt->execute($params);
        $rows = array_map('format_task', $stmt->fetchAll());
        respond(200, ['success' => true, 'count' => count($rows), 'data' => $rows]);

    case 'POST':
        $t = validate_task(json_body());
        $stmt = db()->prepare(
            'INSERT INTO tasks (media_id, task_name, priority, due_date, status) VALUES (?, ?, ?, ?, ?)'
        );
        $stmt->execute([$t['media_id'], $t['task_name'], $t['priority'], $t['due_date'], $t['status']]);
        respond(201, [
            'success' => true,
            'message' => 'Task created successfully.',
            'data' => find_task((int) db()->lastInsertId()),
        ]);

    case 'PUT':
    case 'PATCH':
        if ($id === null) {
            fail(400, 'The "id" parameter is required to update a task.');
        }
        if (!find_task($id)) {
            fail(404, "Task with ID $id not found.");
        }
        $t = validate_task(json_body());
        $stmt = db()->prepare(
            'UPDATE tasks SET media_id = ?, task_name = ?, priority = ?, due_date = ?, status = ? WHERE id = ?'
        );
        $stmt->execute([$t['media_id'], $t['task_name'], $t['priority'], $t['due_date'], $t['status'], $id]);
        respond(200, [
            'success' => true,
            'message' => 'Task updated successfully.',
            'data' => find_task($id),
        ]);

    case 'DELETE':
        if ($id === null) {
            fail(400, 'The "id" parameter is required to delete a task.');
        }
        $task = find_task($id);
        if (!$task) {
            fail(404, "Task with ID $id not found.");
        }
        db()->prepare('DELETE FROM tasks WHERE id = ?')->execute([$id]);
        respond(200, [
            'success' => true,
            'message' => 'Task deleted successfully.',
            'data' => $task,
        ]);

    default:
        fail(405, 'Method not allowed.');
}
