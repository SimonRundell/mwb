<?php
/**
 * registerUser.php — self-service registration for staff accounts.
 *
 * POST { email, passwordHash, teacherName }
 * Only email addresses on $config['allowedDomain'] may register.
 * Returns { token, teacher: { id, name, email } } on success, matching getLogin.php,
 * so the frontend can log the new user straight in.
 *
 * @license CC BY-NC-SA 4.0 — Simon Rundell / CodeMonkey Design Ltd. 2026
 */
include 'setup.php';

$email        = trim($receivedData['email'] ?? '');
$passwordHash = trim($receivedData['passwordHash'] ?? '');
$teacherName  = trim($receivedData['teacherName'] ?? '');

if (!$email)        send_response('email is required', 400);
if (!$passwordHash) send_response('passwordHash is required', 400);
if (!$teacherName)  send_response('teacherName is required', 400);

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    send_response('Please enter a valid email address.', 400);
}

$allowedDomains = $config['allowedDomains'] ?? [];
if ($allowedDomains) {
    $emailDomain = strtolower(substr(strrchr($email, '@'), 1));
    $allowed     = array_map('strtolower', $allowedDomains);
    if (!in_array($emailDomain, $allowed, true)) {
        $list = implode(', ', array_map(fn($d) => "@$d", $allowedDomains));
        send_response("Registration is only open to staff email addresses ({$list}).", 403);
    }
}

$stmt = $mysqli->prepare('SELECT id FROM mwb_user WHERE email = ?');
if (!$stmt) {
    log_info("Prepare failed: " . $mysqli->error);
    send_response("Prepare failed: " . $mysqli->error, 500);
}
$stmt->bind_param('s', $email);
$stmt->execute();
$stmt->store_result();
if ($stmt->num_rows > 0) {
    $stmt->close();
    send_response('An account with that email already exists.', 409);
}
$stmt->close();

$stmt = $mysqli->prepare(
    'INSERT INTO mwb_user (email, passwordHash, teacherName) VALUES (?, ?, ?)'
);
if (!$stmt) {
    log_info("Prepare failed: " . $mysqli->error);
    send_response("Prepare failed: " . $mysqli->error, 500);
}
$stmt->bind_param('sss', $email, $passwordHash, $teacherName);

if (!$stmt->execute()) {
    log_info("Execute failed: " . $stmt->error);
    send_response("Execute failed: " . $stmt->error, 500);
}

$id = $mysqli->insert_id;
$stmt->close();

$token = generateJWT(
    [
        'userId'  => $id,
        'teacher' => 1,
        'name'    => $teacherName,
        'exp'     => time() + 86400,
    ],
    $config['jwtSecret']
);

log_info("New teacher registered: {$email} (id {$id})");

send_response([
    'token'   => $token,
    'teacher' => [
        'id'      => $id,
        'name'    => $teacherName,
        'email'   => $email,
        'isAdmin' => false,
    ],
], 200);
