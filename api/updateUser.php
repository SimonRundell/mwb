<?php
/**
 * updateUser.php — lets an administrator edit any account: name, email,
 * reset password, grant/revoke admin, and activate/deactivate. Admin JWT required.
 *
 * POST { id, teacherName?, email?, passwordHash?, isAdmin?, isActive? }
 * An admin cannot change their own isAdmin/isActive here, to avoid
 * accidentally locking themselves out — another admin must do that.
 *
 * @license CC BY-NC-SA 4.0 — Simon Rundell / CodeMonkey Design Ltd. 2026
 */
include 'setup.php';

$auth = requireAdmin();

$id = (int)($receivedData['id'] ?? 0);
if (!$id) send_response('id is required', 400);

$teacherName  = array_key_exists('teacherName', $receivedData)  ? trim($receivedData['teacherName'])  : null;
$email        = array_key_exists('email', $receivedData)        ? trim($receivedData['email'])        : null;
$passwordHash = array_key_exists('passwordHash', $receivedData) ? trim($receivedData['passwordHash']) : null;
$isAdmin      = array_key_exists('isAdmin', $receivedData)      ? (bool)$receivedData['isAdmin']       : null;
$isActive     = array_key_exists('isActive', $receivedData)     ? (bool)$receivedData['isActive']      : null;

if ($id === $auth['userId'] && ($isAdmin !== null || $isActive !== null)) {
    send_response('Ask another administrator to change your own admin or active status.', 403);
}

if ($teacherName !== null && $teacherName === '') {
    send_response('Name cannot be empty.', 400);
}

if ($email !== null) {
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        send_response('Please enter a valid email address.', 400);
    }
    $check = $mysqli->prepare('SELECT id FROM mwb_user WHERE email = ? AND id != ?');
    $check->bind_param('si', $email, $id);
    $check->execute();
    $check->store_result();
    if ($check->num_rows > 0) {
        $check->close();
        send_response('Another account already uses that email.', 409);
    }
    $check->close();
}

$sets   = [];
$types  = '';
$params = [];

if ($teacherName !== null) { $sets[] = 'teacherName = ?'; $types .= 's'; $params[] = $teacherName; }
if ($email !== null)        { $sets[] = 'email = ?';        $types .= 's'; $params[] = $email; }
if ($passwordHash)          { $sets[] = 'passwordHash = ?'; $types .= 's'; $params[] = $passwordHash; }
if ($isAdmin !== null)      { $sets[] = 'isAdmin = ?';      $types .= 'i'; $params[] = $isAdmin  ? 1 : 0; }
if ($isActive !== null)     { $sets[] = 'isActive = ?';     $types .= 'i'; $params[] = $isActive ? 1 : 0; }

if (!$sets) send_response('Nothing to update.', 400);

$types   .= 'i';
$params[] = $id;

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

if ($stmt->affected_rows === 0) {
    $stmt->close();
    send_response('User not found.', 404);
}
$stmt->close();

log_info("User {$id} updated by admin {$auth['userId']}");

send_response('User updated.', 200);
