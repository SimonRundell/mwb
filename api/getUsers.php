<?php
/**
 * getUsers.php — lists all staff accounts. Admin JWT required.
 *
 * POST {} (JWT required, admin only)
 * Returns a JSON array of accounts, name first. passwordHash is never returned.
 *
 * @license CC BY-NC-SA 4.0 — Simon Rundell / CodeMonkey Design Ltd. 2026
 */
include 'setup.php';

requireAdmin();

$result = $mysqli->query(
    'SELECT id, email, teacherName, isAdmin, isActive FROM mwb_user ORDER BY teacherName'
);

$users = [];
while ($row = $result->fetch_assoc()) {
    $users[] = [
        'id'          => (int)$row['id'],
        'email'       => $row['email'],
        'teacherName' => $row['teacherName'],
        'isAdmin'     => (bool)$row['isAdmin'],
        'isActive'    => (bool)$row['isActive'],
    ];
}

http_response_code(200);
die(json_encode($users));
