<?php
/**
 * submitAnswer.php — public endpoint for a student to submit or revise their answer.
 * Upserts on (questionId, studentToken) so each student has exactly one editable card.
 *
 * POST { questionId, studentToken, answerText }
 * Returns 410 if the question is no longer active.
 *
 * @license CC BY-NC-SA 4.0 — Simon Rundell / CodeMonkey Design Ltd. 2026
 */
include 'setup.php';

$questionId   = (int)($receivedData['questionId'] ?? 0);
$studentToken = trim($receivedData['studentToken'] ?? '');
$answerText   = trim($receivedData['answerText'] ?? '');

if (!$questionId)   send_response('questionId is required', 400);
if (!$studentToken) send_response('studentToken is required', 400);
if ($answerText === '') send_response('answerText is required', 400);
if (mb_strlen($answerText) > 500) send_response('answerText is too long', 400);

$check = $mysqli->prepare("SELECT isActive FROM tblquestion WHERE id = ?");
$check->bind_param("i", $questionId);
$check->execute();
$question = $check->get_result()->fetch_assoc();
$check->close();

if (!$question) {
    send_response('Question not found.', 404);
}
if (!$question['isActive']) {
    send_response('This question has ended.', 410);
}

$now = date('Y-m-d H:i:s');

$stmt = $mysqli->prepare(
    "INSERT INTO tblanswer (questionId, studentToken, answerText, submittedAt, updatedAt)
     VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE answerText = VALUES(answerText), updatedAt = VALUES(updatedAt)"
);
$stmt->bind_param("issss", $questionId, $studentToken, $answerText, $now, $now);

if (!$stmt->execute()) {
    send_response("Execute failed: " . $stmt->error, 500);
}
$stmt->close();

send_response('Answer submitted.', 200);
