<?php
/**
 * getLogin.php — authenticates a teacher and returns a JWT.
 *
 * POST { email, passwordHash }
 * Returns { token, teacher: { id, name, email } } on success.
 *
 * @license CC BY-NC-SA 4.0 — Simon Rundell / CodeMonkey Design Ltd. 2026
 */
include 'setup.php';

$stmt = $mysqli->prepare(
    "SELECT id, teacherName, email FROM mwb_user WHERE email = ? AND passwordHash = ?"
);

if (!$stmt) {
    log_info("Prepare failed: " . $mysqli->error);
    send_response("Prepare failed: " . $mysqli->error, 500);
}

$stmt->bind_param("ss", $receivedData['email'], $receivedData['passwordHash']);

if (!$stmt->execute()) {
    log_info("Execute failed: " . $stmt->error);
    send_response("Execute failed: " . $stmt->error, 500);
}

$result = $stmt->get_result();
$user   = $result->fetch_assoc();
$stmt->close();

if (!$user) {
    send_response("Invalid credentials.", 401);
}

$token = generateJWT(
    [
        'userId'  => $user['id'],
        'teacher' => 1,
        'name'    => $user['teacherName'],
        'exp'     => time() + 86400,
    ],
    $config['jwtSecret']
);

log_info("Teacher login: " . $user['email']);

send_response([
    'token'   => $token,
    'teacher' => [
        'id'    => $user['id'],
        'name'  => $user['teacherName'],
        'email' => $user['email'],
    ],
], 200);
