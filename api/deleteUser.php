<?php
/**
 * deleteUser.php — permanently deletes a staff account, along with any
 * questions (and their answers) owned by that teacher. Admin JWT required.
 *
 * An admin cannot delete their own account (another admin must do that),
 * and the last remaining admin cannot be deleted, to avoid locking
 * everyone out of the Admin tab.
 *
 * POST { id }
 *
 * @license CC BY-NC-SA 4.0 — Simon Rundell / CodeMonkey Design Ltd. 2026
 */
include 'setup.php';

$auth = requireAdmin();

$id = (int)($receivedData['id'] ?? 0);
if (!$id) send_response('id is required', 400);

if ($id === $auth['userId']) {
    send_response('Ask another administrator to delete your own account.', 403);
}

$check = $mysqli->prepare('SELECT isAdmin FROM mwb_user WHERE id = ?');
$check->bind_param('i', $id);
$check->execute();
$user = $check->get_result()->fetch_assoc();
$check->close();

if (!$user) send_response('User not found.', 404);

if ($user['isAdmin']) {
    $countStmt = $mysqli->prepare('SELECT COUNT(*) AS n FROM mwb_user WHERE isAdmin = 1');
    $countStmt->execute();
    $adminCount = (int)$countStmt->get_result()->fetch_assoc()['n'];
    $countStmt->close();

    if ($adminCount <= 1) {
        send_response('Cannot delete the last remaining administrator.', 403);
    }
}

$deleteAnswers = $mysqli->prepare(
    'DELETE a FROM mwb_answer a INNER JOIN mwb_question q ON a.questionId = q.id WHERE q.teacherId = ?'
);
$deleteAnswers->bind_param('i', $id);
$deleteAnswers->execute();
$deleteAnswers->close();

$deleteQuestions = $mysqli->prepare('DELETE FROM mwb_question WHERE teacherId = ?');
$deleteQuestions->bind_param('i', $id);
$deleteQuestions->execute();
$deleteQuestions->close();

$stmt = $mysqli->prepare('DELETE FROM mwb_user WHERE id = ?');
$stmt->bind_param('i', $id);

if (!$stmt->execute()) {
    log_info("Execute failed: " . $stmt->error);
    send_response("Execute failed: " . $stmt->error, 500);
}

if ($stmt->affected_rows === 0) {
    $stmt->close();
    send_response('User not found.', 404);
}
$stmt->close();

log_info("User deleted: id {$id} by admin {$auth['userId']}");

send_response('User deleted.', 200);
