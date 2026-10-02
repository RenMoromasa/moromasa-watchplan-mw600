<?php
// Database connection settings (XAMPP defaults: user "root", no password).
const DB_HOST = '127.0.0.1';
const DB_PORT = 3306;
const DB_NAME = 'watchplan';
const DB_USER = 'root';
const DB_PASS = '';

// Origins allowed to call the API (the Vite dev server).
const ALLOWED_ORIGINS = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
];
