/* =====================================================================
   librarian.js  -  Everything the Librarian can do (librarian.html)
   ---------------------------------------------------------------------
   CRUD + Search : Manage Books (books array)
   Unique 1      : Issue Book to a student
   Unique 2      : Return Book and calculate the fine
   Unique 3      : Overdue Books Report
   ===================================================================== */

const sections = ["catalogSection", "issueSection", "returnSection", "overdueSection"];

let editBookIndex = -1;          // -1 = adding, otherwise the index being edited
const DAMAGE_CHARGE = 100;       // Tk added when a returned book is damaged

const bookFields = ["bookTitle", "bookAuthor", "bookCategory", "bookIsbn", "bookYear", "bookCopies", "bookShelf"];


/* =====================================================================
   SHARED HELPERS FOR THIS PAGE
   ===================================================================== */

// Finds a user object by id (returns null if there is none)
function findUser(id) {
  for (const user of users) {
    if (user.id === id) {
      return user;
    }
  }
  return null;
}

// Counts how many books a student holds right now
function countActiveLoans(studentId) {
  let count = 0;
  for (const loan of issuedBooks) {
    if (loan.studentId === studentId && loan.returned === false) {
      count++;
    }
  }
  return count;
}

// Counts the copies of a book that are out on loan
function copiesOnLoan(bookId) {
  let count = 0;
  for (const loan of issuedBooks) {
    if (loan.bookId === bookId && loan.returned === false) {
      count++;
    }
  }
  return count;
}

// Redraws everything that depends on books and loans
function refreshAll() {
  renderBooks();
  fillIssueSelects();
  renderActiveLoans();
  fillReturnSelect();
  renderReturned();
  renderOverdue();
}


/* =====================================================================
   MANAGE BOOKS: CREATE, READ, UPDATE, DELETE, SEARCH
   ===================================================================== */

// READ + SEARCH
function renderBooks() {
  let keyword = document.getElementById("bookSearch").value;
  let category = document.getElementById("bookCategoryFilter").value;
  let stock = document.getElementById("bookStockFilter").value;

  let rows = "";
  let shown = 0;

  for (let i = 0; i < books.length; i++) {
    let book = books[i];

    let matchesKeyword = containsText(book.title, keyword) || containsText(book.author, keyword) ||
                         containsText(book.isbn, keyword) || containsText(book.id, keyword);
    let matchesCategory = (category === "All" || book.category === category);
    let matchesStock = (stock === "All") ||
                       (stock === "In" && book.available > 0) ||
                       (stock === "Out" && book.available === 0);

    if (matchesKeyword && matchesCategory && matchesStock) {
      // Green when copies are on the shelf, red when none are left (ternary operator)
      let stockColor = book.available > 0 ? "green" : "red";

      rows += "<tr>" +
                "<td>" + book.id + "</td>" +
                "<td><strong>" + book.title + "</strong><br><span class='hint'>" + book.author + "</span></td>" +
                "<td>" + book.category + "</td>" +
                "<td>" + book.isbn + "<br><span class='hint'>" + book.year + "</span></td>" +
                "<td><span class='badge " + stockColor + "'>" + book.available + " / " + book.copies + "</span></td>" +
                "<td>" + book.shelf + "</td>" +
                "<td>" +
                  "<button type='button' class='btn btn-small' onclick='editBook(" + i + ")'>Edit</button>" +
                  "<button type='button' class='btn btn-small btn-danger' onclick='deleteBook(" + i + ")'>Delete</button>" +
                "</td>" +
              "</tr>";
      shown++;
    }
  }

  if (shown === 0) {
    rows = "<tr><td colspan='7' class='empty-row'>No books match your search.</td></tr>";
  }

  document.getElementById("bookTableBody").innerHTML = rows;
  document.getElementById("bookCount").innerHTML = "Showing " + shown + " of " + books.length + " books";
}


// CREATE or UPDATE
function saveBook() {
  let title = document.getElementById("bookTitle").value.trim();
  let author = document.getElementById("bookAuthor").value.trim();
  let category = document.getElementById("bookCategory").value;
  let isbn = document.getElementById("bookIsbn").value.trim();
  let yearText = document.getElementById("bookYear").value;
  let copiesText = document.getElementById("bookCopies").value;
  let shelf = document.getElementById("bookShelf").value.trim().toUpperCase();

  let year = Number(yearText);
  let copies = Number(copiesText);
  let thisYear = Number(todayString().slice(0, 4));

  // ----- Validation -----
  let isValid = true;
  clearErrors(bookFields);

  if (title.length < 2) {
    showError("bookTitle", "Title must be at least 2 characters.");
    isValid = false;
  }

  if (author.length < 3) {
    showError("bookAuthor", "Author must be at least 3 characters.");
    isValid = false;
  }

  if (category === "") {
    showError("bookCategory", "Please choose a category.");
    isValid = false;
  }

  if (isDigitsOnly(isbn) === false || isbn.length !== 13) {
    showError("bookIsbn", "ISBN must be exactly 13 digits.");
    isValid = false;
  } else if (isbnUsedByOther(isbn)) {
    showError("bookIsbn", "Another book already has this ISBN.");
    isValid = false;
  }

  if (yearText === "" || year < 1900 || year > thisYear) {
    showError("bookYear", "Year must be between 1900 and " + thisYear + ".");
    isValid = false;
  }

  if (copiesText === "" || copies < 1 || copies > 50) {
    showError("bookCopies", "Copies must be between 1 and 50.");
    isValid = false;
  } else if (editBookIndex !== -1 && copies < copiesOnLoan(books[editBookIndex].id)) {
    showError("bookCopies", "Cannot be less than the " + copiesOnLoan(books[editBookIndex].id) + " copies on loan.");
    isValid = false;
  }

  if (isValidShelf(shelf) === false) {
    showError("bookShelf", "Use a capital letter, a dash and a number, e.g. A-1.");
    isValid = false;
  }

  if (isValid === false) {
    return false;
  }

  // ----- Save -----
  if (editBookIndex === -1) {
    // CREATE
    let newBook = { id: nextId("B", books), title: title, author: author, category: category, isbn: isbn,
                    year: year, copies: copies, available: copies, shelf: shelf };
    books.push(newBook);
    showMessage("bookMessage", "<strong>" + title + "</strong> was added with id " + newBook.id + ".", "success");
  } else {
    // UPDATE: keep the number of copies on loan the same
    let book = books[editBookIndex];
    let onLoan = book.copies - book.available;
    book.title = title;
    book.author = author;
    book.category = category;
    book.isbn = isbn;
    book.year = year;
    book.copies = copies;
    book.available = copies - onLoan;
    book.shelf = shelf;
    showMessage("bookMessage", "<strong>" + title + "</strong> was updated.", "success");
  }

  resetBookForm();
  refreshAll();
  return false;
}


// Shelf codes look like A-1 or C-12
function isValidShelf(shelf) {
  let letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  if (shelf.length < 3) {
    return false;
  }
  return letters.indexOf(shelf[0]) !== -1 && shelf[1] === "-" && isDigitsOnly(shelf.slice(2));
}


function isbnUsedByOther(isbn) {
  for (let i = 0; i < books.length; i++) {
    if (i !== editBookIndex && books[i].isbn === isbn) {
      return true;
    }
  }
  return false;
}


// UPDATE step 1: put the book's values into the form
function editBook(index) {
  let book = books[index];
  editBookIndex = index;

  document.getElementById("bookTitle").value = book.title;
  document.getElementById("bookAuthor").value = book.author;
  document.getElementById("bookCategory").value = book.category;
  document.getElementById("bookIsbn").value = book.isbn;
  document.getElementById("bookYear").value = book.year;
  document.getElementById("bookCopies").value = book.copies;
  document.getElementById("bookShelf").value = book.shelf;

  document.getElementById("bookFormTitle").innerHTML = "Edit Book " + book.id;
  document.getElementById("bookSaveButton").value = "Update Book";
  hideMessage("bookMessage");
}


// DELETE: only allowed when no copy is out on loan
function deleteBook(index) {
  let book = books[index];

  if (copiesOnLoan(book.id) > 0) {
    showMessage("bookMessage", "<strong>" + book.title + "</strong> cannot be deleted: some copies are still on loan.", "error");
    return;
  }

  books = removeAt(books, index);
  showMessage("bookMessage", "<strong>" + book.title + "</strong> was deleted.", "info");
  resetBookForm();
  refreshAll();
}


function resetBookForm() {
  editBookIndex = -1;
  document.getElementById("bookForm").reset();
  clearErrors(bookFields);
  document.getElementById("bookFormTitle").innerHTML = "Add New Book";
  document.getElementById("bookSaveButton").value = "Add Book";
}


/* =====================================================================
   UNIQUE FEATURE 1: ISSUE A BOOK
   ===================================================================== */

// Adds one <option> to a <select> (createElement + appendChild)
function addOption(select, value, text) {
  let option = document.createElement("option");
  option.value = value;
  option.innerHTML = text;
  select.appendChild(option);
}

// Fills the Book and Student drop-down lists
function fillIssueSelects() {
  let bookSelect = document.getElementById("loanBook");
  let studentSelect = document.getElementById("loanStudent");

  bookSelect.innerHTML = "";
  addOption(bookSelect, "", "-- Select Book --");
  for (const book of books) {
    if (book.available > 0) {                // only books on the shelf
      addOption(bookSelect, book.id, book.title + " (" + book.available + " left)");
    }
  }

  studentSelect.innerHTML = "";
  addOption(studentSelect, "", "-- Select Student --");
  for (const user of users) {
    if (user.role === "Student" && user.status === "Active") {
      addOption(studentSelect, user.id, user.name + " (" + user.id + ")");
    }
  }
}

// The due date is always issue date + loan days
function updateDueDate() {
  let issueDate = document.getElementById("issueDate").value;
  if (issueDate !== "") {
    document.getElementById("issueDueDate").value = addDays(issueDate, libraryRules.loanDays);
  }
}

// Shows the book's stock and the student's loans while the librarian chooses
function showIssueInfo() {
  let bookId = document.getElementById("loanBook").value;
  let studentId = document.getElementById("loanStudent").value;
  let info = "";

  if (bookId !== "") {
    let book = books[findIndexById(books, bookId)];
    info += "<p><strong>" + book.title + "</strong> by " + book.author + "<br>Shelf " + book.shelf +
            " &middot; " + book.available + " of " + book.copies + " copies on the shelf</p>";
  }

  if (studentId !== "") {
    let student = findUser(studentId);
    let holding = countActiveLoans(studentId);
    let color = holding >= libraryRules.maxBooks ? "red" : "green";
    info += "<p><strong>" + student.name + "</strong> holds <span class='badge " + color + "'>" +
            holding + " / " + libraryRules.maxBooks + "</span> books</p>";
  }

  if (info === "") {
    info = "Choose a book and a student to see the details.";
  }
  document.getElementById("issueInfo").innerHTML = info;
}

function issueBook() {
  let bookId = document.getElementById("loanBook").value;
  let studentId = document.getElementById("loanStudent").value;
  let issueDate = document.getElementById("issueDate").value;

  let isValid = true;
  clearErrors(["loanBook", "loanStudent", "issueDate"]);
  hideMessage("issueMessage");

  if (bookId === "") {
    showError("loanBook", "Please choose a book.");
    isValid = false;
  }

  if (studentId === "") {
    showError("loanStudent", "Please choose a student.");
    isValid = false;
  } else if (countActiveLoans(studentId) >= libraryRules.maxBooks) {
    showError("loanStudent", "This student already holds the maximum of " + libraryRules.maxBooks + " books.");
    isValid = false;
  }

  if (issueDate === "") {
    showError("issueDate", "Please choose the issue date.");
    isValid = false;
  } else if (daysBetween(todayString(), issueDate) > 0) {
    showError("issueDate", "The issue date cannot be in the future.");
    isValid = false;
  }

  // The same student cannot borrow two copies of the same book
  if (isValid) {
    for (const loan of issuedBooks) {
      if (loan.bookId === bookId && loan.studentId === studentId && loan.returned === false) {
        showError("loanBook", "This student already has a copy of this book.");
        isValid = false;
      }
    }
  }

  if (isValid === false) {
    return false;
  }

  let book = books[findIndexById(books, bookId)];
  let student = findUser(studentId);
  let dueDate = addDays(issueDate, libraryRules.loanDays);

  issuedBooks.push({
    id: nextId("I", issuedBooks), bookId: book.id, title: book.title,
    studentId: student.id, studentName: student.name,
    issueDate: issueDate, dueDate: dueDate,
    returned: false, returnDate: "", fine: 0, renewals: 0
  });
  book.available--;                               // one copy fewer on the shelf

  showMessage("issueMessage", "<strong>" + book.title + "</strong> was issued to " + student.name +
              ". Due back on <strong>" + dueDate + "</strong>.", "success");

  document.getElementById("issueForm").reset();
  setDefaultDates();
  refreshAll();
  showIssueInfo();
  return false;
}

// Table of books that are out right now
function renderActiveLoans() {
  let rows = "";
  for (const loan of issuedBooks) {
    if (loan.returned === false) {
      rows += "<tr><td>" + loan.id + "</td><td>" + loan.title + "</td><td>" + loan.studentName +
              "</td><td>" + loan.issueDate + "</td><td>" + loan.dueDate + "</td></tr>";
    }
  }
  if (rows === "") {
    rows = "<tr><td colspan='5' class='empty-row'>No books are on loan.</td></tr>";
  }
  document.getElementById("activeLoansBody").innerHTML = rows;
}


/* =====================================================================
   UNIQUE FEATURE 2: RETURN A BOOK AND CALCULATE THE FINE
   ===================================================================== */

function fillReturnSelect() {
  let select = document.getElementById("returnLoan");
  select.innerHTML = "";
  addOption(select, "", "-- Select Loan --");

  for (const loan of issuedBooks) {
    if (loan.returned === false) {
      addOption(select, loan.id, loan.id + " - " + loan.title + " - " + loan.studentName + " (due " + loan.dueDate + ")");
    }
  }
}

// Works out the fine and returns it as a number. It also fills the fine box.
function calculateFine() {
  let loanId = document.getElementById("returnLoan").value;
  let returnDate = document.getElementById("returnDate").value;
  let damaged = document.getElementById("returnDamaged").checked;
  let box = document.getElementById("fineBox");

  if (loanId === "" || returnDate === "") {
    box.innerHTML = "Choose a loan and a return date to calculate the fine.";
    return 0;
  }

  let loan = issuedBooks[findIndexById(issuedBooks, loanId)];
  let daysLate = daysBetween(loan.dueDate, returnDate);
  if (daysLate < 0) {
    daysLate = 0;                                  // returned early: not late
  }

  let lateFine = daysLate * libraryRules.finePerDay;
  let damageFine = damaged ? DAMAGE_CHARGE : 0;
  let total = lateFine + damageFine;

  let status;
  if (daysLate === 0) {
    status = "<span class='badge green'>On time</span>";
  } else if (daysLate <= 7) {
    status = "<span class='badge orange'>" + daysLate + " days late</span>";
  } else {
    status = "<span class='badge red'>" + daysLate + " days late</span>";
  }

  box.innerHTML =
    "<p><strong>" + loan.title + "</strong> &middot; " + loan.studentName + "</p>" +
    "<p>Due " + loan.dueDate + ", returned " + returnDate + " " + status + "</p>" +
    "<p>Late fine: " + daysLate + " days x " + libraryRules.finePerDay + " Tk = " + lateFine + " Tk</p>" +
    "<p>Damage charge: " + damageFine + " Tk</p>" +
    "<p>Total fine: <span class='big'>" + total + " Tk</span></p>";

  return total;
}

function returnBook() {
  let loanId = document.getElementById("returnLoan").value;
  let returnDate = document.getElementById("returnDate").value;

  let isValid = true;
  clearErrors(["returnLoan", "returnDate"]);
  hideMessage("returnMessage");

  if (loanId === "") {
    showError("returnLoan", "Please choose a loan.");
    isValid = false;
  }

  if (returnDate === "") {
    showError("returnDate", "Please choose the return date.");
    isValid = false;
  } else if (daysBetween(todayString(), returnDate) > 0) {
    showError("returnDate", "The return date cannot be in the future.");
    isValid = false;
  } else if (loanId !== "") {
    let loan = issuedBooks[findIndexById(issuedBooks, loanId)];
    if (daysBetween(loan.issueDate, returnDate) < 0) {
      showError("returnDate", "The return date cannot be before the issue date (" + loan.issueDate + ").");
      isValid = false;
    }
  }

  if (isValid === false) {
    return false;
  }

  let fine = calculateFine();
  let loan = issuedBooks[findIndexById(issuedBooks, loanId)];
  loan.returned = true;
  loan.returnDate = returnDate;
  loan.fine = fine;

  let bookIndex = findIndexById(books, loan.bookId);
  if (bookIndex !== -1) {
    books[bookIndex].available++;                  // the copy is back on the shelf
  }

  showMessage("returnMessage", "<strong>" + loan.title + "</strong> was returned by " + loan.studentName +
              ". Fine: <strong>" + fine + " Tk</strong>.", "success");

  document.getElementById("returnForm").reset();
  setDefaultDates();
  document.getElementById("fineBox").innerHTML = "Choose a loan to calculate the fine.";
  refreshAll();
  return false;
}

// Returned loans, newest first (loop backwards)
function renderReturned() {
  let rows = "";
  for (let i = issuedBooks.length - 1; i >= 0; i--) {
    let loan = issuedBooks[i];
    if (loan.returned) {
      rows += "<tr><td>" + loan.id + "</td><td>" + loan.title + "</td><td>" + loan.studentName +
              "</td><td>" + loan.dueDate + "</td><td>" + loan.returnDate + "</td><td>" + loan.fine + "</td></tr>";
    }
  }
  if (rows === "") {
    rows = "<tr><td colspan='6' class='empty-row'>No returns yet.</td></tr>";
  }
  document.getElementById("returnedBody").innerHTML = rows;
}


/* =====================================================================
   UNIQUE FEATURE 3: OVERDUE BOOKS REPORT
   ===================================================================== */

function renderOverdue() {
  let today = todayString();
  let rows = "";
  let count = 0;
  let totalFine = 0;
  let worst = 0;

  for (const loan of issuedBooks) {
    let daysLate = daysBetween(loan.dueDate, today);

    if (loan.returned === false && daysLate > 0) {
      let fine = daysLate * libraryRules.finePerDay;
      count++;
      totalFine += fine;
      if (daysLate > worst) {
        worst = daysLate;
      }

      let level = daysLate > 7 ? "<span class='badge red'>Serious</span>" : "<span class='badge orange'>Late</span>";

      rows += "<tr>" +
                "<td>" + loan.id + "</td>" +
                "<td>" + loan.title + "</td>" +
                "<td>" + loan.studentName + "</td>" +
                "<td>" + loan.dueDate + "</td>" +
                "<td>" + daysLate + "</td>" +
                "<td>" + fine + " Tk</td>" +
                "<td>" + level + "</td>" +
                "<td><button type='button' class='btn btn-small' onclick=\"sendReminder('" + loan.id + "', this)\">Send reminder</button></td>" +
              "</tr>";
    }
  }

  if (count === 0) {
    rows = "<tr><td colspan='8' class='empty-row'>Great: no overdue books.</td></tr>";
  }

  document.getElementById("overdueBody").innerHTML = rows;
  document.getElementById("overdueCount").innerHTML = count;
  document.getElementById("overdueFine").innerHTML = totalFine;
  document.getElementById("overdueWorst").innerHTML = worst;
}

// "this" in the onclick is the button that was clicked, so we can change it
function sendReminder(loanId, button) {
  let loan = issuedBooks[findIndexById(issuedBooks, loanId)];
  let student = findUser(loan.studentId);

  alert("Reminder sent to " + student.name + " (" + student.email + "):\n" +
        "Please return \"" + loan.title + "\". It was due on " + loan.dueDate + ".");

  button.innerHTML = "Sent";
  button.disabled = true;
  button.className = "btn btn-small btn-success";
}


/* =====================================================================
   START
   ===================================================================== */
function setDefaultDates() {
  document.getElementById("issueDate").value = todayString();
  document.getElementById("returnDate").value = todayString();
  updateDueDate();
  document.getElementById("loanRuleHint").innerHTML =
    "Loan period: " + libraryRules.loanDays + " days";
}

setDefaultDates();
refreshAll();
showSection("catalogSection");
