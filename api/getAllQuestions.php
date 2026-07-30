<?php
/**
 * getAllQuestions.php — lists the authenticated teacher's saved questions.
 *
 * POST {} (JWT required)
 * Returns a JSON array of questions, most recently updated first.
 *
 * @license CC BY-NC-SA 4.0 — Simon Rundell / CodeMonkey Design Ltd. 2026
 */
include 'setup.php';

$auth = requireAuth();

$stmt = $mysqli->prepare(
    "SELECT id, questionCode, questionTitle, questionHtml, isActive, launchedAt, endedAt, createdAt, updatedAt
     FROM mwb_question
     WHERE teacherId = ?
     ORDER BY updatedAt DESC"
);

if (!$stmt) {
    send_response("Prepare failed: " . $mysqli->error, 500);
}

$stmt->bind_param("i", $auth['userId']);
$stmt->execute();
$rows = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
$stmt->close();

http_response_code(200);
die(json_encode($rows));
