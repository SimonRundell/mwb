<?php
/**
 * updateMyAccount.php — lets the signed-in teacher change their own display
 * name and/or password. Email, admin status and active status are not
 * editable here — those require an administrator (see updateUser.php).
 *
 * POST { teacherName?, passwordHash? } (JWT required, at least one field)
 *
 * @license CC BY-NC-SA 4.0 — Simon Rundell / CodeMonkey Design Ltd. 2026
 */
include 'setup.php';

$auth = requireAuth();

$teacherName  = array_key_exists('teacherName', $receivedData)  ? trim($receivedData['teacherName'])  : null;
$passwordHash = array_key_exists('passwordHash', $receivedData) ? trim($receivedData['passwordHash']) : null;

if ($teacherName === null && !$passwordHash) {
    send_response('Nothing to update.', 400);
}
if ($teacherName !== null && $teacherName === '') {
    send_response('Name cannot be empty.', 400);
}

$sets   = [];
$types  = '';
$params = [];

if ($teacherName !== null) {
    $sets[]   = 'teacherName = ?';
    $types   .= 's';
    $params[] = $teacherName;
}
if ($passwordHash) {
    $sets[]   = 'passwordHash = ?';
    $types   .= 's';
    $params[] = $passwordHash;
}

$types   .= 'i';
$params[] = $auth['userId'];

$stmt = $mysqli->prepare('UPDATE mwb_user SET ' . implode(', ', $sets) . ' WHERE id = ?');
if (!$stmt) {
    log_info("Prepare failed: " . $mysqli->error);
    send_response("Prepare failed: " . $mysqli->error, 500);
}
$stmt->bind_param($types, ...$params);

if (!$stmt->execute()) {
    log_info("Execute failed: " . $stmt->error);
    send_response("Execute failed: " . $stmt->error, 500);
}
$stmt->close();

log_info("Account updated: user {$auth['userId']}");

send_response([
    'teacher' => [
        'id'      => $auth['userId'],
        'name'    => $teacherName ?? $auth['name'],
        'email'   => $auth['email'],
        'isAdmin' => $auth['isAdmin'],
    ],
], 200);
