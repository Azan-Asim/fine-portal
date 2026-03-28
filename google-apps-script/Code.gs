/**
 * Devsinn Team Management Portal - Google Apps Script
 * Deploy as a Web App (Execute as: Me, Access: Anyone)
 * 
 * Sheet names: "Employees", "Penalties", "Penalty Expenses", "Company Expenses", "Company Income", "Payroll Letters", "Attendance"
 * All requests use GET with ?action=xxx&payload=JSON
 */

const SS = SpreadsheetApp.getActiveSpreadsheet();
const EMPLOYEES_SHEET = 'Employees';
const PENALTIES_SHEET = 'Penalties';
const PENALTY_EXPENSES_SHEET = 'Penalty Expenses';
const COMPANY_EXPENSES_SHEET = 'Company Expenses';
const COMPANY_INCOME_SHEET = 'Company Income';
const PAYROLL_SHEET = 'Payroll Letters';
const ATTENDANCE_SHEET = 'Attendance';

function respond(data) {
  return ContentService
    .createTextOutput(JSON.stringify({ data: data }))
    .setMimeType(ContentService.MimeType.JSON);
}

function respondError(msg) {
  return ContentService
    .createTextOutput(JSON.stringify({ error: msg }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  try {
    const action = e.parameter.action;
    const payload = e.parameter.payload ? JSON.parse(e.parameter.payload) : {};

    if (!action) return respond({ status: 'Devsinn Team Management Portal API online' });

    if (action === 'getEmployees') return respond(getEmployees());
    if (action === 'addEmployee')  return respond(addEmployee(payload));
    if (action === 'updateEmployee') return respond(updateEmployee(payload.id, payload.updates));
    if (action === 'deleteEmployee') return respond(deleteEmployee(payload.id));
    if (action === 'getPenalties') return respond(getPenalties());
    if (action === 'addPenalty')   return respond(addPenalty(payload));
    if (action === 'updatePenalty') return respond(updatePenalty(payload.id, payload.updates));
    if (action === 'deletePenalty') return respond(deletePenalty(payload.id));
    
    // Penalty Expenses
    if (action === 'getPenaltyExpenses') return respond(getPenaltyExpenses());
    if (action === 'addPenaltyExpense') return respond(addPenaltyExpense(payload));
    if (action === 'deletePenaltyExpense') return respond(deletePenaltyExpense(payload.id));
    
    // Company Expenses
    if (action === 'getCompanyExpenses') return respond(getCompanyExpenses());
    if (action === 'addCompanyExpense') return respond(addCompanyExpense(payload));
    if (action === 'deleteCompanyExpense') return respond(deleteCompanyExpense(payload.id));
    
    // Company Income
    if (action === 'getCompanyIncomes') return respond(getCompanyIncomes());
    if (action === 'addCompanyIncome') return respond(addCompanyIncome(payload));
    if (action === 'deleteCompanyIncome') return respond(deleteCompanyIncome(payload.id));

    // Payroll
    if (action === 'getPayrollRecords') return respond(getPayrollRecords());
    if (action === 'addPayrollRecord') return respond(addPayrollRecord(payload));

    // Attendance
    if (action === 'getAttendanceByDate') return respond(getAttendanceByDate(payload.date));
    if (action === 'upsertAttendanceRecord') return respond(upsertAttendanceRecord(payload));
    if (action === 'setHolidayForDate') return respond(setHolidayForDate(payload.date));
    if (action === 'getEmployeeMonthlyAttendance') return respond(getEmployeeMonthlyAttendance(payload.employeeId, payload.month, payload.year));

    return respondError('Unknown action: ' + action);
  } catch (err) {
    return respondError(err.message);
  }
}

// Keep doPost as fallback (not used by frontend anymore)
function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    return doGet({ parameter: { action: body.action, payload: JSON.stringify(body) } });
  } catch (err) {
    return respondError(err.message);
  }
}

// ============ EMPLOYEES ============

function getSheet(name) {
  let sheet = SS.getSheetByName(name);
  if (!sheet) {
    sheet = SS.insertSheet(name);
    if (name === EMPLOYEES_SHEET) {
      sheet.appendRow(['ID', 'Name', 'Email', 'Father Name', 'CNIC', 'Picture', 'Bank Name', 'Bank Title', 'Bank Account Number', 'Address', 'Job Position', 'Status', 'Joining Date', 'Contact Number', 'Created At']);
    } else if (name === PENALTIES_SHEET) {
      sheet.appendRow(['ID', 'Employee ID', 'Employee Name', 'Email', 'Reason',
        'Reference URL', 'Amount', 'Date', 'Status', 'Payment Proof',
        'Payment Date', 'Payment Type', 'Notes', 'Created At']);
    } else if (name === PENALTY_EXPENSES_SHEET) {
      sheet.appendRow(['ID', 'Date', 'Description', 'Amount', 'Approved By', 'Notes', 'Created At']);
    } else if (name === COMPANY_EXPENSES_SHEET) {
      sheet.appendRow(['ID', 'Date', 'Description', 'Amount', 'Paid By', 'Approved By', 'Payment Method', 'Receipt URL', 'Notes', 'Created At']);
    } else if (name === COMPANY_INCOME_SHEET) {
      sheet.appendRow(['ID', 'Date', 'Description', 'Amount', 'Received By', 'Receipt URL', 'Notes', 'Created At']);
    } else if (name === PAYROLL_SHEET) {
      sheet.appendRow(['ID', 'Payroll Date', 'Cheque No', 'Salary Month', 'Salary Year', 'Prepared By', 'Designation', 'Total', 'Line Items JSON', 'Created At']);
    } else if (name === ATTENDANCE_SHEET) {
      sheet.appendRow(['ID', 'Employee ID', 'Date', 'Day Type', 'Status', 'Leave Reason', 'Tracking Hours', 'Working Hours', 'Work Sessions JSON', 'Break Sessions JSON', 'Created At', 'Updated At']);
    }
  }
  return sheet;
}

function generateId() {
  return Utilities.getUuid().replace(/-/g, '').substring(0, 12);
}

function sheetToObjects(sheet, headers) {
  const rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) return [];
  return rows.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => obj[h] = row[i] !== undefined ? String(row[i]) : '');
    return obj;
  });
}

const E_HEADERS = ['id', 'name', 'email', 'fatherName', 'cnic', 'picture', 'bankName', 'bankTitle', 'bankAccountNumber', 'address', 'jobPosition', 'status', 'joiningDate', 'contactNumber', 'createdAt'];

function getEmployees() {
  const sheet = getSheet(EMPLOYEES_SHEET);
  return sheetToObjects(sheet, E_HEADERS);
}

function addEmployee(body) {
  const sheet = getSheet(EMPLOYEES_SHEET);
  const id = generateId();
  const createdAt = new Date().toISOString();
  
  const row = [
    id, body.name, body.email, body.fatherName || '', body.cnic || '', body.picture || '',
    body.bankName || '', body.bankTitle || '', body.bankAccountNumber || '', body.address || '',
    body.jobPosition || '', body.status || '', body.joiningDate || '', body.contactNumber || '', createdAt
  ];
  sheet.appendRow(row);
  return { 
    id, name: body.name, email: body.email, 
    fatherName: body.fatherName || '', cnic: body.cnic || '', picture: body.picture || '',
    bankName: body.bankName || '', bankTitle: body.bankTitle || '', bankAccountNumber: body.bankAccountNumber || '',
    address: body.address || '', jobPosition: body.jobPosition || '', status: body.status || '',
    joiningDate: body.joiningDate || '', contactNumber: body.contactNumber || '', createdAt
  };
}

function updateEmployee(id, updates) {
  const sheet = getSheet(EMPLOYEES_SHEET);
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === id) {
      const colMap = { id: 0, name: 1, email: 2, fatherName: 3, cnic: 4, picture: 5, bankName: 6, bankTitle: 7, bankAccountNumber: 8, address: 9, jobPosition: 10, status: 11, joiningDate: 12, contactNumber: 13, createdAt: 14 };
      for (const key in updates) {
        if (colMap[key] !== undefined) {
          sheet.getRange(i + 1, colMap[key] + 1).setValue(updates[key]);
          data[i][colMap[key]] = updates[key];
        }
      }
      const result = {};
      E_HEADERS.forEach((h, idx) => result[h] = String(data[i][idx]));
      return result;
    }
  }
  throw new Error('Employee not found: ' + id);
}

function deleteEmployee(id) {
  const sheet = getSheet(EMPLOYEES_SHEET);
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === id) { sheet.deleteRow(i + 1); break; }
  }
  return null;
}

// ============ PENALTIES ============

const P_HEADERS = ['id','employeeId','employeeName','email','reason','referenceUrl','amount','date','status','paymentProof','paymentDate','paymentType','notes','createdAt'];

function getPenalties() {
  const sheet = getSheet(PENALTIES_SHEET);
  const rows = sheetToObjects(sheet, P_HEADERS);
  return rows.map(r => ({ ...r, amount: Number(r.amount) }));
}

function addPenalty(body) {
  const sheet = getSheet(PENALTIES_SHEET);
  const id = generateId();
  const createdAt = new Date().toISOString();
  const row = [
    id, body.employeeId, body.employeeName, body.email, body.reason,
    body.referenceUrl || '', body.amount, body.date,
    'Unpaid', '', '', '', '', createdAt
  ];
  sheet.appendRow(row);
  return { id, employeeId: body.employeeId, employeeName: body.employeeName, email: body.email,
    reason: body.reason, referenceUrl: body.referenceUrl || '', amount: Number(body.amount),
    date: body.date, status: 'Unpaid', paymentProof: '', paymentDate: '', paymentType: '', notes: '', createdAt };
}

function updatePenalty(id, updates) {
  const sheet = getSheet(PENALTIES_SHEET);
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === id) {
      const colMap = { id:0, employeeId:1, employeeName:2, email:3, reason:4, referenceUrl:5,
        amount:6, date:7, status:8, paymentProof:9, paymentDate:10, paymentType:11, notes:12, createdAt:13 };
      for (const key in updates) {
        if (colMap[key] !== undefined) {
          sheet.getRange(i + 1, colMap[key] + 1).setValue(updates[key]);
          data[i][colMap[key]] = updates[key];
        }
      }
      const result = {};
      P_HEADERS.forEach((h, idx) => result[h] = h === 'amount' ? Number(data[i][idx]) : String(data[i][idx]));
      return result;
    }
  }
  throw new Error('Penalty not found: ' + id);
}

function deletePenalty(id) {
  const sheet = getSheet(PENALTIES_SHEET);
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === id) { sheet.deleteRow(i + 1); break; }
  }
  return null;
}

// ============ PENALTY EXPENSES ============

const PE_HEADERS = ['id', 'date', 'description', 'amount', 'approvedBy', 'notes', 'createdAt'];

function getPenaltyExpenses() {
  const sheet = getSheet(PENALTY_EXPENSES_SHEET);
  const rows = sheetToObjects(sheet, PE_HEADERS);
  return rows.map(r => ({ ...r, amount: Number(r.amount) }));
}

function addPenaltyExpense(body) {
  const sheet = getSheet(PENALTY_EXPENSES_SHEET);
  const id = generateId();
  const createdAt = new Date().toISOString();
  const row = [
    id, body.date, body.description, body.amount, body.approvedBy, body.notes || '', createdAt
  ];
  sheet.appendRow(row);
  return { 
    id, date: body.date, description: body.description, amount: Number(body.amount),
    approvedBy: body.approvedBy, notes: body.notes || '', createdAt 
  };
}

function deletePenaltyExpense(id) {
  const sheet = getSheet(PENALTY_EXPENSES_SHEET);
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === id) { sheet.deleteRow(i + 1); break; }
  }
  return null;
}

// ============ COMPANY EXPENSES ============

const CE_HEADERS = ['id', 'date', 'description', 'amount', 'paidBy', 'approvedBy', 'paymentMethod', 'receiptUrl', 'notes', 'createdAt'];

function getCompanyExpenses() {
  const sheet = getSheet(COMPANY_EXPENSES_SHEET);
  const rows = sheetToObjects(sheet, CE_HEADERS);
  return rows.map(r => ({ ...r, amount: Number(r.amount) }));
}

function addCompanyExpense(body) {
  const sheet = getSheet(COMPANY_EXPENSES_SHEET);
  const id = generateId();
  const createdAt = new Date().toISOString();
  const row = [
    id, body.date, body.description, body.amount, body.paidBy, body.approvedBy,
    body.paymentMethod || '', body.receiptUrl || '', body.notes || '', createdAt
  ];
  sheet.appendRow(row);
  return { 
    id, date: body.date, description: body.description, amount: Number(body.amount),
    paidBy: body.paidBy, approvedBy: body.approvedBy, 
    paymentMethod: body.paymentMethod || '', receiptUrl: body.receiptUrl || '',
    notes: body.notes || '', createdAt 
  };
}

function deleteCompanyExpense(id) {
  const sheet = getSheet(COMPANY_EXPENSES_SHEET);
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === id) { sheet.deleteRow(i + 1); break; }
  }
  return null;
}

// ============ COMPANY INCOME ============

const CI_HEADERS = ['id', 'date', 'description', 'amount', 'receivedBy', 'receiptUrl', 'notes', 'createdAt'];

function getCompanyIncomes() {
  const sheet = getSheet(COMPANY_INCOME_SHEET);
  const rows = sheetToObjects(sheet, CI_HEADERS);
  return rows.map(r => ({ ...r, amount: Number(r.amount) }));
}

function addCompanyIncome(body) {
  const sheet = getSheet(COMPANY_INCOME_SHEET);
  const id = generateId();
  const createdAt = new Date().toISOString();
  const row = [
    id, body.date, body.description, body.amount, body.receivedBy, body.receiptUrl || '', body.notes || '', createdAt
  ];
  sheet.appendRow(row);
  return { 
    id, date: body.date, description: body.description, amount: Number(body.amount),
    receivedBy: body.receivedBy, receiptUrl: body.receiptUrl || '',
    notes: body.notes || '', createdAt 
  };
}

function deleteCompanyIncome(id) {
  const sheet = getSheet(COMPANY_INCOME_SHEET);
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === id) { sheet.deleteRow(i + 1); break; }
  }
  return null;
}

// ============ PAYROLL ============

const PR_HEADERS = ['id', 'payrollDate', 'chequeNo', 'salaryMonth', 'salaryYear', 'preparedBy', 'designation', 'total', 'lineItems', 'createdAt'];

function getPayrollRecords() {
  const sheet = getSheet(PAYROLL_SHEET);
  const rows = sheetToObjects(sheet, PR_HEADERS);

  return rows.map(r => {
    let parsedItems = [];
    try {
      parsedItems = r.lineItems ? JSON.parse(r.lineItems) : [];
    } catch (e) {
      parsedItems = [];
    }

    return {
      id: r.id,
      payrollDate: r.payrollDate,
      chequeNo: r.chequeNo,
      salaryMonth: r.salaryMonth,
      salaryYear: Number(r.salaryYear || 0),
      preparedBy: r.preparedBy,
      designation: r.designation,
      total: Number(r.total || 0),
      lineItems: parsedItems,
      createdAt: r.createdAt,
    };
  });
}

function addPayrollRecord(body) {
  const sheet = getSheet(PAYROLL_SHEET);
  const id = generateId();
  const createdAt = new Date().toISOString();
  const safeLineItems = Array.isArray(body.lineItems) ? body.lineItems : [];
  const lineItemsJson = JSON.stringify(safeLineItems);

  const row = [
    id,
    body.payrollDate || '',
    body.chequeNo || '',
    body.salaryMonth || '',
    body.salaryYear || '',
    body.preparedBy || '',
    body.designation || '',
    Number(body.total || 0),
    lineItemsJson,
    createdAt,
  ];

  sheet.appendRow(row);

  return {
    id,
    payrollDate: body.payrollDate || '',
    chequeNo: body.chequeNo || '',
    salaryMonth: body.salaryMonth || '',
    salaryYear: Number(body.salaryYear || 0),
    preparedBy: body.preparedBy || '',
    designation: body.designation || '',
    total: Number(body.total || 0),
    lineItems: safeLineItems,
    createdAt,
  };
}

// ============ ATTENDANCE ============

const A_HEADERS = ['id', 'employeeId', 'date', 'dayType', 'status', 'leaveReason', 'trackingHours', 'workingHours', 'workSessions', 'breakSessions', 'createdAt', 'updatedAt'];

function toMinutes(timeStr) {
  if (!timeStr) return null;
  const parts = String(timeStr).split(':');
  if (parts.length < 2) return null;
  const h = Number(parts[0]);
  const m = Number(parts[1]);
  if (isNaN(h) || isNaN(m)) return null;
  return h * 60 + m;
}

function calculateWorkingHours(workSessions, breakSessions) {
  const sessions = Array.isArray(workSessions) ? workSessions : [];
  const breaks = Array.isArray(breakSessions) ? breakSessions : [];

  let workMinutes = 0;
  for (let i = 0; i < sessions.length; i++) {
    const s = sessions[i] || {};
    const start = toMinutes(s.checkIn);
    const end = toMinutes(s.checkOut);
    if (start === null || end === null || end <= start) continue;
    workMinutes += (end - start);
  }

  let breakMinutes = 0;
  for (let j = 0; j < breaks.length; j++) {
    const b = breaks[j] || {};
    const start = toMinutes(b.start);
    const end = toMinutes(b.end);
    if (start === null || end === null || end <= start) continue;
    breakMinutes += (end - start);
  }

  const net = Math.max(0, workMinutes - breakMinutes);
  return Number((net / 60).toFixed(2));
}

function parseAttendanceObject(rowObj) {
  let workSessions = [];
  let breakSessions = [];
  try { workSessions = rowObj.workSessions ? JSON.parse(rowObj.workSessions) : []; } catch (e) { workSessions = []; }
  try { breakSessions = rowObj.breakSessions ? JSON.parse(rowObj.breakSessions) : []; } catch (e) { breakSessions = []; }

  return {
    id: rowObj.id,
    employeeId: rowObj.employeeId,
    date: rowObj.date,
    dayType: rowObj.dayType || 'Working Day',
    status: rowObj.status || 'Absent',
    leaveReason: rowObj.leaveReason || '',
    trackingHours: Number(rowObj.trackingHours || 0),
    workingHours: Number(rowObj.workingHours || 0),
    workSessions: workSessions,
    breakSessions: breakSessions,
    createdAt: rowObj.createdAt,
    updatedAt: rowObj.updatedAt,
  };
}

function getAttendanceByDate(date) {
  if (!date) throw new Error('date is required');
  const sheet = getSheet(ATTENDANCE_SHEET);
  const rows = sheetToObjects(sheet, A_HEADERS);

  return rows
    .filter(r => String(r.date) === String(date))
    .map(parseAttendanceObject);
}

function upsertAttendanceRecord(body) {
  if (!body || !body.employeeId || !body.date) {
    throw new Error('employeeId and date are required');
  }

  const sheet = getSheet(ATTENDANCE_SHEET);
  const data = sheet.getDataRange().getValues();
  const now = new Date().toISOString();

  const safeWorkSessions = Array.isArray(body.workSessions) ? body.workSessions : [];
  const safeBreakSessions = Array.isArray(body.breakSessions) ? body.breakSessions : [];
  const workingHours = calculateWorkingHours(safeWorkSessions, safeBreakSessions);

  const record = {
    employeeId: String(body.employeeId),
    date: String(body.date),
    dayType: body.dayType || 'Working Day',
    status: body.status || 'Absent',
    leaveReason: body.leaveReason || '',
    trackingHours: Number(body.trackingHours || 0),
    workingHours: workingHours,
    workSessions: JSON.stringify(safeWorkSessions),
    breakSessions: JSON.stringify(safeBreakSessions),
    updatedAt: now,
  };

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][1]) === record.employeeId && String(data[i][2]) === record.date) {
      sheet.getRange(i + 1, 4).setValue(record.dayType);
      sheet.getRange(i + 1, 5).setValue(record.status);
      sheet.getRange(i + 1, 6).setValue(record.leaveReason);
      sheet.getRange(i + 1, 7).setValue(record.trackingHours);
      sheet.getRange(i + 1, 8).setValue(record.workingHours);
      sheet.getRange(i + 1, 9).setValue(record.workSessions);
      sheet.getRange(i + 1, 10).setValue(record.breakSessions);
      sheet.getRange(i + 1, 12).setValue(record.updatedAt);

      return {
        id: String(data[i][0]),
        employeeId: record.employeeId,
        date: record.date,
        dayType: record.dayType,
        status: record.status,
        leaveReason: record.leaveReason,
        trackingHours: record.trackingHours,
        workingHours: record.workingHours,
        workSessions: safeWorkSessions,
        breakSessions: safeBreakSessions,
        createdAt: String(data[i][10]),
        updatedAt: record.updatedAt,
      };
    }
  }

  const id = generateId();
  const createdAt = now;
  sheet.appendRow([
    id,
    record.employeeId,
    record.date,
    record.dayType,
    record.status,
    record.leaveReason,
    record.trackingHours,
    record.workingHours,
    record.workSessions,
    record.breakSessions,
    createdAt,
    now,
  ]);

  return {
    id: id,
    employeeId: record.employeeId,
    date: record.date,
    dayType: record.dayType,
    status: record.status,
    leaveReason: record.leaveReason,
    trackingHours: record.trackingHours,
    workingHours: record.workingHours,
    workSessions: safeWorkSessions,
    breakSessions: safeBreakSessions,
    createdAt: createdAt,
    updatedAt: now,
  };
}

function setHolidayForDate(date) {
  if (!date) throw new Error('date is required');
  return upsertAttendanceRecord({
    employeeId: 'GLOBAL',
    date: date,
    dayType: 'Holiday',
    status: 'Holiday',
    leaveReason: '',
    trackingHours: 0,
    workSessions: [],
    breakSessions: [],
  });
}

function getEmployeeMonthlyAttendance(employeeId, month, year) {
  if (!employeeId) throw new Error('employeeId is required');
  const m = Number(month);
  const y = Number(year);
  if (!m || !y) throw new Error('month and year are required');

  const attendanceSheet = getSheet(ATTENDANCE_SHEET);
  const rows = sheetToObjects(attendanceSheet, A_HEADERS).map(parseAttendanceObject);

  const employees = getEmployees();
  const employee = employees.find(e => String(e.id) === String(employeeId)) || null;

  const start = new Date(Date.UTC(y, m - 1, 1));
  const end = new Date(Date.UTC(y, m, 1));

  const isInMonth = function(dateStr) {
    if (!dateStr) return false;
    const d = new Date(dateStr + 'T00:00:00Z');
    return d >= start && d < end;
  };

  const employeeRecords = rows.filter(r => r.employeeId === String(employeeId) && isInMonth(r.date));
  const holidayDays = rows.filter(r => r.employeeId === 'GLOBAL' && r.status === 'Holiday' && isInMonth(r.date));

  const totalWorkingHours = employeeRecords.reduce((sum, r) => sum + Number(r.workingHours || 0), 0);
  const totalTrackingHours = employeeRecords.reduce((sum, r) => sum + Number(r.trackingHours || 0), 0);
  const totalLeaves = employeeRecords.filter(r => r.status === 'Leave').length;
  const totalPresents = employeeRecords.filter(r => r.status === 'Present').length;
  const totalAbsents = employeeRecords.filter(r => r.status === 'Absent').length;
  const totalHolidays = holidayDays.length;

  return {
    employee: employee,
    month: m,
    year: y,
    totalWorkingHours: Number(totalWorkingHours.toFixed(2)),
    totalTrackingHours: Number(totalTrackingHours.toFixed(2)),
    totalLeaves: totalLeaves,
    totalHolidays: totalHolidays,
    totalPresents: totalPresents,
    totalAbsents: totalAbsents,
    records: employeeRecords,
  };
}
