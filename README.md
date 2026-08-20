# Mini Whiteboard

A classroom hinge-question tool built for 16-19 year old Further Education students. Teachers write a short rich-text question and launch it under a single stable code; students join with just the code and type a short answer -- no account, no name. The teacher's screen shows every answer live as a masonry board of anonymous cards, similar to holding up mini whiteboards.

Sibling project to [Retrieval Practice](../retrieval) -- same tech stack, branding and conventions, adapted for quick checks for understanding rather than full quizzes.

---

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | React 18 + Vite 6 |
| Routing | React Router v7 |
| Rich text editor | Tiptap |
| HTTP client | Axios |
| Backend | PHP (no framework) |
| Database | MariaDB / MySQL |
| Auth | JWT (HS256, pure PHP -- no Composer needed) |
| Dev server | Laragon (Apache + MariaDB on Windows) |

---

## Project Structure

```text
/
├── api/                        PHP REST API endpoints
│   ├── .config.json            Local config (not committed -- see .config.example.json)
│   ├── .config.example.json    Template for the above
│   ├── .htaccess               Passes Authorization header through Apache
│   ├── cors.php                Shared CORS handler, included first by every endpoint
│   ├── setup.php               Shared bootstrap: DB, JWT helpers, response utilities
│   ├── getLogin.php            Teacher login, returns JWT (rejects deactivated accounts)
│   ├── registerUser.php        Self-service staff registration, restricted to configured email domains
│   ├── updateMyAccount.php     Signed-in teacher changes their own display name/password
│   ├── getUsers.php            List all staff accounts (admin only)
│   ├── updateUser.php          Edit any account: name, email, reset password, admin/active flags (admin only)
│   ├── getAllQuestions.php     List the teacher's saved questions
│   ├── getQuestionById.php     Fetch a single question (editor prefill / watch screen)
│   ├── insertQuestion.php      Create a new question (JWT required)
│   ├── updateQuestion.php      Edit an existing question's title/content (JWT required)
│   ├── deleteQuestion.php      Permanently delete a question and its answers (JWT required)
│   ├── launchQuestion.php      Open a question's code for answers, clearing old ones (JWT required)
│   ├── endQuestion.php         Close a question and delete its answers (JWT required)
│   ├── getAnswers.php          Live answer list for the Watch board (JWT required)
│   ├── getQuestionByCode.php   Public lookup used by students joining a question
│   └── submitAnswer.php        Public upsert of a student's answer
│
├── data/
│   └── schema.sql              Fresh installation schema
│
├── public/
│   └── .config.json            Frontend config (appName, strapline, api path)
│
└── src/
    ├── App.jsx                 Root component
    ├── App.css                 Full stylesheet (light theme, CSS custom properties)
    ├── main.jsx                Entry point
    ├── styles/
    │   └── variables.css       CSS custom property definitions (shared with Retrieval)
    ├── contexts/
    │   ├── AuthContext.jsx     JWT auth state (login, logout, updateTeacher, isAuthenticated)
    │   └── ToastContext.jsx    Global toast notification queue
    ├── hooks/
    │   └── useApi.js           Axios instance with automatic Bearer token injection
    ├── utils/
    │   └── questionCode.js     Shared random question-code generator (new question / import)
    ├── router/
    │   ├── AppRouter.jsx       All route definitions
    │   ├── ProtectedRoute.jsx  Redirects unauthenticated users to /teacher/login
    │   └── AdminRoute.jsx      Redirects non-admins away from /teacher/admin
    ├── components/
    │   ├── layout/
    │   │   └── AppHeader.jsx   Shared teacher-area header (My Account / Admin / Sign out)
    │   ├── ui/                 Reusable UI components (Button, Input, Modal, Spinner, Switch)
    │   └── question/           QuestionEditor (Tiptap, with code block/indent support), AnswerCard
    └── pages/
        ├── student/            StudentEntry, AnswerSubmit
        └── teacher/            TeacherLogin, TeacherRegister, TeacherDashboard, TeacherAccount,
                                 TeacherAdmin, QuestionEditorPage, WatchAnswers
```

---

## Installation

### Prerequisites

- [Laragon](https://laragon.org/) (or any Apache + PHP 8.x + MariaDB stack)
- Node.js 20+
- npm 10+

### 1. Install JavaScript dependencies

```bash
npm install
```

### 2. Configure the API

Copy the example config and fill in your database credentials:

```bash
cp api/.config.example.json api/.config.json
```

Edit `api/.config.json`:

```json
{
    "servername": "localhost",
    "dbname": "mwb",
    "username": "your_db_user",
    "password": "your_db_password",
    "jwtSecret": "a_long_random_secret_string",
    "allowedDomains": ["your-school.ac.uk"]
}
```

`allowedDomains` restricts self-service registration (see [Accounts, Roles & Administration](#accounts-roles--administration) below) to staff email addresses on those domains. Add more entries as other institutions come online.

### 3. Create the database

Import `data/schema.sql` into MariaDB. This creates the `mwb` database, all three tables, and a default administrator account.

```bash
mysql -u root < data/schema.sql
```

The default administrator account is:

| Field | Value |
| --- | --- |
| Email | `name@school.ac.uk` |
| Password | `1234` |

**Change both the email and password** immediately after first login (update the `passwordHash` column with the MD5 of your new password, or use My Account once signed in). From then on, other staff can self-register at `/teacher/register` -- see [Accounts, Roles & Administration](#accounts-roles--administration).

### 4. Vite dev proxy

Make sure Laragon's document root points to this project folder so `api/*.php` is served on the same origin the frontend config points at (`public/.config.json`'s `api` field).

### 5. Start the development server

```bash
npm run dev
```

The app will be at `http://localhost:5173`.

---

## Database Schema

Three tables (all prefixed `mwb_` so the app can share a database with other tools):

| Table | Purpose |
| --- | --- |
| `mwb_user` | Teacher/staff accounts. Students are anonymous and have no rows here. `isAdmin` grants access to the Admin tab; `isActive` (0) blocks login and is checked on every authenticated request, not just at login. |
| `mwb_question` | One row per hinge question. `questionCode` is assigned once at creation and never changes -- launching just reopens it. |
| `mwb_answer` | One row per student per launch, keyed by a random `studentToken` generated in the browser. Upserted on submit so each student has exactly one editable card. |

---

## Live Question Flow

1. The teacher creates a question in the rich text editor and saves it -- this assigns a permanent code.
2. Clicking **Launch** opens the code for answers and clears any answers left over from a previous round, then takes the teacher to the live Watch board.
3. Students visit the site, enter the code, and type a short answer. No name or login is required -- their card is tracked by a random token stored in their browser, so they can revise their answer as many times as they like.
4. The Watch board polls for new answers every 3 seconds and lays them out as a masonry grid of anonymous cards.
5. Clicking **End Question** closes the code to new answers and deletes every answer for that round. The code itself is unchanged, so the same question can be relaunched for another class or another attempt.

---

## Importing & Exporting Questions

Teachers can share questions with colleagues without either of them touching the database:

- **Export** -- tick the checkbox on one or more questions in the dashboard (or "Select all", which respects the current search filter), then **Export selected**. This downloads a `mwb-questions-YYYY-MM-DD.json` file containing each question's title and content.
- **Import** -- **Import...** opens a file picker for a previously exported JSON file. The file is validated client-side and a confirmation dialog shows how many questions will be created (and how many were skipped for missing title/content) before anything is saved.

Imported questions are created as new, unlaunched questions owned by whoever imports them, each with a freshly generated code -- nothing about the original owner, launch history or answers is carried over. No dedicated import/export API endpoint exists; export reads data already loaded into the dashboard and import calls the same `insertQuestion.php` endpoint used by the question editor.

---

## Question Editor Toolbar

Questions are authored with a Tiptap rich text editor (`src/components/question/QuestionEditor.jsx`). The toolbar supports:

| Button | Purpose |
| --- | --- |
| **B** / **I** / **U** | Bold, italic, underline |
| **`</>`** | Inline code (short snippets like `print()`) |
| **`{ }`** | Code block -- a multi-line, monospaced block that preserves indentation and line breaks, for pasting Python or other code samples |
| **¶** | Normal text (clears block formatting back to a paragraph) |
| **•** / **1.** | Bullet list / numbered list |
| **⇥** / **⇤** | Indent / outdent -- shifts the current line(s) by 4 spaces; only active while the cursor is inside a code block, so Python's whitespace-sensitive layout survives editing |
| **―** | Horizontal rule |
| **↺** / **↻** | Undo / redo |

Content is stored and transmitted as HTML and sanitised with DOMPurify's default tag allow-list on both the Watch board and the student answer screen, which already permits `pre`, `code` and `hr`.

---

## Accounts, Roles & Administration

Teachers log in with email and password (stored as MD5 hashes in `mwb_user.passwordHash`). On success, `getLogin.php` issues a JWT signed with HS256, valid for 24 hours. The token is stored in `localStorage` and injected as a `Bearer` header on every Axios request by `src/hooks/useApi.js`.

Students are fully anonymous -- they never provide a name, only the question code and their answer.

### Registration

New staff self-register at `/teacher/register` with their name, email and a password. The email must end in one of the domains listed in `allowedDomains` in `api/.config.json`; anything else is rejected server-side with a 403. Registered accounts are teachers by default (not admins) and are active immediately -- there is no approval step.

### My Account

Every signed-in teacher can update their own display name and/or password from **My Account** (linked in the header). Email address is fixed there; only an administrator can change it.

### Admin tab

Accounts with `isAdmin = 1` see an **Admin** link in the header, leading to `/teacher/admin`. From there an administrator can, for any account:

- Edit the display name and email address
- Set a new password
- Grant or revoke admin rights
- Activate or deactivate the account (a deactivated account cannot log in, and is signed out of any existing session immediately -- see below)

An administrator cannot change their own admin or active status from this screen, to avoid accidentally locking themselves (or the only admin) out; another admin has to do it.

### Enforcement

`requireAuth()` and `requireAdmin()` (`api/setup.php`) re-read `isActive`/`isAdmin` from the database on every authenticated request rather than trusting the JWT's claims. This means a deactivation or a role change takes effect on the account's very next request, rather than waiting up to 24 hours for its token to expire. The client-side `AdminRoute` guard is a UX convenience only -- the real access control is server-side.

---

## Development Notes

- **CSS** -- all styles are in `src/App.css`, with design tokens defined in `src/styles/variables.css`, shared verbatim with the Retrieval Practice app. The palette is based on the Exeter College brand colour (`--primary: #0078C2`). No CSS framework is used.
- **Rich text sanitisation** -- question HTML is stored as authored by the teacher, but sanitised with DOMPurify on both the Watch board and the student answer screen before being rendered.
- **`api/.htaccess`** -- required on Apache to prevent the server from stripping the `Authorization` header before PHP can read it.
- **`api/.config.json`** -- excluded from version control. Never commit database credentials or the JWT secret.
- **Password fields** -- every `type="password"` `Input` gets a show/hide eye toggle automatically (`src/components/ui/Input.jsx`); no per-page wiring needed.

---

## Building for Production

```bash
npm run build
```

Upload the contents of `dist/` and the entire `api/` directory to your web host. Ensure `api/.config.json` is present on the server but not publicly accessible -- consider placing it above the web root and updating the path in `setup.php` accordingly.

---

## License

Copyright (c) 2026 Simon Rundell

Released under the [Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License](https://creativecommons.org/licenses/by-nc-sa/4.0/).

You are free to share and adapt this material for non-commercial purposes, provided you give appropriate credit and distribute any adaptations under the same license.

[![CC BY-NC-SA 4.0](https://licensebuttons.net/l/by-nc-sa/4.0/88x31.png)](https://creativecommons.org/licenses/by-nc-sa/4.0/)
