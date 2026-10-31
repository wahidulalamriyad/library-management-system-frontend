/* =====================================================================
   data.js  -  Sample data for the whole system
   ---------------------------------------------------------------------
   Every list is an ARRAY OF OBJECTS (Lecture 05: "Arrays of objects").
   Each object groups related values as  name: value  pairs.

   IMPORTANT (frontend only):
   This data lives in the browser's memory. When you reload a page or
   move to another page, it starts again from these values.
   When the backend (PHP + MySQL) is built later, these arrays will be
   replaced by data that comes from the database.
   ===================================================================== */


// ---------- Users of the system (used by Login, Register and Admin) ----------
// Every user has the same basic properties. Each type of user also has a few
// extra properties that only that type needs (they come from the registration form).
//   status: "Active"  = can log in
//           "Pending" = registered, waiting for an admin to approve (librarians)
//           "Blocked" = stopped by an admin
let users = [
  { id: "U-001", name: "Rifat Hasan",   username: "admin",     password: "admin1234",  email: "admin@booknest.edu", phone: "01711000001", role: "Admin",     status: "Active" },

  { id: "U-002", name: "Sadia Akter",   username: "librarian", password: "library123", email: "sadia@booknest.edu", phone: "01711000002", role: "Librarian", status: "Active",
    employeeId: "EMP-1001", qualification: "MLIS", experience: 6, shift: "Morning" },
  { id: "U-007", name: "Mitu Sarker",   username: "mitu",      password: "mitu12345",  email: "mitu@booknest.edu",  phone: "01711000007", role: "Librarian", status: "Active",
    employeeId: "EMP-1002", qualification: "BLIS", experience: 2, shift: "Evening" },
  { id: "U-010", name: "Jamal Uddin",   username: "jamal",     password: "jamal1234",  email: "jamal@mail.com",     phone: "01711000010", role: "Librarian", status: "Pending",
    employeeId: "EMP-1003", qualification: "BLIS", experience: 1, shift: "Morning" },

  { id: "U-003", name: "Rahim Uddin",   username: "student",   password: "student123", email: "rahim@student.edu",  phone: "01711000003", role: "Student",   status: "Active",
    studentId: "23-51234-1", department: "CSE", semester: "5th" },
  { id: "U-004", name: "Karim Hasan",   username: "karim",     password: "karim1234",  email: "karim@student.edu",  phone: "01711000004", role: "Student",   status: "Active",
    studentId: "22-48765-2", department: "EEE", semester: "7th" },
  { id: "U-005", name: "Nadia Rahman",  username: "nadia",     password: "nadia1234",  email: "nadia@student.edu",  phone: "01711000005", role: "Student",   status: "Active",
    studentId: "24-55120-3", department: "BBA", semester: "2nd" },
  { id: "U-006", name: "Tanvir Ahmed",  username: "tanvir",    password: "tanvir123",  email: "tanvir@student.edu", phone: "01711000006", role: "Student",   status: "Blocked",
    studentId: "21-44001-1", department: "CSE", semester: "8th" },

  { id: "U-008", name: "Farhana Kabir", username: "visitor",   password: "visitor123", email: "farhana@mail.com",   phone: "01712345678", role: "Visitor",   status: "Active",
    nid: "1990123456789", occupation: "Teacher", organization: "Green Valley School" },
  { id: "U-009", name: "Imran Hossain", username: "imran",     password: "imran1234",  email: "imran@mail.com",     phone: "01898765432", role: "Visitor",   status: "Active",
    nid: "1234567890", occupation: "Researcher", organization: "Self-employed" }
];


// ---------- Books in the library (used by Librarian, Student, Visitor) ----------
// available = copies that are on the shelf right now
let books = [
  { id: "B-101", title: "Introduction to Algorithms",      author: "Thomas H. Cormen",     category: "Computer Science", isbn: "9780262046305", year: 2022, copies: 5, available: 3, shelf: "A-1" },
  { id: "B-102", title: "Clean Code",                      author: "Robert C. Martin",     category: "Computer Science", isbn: "9780132350884", year: 2008, copies: 4, available: 3, shelf: "A-2" },
  { id: "B-103", title: "Database System Concepts",        author: "Abraham Silberschatz", category: "Computer Science", isbn: "9780078022159", year: 2019, copies: 3, available: 3, shelf: "A-3" },
  { id: "B-104", title: "Calculus: Early Transcendentals", author: "James Stewart",        category: "Mathematics",      isbn: "9781285741550", year: 2015, copies: 6, available: 6, shelf: "B-1" },
  { id: "B-105", title: "Discrete Mathematics",            author: "Kenneth H. Rosen",     category: "Mathematics",      isbn: "9781259676512", year: 2018, copies: 4, available: 4, shelf: "B-2" },
  { id: "B-106", title: "Principles of Economics",         author: "N. Gregory Mankiw",    category: "Business",         isbn: "9781305585126", year: 2017, copies: 3, available: 3, shelf: "C-1" },
  { id: "B-107", title: "A Brief History of Time",         author: "Stephen Hawking",      category: "Science",          isbn: "9780553380163", year: 1998, copies: 2, available: 2, shelf: "D-1" },
  { id: "B-108", title: "The Pragmatic Programmer",        author: "David Thomas",         category: "Computer Science", isbn: "9780135957059", year: 2019, copies: 4, available: 3, shelf: "A-4" },
  { id: "B-109", title: "Sapiens",                         author: "Yuval Noah Harari",    category: "History",          isbn: "9780062316097", year: 2015, copies: 3, available: 3, shelf: "E-1" },
  { id: "B-110", title: "Gitanjali",                       author: "Rabindranath Tagore",  category: "Literature",       isbn: "9789350090091", year: 2011, copies: 5, available: 5, shelf: "F-1" }
];


// ---------- Book loans (used by Librarian and Student) ----------
// Dates are written as "YYYY-MM-DD", the same format an <input type="date"> gives.
let issuedBooks = [
  { id: "I-001", bookId: "B-101", title: "Introduction to Algorithms", studentId: "U-003", studentName: "Rahim Uddin",  issueDate: "2026-10-20", dueDate: "2026-11-03", returned: false, returnDate: "",           fine: 0,  renewals: 0 },
  { id: "I-002", bookId: "B-102", title: "Clean Code",                 studentId: "U-003", studentName: "Rahim Uddin",  issueDate: "2026-10-05", dueDate: "2026-10-19", returned: false, returnDate: "",           fine: 0,  renewals: 0 },
  { id: "I-003", bookId: "B-108", title: "The Pragmatic Programmer",   studentId: "U-004", studentName: "Karim Hasan",  issueDate: "2026-10-12", dueDate: "2026-10-26", returned: false, returnDate: "",           fine: 0,  renewals: 0 },
  { id: "I-004", bookId: "B-101", title: "Introduction to Algorithms", studentId: "U-005", studentName: "Nadia Rahman", issueDate: "2026-10-25", dueDate: "2026-11-08", returned: false, returnDate: "",           fine: 0,  renewals: 0 },
  { id: "I-005", bookId: "B-107", title: "A Brief History of Time",    studentId: "U-003", studentName: "Rahim Uddin",  issueDate: "2026-09-01", dueDate: "2026-09-15", returned: true,  returnDate: "2026-09-14", fine: 0,  renewals: 0 },
  { id: "I-006", bookId: "B-109", title: "Sapiens",                    studentId: "U-003", studentName: "Rahim Uddin",  issueDate: "2026-08-10", dueDate: "2026-08-24", returned: true,  returnDate: "2026-08-22", fine: 0,  renewals: 0 },
  { id: "I-007", bookId: "B-104", title: "Calculus: Early Transcendentals", studentId: "U-006", studentName: "Tanvir Ahmed", issueDate: "2026-09-02", dueDate: "2026-09-16", returned: true, returnDate: "2026-09-19", fine: 15, renewals: 0 }
];


// ---------- Library rules (set by Admin, used by Librarian and Student) ----------
// A single object: its properties are read with dot notation, e.g. libraryRules.finePerDay
let libraryRules = {
  finePerDay: 5,       // Taka per late day
  loanDays: 14,        // a book is lent for 14 days
  maxBooks: 3,         // a student can hold at most 3 books at once
  renewDays: 7,        // a renewal adds 7 days
  maxRenewals: 1       // each loan can be renewed once
};


// ---------- Book requests made by students (used by Student) ----------
let bookRequests = [
  { id: "R-001", studentId: "U-003", title: "Deep Learning",              author: "Ian Goodfellow",       type: "Purchase", priority: "Normal", reason: "Needed for my machine learning course project.", status: "Pending",  date: "2026-10-28" },
  { id: "R-002", studentId: "U-003", title: "Operating System Concepts",  author: "Abraham Silberschatz", type: "Reserve",  priority: "Urgent", reason: "Midterm preparation for the OS course.",         status: "Approved", date: "2026-10-15" },
  { id: "R-003", studentId: "U-003", title: "Computer Networking",        author: "James Kurose",         type: "Purchase", priority: "Low",    reason: "Extra reading for the networking lab.",           status: "Rejected", date: "2026-09-30" }
];


// ---------- Reading-room visit passes booked by visitors (used by Visitor) ----------
let visitPasses = [
  { id: "P-1001", visitorId: "U-008", name: "Farhana Kabir", email: "farhana@mail.com", phone: "01712345678", date: "2026-11-05", slot: "Morning (9 AM - 12 PM)",    purpose: "Reading",  guests: 1 },
  { id: "P-1002", visitorId: "U-009", name: "Imran Hossain", email: "imran@mail.com",   phone: "01898765432", date: "2026-11-07", slot: "Afternoon (12 PM - 4 PM)", purpose: "Research", guests: 2 }
];


// ---------- Activity log (used by Admin) ----------
let activityLog = [
  { time: "2026-10-29 09:12", user: "admin",     type: "User",     message: "Created librarian account for Mitu Sarker" },
  { time: "2026-10-29 11:40", user: "librarian", type: "Book",     message: "Added book: Gitanjali (B-110)" },
  { time: "2026-10-30 14:05", user: "librarian", type: "Loan",     message: "Issued Introduction to Algorithms to Nadia Rahman" },
  { time: "2026-10-30 16:22", user: "admin",     type: "Security", message: "Blocked account of Tanvir Ahmed (unpaid fine)" },
  { time: "2026-10-31 08:55", user: "admin",     type: "Settings", message: "Changed fine per day to 5 Taka" },
  { time: "2026-10-31 09:30", user: "jamal",     type: "User",     message: "New librarian registration waiting for approval: Jamal Uddin" }
];
