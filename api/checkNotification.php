<?php
/**
 * checkNotification.php — public endpoint a student's device polls to see
 * if the teacher has flagged their card on the monitor screen. Fetches the
 * pending notification (if any) for this question/studentToken and clears
 * it in the same request, so it fires exactly once.
 *
 * POST { questionId, studentToken }
 * Returns { notifyType: 'warning' | 'praise' | null }
 *
 * @license CC BY-NC-SA 4.0 — Simon Rundell / CodeMonkey Design Ltd. 2026
 */
include 'setup.php';

$questionId   = (int)($receivedData['questionId'] ?? 0);
$studentToken = trim($receivedData['studentToken'] ?? '');

if (!$questionId)   send_response('questionId is required', 400);
if (!$studentToken) send_response('studentToken is required', 400);

$stmt = $mysqli->prepare(
    "SELECT id, notifyType FROM mwb_answer WHERE questionId = ? AND studentToken = ?"
);
$stmt->bind_param("is", $questionId, $studentToken);
$stmt->execute();
$answer = $stmt->get_result()->fetch_assoc();
$stmt->close();

$notifyType = $answer['notifyType'] ?? null;

if ($answer && $notifyType !== null) {
    $clear = $mysqli->prepare("UPDATE mwb_answer SET notifyType = NULL WHERE id = ?");
    $clear->bind_param("i", $answer['id']);
    $clear->execute();
    $clear->close();
}

http_response_code(200);
die(json_encode(['notifyType' => $notifyType]));
