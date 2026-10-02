<?php
require_once __DIR__ . '/bootstrap.php';

respond(200, [
    'success' => true,
    'message' => 'WatchPlan PHP API is online.',
    'endpoints' => [
        'media' => 'GET|POST api/media.php, GET|PUT|DELETE api/media.php?id={id}',
        'tasks' => 'GET|POST api/tasks.php, GET|PUT|DELETE api/tasks.php?id={id}',
        'external' => 'GET api/external.php?query={title}',
    ],
]);
