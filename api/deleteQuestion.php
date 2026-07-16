<?php
/**
 * deleteQuestion.php — permanently deletes a question owned by the teacher,
 * along with any answers submitted against it.
 *
 * POST { id } (JWT required)
 *
 * @license CC BY-NC-SA 4.0 — Simon Rundell / CodeMonkey Design Ltd. 2026
 */
include 'setup.php';

$auth = requireAuth();

$id = (int)($receivedData['id'] ?? 0);
if (!$id) send_response('id is required', 400);

$check = $mysqli->prepare("SELECT id FROM tblquestion WHERE id = ? AND teacherId = ?");
$check->bind_param("ii", $id, $auth['userId']);
$check->execute();
$question = $check->get_result()->fetch_assoc();
$check->close();

if (!$question) {
    send_response('Question not found.', 404);
}

$deleteAnswers = $mysqli->prepare("DELETE FROM tblanswer WHERE questionId = ?");
$deleteAnswers->bind_param("i", $id);
$deleteAnswers->execute();
$deleteAnswers->close();

$stmt = $mysqli->prepare("DELETE FROM tblquestion WHERE id = ? AND teacherId = ?");
$stmt->bind_param("ii", $id, $auth['userId']);

if (!$stmt->execute()) {
    send_response("Execute failed: " . $stmt->error, 500);
}

$stmt->close();

log_info("Question deleted: id {$id} by user {$auth['userId']}");

send_response('Question deleted.', 200);
