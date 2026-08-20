/**
 * Generates a short random question code (client-side; uniqueness is
 * enforced server-side by insertQuestion.php's unique key on questionCode).
 */
export function genCode() {
    return Math.random().toString(36).substring(2, 8);
}
