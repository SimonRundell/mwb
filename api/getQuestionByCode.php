<?php
/**
 * getQuestionByCode.php — public lookup used by students joining a question.
 *
 * POST { questionCode }
 * Returns { id, questionCode, questionTitle, questionHtml } if the question
 * is currently active; 404 if the code is unknown, 410 if it exists but has
 * been ended.
 *
 * @license CC BY-NC-SA 4.0 — Simon Rundell / CodeMonkey Design Ltd. 2026
 */
include 'setup.php';

$questionCode = trim($receivedData['questionCode'] ?? '');
if (!$questionCode) send_response('questionCode is required', 400);

$stmt = $mysqli->prepare(
    "SELECT id, questionCode, questionTitle, questionHtml, isActive
     FROM mwb_question
     WHERE questionCode = ?"
);
$stmt->bind_param("s", $questionCode);
$stmt->execute();
$question = $stmt->get_result()->fetch_assoc();
$stmt->close();

if (!$question) {
    send_response('Code not found. Check the code and try again.', 404);
}

if (!$question['isActive']) {
    send_response('This question is not currently accepting answers.', 410);
}

unset($question['isActive']);

http_response_code(200);
die(json_encode($question));
