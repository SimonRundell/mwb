<?php
/**
 * getAnswers.php — returns the current answers for a question, for the
 * teacher's live masonry board. Polled every few seconds.
 *
 * POST { id } (JWT required)
 * Returns a JSON array of { id, answerText, submittedAt, updatedAt }
 * (no studentToken — answers are anonymous on the teacher's board).
 *
 * @license CC BY-NC-SA 4.0 — Simon Rundell / CodeMonkey Design Ltd. 2026
 */
include 'setup.php';

$auth = requireAuth();

$id = (int)($receivedData['id'] ?? 0);
if (!$id) send_response('id is required', 400);

$check = $mysqli->prepare("SELECT id, isActive FROM tblquestion WHERE id = ? AND teacherId = ?");
$check->bind_param("ii", $id, $auth['userId']);
$check->execute();
$question = $check->get_result()->fetch_assoc();
$check->close();

if (!$question) {
    send_response('Question not found.', 404);
}

$stmt = $mysqli->prepare(
    "SELECT id, answerText, submittedAt, updatedAt
     FROM tblanswer
     WHERE questionId = ?
     ORDER BY submittedAt ASC"
);
$stmt->bind_param("i", $id);
$stmt->execute();
$rows = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
$stmt->close();

http_response_code(200);
die(json_encode(['isActive' => (bool)$question['isActive'], 'answers' => $rows]));
