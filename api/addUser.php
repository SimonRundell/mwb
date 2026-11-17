<?php
/**
 * addUser.php — lets an administrator create a new staff account directly,
 * bypassing the self-service email-domain restriction. Admin JWT required.
 *
 * POST { teacherName, email, passwordHash, isAdmin?, isActive? }
 *
 * @license CC BY-NC-SA 4.0 — Simon Rundell / CodeMonkey Design Ltd. 2026
 */
include 'setup.php';

$auth = requireAdmin();

$teacherName  = trim($receivedData['teacherName']  ?? '');
$email        = trim($receivedData['email']        ?? '');
$passwordHash = trim($receivedData['passwordHash']  ?? '');
$isAdmin      = (bool)($receivedData['isAdmin']  ?? false);
$isActive     = array_key_exists('isActive', $receivedData) ? (bool)$receivedData['isActive'] : true;

if (!$teacherName)  send_response('teacherName is required', 400);
if (!$email)        send_response('email is required', 400);
if (!$passwordHash) send_response('passwordHash is required', 400);

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    send_response('Please enter a valid email address.', 400);
}

$check = $mysqli->prepare('SELECT id FROM mwb_user WHERE email = ?');
$check->bind_param('s', $email);
$check->execute();
$check->store_result();
if ($check->num_rows > 0) {
    $check->close();
    send_response('An account with that email already exists.', 409);
}
$check->close();

$stmt = $mysqli->prepare(
    'INSERT INTO mwb_user (email, passwordHash, teacherName, isAdmin, isActive) VALUES (?, ?, ?, ?, ?)'
);
if (!$stmt) {
    log_info("Prepare failed: " . $mysqli->error);
    send_response("Prepare failed: " . $mysqli->error, 500);
}
$isAdminInt  = $isAdmin  ? 1 : 0;
$isActiveInt = $isActive ? 1 : 0;
$stmt->bind_param('sssii', $email, $passwordHash, $teacherName, $isAdminInt, $isActiveInt);

if (!$stmt->execute()) {
    log_info("Execute failed: " . $stmt->error);
    send_response("Execute failed: " . $stmt->error, 500);
}

$id = $mysqli->insert_id;
$stmt->close();

log_info("User created: {$email} (id {$id}) by admin {$auth['userId']}");

send_response([
    'id'          => $id,
    'email'       => $email,
    'teacherName' => $teacherName,
    'isAdmin'     => $isAdmin,
    'isActive'    => $isActive,
], 200);
