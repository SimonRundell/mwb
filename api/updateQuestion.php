<?php
/**
 * updateQuestion.php — edits the title/content of an existing question owned by the teacher.
 * The questionCode is immutable once created.
 *
 * POST { id, questionTitle, questionHtml } (JWT required)
 *
 * @license CC BY-NC-SA 4.0 — Simon Rundell / CodeMonkey Design Ltd. 2026
 */
include 'setup.php';

$auth = requireAuth();

$id            = (int)($receivedData['id'] ?? 0);
$questionTitle = trim($receivedData['questionTitle'] ?? '');
$questionHtml  = $receivedData['questionHtml'] ?? '';

if (!$id)            send_response('id is required', 400);
if (!$questionTitle) send_response('questionTitle is required', 400);
if (!$questionHtml)  send_response('questionHtml is required', 400);

$now = date('Y-m-d H:i:s');

$stmt = $mysqli->prepare(
    "UPDATE tblquestion SET questionTitle = ?, questionHtml = ?, updatedAt = ?
     WHERE id = ? AND teacherId = ?"
);

if (!$stmt) {
    send_response("Prepare failed: " . $mysqli->error, 500);
}

$stmt->bind_param("sssii", $questionTitle, $questionHtml, $now, $id, $auth['userId']);

if (!$stmt->execute()) {
    send_response("Execute failed: " . $stmt->error, 500);
}

if ($stmt->affected_rows === 0) {
    $stmt->close();
    send_response('Question not found.', 404);
}

$stmt->close();
send_response('Question updated.', 200);
