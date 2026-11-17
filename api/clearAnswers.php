<?php
/**
 * clearAnswers.php — wipes every current answer for a question, without
 * ending it. For removing inappropriate content or leftover answers from a
 * previous class while the monitor screen stays open.
 *
 * POST { id } (JWT required)
 *
 * @license CC BY-NC-SA 4.0 — Simon Rundell / CodeMonkey Design Ltd. 2026
 */
include 'setup.php';

$auth = requireAuth();

$id = (int)($receivedData['id'] ?? 0);
if (!$id) send_response('id is required', 400);

$check = $mysqli->prepare("SELECT id FROM mwb_question WHERE id = ? AND teacherId = ?");
$check->bind_param("ii", $id, $auth['userId']);
$check->execute();
$question = $check->get_result()->fetch_assoc();
$check->close();

if (!$question) {
    send_response('Question not found.', 404);
}

$stmt = $mysqli->prepare("DELETE FROM mwb_answer WHERE questionId = ?");
$stmt->bind_param("i", $id);

if (!$stmt->execute()) {
    log_info("Execute failed: " . $stmt->error);
    send_response("Execute failed: " . $stmt->error, 500);
}
$stmt->close();

log_info("Answers cleared: question id {$id} by user {$auth['userId']}");

send_response('Answers cleared.', 200);
