<?php
/**
 * insertQuestion.php — creates a new hinge question. Teacher JWT required.
 *
 * POST { questionCode, questionTitle, questionHtml }
 * questionCode is generated client-side (short random string) and must be unique.
 *
 * @license CC BY-NC-SA 4.0 — Simon Rundell / CodeMonkey Design Ltd. 2026
 */
include 'setup.php';

$auth = requireAuth();

$questionCode  = trim($receivedData['questionCode']  ?? '');
$questionTitle = trim($receivedData['questionTitle'] ?? '');
$questionHtml  = $receivedData['questionHtml'] ?? '';

if (!$questionCode)  send_response('questionCode is required', 400);
if (!$questionTitle) send_response('questionTitle is required', 400);
if (!$questionHtml)  send_response('questionHtml is required', 400);

$now = date('Y-m-d H:i:s');

$stmt = $mysqli->prepare(
    "INSERT INTO tblquestion (questionCode, questionTitle, questionHtml, teacherId, isActive, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, 0, ?, ?)"
);

if (!$stmt) {
    log_info("Prepare failed: " . $mysqli->error);
    send_response("Prepare failed: " . $mysqli->error, 500);
}

$stmt->bind_param("sssiss", $questionCode, $questionTitle, $questionHtml, $auth['userId'], $now, $now);

if (!$stmt->execute()) {
    log_info("Execute failed: " . $stmt->error);
    send_response("Execute failed: " . $stmt->error, 500);
}

$id = $mysqli->insert_id;
$stmt->close();

log_info("Question created: {$questionCode} (id {$id}) by user {$auth['userId']}");

send_response(['id' => $id, 'questionCode' => $questionCode], 200);
