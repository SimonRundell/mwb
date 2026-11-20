<?php
/**
 * notifyAnswer.php — teacher flags a card on the monitor screen to send a
 * big full-screen notification back to the originating student's device,
 * e.g. to call out an inappropriate post or praise a good one.
 *
 * POST { answerId, type } (JWT required), type is 'warning' or 'praise'.
 * The student's device picks this up via checkNotification.php, which also
 * clears it, so a fresh click is needed to notify the same student again.
 *
 * @license CC BY-NC-SA 4.0 — Simon Rundell / CodeMonkey Design Ltd. 2026
 */
include 'setup.php';

$auth = requireAuth();

$answerId = (int)($receivedData['answerId'] ?? 0);
$type     = trim($receivedData['type'] ?? '');

if (!$answerId) send_response('answerId is required', 400);
if (!in_array($type, ['warning', 'praise'], true)) send_response('type must be warning or praise', 400);

$check = $mysqli->prepare(
    "SELECT a.id
     FROM mwb_answer a
     JOIN mwb_question q ON q.id = a.questionId
     WHERE a.id = ? AND q.teacherId = ?"
);
$check->bind_param("ii", $answerId, $auth['userId']);
$check->execute();
$answer = $check->get_result()->fetch_assoc();
$check->close();

if (!$answer) {
    send_response('Answer not found.', 404);
}

$now = date('Y-m-d H:i:s');
$stmt = $mysqli->prepare("UPDATE mwb_answer SET notifyType = ?, notifiedAt = ? WHERE id = ?");
$stmt->bind_param("ssi", $type, $now, $answerId);

if (!$stmt->execute()) {
    send_response("Execute failed: " . $stmt->error, 500);
}
$stmt->close();

send_response('Notification sent.', 200);
