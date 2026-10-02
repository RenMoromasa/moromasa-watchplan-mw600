<?php
require_once __DIR__ . '/config.php';

// ==========================================
// CORS & JSON headers
// ==========================================
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, ALLOWED_ORIGINS, true)) {
    header("Access-Control-Allow-Origin: $origin");
    header('Vary: Origin');
}
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// ==========================================
// Helpers
// ==========================================
function respond(int $status, array $body): void
{
    http_response_code($status);
    echo json_encode($body, JSON_UNESCAPED_UNICODE);
    exit;
}

function fail(int $status, string $message): void
{
    respond($status, ['success' => false, 'message' => $message]);
}

function db(): PDO
{
    static $pdo = null;
    if ($pdo === null) {
        $dsn = sprintf('mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4', DB_HOST, DB_PORT, DB_NAME);
        try {
            $pdo = new PDO($dsn, DB_USER, DB_PASS, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ]);
        } catch (PDOException $e) {
            fail(500, 'Database connection failed. Is MySQL running in XAMPP and is the "watchplan" database imported? ' . $e->getMessage());
        }
    }
    return $pdo;
}

function json_body(): array
{
    $raw = file_get_contents('php://input');
    if ($raw === '' || $raw === false) {
        return [];
    }
    $data = json_decode($raw, true);
    if (!is_array($data)) {
        fail(400, 'Request body must be valid JSON.');
    }
    return $data;
}

function request_id(): ?int
{
    if (!isset($_GET['id'])) {
        return null;
    }
    $id = filter_var($_GET['id'], FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
    if ($id === false) {
        fail(400, 'Invalid "id" parameter.');
    }
    return $id;
}

function require_string(array $data, string $key, string $label): string
{
    $value = isset($data[$key]) ? trim((string) $data[$key]) : '';
    if ($value === '') {
        fail(422, "Validation error: \"$label\" is required.");
    }
    return $value;
}

function require_enum(array $data, string $key, array $allowed, string $default): string
{
    $value = $data[$key] ?? $default;
    if (!in_array($value, $allowed, true)) {
        fail(422, "Validation error: \"$key\" must be one of: " . implode(', ', $allowed) . '.');
    }
    return $value;
}

set_exception_handler(function (Throwable $e) {
    error_log('WatchPlan API error: ' . $e->getMessage());
    fail(500, 'Internal server error: ' . $e->getMessage());
});
