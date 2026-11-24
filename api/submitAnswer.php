<?php
/**
 * submitAnswer.php — public endpoint for a student to submit or revise their answer.
 * Upserts on (questionId, studentToken) so each student has exactly one editable card.
 * Accepted at any time once the question exists — not gated on whether a
 * teacher has launched the monitor screen yet, so students can answer early
 * and still see their card once the teacher opens the board.
 *
 * studentName is required and shown on the card so the teacher can trace
 * who gave which answer (e.g. to follow up on a misconception) — answers
 * are no longer anonymous.
 *
 * POST { questionId, studentToken, studentName, answerText }
 *
 * @license CC BY-NC-SA 4.0 — Simon Rundell / CodeMonkey Design Ltd. 2026
 */
include 'setup.php';

$questionId   = (int)($receivedData['questionId'] ?? 0);
$studentToken = trim($receivedData['studentToken'] ?? '');
$studentName  = trim($receivedData['studentName'] ?? '');
$answerText   = trim($receivedData['answerText'] ?? '');

if (!$questionId)   send_response('questionId is required', 400);
if (!$studentToken) send_response('studentToken is required', 400);
if (!$studentName)  send_response('studentName is required', 400);
if (mb_strlen($studentName) > 50) send_response('studentName is too long', 400);
if ($answerText === '') send_response('answerText is required', 400);
if (mb_strlen($answerText) > 500) send_response('answerText is too long', 400);

$check = $mysqli->prepare("SELECT id FROM mwb_question WHERE id = ?");
$check->bind_param("i", $questionId);
$check->execute();
$question = $check->get_result()->fetch_assoc();
$check->close();

if (!$question) {
    send_response('Question not found.', 404);
}

$now = date('Y-m-d H:i:s');

$stmt = $mysqli->prepare(
    "INSERT INTO mwb_answer (questionId, studentToken, studentName, answerText, submittedAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE studentName = VALUES(studentName), answerText = VALUES(answerText), updatedAt = VALUES(updatedAt)"
);
$stmt->bind_param("isssss", $questionId, $studentToken, $studentName, $answerText, $now, $now);

if (!$stmt->execute()) {
    send_response("Execute failed: " . $stmt->error, 500);
}
$stmt->close();

send_response('Answer submitted.', 200);
