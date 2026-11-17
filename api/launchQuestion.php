<?php
/**
 * launchQuestion.php — marks a question as live and opens its display/monitor
 * screen. Students can already answer by code before this point; launching
 * does not clear those early answers — use clearAnswers.php to wipe the
 * board explicitly if needed.
 *
 * POST { id } (JWT required)
 * Returns { questionCode }
 *
 * @license CC BY-NC-SA 4.0 — Simon Rundell / CodeMonkey Design Ltd. 2026
 */
include 'setup.php';

$auth = requireAuth();

$id = (int)($receivedData['id'] ?? 0);
if (!$id) send_response('id is required', 400);

$check = $mysqli->prepare("SELECT questionCode FROM mwb_question WHERE id = ? AND teacherId = ?");
$check->bind_param("ii", $id, $auth['userId']);
$check->execute();
$question = $check->get_result()->fetch_assoc();
$check->close();

if (!$question) {
    send_response('Question not found.', 404);
}

$now = date('Y-m-d H:i:s');
$stmt = $mysqli->prepare(
    "UPDATE mwb_question SET isActive = 1, launchedAt = ?, endedAt = NULL, updatedAt = ? WHERE id = ?"
);
$stmt->bind_param("ssi", $now, $now, $id);

if (!$stmt->execute()) {
    send_response("Execute failed: " . $stmt->error, 500);
}
$stmt->close();

log_info("Question launched: {$question['questionCode']} (id {$id}) by user {$auth['userId']}");

send_response(['questionCode' => $question['questionCode']], 200);
