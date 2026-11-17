<?php
/**
 * submitAnswer.php — public endpoint for a student to submit or revise their answer.
 * Upserts on (questionId, studentToken) so each student has exactly one editable card.
 * Accepted at any time once the question exists — not gated on whether a
 * teacher has launched the monitor screen yet, so students can answer early
 * and still see their card once the teacher opens the board.
 *
 * POST { questionId, studentToken, answerText }
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
    "INSERT INTO mwb_answer (questionId, studentToken, answerText, submittedAt, updatedAt)
     VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE answerText = VALUES(answerText), updatedAt = VALUES(updatedAt)"
);
$stmt->bind_param("issss", $questionId, $studentToken, $answerText, $now, $now);

if (!$stmt->execute()) {
    send_response("Execute failed: " . $stmt->error, 500);
}
$stmt->close();

send_response('Answer submitted.', 200);
