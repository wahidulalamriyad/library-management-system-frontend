/* =====================================================================
   visitor.js  -  Everything a Visitor can do (visitor.html)
   ---------------------------------------------------------------------
   CRUD + Search : Reading-room Visit Passes (visitPasses array)
   Unique 1      : Membership Fee Calculator
   Unique 2      : Opening Hours Checker
   Unique 3      : Section Finder with a building map
   Also          : Browse the catalogue (renderCatalog in common.js)
   ===================================================================== */

const sections = ["passesSection", "catalogSection", "feeSection", "hoursSection", "finderSection"];

// The visitor who is logged in. With the PHP backend this will come
// from the session ($_SESSION) instead of being written here.
const currentVisitorId = "U-008";

let editPassIndex = -1;
const SLOT_CAPACITY = 10;          // people allowed in one time slot

const passFields = ["passName", "passEmail", "passPhone", "passDate", "passSlot", "passPurpose", "passGuests"];

// The weekly timetable: an array of objects, one per day (index 0 = Sunday,
// the same numbering as Date's getDay()). Times are "HH:MM", 24-hour clock.
const openingHours = [
  { day: "Sunday",    open: "08:00", close: "20:00" },
  { day: "Monday",    open: "08:00", close: "20:00" },
  { day: "Tuesday",   open: "08:00", close: "20:00" },
  { day: "Wednesday", open: "08:00", close: "20:00" },
  { day: "Thursday",  open: "08:00", close: "18:00" },
  { day: "Friday",    open: "15:00", close: "20:00" },
  { day: "Saturday",  open: "09:00", close: "20:00" }
];


/* =====================================================================
   VISIT PASSES: CREATE, READ, UPDATE, DELETE, SEARCH
   ===================================================================== */

// READ + SEARCH
function renderPasses() {
  let keyword = document.getElementById("passSearch").value;
  let dateFilter = document.getElementById("passDateFilter").value;

  let rows = "";
  let shown = 0;
  let mine = 0;

  for (let i = 0; i < visitPasses.length; i++) {
    let pass = visitPasses[i];
    if (pass.visitorId === currentVisitorId) {
      mine++;
    }

    let matchesKeyword = containsText(pass.name, keyword) || containsText(pass.email, keyword) ||
                         containsText(pass.phone, keyword) || containsText(pass.id, keyword);
    let matchesDate = (dateFilter === "" || pass.date === dateFilter);
    let isMine = (pass.visitorId === currentVisitorId);   // a visitor sees only their own passes

    if (isMine && matchesKeyword && matchesDate) {
      rows += "<tr>" +
                "<td>" + pass.id + "</td>" +
                "<td><strong>" + pass.name + "</strong><br><span class='hint'>" + pass.email + "</span></td>" +
                "<td>" + pass.phone + "</td>" +
                "<td>" + pass.date + "<br><span class='hint'>" + pass.slot + "</span></td>" +
                "<td>" + pass.purpose + "</td>" +
                "<td>" + (1 + pass.guests) + "</td>" +
                "<td>" +
                  "<button type='button' class='btn btn-small' onclick='editPass(" + i + ")'>Edit</button>" +
                  "<button type='button' class='btn btn-small btn-danger' onclick='deletePass(" + i + ")'>Cancel</button>" +
                "</td>" +
              "</tr>";
      shown++;
    }
  }

  if (shown === 0) {
    rows = "<tr><td colspan='7' class='empty-row'>No passes match your search.</td></tr>";
  }

  document.getElementById("passTableBody").innerHTML = rows;
  document.getElementById("passCount").innerHTML = "Showing " + shown + " of your " + mine + " passes";
}

function clearPassFilters() {
  document.getElementById("passSearch").value = "";
  document.getElementById("passDateFilter").value = "";
  renderPasses();
}

// How many people are already booked for a date and slot (not counting the pass being edited)
function peopleInSlot(date, slot) {
  let total = 0;
  for (let i = 0; i < visitPasses.length; i++) {
    if (i !== editPassIndex && visitPasses[i].date === date && visitPasses[i].slot === slot) {
      total += 1 + visitPasses[i].guests;
    }
  }
  return total;
}

// CREATE or UPDATE
function savePass() {
  let name = document.getElementById("passName").value.trim();
  let email = document.getElementById("passEmail").value.trim();
  let phone = document.getElementById("passPhone").value.trim();
  let date = document.getElementById("passDate").value;
  let slot = document.getElementById("passSlot").value;
  let purpose = getRadioValue("passPurpose");
  let guestsText = document.getElementById("passGuests").value;
  let guests = Number(guestsText);

  let isValid = true;
  clearErrors(passFields);

  if (name.length < 3) {
    showError("passName", "Name must be at least 3 characters.");
    isValid = false;
  }

  if (isValidEmail(email) === false) {
    showError("passEmail", "Please enter a valid email address.");
    isValid = false;
  }

  if (isDigitsOnly(phone) === false || phone.length !== 11 || phone.slice(0, 2) !== "01") {
    showError("passPhone", "Phone must be 11 digits and start with 01.");
    isValid = false;
  }

  if (date === "") {
    showError("passDate", "Please choose a date.");
    isValid = false;
  } else {
    let daysAhead = daysBetween(todayString(), date);
    let weekDay = new Date(date + "T00:00").getDay();   // 0 = Sunday ... 5 = Friday

    if (daysAhead < 0) {
      showError("passDate", "The date cannot be in the past.");
      isValid = false;
    } else if (daysAhead > 30) {
      showError("passDate", "You can book at most 30 days ahead.");
      isValid = false;
    } else if (weekDay === 5) {
      showError("passDate", "Visit passes are not available on Fridays.");
      isValid = false;
    }
  }

  if (slot === "") {
    showError("passSlot", "Please choose a time slot.");
    isValid = false;
  }

  if (purpose === "") {
    showError("passPurpose", "Please choose the purpose of your visit.");
    isValid = false;
  }

  if (guestsText === "" || guests < 0 || guests > 4) {
    showError("passGuests", "Extra guests must be from 0 to 4.");
    isValid = false;
  }

  // Room capacity: only checked when the date and slot are valid
  if (isValid) {
    let alreadyBooked = peopleInSlot(date, slot);
    if (alreadyBooked + 1 + guests > SLOT_CAPACITY) {
      showError("passSlot", "Only " + (SLOT_CAPACITY - alreadyBooked) + " place(s) left in this slot.");
      isValid = false;
    }
  }

  if (isValid === false) {
    return false;
  }

  if (editPassIndex === -1) {
    // CREATE
    let newPass = { id: nextId("P", visitPasses), visitorId: currentVisitorId, name: name, email: email, phone: phone,
                    date: date, slot: slot, purpose: purpose, guests: guests };
    visitPasses.push(newPass);
    showMessage("passMessage", "Pass <strong>" + newPass.id + "</strong> booked for " + date + ", " + slot +
                ". Show this pass id at the front desk.", "success");
  } else {
    // UPDATE
    let pass = visitPasses[editPassIndex];
    pass.name = name;
    pass.email = email;
    pass.phone = phone;
    pass.date = date;
    pass.slot = slot;
    pass.purpose = purpose;
    pass.guests = guests;
    showMessage("passMessage", "Pass <strong>" + pass.id + "</strong> was updated.", "success");
  }

  resetPassForm();
  renderPasses();
  return false;
}

// UPDATE step 1
function editPass(index) {
  let pass = visitPasses[index];
  editPassIndex = index;

  document.getElementById("passName").value = pass.name;
  document.getElementById("passEmail").value = pass.email;
  document.getElementById("passPhone").value = pass.phone;
  document.getElementById("passDate").value = pass.date;
  document.getElementById("passSlot").value = pass.slot;
  setRadioValue("passPurpose", pass.purpose);
  document.getElementById("passGuests").value = pass.guests;

  document.getElementById("passFormTitle").innerHTML = "Edit Pass " + pass.id;
  document.getElementById("passSaveButton").value = "Update Pass";
  hideMessage("passMessage");
}

// DELETE
function deletePass(index) {
  let pass = visitPasses[index];
  visitPasses = removeAt(visitPasses, index);
  showMessage("passMessage", "Pass <strong>" + pass.id + "</strong> for " + pass.name + " was cancelled.", "info");
  resetPassForm();
  renderPasses();
}

function resetPassForm() {
  editPassIndex = -1;
  document.getElementById("passForm").reset();
  clearErrors(passFields);
  document.getElementById("passFormTitle").innerHTML = "Book a Visit Pass";
  document.getElementById("passSaveButton").value = "Book Pass";
  fillFromAccount();
}

// Puts the logged-in visitor's name, email and phone into the pass form
function fillFromAccount() {
  let visitor = users[findIndexById(users, currentVisitorId)];
  document.getElementById("passName").value = visitor.name;
  document.getElementById("passEmail").value = visitor.email;
  document.getElementById("passPhone").value = visitor.phone;
}


/* =====================================================================
   UNIQUE FEATURE 1: MEMBERSHIP FEE CALCULATOR
   ===================================================================== */
function calculateFee() {
  let plan = getRadioValue("plan");
  let months = Number(document.getElementById("feeMonths").value);
  let concession = document.getElementById("feeConcession").checked;

  // Price and benefits of each plan, chosen with switch
  let monthlyPrice;
  let booksAllowed;
  switch (plan) {
    case "Basic":
      monthlyPrice = 200;
      booksAllowed = 2;
      break;
    case "Standard":
      monthlyPrice = 350;
      booksAllowed = 4;
      break;
    case "Premium":
      monthlyPrice = 500;
      booksAllowed = 6;
      break;
  }

  // Discount for a longer membership
  let lengthDiscount = 0;
  if (months === 12) {
    lengthDiscount = 15;
  } else if (months === 6) {
    lengthDiscount = 10;
  }

  let extraDiscount = concession ? 10 : 0;
  let totalDiscount = lengthDiscount + extraDiscount;

  let subtotal = monthlyPrice * months;
  let discountAmount = Math.round(subtotal * totalDiscount / 100);
  let total = subtotal - discountAmount;
  const DEPOSIT = 500;              // refundable card deposit

  document.getElementById("feeResult").innerHTML =
    "<p><strong>" + plan + " plan</strong> &middot; borrow up to " + booksAllowed + " books at a time</p>" +
    "<p>" + monthlyPrice + " Tk x " + months + " month(s) = " + subtotal + " Tk</p>" +
    "<p>Discount: " + totalDiscount + "% = -" + discountAmount + " Tk</p>" +
    "<p>Membership fee: <span class='big'>" + total + " Tk</span></p>" +
    "<p class='hint'>Plus a refundable card deposit of " + DEPOSIT + " Tk. First payment: " +
    (total + DEPOSIT) + " Tk. That is about " + Math.round(total / months) + " Tk per month.</p>";

  return false;   // the form never leaves the page
}


/* =====================================================================
   UNIQUE FEATURE 2: OPENING HOURS CHECKER
   ===================================================================== */

// "14:30" -> 870 minutes after midnight, so two times can be compared
function toMinutes(timeText) {
  return Number(timeText.slice(0, 2)) * 60 + Number(timeText.slice(3, 5));
}

// Draws the weekly timetable and highlights today's row
function renderHours() {
  let today = new Date().getDay();
  let tbody = document.getElementById("hoursTableBody");
  tbody.innerHTML = "";

  for (let i = 0; i < openingHours.length; i++) {
    let row = document.createElement("tr");
    row.innerHTML = "<td>" + openingHours[i].day + "</td><td>" + openingHours[i].open +
                    "</td><td>" + openingHours[i].close + "</td>";
    if (i === today) {
      row.style.backgroundColor = "#E8DEF8";
      row.style.fontWeight = "bold";
    }
    tbody.appendChild(row);
  }
}

function checkOpen() {
  let dayIndex = Number(document.getElementById("checkDay").value);
  let time = document.getElementById("checkTime").value;
  let box = document.getElementById("openResult");
  clearError("checkTime");

  if (time === "") {
    showError("checkTime", "Please choose a time.");
    return false;
  }

  let hours = openingHours[dayIndex];
  let now = toMinutes(time);
  let opens = toMinutes(hours.open);
  let closes = toMinutes(hours.close);

  if (now < opens) {
    let wait = opens - now;
    box.innerHTML = "<p><span class='badge red'>Closed</span></p>" +
                    "<p>On " + hours.day + " the library opens at <strong>" + hours.open + "</strong>, in " +
                    Math.floor(wait / 60) + " h " + (wait % 60) + " min.</p>";
  } else if (now >= closes) {
    box.innerHTML = "<p><span class='badge red'>Closed</span></p>" +
                    "<p>On " + hours.day + " the library closed at <strong>" + hours.close + "</strong>. " +
                    "Next day: " + openingHours[(dayIndex + 1) % 7].day + " from " + openingHours[(dayIndex + 1) % 7].open + ".</p>";
  } else {
    let left = closes - now;
    let badge = left <= 60 ? "<span class='badge orange'>Closing soon</span>" : "<span class='badge green'>Open</span>";
    box.innerHTML = "<p>" + badge + "</p>" +
                    "<p>Open until <strong>" + hours.close + "</strong>: " +
                    Math.floor(left / 60) + " h " + (left % 60) + " min left.</p>";
  }

  return false;
}

// Fills the form with the current day and time, then checks
function checkRightNow() {
  let now = new Date();
  let hours = now.getHours();
  let minutes = now.getMinutes();
  if (hours < 10) { hours = "0" + hours; }
  if (minutes < 10) { minutes = "0" + minutes; }

  document.getElementById("checkDay").value = now.getDay();
  document.getElementById("checkTime").value = hours + ":" + minutes;
  checkOpen();
}


/* =====================================================================
   UNIQUE FEATURE 3: SECTION FINDER
   ===================================================================== */
function findSection() {
  let subject = document.getElementById("finderSubject").value;
  let box = document.getElementById("finderResult");

  // Reset every floor on the map first
  for (let i = 0; i <= 3; i++) {
    let floor = document.getElementById("floor" + i);
    floor.style.backgroundColor = "";
    floor.style.borderColor = "";
    floor.style.transform = "";
  }

  if (subject === "") {
    box.innerHTML = "Choose a subject to see where it is.";
    return;
  }

  let floorNumber;
  let place;
  let tip;

  switch (subject) {
    case "Computer Science":
      floorNumber = 1; place = "Zone A, shelves A-1 to A-9";
      tip = "Programming books are near the windows.";
      break;
    case "Mathematics":
      floorNumber = 1; place = "Zone B, shelves B-1 to B-6";
      tip = "Solution manuals are kept at the front desk.";
      break;
    case "Business":
      floorNumber = 2; place = "Zone C, shelves C-1 to C-5";
      tip = "Annual reports are in the last row.";
      break;
    case "Science":
      floorNumber = 2; place = "Zone D, shelves D-1 to D-8";
      tip = "Encyclopaedias are for reading in the library only.";
      break;
    case "History":
      floorNumber = 3; place = "Zone E, shelves E-1 to E-6";
      tip = "Old maps are in the glass cabinet.";
      break;
    case "Literature":
      floorNumber = 3; place = "Zone F, shelves F-1 to F-10";
      tip = "Bangla literature is on shelves F-1 to F-4.";
      break;
    case "Newspapers":
      floorNumber = 0; place = "Next to the main entrance";
      tip = "Today's papers arrive by 9 AM.";
      break;
    default:
      floorNumber = 0; place = "Reading room, behind the front desk";
      tip = "Silence please. Book a visit pass first.";
  }

  let floorNames = ["Ground floor", "1st floor", "2nd floor", "3rd floor"];

  // Count the books we have in that category (only for book subjects)
  let titles = [];
  for (const book of books) {
    if (book.category === subject) {
      titles.push(book.title);
    }
  }

  let html = "<p>Go to the <span class='big'>" + floorNames[floorNumber] + "</span></p>" +
             "<p>" + place + "</p>" +
             "<p class='hint'>Tip: " + tip + "</p>";
  if (titles.length > 0) {
    html += "<p><strong>" + titles.length + " title(s) here:</strong> " + titles.join(", ") + "</p>";
  }
  box.innerHTML = html;

  // Highlight the floor on the map
  let selectedFloor = document.getElementById("floor" + floorNumber);
  selectedFloor.style.backgroundColor = "#E8DEF8";
  selectedFloor.style.borderColor = "#663399";
  selectedFloor.style.transform = "scale(1.03)";
}


/* =====================================================================
   START
   ===================================================================== */
fillFromAccount();
renderPasses();
renderCatalog();
calculateFee();
renderHours();
checkRightNow();
showSection("passesSection");
