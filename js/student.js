/* =====================================================================
   student.js  -  Everything a Student can do (student.html)
   ---------------------------------------------------------------------
   CRUD + Search : My Book Requests (bookRequests array)
   Unique 1      : Due-Date Reminders (colour-coded countdown)
   Unique 2      : Renew a borrowed book
   Unique 3      : Reading Goal tracker with a progress bar
   Also          : Search the catalogue (renderCatalog in common.js)
   ===================================================================== */

const sections = ["remindersSection", "requestsSection", "renewSection", "goalSection", "catalogSection"];

// The student who is logged in. With the PHP backend this will come
// from the session ($_SESSION) instead of being written here.
const currentStudentId = "U-003";

let editRequestIndex = -1;

// Reading goal data
let readingGoal = 10;
let goalPeriod = "this semester";
let extraBooks = ["The Alchemist"];   // books read outside the library

const requestFields = ["requestTitle", "requestAuthor", "requestType", "requestReason"];


/* =====================================================================
   HELPERS FOR THIS PAGE
   ===================================================================== */

// Returns an array with only this student's loans that are still out
function getMyActiveLoans() {
  let myLoans = [];
  for (const loan of issuedBooks) {
    if (loan.studentId === currentStudentId && loan.returned === false) {
      myLoans.push(loan);
    }
  }
  return myLoans;
}

// Returns an array with this student's returned loans
function getMyReturnedLoans() {
  let myLoans = [];
  for (const loan of issuedBooks) {
    if (loan.studentId === currentStudentId && loan.returned === true) {
      myLoans.push(loan);
    }
  }
  return myLoans;
}


/* =====================================================================
   UNIQUE FEATURE 1: DUE-DATE REMINDERS
   Each borrowed book gets a coloured card:
     red = overdue, orange = due within 3 days, green = plenty of time
   ===================================================================== */
function renderReminders() {
  let today = todayString();
  let myLoans = getMyActiveLoans();
  let list = document.getElementById("reminderList");
  let overdueCount = 0;

  list.innerHTML = "";

  for (const loan of myLoans) {
    let daysLeft = daysBetween(today, loan.dueDate);
    let color;
    let background;
    let text;

    if (daysLeft < 0) {
      let fine = -daysLeft * libraryRules.finePerDay;
      color = "#C62828";
      background = "#FFEBEE";
      text = "Overdue by " + (-daysLeft) + " days. Fine so far: " + fine + " Tk. Please return it now.";
      overdueCount++;
    } else if (daysLeft === 0) {
      color = "#EF6C00";
      background = "#FFF3E0";
      text = "Due TODAY. Return or renew it today to avoid a fine.";
    } else if (daysLeft <= 3) {
      color = "#EF6C00";
      background = "#FFF3E0";
      text = "Due soon: " + daysLeft + " day(s) left.";
    } else {
      color = "#2E7D32";
      background = "#F1F8F1";
      text = daysLeft + " days left.";
    }

    // Build the card with createElement and change its style with the DOM
    let card = document.createElement("div");
    card.className = "reminder";
    card.style.borderLeftColor = color;
    card.style.backgroundColor = background;
    card.innerHTML = "<h4>" + loan.title + "</h4>" +
                     "<p class='hint'>Borrowed " + loan.issueDate + " &middot; Due " + loan.dueDate + "</p>" +
                     "<p><strong>" + text + "</strong></p>";
    list.appendChild(card);
  }

  if (myLoans.length === 0) {
    list.innerHTML = "<p class='empty-row'>You have no borrowed books right now.</p>";
  }

  // Summary sentence above the cards
  let summary = "You have " + myLoans.length + " of " + libraryRules.maxBooks + " books borrowed. ";
  if (overdueCount > 0) {
    summary += overdueCount + " of them overdue!";
  } else {
    summary += "Nothing is overdue.";
  }
  document.getElementById("reminderSummary").innerHTML = summary;

  // Borrowing history table
  let rows = "";
  let history = getMyReturnedLoans();
  for (const loan of history) {
    rows += "<tr><td>" + loan.title + "</td><td>" + loan.issueDate + "</td><td>" + loan.returnDate +
            "</td><td>" + loan.fine + " Tk</td></tr>";
  }
  if (rows === "") {
    rows = "<tr><td colspan='4' class='empty-row'>No returned books yet.</td></tr>";
  }
  document.getElementById("historyBody").innerHTML = rows;
}


/* =====================================================================
   MY BOOK REQUESTS: CREATE, READ, UPDATE, DELETE, SEARCH
   ===================================================================== */

// READ + SEARCH (only this student's requests)
function renderRequests() {
  let keyword = document.getElementById("requestSearch").value;
  let statusFilter = document.getElementById("requestStatusFilter").value;

  let rows = "";
  let shown = 0;
  let mine = 0;

  for (let i = 0; i < bookRequests.length; i++) {
    let request = bookRequests[i];
    let isMine = (request.studentId === currentStudentId);   // only this student's requests
    if (isMine) {
      mine++;
    }

    let matchesKeyword = containsText(request.title, keyword) || containsText(request.author, keyword) ||
                         containsText(request.id, keyword);
    let matchesStatus = (statusFilter === "All" || request.status === statusFilter);

    if (isMine && matchesKeyword && matchesStatus) {
      // A colour for each status, chosen with switch
      let statusColor;
      switch (request.status) {
        case "Approved":
          statusColor = "green";
          break;
        case "Rejected":
          statusColor = "red";
          break;
        default:
          statusColor = "orange";
      }

      let priorityColor = request.priority === "Urgent" ? "red" : "grey";

      let actions = "&mdash;";
      if (request.status === "Pending") {
        actions = "<button type='button' class='btn btn-small' onclick='editRequest(" + i + ")'>Edit</button>" +
                  "<button type='button' class='btn btn-small btn-danger' onclick='deleteRequest(" + i + ")'>Cancel</button>";
      }

      rows += "<tr>" +
                "<td>" + request.id + "</td>" +
                "<td><strong>" + request.title + "</strong><br><span class='hint'>" + request.author + "</span></td>" +
                "<td>" + request.type + "</td>" +
                "<td><span class='badge " + priorityColor + "'>" + request.priority + "</span></td>" +
                "<td>" + request.date + "</td>" +
                "<td><span class='badge " + statusColor + "'>" + request.status + "</span></td>" +
                "<td>" + actions + "</td>" +
              "</tr>";
      shown++;
    }
  }

  if (shown === 0) {
    rows = "<tr><td colspan='7' class='empty-row'>No requests match your search.</td></tr>";
  }

  document.getElementById("requestTableBody").innerHTML = rows;
  document.getElementById("requestCount").innerHTML = "Showing " + shown + " of " + mine + " requests";
}


// CREATE or UPDATE
function saveRequest() {
  let title = document.getElementById("requestTitle").value.trim();
  let author = document.getElementById("requestAuthor").value.trim();
  let type = getRadioValue("requestType");
  let priority = document.getElementById("requestPriority").value;
  let reason = document.getElementById("requestReason").value.trim();

  let isValid = true;
  clearErrors(requestFields);

  if (title.length < 2) {
    showError("requestTitle", "Title must be at least 2 characters.");
    isValid = false;
  } else if (isDuplicateRequest(title)) {
    showError("requestTitle", "You already have a pending request for this book.");
    isValid = false;
  }

  if (author.length < 3) {
    showError("requestAuthor", "Author must be at least 3 characters.");
    isValid = false;
  }

  if (type === "") {
    showError("requestType", "Choose Purchase or Reserve.");
    isValid = false;
  }

  if (reason.length < 10) {
    showError("requestReason", "Please write at least 10 characters.");
    isValid = false;
  } else if (reason.length > 200) {
    showError("requestReason", "Please keep it under 200 characters.");
    isValid = false;
  }

  // At most 3 pending requests at a time
  if (editRequestIndex === -1 && countPending() >= 3) {
    showMessage("requestMessage", "You can have at most 3 pending requests. Cancel one first.", "error");
    isValid = false;
  }

  if (isValid === false) {
    return false;
  }

  if (editRequestIndex === -1) {
    // CREATE
    let newRequest = { id: nextId("R", bookRequests), studentId: currentStudentId, title: title, author: author,
                       type: type, priority: priority, reason: reason, status: "Pending", date: todayString() };
    bookRequests.push(newRequest);
    showMessage("requestMessage", "Request " + newRequest.id + " for <strong>" + title + "</strong> was sent.", "success");
  } else {
    // UPDATE
    let request = bookRequests[editRequestIndex];
    request.title = title;
    request.author = author;
    request.type = type;
    request.priority = priority;
    request.reason = reason;
    showMessage("requestMessage", "Request " + request.id + " was updated.", "success");
  }

  resetRequestForm();
  renderRequests();
  return false;
}


function countPending() {
  let count = 0;
  for (const request of bookRequests) {
    if (request.studentId === currentStudentId && request.status === "Pending") {
      count++;
    }
  }
  return count;
}

// true if another pending request of this student has the same title
function isDuplicateRequest(title) {
  for (let i = 0; i < bookRequests.length; i++) {
    let request = bookRequests[i];
    if (i !== editRequestIndex && request.studentId === currentStudentId && request.status === "Pending" &&
        request.title.toLowerCase() === title.toLowerCase()) {
      return true;
    }
  }
  return false;
}


// UPDATE step 1
function editRequest(index) {
  let request = bookRequests[index];
  editRequestIndex = index;

  document.getElementById("requestTitle").value = request.title;
  document.getElementById("requestAuthor").value = request.author;
  setRadioValue("requestType", request.type);
  document.getElementById("requestPriority").value = request.priority;
  document.getElementById("requestReason").value = request.reason;
  countReasonCharacters();

  document.getElementById("requestFormTitle").innerHTML = "Edit Request " + request.id;
  document.getElementById("requestSaveButton").value = "Update Request";
  hideMessage("requestMessage");
}


// DELETE (cancel a pending request)
function deleteRequest(index) {
  let request = bookRequests[index];
  bookRequests = removeAt(bookRequests, index);
  showMessage("requestMessage", "Request " + request.id + " for <strong>" + request.title + "</strong> was cancelled.", "info");
  resetRequestForm();
  renderRequests();
}


function resetRequestForm() {
  editRequestIndex = -1;
  document.getElementById("requestForm").reset();
  clearErrors(requestFields);
  countReasonCharacters();
  document.getElementById("requestFormTitle").innerHTML = "New Request";
  document.getElementById("requestSaveButton").value = "Send Request";
}


// Live character counter for the reason box (onkeyup event)
function countReasonCharacters() {
  let length = document.getElementById("requestReason").value.length;
  let counter = document.getElementById("reasonCounter");
  counter.innerHTML = length + " / 200";
  counter.style.color = length > 200 ? "#C62828" : "";
}


/* =====================================================================
   UNIQUE FEATURE 2: RENEW A BORROWED BOOK
   A loan can be renewed when it is not overdue and has not used up
   its renewals. Renewing adds libraryRules.renewDays to the due date.
   ===================================================================== */

// Returns "" if the loan can be renewed, otherwise the reason why not
function whyNotRenewable(loan) {
  if (daysBetween(todayString(), loan.dueDate) < 0) {
    return "Overdue: return it first";
  }
  if (loan.renewals >= libraryRules.maxRenewals) {
    return "Already renewed " + loan.renewals + " time(s)";
  }
  return "";
}

function renderRenewals() {
  let select = document.getElementById("renewLoanSelect");
  let rows = "";
  let myLoans = getMyActiveLoans();

  select.innerHTML = "<option value=''>-- Select Book --</option>";

  for (const loan of myLoans) {
    let reason = whyNotRenewable(loan);
    let answer;

    if (reason === "") {
      answer = "<span class='badge green'>Yes</span>";
      // Only renewable loans go into the drop-down list
      let option = document.createElement("option");
      option.value = loan.id;
      option.innerHTML = loan.title + " (due " + loan.dueDate + ")";
      select.appendChild(option);
    } else {
      answer = "<span class='badge red'>No</span> <span class='hint'>" + reason + "</span>";
    }

    rows += "<tr><td>" + loan.title + "</td><td>" + loan.dueDate + "</td><td>" +
            loan.renewals + " / " + libraryRules.maxRenewals + "</td><td>" + answer + "</td></tr>";
  }

  if (rows === "") {
    rows = "<tr><td colspan='4' class='empty-row'>You have no borrowed books.</td></tr>";
  }
  document.getElementById("renewTableBody").innerHTML = rows;

  document.getElementById("renewRules").innerHTML =
    "Each renewal adds " + libraryRules.renewDays + " days. A loan can be renewed " +
    libraryRules.maxRenewals + " time(s), and only before it is overdue.";
}

function previewRenewal() {
  let loanId = document.getElementById("renewLoanSelect").value;
  let box = document.getElementById("renewPreview");

  if (loanId === "") {
    box.innerHTML = "Choose a book to see its new due date.";
    return;
  }

  let loan = issuedBooks[findIndexById(issuedBooks, loanId)];
  box.innerHTML = "<p><strong>" + loan.title + "</strong></p>" +
                  "<p>Current due date: " + loan.dueDate + "</p>" +
                  "<p>New due date: <span class='big'>" + addDays(loan.dueDate, libraryRules.renewDays) + "</span></p>";
}

function renewLoan() {
  let loanId = document.getElementById("renewLoanSelect").value;
  clearError("renewLoanSelect");
  hideMessage("renewMessage");

  if (loanId === "") {
    showError("renewLoanSelect", "Please choose a book to renew.");
    return false;
  }

  let loan = issuedBooks[findIndexById(issuedBooks, loanId)];
  let reason = whyNotRenewable(loan);
  if (reason !== "") {
    showError("renewLoanSelect", reason);
    return false;
  }

  let oldDue = loan.dueDate;
  loan.dueDate = addDays(loan.dueDate, libraryRules.renewDays);
  loan.renewals++;

  showMessage("renewMessage", "<strong>" + loan.title + "</strong> was renewed. Due date moved from " +
              oldDue + " to <strong>" + loan.dueDate + "</strong>.", "success");

  document.getElementById("renewPreview").innerHTML = "Choose a book to see its new due date.";
  renderRenewals();
  renderReminders();      // the reminder cards use the new due date
  return false;
}


/* =====================================================================
   UNIQUE FEATURE 3: READING GOAL TRACKER
   ===================================================================== */
function renderGoal() {
  let returned = getMyReturnedLoans();
  let booksRead = returned.length + extraBooks.length;

  // The list of books read: library books first, then the extra ones
  let listHtml = "";
  for (const loan of returned) {
    listHtml += "<li>" + loan.title + " <span class='badge blue'>Library</span></li>";
  }
  for (let i = 0; i < extraBooks.length; i++) {
    listHtml += "<li>" + extraBooks[i] + " <span class='badge grey'>Other</span></li>";
  }
  if (listHtml === "") {
    listHtml = "<li>No books yet.</li>";
  }
  document.getElementById("readList").innerHTML = listHtml;

  // Percentage, never more than 100
  let percent = Math.round(booksRead / readingGoal * 100);
  if (percent > 100) {
    percent = 100;
  }

  let bar = document.getElementById("goalBar");
  bar.style.width = percent + "%";
  bar.innerHTML = percent + "%";

  // Colour and advice depend on the progress (if / else if / else)
  let advice;
  if (percent >= 100) {
    bar.style.backgroundColor = "#2E7D32";
    advice = "Goal reached! Well done. Set a bigger goal?";
  } else if (percent >= 50) {
    bar.style.backgroundColor = "#1565C0";
    advice = "More than halfway there. Keep going!";
  } else if (percent > 0) {
    bar.style.backgroundColor = "#EF6C00";
    advice = "A good start. Try reading a little every day.";
  } else {
    bar.style.backgroundColor = "#C62828";
    advice = "Pick your first book from the catalogue.";
  }

  document.getElementById("goalText").innerHTML =
    "You have read <strong>" + booksRead + "</strong> of <strong>" + readingGoal + "</strong> books " + goalPeriod + ".";
  document.getElementById("goalAdvice").innerHTML = advice;
}

function setGoal() {
  let goalText = document.getElementById("goalNumber").value;
  let goal = Number(goalText);
  clearError("goalNumber");

  if (goalText === "" || goal < 1 || goal > 100) {
    showError("goalNumber", "Enter a goal from 1 to 100 books.");
    return false;
  }

  readingGoal = goal;
  goalPeriod = document.getElementById("goalPeriod").value;
  renderGoal();
  return false;
}

// Like the Lab 04 to-do list: push() adds to the end ...
function addExtraBook() {
  let input = document.getElementById("extraBook");
  let title = input.value.trim();
  clearError("extraBook");

  if (title === "") {
    showError("extraBook", "Type a book title first.");
    return;
  }

  extraBooks.push(title);
  console.log("Extra books:", extraBooks);
  input.value = "";              // clear the box
  renderGoal();
}

// ... and pop() removes the last one
function removeLastExtraBook() {
  if (extraBooks.length === 0) {
    showError("extraBook", "There is nothing to remove.");
    return;
  }
  let removed = extraBooks.pop();
  console.log("Removed:", removed);
  clearError("extraBook");
  renderGoal();
}


/* =====================================================================
   START
   ===================================================================== */
renderReminders();
renderRequests();
renderRenewals();
renderGoal();
renderCatalog();
showSection("remindersSection");
