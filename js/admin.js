/* =====================================================================
   admin.js  -  Everything the Admin can do (admin.html)
   ---------------------------------------------------------------------
   CRUD + Search : Manage Users (users array)
   Unique 1      : Library Statistics Report
   Unique 2      : Library Rules Settings
   Unique 3      : Activity Log Monitor

   The forms on this page never go to another page: each onsubmit
   handler does its work with JavaScript and returns false.
   ===================================================================== */

// The ids of the sections on this page (used by showSection in common.js)
const sections = ["statsSection", "usersSection", "rulesSection", "logSection"];

// -1 means "adding a new user"; any other number is the index being edited
let editUserIndex = -1;

// A copy of the starting rules, used by "Restore Defaults"
const defaultRules = { finePerDay: 5, loanDays: 14, maxBooks: 3, renewDays: 7, maxRenewals: 1 };


/* =====================================================================
   SHARED: write an entry into the activity log
   ===================================================================== */
function addLog(type, message) {
  activityLog.push({ time: nowString(), user: "admin", type: type, message: message });
}


/* =====================================================================
   UNIQUE FEATURE 1: LIBRARY STATISTICS REPORT
   ===================================================================== */
function generateReport() {
  // ----- Users -----
  let activeCount = 0;
  let pendingCount = 0;
  let roleCounts = { Admin: 0, Librarian: 0, Student: 0, Visitor: 0 };   // an object used as counters

  for (const user of users) {
    if (user.status === "Active") {
      activeCount++;
    } else if (user.status === "Pending") {
      pendingCount++;
    }
    roleCounts[user.role]++;          // bracket notation: roleCounts["Student"]++
  }

  // ----- Books -----
  // Two arrays that go together: categoryNames[i] has categoryTotals[i] copies
  let totalCopies = 0;
  let availableCopies = 0;
  let categoryNames = [];
  let categoryTotals = [];

  for (const book of books) {
    totalCopies += book.copies;
    availableCopies += book.available;

    let position = categoryNames.indexOf(book.category);   // -1 if not in the array yet
    if (position === -1) {
      categoryNames.push(book.category);
      categoryTotals.push(0);
      position = categoryNames.length - 1;
    }
    categoryTotals[position] += book.copies;
  }

  // ----- Loans and fines -----
  let onLoan = 0;
  let overdue = 0;
  let finesCollected = 0;
  let today = todayString();

  for (const loan of issuedBooks) {
    if (loan.returned === false) {
      onLoan++;
      if (daysBetween(loan.dueDate, today) > 0) {
        overdue++;
      }
    } else {
      finesCollected += loan.fine;
    }
  }

  let usagePercent = 0;
  if (totalCopies > 0) {
    usagePercent = Math.round((totalCopies - availableCopies) / totalCopies * 100);
  }

  // ----- Show the numbers with innerHTML -----
  document.getElementById("statUsers").innerHTML = users.length;
  document.getElementById("statActive").innerHTML = activeCount;
  document.getElementById("statPending").innerHTML = pendingCount;
  document.getElementById("statTitles").innerHTML = books.length;
  document.getElementById("statCopies").innerHTML = totalCopies;
  document.getElementById("statOnLoan").innerHTML = onLoan;
  document.getElementById("statOverdue").innerHTML = overdue;
  document.getElementById("statFines").innerHTML = finesCollected;
  document.getElementById("statUsage").innerHTML = usagePercent + "%";
  document.getElementById("reportTime").innerHTML = "Generated at " + nowString();

  // Overdue loans are shown in red when there are any (element.style)
  if (overdue > 0) {
    document.getElementById("statOverdue").style.color = "#C62828";
  } else {
    document.getElementById("statOverdue").style.color = "";
  }

  // ----- Bar charts -----
  let roleNames = ["Admin", "Librarian", "Student", "Visitor"];
  let roleTotals = [roleCounts.Admin, roleCounts.Librarian, roleCounts.Student, roleCounts.Visitor];
  drawBarChart("roleChart", roleNames, roleTotals, users.length);
  drawBarChart("categoryChart", categoryNames, categoryTotals, totalCopies);
}


// Draws simple horizontal bars. names[i] is the label of the bar with value counts[i].
// Each bar's width is set as a percentage with an inline style.
function drawBarChart(chartId, names, counts, total) {
  let html = "";

  for (let i = 0; i < names.length; i++) {
    let percent = 0;
    if (total > 0) {
      percent = Math.round(counts[i] / total * 100);
    }
    html += "<div class='bar-row'>" +
              "<div class='bar-label'>" + names[i] + "</div>" +
              "<div class='bar-track'><div class='bar-fill' style='width:" + percent + "%'></div></div>" +
              "<div class='bar-value'>" + counts[i] + "</div>" +
            "</div>";
  }

  document.getElementById(chartId).innerHTML = html;
}


/* =====================================================================
   MANAGE USERS: CREATE, READ, UPDATE, DELETE, SEARCH
   ===================================================================== */

// READ + SEARCH: draw the table rows with a loop and innerHTML (Lab 04, Task 2)
function renderUsers() {
  let keyword = document.getElementById("userSearch").value;
  let roleFilter = document.getElementById("userRoleFilter").value;
  let statusFilter = document.getElementById("userStatusFilter").value;

  let rows = "";
  let shown = 0;

  for (let i = 0; i < users.length; i++) {
    let user = users[i];

    // SEARCH: skip users that do not match the keyword or the filters
    let matchesKeyword = containsText(user.name, keyword) || containsText(user.username, keyword) ||
                         containsText(user.email, keyword) || containsText(user.id, keyword);
    let matchesRole = (roleFilter === "All" || user.role === roleFilter);
    let matchesStatus = (statusFilter === "All" || user.status === statusFilter);

    if (matchesKeyword && matchesRole && matchesStatus) {
      // A colour for each status, and an Approve button for pending accounts
      let statusColor;
      let approveButton = "";
      switch (user.status) {
        case "Active":
          statusColor = "green";
          break;
        case "Pending":
          statusColor = "orange";
          approveButton = "<button type='button' class='btn btn-small btn-success' onclick='approveUser(" + i + ")'>Approve</button>";
          break;
        default:
          statusColor = "red";
      }

      rows += "<tr>" +
                "<td>" + user.id + "</td>" +
                "<td><strong>" + user.name + "</strong><br><span class='hint'>" + user.email + "</span></td>" +
                "<td>" + user.username + "</td>" +
                "<td><span class='badge " + user.role.toLowerCase() + "'>" + user.role + "</span></td>" +
                "<td><span class='badge " + statusColor + "'>" + user.status + "</span></td>" +
                "<td>" +
                  approveButton +
                  "<button type='button' class='btn btn-small' onclick='editUser(" + i + ")'>Edit</button>" +
                  "<button type='button' class='btn btn-small btn-danger' onclick='deleteUser(" + i + ")'>Delete</button>" +
                "</td>" +
              "</tr>";
      shown++;
    }
  }

  if (shown === 0) {
    rows = "<tr><td colspan='6' class='empty-row'>No users match your search.</td></tr>";
  }

  document.getElementById("userTableBody").innerHTML = rows;
  document.getElementById("userCount").innerHTML = "Showing " + shown + " of " + users.length + " users";
}


// CREATE or UPDATE: runs when the user form is submitted
function saveUser() {
  let name = document.getElementById("userName").value.trim();
  let username = document.getElementById("userUsername").value.trim();
  let email = document.getElementById("userEmail").value.trim();
  let password = document.getElementById("userPassword").value;
  let role = document.getElementById("userRole").value;
  let status = getRadioValue("userStatus");

  // ----- Validation -----
  let isValid = true;
  clearErrors(["userName", "userUsername", "userEmail", "userPassword", "userRole"]);

  if (name.length < 3) {
    showError("userName", "Name must be at least 3 characters.");
    isValid = false;
  }

  if (username.length < 4) {
    showError("userUsername", "Username must be at least 4 characters.");
    isValid = false;
  } else if (usernameUsedByOther(username)) {
    showError("userUsername", "Another user already has this username.");
    isValid = false;
  }

  if (isValidEmail(email) === false) {
    showError("userEmail", "Please enter a valid email address.");
    isValid = false;
  }

  if (password.length < 8) {
    showError("userPassword", "Password must be at least 8 characters.");
    isValid = false;
  }

  if (role === "") {
    showError("userRole", "Please choose a role.");
    isValid = false;
  }

  if (isValid === false) {
    return false;
  }

  // ----- Save -----
  if (editUserIndex === -1) {
    // CREATE: build a new object and push() it to the end of the array
    let newUser = { id: nextId("U", users), name: name, username: username, email: email,
                    password: password, role: role, status: status };
    users.push(newUser);
    addLog("User", "Created " + role.toLowerCase() + " account for " + name);
    showMessage("userMessage", "User <strong>" + name + "</strong> was added with id " + newUser.id + ".", "success");
  } else {
    // UPDATE: change the properties of the object that is being edited
    let user = users[editUserIndex];
    if (user.status !== status) {
      addLog("Security", status + " account of " + name);
    }
    user.name = name;
    user.username = username;
    user.email = email;
    user.password = password;
    user.role = role;
    user.status = status;
    addLog("User", "Updated account " + user.id + " (" + name + ")");
    showMessage("userMessage", "User <strong>" + name + "</strong> was updated.", "success");
  }

  resetUserForm();
  renderUsers();
  return false;   // never leave the page
}


// true if the username belongs to a DIFFERENT user than the one being edited
function usernameUsedByOther(username) {
  for (let i = 0; i < users.length; i++) {
    if (i !== editUserIndex && users[i].username.toLowerCase() === username.toLowerCase()) {
      return true;
    }
  }
  return false;
}


// UPDATE step 1: copy the user's values into the form
function editUser(index) {
  let user = users[index];
  editUserIndex = index;

  document.getElementById("userName").value = user.name;
  document.getElementById("userUsername").value = user.username;
  document.getElementById("userEmail").value = user.email;
  document.getElementById("userPassword").value = user.password;
  document.getElementById("userRole").value = user.role;
  setRadioValue("userStatus", user.status);

  document.getElementById("userFormTitle").innerHTML = "Edit User " + user.id;
  document.getElementById("userSaveButton").value = "Update User";
  hideMessage("userMessage");
}


// DELETE: remove the user from the array
function deleteUser(index) {
  let user = users[index];

  // The admin who is logged in cannot delete their own account
  if (user.id === "U-001") {
    showMessage("userMessage", "You cannot delete your own admin account.", "error");
    return;
  }

  users = removeAt(users, index);
  addLog("User", "Deleted account " + user.id + " (" + user.name + ")");
  showMessage("userMessage", "User <strong>" + user.name + "</strong> was deleted.", "info");

  resetUserForm();
  renderUsers();
}


// Approve a pending registration (e.g. a new librarian): status becomes Active
function approveUser(index) {
  let user = users[index];
  user.status = "Active";
  addLog("Security", "Approved " + user.role.toLowerCase() + " account of " + user.name);
  showMessage("userMessage", "<strong>" + user.name + "</strong> was approved and can now log in.", "success");
  renderUsers();
}


// Clears the form and goes back to "Add" mode
function resetUserForm() {
  editUserIndex = -1;
  document.getElementById("userForm").reset();
  clearErrors(["userName", "userUsername", "userEmail", "userPassword", "userRole"]);
  document.getElementById("userFormTitle").innerHTML = "Add New User";
  document.getElementById("userSaveButton").value = "Add User";
}


/* =====================================================================
   UNIQUE FEATURE 2: LIBRARY RULES SETTINGS
   ===================================================================== */

// Fills the form and the "Rules in use now" table from the libraryRules object
function loadRules() {
  document.getElementById("ruleFine").value = libraryRules.finePerDay;
  document.getElementById("ruleLoanDays").value = libraryRules.loanDays;
  document.getElementById("ruleMaxBooks").value = libraryRules.maxBooks;
  document.getElementById("ruleRenewDays").value = libraryRules.renewDays;
  document.getElementById("ruleMaxRenewals").value = libraryRules.maxRenewals;

  document.getElementById("currentRulesBody").innerHTML =
    "<tr><td>Fine per late day</td><td><strong>" + libraryRules.finePerDay + " Tk</strong></td></tr>" +
    "<tr><td>Loan period</td><td><strong>" + libraryRules.loanDays + " days</strong></td></tr>" +
    "<tr><td>Max books per student</td><td><strong>" + libraryRules.maxBooks + "</strong></td></tr>" +
    "<tr><td>Days added on renewal</td><td><strong>" + libraryRules.renewDays + " days</strong></td></tr>" +
    "<tr><td>Renewals per loan</td><td><strong>" + libraryRules.maxRenewals + "</strong></td></tr>";

  previewRules();
}


// Live preview while the admin types (onkeyup / onchange events)
function previewRules() {
  let fine = Number(document.getElementById("ruleFine").value);
  let loanDays = Number(document.getElementById("ruleLoanDays").value);
  let today = todayString();

  document.getElementById("rulesPreview").innerHTML =
    "a book borrowed today is due on <strong>" + addDays(today, loanDays) + "</strong>, and returning it " +
    "3 days late costs <strong>" + (fine * 3) + " Tk</strong>.";
}


// Checks one number field is between min and max; shows an error if not
function checkRange(fieldId, min, max) {
  let text = document.getElementById(fieldId).value;
  let number = Number(text);

  if (text === "" || number < min || number > max) {
    showError(fieldId, "Enter a number from " + min + " to " + max + ".");
    return false;
  }
  return true;
}


function saveRules() {
  clearErrors(["ruleFine", "ruleLoanDays", "ruleMaxBooks", "ruleRenewDays", "ruleMaxRenewals"]);

  // Run every check (so every error is shown), then combine the results
  let ok1 = checkRange("ruleFine", 0, 100);
  let ok2 = checkRange("ruleLoanDays", 1, 60);
  let ok3 = checkRange("ruleMaxBooks", 1, 10);
  let ok4 = checkRange("ruleRenewDays", 1, 30);
  let ok5 = checkRange("ruleMaxRenewals", 0, 5);

  if (!(ok1 && ok2 && ok3 && ok4 && ok5)) {
    showMessage("rulesMessage", "Some values are out of range.", "error");
    return false;
  }

  let oldFine = libraryRules.finePerDay;

  libraryRules.finePerDay = Number(document.getElementById("ruleFine").value);
  libraryRules.loanDays = Number(document.getElementById("ruleLoanDays").value);
  libraryRules.maxBooks = Number(document.getElementById("ruleMaxBooks").value);
  libraryRules.renewDays = Number(document.getElementById("ruleRenewDays").value);
  libraryRules.maxRenewals = Number(document.getElementById("ruleMaxRenewals").value);

  if (oldFine !== libraryRules.finePerDay) {
    addLog("Settings", "Changed fine per day from " + oldFine + " to " + libraryRules.finePerDay + " Taka");
  }
  addLog("Settings", "Saved library rules");

  showMessage("rulesMessage", "Library rules saved.", "success");
  loadRules();
  return false;
}


function restoreDefaultRules() {
  libraryRules.finePerDay = defaultRules.finePerDay;
  libraryRules.loanDays = defaultRules.loanDays;
  libraryRules.maxBooks = defaultRules.maxBooks;
  libraryRules.renewDays = defaultRules.renewDays;
  libraryRules.maxRenewals = defaultRules.maxRenewals;

  clearErrors(["ruleFine", "ruleLoanDays", "ruleMaxBooks", "ruleRenewDays", "ruleMaxRenewals"]);
  addLog("Settings", "Restored default library rules");
  showMessage("rulesMessage", "Default rules restored.", "info");
  loadRules();
}


/* =====================================================================
   UNIQUE FEATURE 3: ACTIVITY LOG MONITOR
   ===================================================================== */

// Picks a colour for each type of activity with a switch statement
function getLogColor(type) {
  let color;
  switch (type) {
    case "User":
      color = "#1565C0";
      break;
    case "Book":
      color = "#2E7D32";
      break;
    case "Loan":
      color = "#EF6C00";
      break;
    case "Security":
      color = "#C62828";
      break;
    case "Settings":
      color = "#663399";
      break;
    default:
      color = "#6C757D";
  }
  return color;
}


function renderLog() {
  let typeFilter = document.getElementById("logTypeFilter").value;
  let userFilter = document.getElementById("logUserFilter").value;
  let board = document.getElementById("logBoard");

  board.innerHTML = "";   // empty the board, then add one <div> per entry
  let shown = 0;

  // Loop backwards so the newest entry is at the top
  for (let i = activityLog.length - 1; i >= 0; i--) {
    let entry = activityLog[i];

    if ((typeFilter === "All" || entry.type === typeFilter) &&
        (userFilter === "All" || entry.user === userFilter)) {

      // createElement + appendChild (Lecture 05: Basic DOM operations)
      let item = document.createElement("div");
      item.className = "log-item";
      item.style.borderLeftColor = getLogColor(entry.type);
      item.innerHTML = "<span class='log-time'>" + entry.time + " &middot; " + entry.user + "</span><br>" +
                       "<span class='badge' style='background-color:" + getLogColor(entry.type) + "'>" +
                       entry.type + "</span> " + entry.message;
      board.appendChild(item);
      shown++;
    }
  }

  if (shown === 0) {
    board.innerHTML = "<p class='empty-row'>No activity to show.</p>";
  }
  document.getElementById("logCount").innerHTML = shown + " entries";
}


function clearLog() {
  activityLog = [];
  addLog("Security", "Activity log was cleared");
  renderLog();
}


/* =====================================================================
   START: runs once when the page has loaded (scripts are at the end of <body>)
   ===================================================================== */
generateReport();
renderUsers();
loadRules();
renderLog();
showSection("statsSection");

// Each time the admin opens Statistics or Activity Log, show fresh data
document.getElementById("nav-statsSection").addEventListener("click", generateReport);
document.getElementById("nav-logSection").addEventListener("click", renderLog);
