<?php
/**
 * External movie/series search (TVMaze public API, no key needed)
 *
 * GET external.php?query=batman
 */
require_once __DIR__ . '/../bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    fail(405, 'Method not allowed.');
}

$query = trim($_GET['query'] ?? '');
if ($query === '') {
    fail(400, 'Query parameter is required. Example: external.php?query=matrix');
}

$response = @file_get_contents('https://api.tvmaze.com/search/shows?q=' . urlencode($query));
if ($response === false) {
    fail(502, 'Failed to fetch results from the external API.');
}

$results = array_map(function (array $item) {
    $show = $item['show'];
    return [
        'externalId' => $show['id'],
        'title' => $show['name'],
        'type' => in_array($show['type'], ['Scripted', 'Animation'], true) ? 'Series' : 'Movie',
        'genre' => $show['genres'] ? implode(', ', $show['genres']) : '',
        'releaseYear' => $show['premiered'] ? (int) substr($show['premiered'], 0, 4) : null,
        'poster' => $show['image']['medium'] ?? null,
    ];
}, json_decode($response, true) ?: []);

respond(200, ['success' => true, 'count' => count($results), 'data' => $results]);
