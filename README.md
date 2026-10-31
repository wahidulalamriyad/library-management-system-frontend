# BookNest — Library Management System (Frontend Version)

CSC 3215 Web Technologies project. Built only with what the lecture and lab slides cover
(Weeks 1–6): HTML pages and forms, an external CSS file, external JavaScript files,
JavaScript form validation and DOM manipulation. The PHP + MySQL backend will be added later.

## How to run

No installation needed. Open `index.html` in Chrome or Firefox
(double-click it, or use VS Code's Live Server).

Everyone uses the **same login page** with just a username (or email) and password.
The role stored in the account decides which dashboard opens.

| Role      | Username    | Password     |
|-----------|-------------|--------------|
| Admin     | `admin`     | `admin1234`  |
| Librarian | `librarian` | `library123` |
| Student   | `student`   | `student123` |
| Visitor   | `visitor`   | `visitor123` |
| Librarian waiting for approval | `jamal` | `jamal1234` (login is refused until an admin approves) |

The login page also has "Use" buttons that fill these in.

### Registration and accounts

- **One registration page** (`register.html`) for Students, Librarians and Visitors.
  Step 1 asks for the type of user; JavaScript then shows the common fields plus only
  that type's fieldset (`element.style.display`):
  - **Student:** Student ID (23-51234-1), department, semester, favourite subjects
  - **Librarian:** Employee ID (EMP-1234), qualification, years of experience, preferred shift
  - **Visitor:** NID (10/13/17 digits), occupation, organization, address, interests
- Minimum age changes by type (Visitor 12, Student 16, Librarian 18).
- New **librarians start as Pending**; an admin approves them in *Manage Users*.
- **Admins are not on the public page.** An existing admin adds new admins from *Manage Users*.

> **Frontend only:** all data lives in JavaScript arrays of objects (`js/data.js`).
> Changes work while you stay on a page, and reset when the page reloads or you move to
> another page. This is expected until the backend stores the data in a database.

## Folder structure (HTML / CSS / JS separation)

```
library-management-system/
├── index.html        Home page: catalogue search, who it is for, how it works, hours
├── login.html        ONE login page for all four user types
├── register.html     ONE registration page; fields change with the user type
├── admin.html        Admin dashboard
├── librarian.html    Librarian dashboard
├── student.html      Student dashboard
├── visitor.html      Visitor dashboard
├── css/
│   └── style.css     ONE external style sheet linked from every page
└── js/
    ├── data.js       Sample data: arrays of objects (users, books, loans, ...)
    ├── common.js     Shared helpers: showSection, showError, validation, dates, search
    ├── home.js       Home page search
    ├── login.js      validateLogin() + switch on role
    ├── register.js   showTypeFields() + validateRegister()
    ├── admin.js      Admin features
    ├── librarian.js  Librarian features
    ├── student.js    Student features
    └── visitor.js    Visitor features
```

Every page loads its scripts at the end of `<body>` in this order:
`data.js` → `common.js` → the page's own script.

## Features by user

Every user can **Create, Read, Update, Delete and Search** their own kind of record,
plus **3 unique features** that no other user has.

| User | CRUD + Search on | Unique feature 1 | Unique feature 2 | Unique feature 3 |
|---|---|---|---|---|
| **Admin** | User accounts of all four roles, incl. adding admins and approving pending librarians | **Statistics Report** — counts users, copies, loans, overdue loans and fines with loops; bar charts | **Library Rules Settings** — fine per day, loan period, book limit, renewal rules, with a live preview | **Activity Log Monitor** — scrolling notice board, filter by type/user, colour per type (switch), clear log |
| **Librarian** | Books (title, author, category, ISBN, year, copies, shelf) | **Issue Book** — drop-downs built with `createElement`, checks stock and the student's book limit, auto due date | **Return & Fine** — late days × fine per day, optional damage charge, puts the copy back on the shelf | **Overdue Report** — overdue loans, days late, pending fines, "Send reminder" button |
| **Student** | Book requests (purchase / reserve, priority, reason) — only *Pending* ones can be edited or cancelled | **Due-Date Reminders** — colour-coded cards (green / orange / red) and borrowing history | **Renew Book** — adds 7 days if not overdue and renewals are left | **Reading Goal** — progress bar; add / remove extra books with `push()` / `pop()` like the Lab 04 to-do list |
| **Visitor** | Their own reading-room visit passes (prefilled from the account), with a 10-person slot limit | **Membership Fee Calculator** — plan (radio) × months (select), discounts (checkbox) | **Opening Hours Checker** — is the library open at a chosen day/time; today highlighted | **Section Finder** — subject → floor, zone and shelves (switch), highlights the floor on a building map |

Everyone (including people not logged in, on the home page) can search the book catalogue.

## Where each part comes from in the slides

| Topic in the code | Slide deck |
|---|---|
| `<!DOCTYPE html>`, `<head>`, `<meta charset>`, `<meta name="viewport">`, `<title>`, `<link>` | Week 02-03 HTML Forms & DOM |
| `<form>`, `<fieldset>`, `<legend>`, `<table>` layout, `<label for>` matching `id` | Week 02-03 lecture, Lab 01 |
| Input types: text, email, password, number, date, time, tel, radio, checkbox, submit, reset; `<select>`, `<textarea>` | Week 02-03 lecture, Lab 01 |
| Password field without `name` so it is not sent in the URL (`method="get"`) | Week 02-03 "Spot the Bugs" |
| Register button disabled until terms are ticked | Week 02-03 "DHTML in our form" |
| External CSS, element / id / class / grouping selectors, `:hover`, `:focus`, `:nth-child` | Week 04 CSS |
| Box model: margin, padding, border, `box-sizing: border-box`, `max-width` + `margin: 0 auto` | Week 04 CSS, Lab 02 |
| Header / navigation / content / footer layout, `position: sticky` nav | Week 04 CSS (Exercise 2) |
| Cards with `border-radius` and `box-shadow`, buttons with `transition` | Week 04 CSS (Exercise 1) |
| Notice board with `overflow-y: auto` and coloured `border-left`, `transform: scale()` on hover | Week 04 CSS (Exercise 4) |
| `display: none / block`, `display: flex`, `display: grid` | Week 04 CSS (Display, Looking ahead) |
| `let` / `const`, functions with `return`, `if / else if / else`, ternary `? :`, `===` | Week 05 JavaScript Intro |
| Events: `onclick`, `onchange`, `onkeyup`, `onsubmit`, `addEventListener` | Week 05 lecture, Lab 03 |
| `switch` (fine colours, plans, sections, login redirect) | Week 06 JS DOM |
| `for`, `for...of`, `while` loops | Week 05–06 |
| Arrays: `push`, `pop`, `slice`, `concat`, `indexOf`, `join`, `length` | Week 06 JS DOM, Lab 04 |
| Objects and arrays of objects (`users`, `books`, `issuedBooks`, `libraryRules`) | Week 06 JS DOM, Lab 04 |
| `getElementById`, `getElementsByName`, `.value`, `.innerHTML`, `.style.property`, `createElement`, `appendChild` | Week 02-03 DOM, Week 06 |
| `onsubmit="return validateForm()"` — `return false` stops the form | Week 06 Form Validation, Lab 04 |
| HTML5 input types and `min` / `max` attributes for simple rules, JavaScript for rules that compare fields (password = confirm password) | Week 06 Built-in HTML5 validation |
| Errors shown in red next to each field with `element.style` | Lab 04 Task 1 |
| Redrawing tables with a `for` loop + `innerHTML` | Lab 04 Task 2 (to-do list) |
| `console.log` for checking arrays while testing | Week 05, Week 06 Debugging |
| `alert()` for the overdue reminder | Week 05 Output |

### Two small extras (explained in comments)

- **Dates:** `common.js` uses the built-in `Date` object only to read today's date and to count
  days between two `YYYY-MM-DD` texts (`todayString`, `addDays`, `daysBetween`).
- **`Math.round` / `Math.floor`:** used to round percentages and fines.

## How a CRUD section works (same pattern on every page)

1. **Read** — `renderX()` loops over the array and builds `<tr>` rows into `innerHTML`.
2. **Search** — the same `renderX()` skips rows that do not contain the search text
   (`containsText()` uses `toLowerCase()` and `indexOf()`); it runs on every `onkeyup`.
3. **Create** — the form's `onsubmit="return saveX()"` validates, builds an object and `push()`es it.
4. **Update** — the **Edit** button copies the object into the form and sets `editIndex`;
   saving again changes that object's properties instead of pushing a new one.
5. **Delete** — `removeAt(array, index)` returns a new array using `slice()` + `concat()`.

## Plan for the backend (later labs)

| Frontend now | Backend later |
|---|---|
| Arrays in `data.js` | MySQL tables: `users`, `books`, `issued_books`, `book_requests`, `visit_passes`, `activity_log`, `library_rules` |
| `validateLogin()` checks the `users` array | `login.php` checks the database, starts `$_SESSION` (Lab 09) |
| `const currentStudentId = "U-003"` | `$_SESSION['user_id']` |
| `method="get"`, password without `name` | `method="post"` with `name="password"`, validated again in PHP (Lab 08) |
| `push()` / editing / `removeAt()` | `INSERT` / `UPDATE` / `DELETE` with prepared statements (Lab 11) |
| Search inside the array | `SELECT ... WHERE ... LIKE ?`, optionally live with AJAX + JSON (Lab 10) |
