<?php
/**
 * endQuestion.php — marks a question no longer live and leaves its
 * monitor screen. Students can still answer by code afterwards (answers are
 * never gated on launch state) and existing answers are left in place —
 * use clearAnswers.php to wipe the board.
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

$now = date('Y-m-d H:i:s');
$stmt = $mysqli->prepare(
    "UPDATE mwb_question SET isActive = 0, endedAt = ?, updatedAt = ? WHERE id = ?"
);
$stmt->bind_param("ssi", $now, $now, $id);

if (!$stmt->execute()) {
    send_response("Execute failed: " . $stmt->error, 500);
}
$stmt->close();

log_info("Question ended: id {$id} by user {$auth['userId']}");

send_response('Question ended.', 200);
