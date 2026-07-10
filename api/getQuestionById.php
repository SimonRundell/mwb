<?php
/**
 * getQuestionById.php — fetches a single question owned by the authenticated teacher.
 *
 * POST { id } (JWT required)
 * Returns the question row, or 404 if it doesn't exist or belongs to another teacher.
 *
 * @license CC BY-NC-SA 4.0 — Simon Rundell / CodeMonkey Design Ltd. 2026
 */
include 'setup.php';

$auth = requireAuth();

$id = (int)($receivedData['id'] ?? 0);
if (!$id) send_response('id is required', 400);

$stmt = $mysqli->prepare(
    "SELECT id, questionCode, questionTitle, questionHtml, isActive, launchedAt, endedAt, createdAt, updatedAt
     FROM tblquestion
     WHERE id = ? AND teacherId = ?"
);

if (!$stmt) {
    send_response("Prepare failed: " . $mysqli->error, 500);
}

$stmt->bind_param("ii", $id, $auth['userId']);
$stmt->execute();
$question = $stmt->get_result()->fetch_assoc();
$stmt->close();

if (!$question) {
    send_response('Question not found.', 404);
}

http_response_code(200);
die(json_encode($question));
