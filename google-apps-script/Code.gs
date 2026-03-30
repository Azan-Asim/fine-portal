/**
 * Devsinn Team Management Portal - Google Apps Script
 * Deploy as a Web App (Execute as: Me, Access: Anyone)
 * 
 * Sheet names: "Employees", "Penalties", "Penalty Expenses", "Company Expenses", "Company Income", "Payroll Letters", "Attendance", "Performance Records", "Salary Slips"
 * Requests support GET (?action=xxx&payload=JSON) and POST JSON body ({ action, payload })
 */

const SS = SpreadsheetApp.getActiveSpreadsheet();
const EMPLOYEES_SHEET = 'Employees';
const PENALTIES_SHEET = 'Penalties';
const PENALTY_EXPENSES_SHEET = 'Penalty Expenses';
const COMPANY_EXPENSES_SHEET = 'Company Expenses';
const COMPANY_INCOME_SHEET = 'Company Income';
const PAYROLL_SHEET = 'Payroll Letters';
const ATTENDANCE_SHEET = 'Attendance';
const PERFORMANCE_SHEET = 'Performance Records';
const SALARY_SLIPS_SHEET = 'Salary Slips';

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
    if (action === 'updatePayrollRecord') return respond(updatePayrollRecord(payload.id, payload.updates));
    if (action === 'addSalarySlipsForPayroll') return respond(addSalarySlipsForPayroll(payload.payrollId));
    if (action === 'getSalarySlipsForEmployee') return respond(getSalarySlipsForEmployee(payload.employeeId));
    if (action === 'getSalarySlipsByPayroll') return respond(getSalarySlipsByPayroll(payload.payrollId));

    // Attendance
    if (action === 'getAttendanceByDate') return respond(getAttendanceByDate(payload.date));
    if (action === 'upsertAttendanceRecord') return respond(upsertAttendanceRecord(payload));
    if (action === 'setHolidayForDate') return respond(setHolidayForDate(payload.date));
    if (action === 'getEmployeeMonthlyAttendance') return respond(getEmployeeMonthlyAttendance(payload.employeeId, payload.month, payload.year));
    if (action === 'upsertPerformanceRecord') return respond(upsertPerformanceRecord(payload));
    if (action === 'getPerformanceRecord') return respond(getPerformanceRecord(payload.employeeId, payload.month, payload.year));

    return respondError('Unknown action: ' + action);
  } catch (err) {
    return respondError(err.message);
  }
}

// Keep doPost as fallback (not used by frontend anymore)
function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents || '{}');
    return doGet({ parameter: { action: body.action, payload: JSON.stringify(body.payload || {}) } });
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
      sheet.appendRow(['ID', 'Name', 'Email', 'Father Name', 'CNIC', 'Picture', 'Bank Name', 'Bank Title', 'Bank Account Number', 'Address', 'Job Position', 'Role', 'Department', 'Lead ID', 'Status', 'Joining Date', 'Contact Number', 'Created At']);
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
      sheet.appendRow(['ID', 'Payroll Date', 'Cheque No', 'Salary Month', 'Salary Year', 'Prepared By', 'Designation', 'Total', 'Line Items JSON', 'Payroll PDF HTML', 'Cheque Proof URL', 'Salary Received', 'Salary Received At', 'Created At']);
    } else if (name === ATTENDANCE_SHEET) {
      sheet.appendRow(['ID', 'Employee ID', 'Date', 'Day Type', 'Status', 'Leave Reason', 'Tracking Hours', 'Working Hours', 'Work Sessions JSON', 'Break Sessions JSON', 'Week1 Comment', 'Week2 Comment', 'Week3 Comment', 'Week4 Comment', 'Created At', 'Updated At']);
    } else if (name === PERFORMANCE_SHEET) {
      sheet.appendRow(['ID', 'Employee ID', 'Lead ID', 'Month', 'Year', 'Week1 Comment', 'Week1 Score', 'Week2 Comment', 'Week2 Score', 'Week3 Comment', 'Week3 Score', 'Week4 Comment', 'Week4 Score', 'Final Reviewer ID', 'Final Comment', 'Final Score', 'Created At', 'Updated At']);
    } else if (name === SALARY_SLIPS_SHEET) {
      sheet.appendRow(['ID', 'Payroll ID', 'Employee ID', 'Employee Name', 'Salary Month', 'Salary Year', 'Pay Date', 'Amount', 'Basic Pay', 'Leave Deduction', 'Late Deduction', 'Total Deductions', 'Net Pay', 'Working Days', 'Paid Leave', 'Unpaid Leave', 'Late Comings', 'Slip HTML', 'Created At']);
    }
  }

  if (name === EMPLOYEES_SHEET && sheet.getLastRow() > 0 && sheet.getLastColumn() < 18) {
    sheet.getRange(1, 1, 1, 18).setValues([['ID', 'Name', 'Email', 'Father Name', 'CNIC', 'Picture', 'Bank Name', 'Bank Title', 'Bank Account Number', 'Address', 'Job Position', 'Role', 'Department', 'Lead ID', 'Status', 'Joining Date', 'Contact Number', 'Created At']]);
  }
  if (name === PAYROLL_SHEET && sheet.getLastRow() > 0 && sheet.getLastColumn() < 14) {
    sheet.getRange(1, 1, 1, 14).setValues([['ID', 'Payroll Date', 'Cheque No', 'Salary Month', 'Salary Year', 'Prepared By', 'Designation', 'Total', 'Line Items JSON', 'Payroll PDF HTML', 'Cheque Proof URL', 'Salary Received', 'Salary Received At', 'Created At']]);
  }
  if (name === ATTENDANCE_SHEET && sheet.getLastRow() > 0 && sheet.getLastColumn() < 16) {
    sheet.getRange(1, 1, 1, 16).setValues([['ID', 'Employee ID', 'Date', 'Day Type', 'Status', 'Leave Reason', 'Tracking Hours', 'Working Hours', 'Work Sessions JSON', 'Break Sessions JSON', 'Week1 Comment', 'Week2 Comment', 'Week3 Comment', 'Week4 Comment', 'Created At', 'Updated At']]);
  }
  if (name === PERFORMANCE_SHEET && sheet.getLastRow() > 0 && sheet.getLastColumn() < 18) {
    sheet.getRange(1, 1, 1, 18).setValues([['ID', 'Employee ID', 'Lead ID', 'Month', 'Year', 'Week1 Comment', 'Week1 Score', 'Week2 Comment', 'Week2 Score', 'Week3 Comment', 'Week3 Score', 'Week4 Comment', 'Week4 Score', 'Final Reviewer ID', 'Final Comment', 'Final Score', 'Created At', 'Updated At']]);
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

const E_HEADERS = ['id', 'name', 'email', 'fatherName', 'cnic', 'picture', 'bankName', 'bankTitle', 'bankAccountNumber', 'address', 'jobPosition', 'role', 'department', 'leadId', 'status', 'joiningDate', 'contactNumber', 'createdAt'];

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
    body.jobPosition || '', body.role || 'employee', body.department || '', body.leadId || '', body.status || '', body.joiningDate || '', body.contactNumber || '', createdAt
  ];
  sheet.appendRow(row);
  return { 
    id, name: body.name, email: body.email, 
    fatherName: body.fatherName || '', cnic: body.cnic || '', picture: body.picture || '',
    bankName: body.bankName || '', bankTitle: body.bankTitle || '', bankAccountNumber: body.bankAccountNumber || '',
    address: body.address || '', jobPosition: body.jobPosition || '', role: body.role || 'employee',
    department: body.department || '', leadId: body.leadId || '', status: body.status || '',
    joiningDate: body.joiningDate || '', contactNumber: body.contactNumber || '', createdAt
  };
}

function updateEmployee(id, updates) {
  const sheet = getSheet(EMPLOYEES_SHEET);
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === id) {
      const colMap = { id: 0, name: 1, email: 2, fatherName: 3, cnic: 4, picture: 5, bankName: 6, bankTitle: 7, bankAccountNumber: 8, address: 9, jobPosition: 10, role: 11, department: 12, leadId: 13, status: 14, joiningDate: 15, contactNumber: 16, createdAt: 17 };
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

const PR_HEADERS = ['id', 'payrollDate', 'chequeNo', 'salaryMonth', 'salaryYear', 'preparedBy', 'designation', 'total', 'lineItems', 'payrollPdfHtml', 'chequeProofUrl', 'salaryReceived', 'salaryReceivedAt', 'createdAt'];

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
      payrollPdfHtml: r.payrollPdfHtml || '',
      chequeProofUrl: r.chequeProofUrl || '',
      salaryReceived: String(r.salaryReceived).toLowerCase() === 'true',
      salaryReceivedAt: r.salaryReceivedAt || '',
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
    body.payrollPdfHtml || '',
    body.chequeProofUrl || '',
    body.salaryReceived ? 'true' : 'false',
    body.salaryReceivedAt || '',
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
    payrollPdfHtml: body.payrollPdfHtml || '',
    chequeProofUrl: body.chequeProofUrl || '',
    salaryReceived: !!body.salaryReceived,
    salaryReceivedAt: body.salaryReceivedAt || '',
    createdAt,
  };
}

function updatePayrollRecord(id, updates) {
  const sheet = getSheet(PAYROLL_SHEET);
  const data = sheet.getDataRange().getValues();

  const colMap = {
    payrollDate: 1,
    chequeNo: 2,
    salaryMonth: 3,
    salaryYear: 4,
    preparedBy: 5,
    designation: 6,
    total: 7,
    lineItems: 8,
    payrollPdfHtml: 9,
    chequeProofUrl: 10,
    salaryReceived: 11,
    salaryReceivedAt: 12,
  };

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) {
      for (const key in updates) {
        if (colMap[key] === undefined) continue;
        let value = updates[key];
        if (key === 'lineItems' && Array.isArray(value)) value = JSON.stringify(value);
        if (key === 'salaryReceived') value = value ? 'true' : 'false';
        sheet.getRange(i + 1, colMap[key] + 1).setValue(value === undefined || value === null ? '' : value);
        data[i][colMap[key]] = value;
      }

      let parsedItems = [];
      try { parsedItems = data[i][8] ? JSON.parse(String(data[i][8])) : []; } catch (e) { parsedItems = []; }

      return {
        id: String(data[i][0]),
        payrollDate: String(data[i][1] || ''),
        chequeNo: String(data[i][2] || ''),
        salaryMonth: String(data[i][3] || ''),
        salaryYear: Number(data[i][4] || 0),
        preparedBy: String(data[i][5] || ''),
        designation: String(data[i][6] || ''),
        total: Number(data[i][7] || 0),
        lineItems: parsedItems,
        payrollPdfHtml: String(data[i][9] || ''),
        chequeProofUrl: String(data[i][10] || ''),
        salaryReceived: String(data[i][11] || '').toLowerCase() === 'true',
        salaryReceivedAt: String(data[i][12] || ''),
        createdAt: String(data[i][13] || ''),
      };
    }
  }

  throw new Error('Payroll record not found: ' + id);
}

// ============ ATTENDANCE ============

const A_HEADERS = ['id', 'employeeId', 'date', 'dayType', 'status', 'leaveReason', 'trackingHours', 'workingHours', 'workSessions', 'breakSessions', 'week1Comment', 'week2Comment', 'week3Comment', 'week4Comment', 'createdAt', 'updatedAt'];

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
    date: toYmd(rowObj.date),
    dayType: rowObj.dayType || 'Working Day',
    status: rowObj.status || 'Absent',
    leaveReason: rowObj.leaveReason || '',
    trackingHours: Number(rowObj.trackingHours || 0),
    workingHours: Number(rowObj.workingHours || 0),
    workSessions: workSessions,
    breakSessions: breakSessions,
    week1Comment: rowObj.week1Comment || '',
    week2Comment: rowObj.week2Comment || '',
    week3Comment: rowObj.week3Comment || '',
    week4Comment: rowObj.week4Comment || '',
    createdAt: rowObj.createdAt,
    updatedAt: rowObj.updatedAt,
  };
}

function toYmd(value) {
  if (!value) return '';
  const str = String(value).trim();

  // Pass through already normalized dates.
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;

  const d = new Date(str);
  if (!isNaN(d.getTime())) {
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    return y + '-' + m + '-' + day;
  }

  // Handle common sheet formats like M/D/YYYY or D/M/YYYY gracefully.
  const parts = str.split(/[\/\-.]/).map(function(p) { return Number(p); });
  if (parts.length === 3 && parts.every(function(n) { return !isNaN(n); })) {
    let year = parts[2];
    let month = parts[0];
    let day = parts[1];

    if (year < 100) year += 2000;
    if (month > 12 && day <= 12) {
      const temp = month;
      month = day;
      day = temp;
    }

    if (month >= 1 && month <= 12 && day >= 1 && day <= 31 && year >= 2000) {
      return String(year) + '-' + String(month).padStart(2, '0') + '-' + String(day).padStart(2, '0');
    }
  }

  return str;
}

function getAttendanceByDate(date) {
  if (!date) throw new Error('date is required');
  const normalizedDate = toYmd(date);
  const sheet = getSheet(ATTENDANCE_SHEET);
  const rows = sheetToObjects(sheet, A_HEADERS);

  return rows
    .filter(r => toYmd(r.date) === normalizedDate)
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
    date: toYmd(body.date),
    dayType: body.dayType || 'Working Day',
    status: body.status || 'Absent',
    leaveReason: body.leaveReason || '',
    trackingHours: Number(body.trackingHours || 0),
    workingHours: workingHours,
    workSessions: JSON.stringify(safeWorkSessions),
    breakSessions: JSON.stringify(safeBreakSessions),
    week1Comment: body.week1Comment || '',
    week2Comment: body.week2Comment || '',
    week3Comment: body.week3Comment || '',
    week4Comment: body.week4Comment || '',
    updatedAt: now,
  };

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][1]) === record.employeeId && toYmd(data[i][2]) === record.date) {
      sheet.getRange(i + 1, 4).setValue(record.dayType);
      sheet.getRange(i + 1, 5).setValue(record.status);
      sheet.getRange(i + 1, 6).setValue(record.leaveReason);
      sheet.getRange(i + 1, 7).setValue(record.trackingHours);
      sheet.getRange(i + 1, 8).setValue(record.workingHours);
      sheet.getRange(i + 1, 9).setValue(record.workSessions);
      sheet.getRange(i + 1, 10).setValue(record.breakSessions);
      sheet.getRange(i + 1, 11).setValue(record.week1Comment);
      sheet.getRange(i + 1, 12).setValue(record.week2Comment);
      sheet.getRange(i + 1, 13).setValue(record.week3Comment);
      sheet.getRange(i + 1, 14).setValue(record.week4Comment);
      sheet.getRange(i + 1, 16).setValue(record.updatedAt);

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
        week1Comment: record.week1Comment,
        week2Comment: record.week2Comment,
        week3Comment: record.week3Comment,
        week4Comment: record.week4Comment,
        createdAt: String(data[i][14]),
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
    record.week1Comment,
    record.week2Comment,
    record.week3Comment,
    record.week4Comment,
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
    week1Comment: record.week1Comment,
    week2Comment: record.week2Comment,
    week3Comment: record.week3Comment,
    week4Comment: record.week4Comment,
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
    const d = new Date(toYmd(dateStr) + 'T00:00:00Z');
    if (isNaN(d.getTime())) return false;
    return d >= start && d < end;
  };

  const employeeRecords = rows.filter(r => r.employeeId === String(employeeId) && isInMonth(r.date));
  const holidayDays = rows.filter(r => r.employeeId === 'GLOBAL' && r.status === 'Holiday' && isInMonth(r.date));
  const performance = getPerformanceRecord(employeeId, m, y);

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
    totalPerformanceScore: Number(performance ? performance.totalScore : 0),
    maxPerformanceScore: Number(performance ? performance.maxScore : 50),
    performance: performance,
    records: employeeRecords,
  };
}

const PERF_HEADERS = ['id', 'employeeId', 'leadId', 'month', 'year', 'week1Comment', 'week1Score', 'week2Comment', 'week2Score', 'week3Comment', 'week3Score', 'week4Comment', 'week4Score', 'finalReviewerId', 'finalComment', 'finalScore', 'createdAt', 'updatedAt'];

function normalizeScore(value) {
  const n = Number(value);
  if (isNaN(n)) return 0;
  return Math.max(0, Math.min(10, Number(n.toFixed(2))));
}

function getPerformanceRecord(employeeId, month, year) {
  if (!employeeId) throw new Error('employeeId is required');
  const m = Number(month);
  const y = Number(year);
  if (!m || !y) throw new Error('month and year are required');

  const sheet = getSheet(PERFORMANCE_SHEET);
  const rows = sheetToObjects(sheet, PERF_HEADERS);

  const found = rows.find(r =>
    String(r.employeeId) === String(employeeId) &&
    Number(r.month || 0) === m &&
    Number(r.year || 0) === y
  );

  if (!found) return null;

  const week1Score = normalizeScore(found.week1Score);
  const week2Score = normalizeScore(found.week2Score);
  const week3Score = normalizeScore(found.week3Score);
  const week4Score = normalizeScore(found.week4Score);
  const finalScore = normalizeScore(found.finalScore);
  const totalScore = Number((week1Score + week2Score + week3Score + week4Score + finalScore).toFixed(2));

  return {
    id: found.id,
    employeeId: found.employeeId,
    leadId: found.leadId || '',
    month: Number(found.month || 0),
    year: Number(found.year || 0),
    week1Comment: found.week1Comment || '',
    week1Score: week1Score,
    week2Comment: found.week2Comment || '',
    week2Score: week2Score,
    week3Comment: found.week3Comment || '',
    week3Score: week3Score,
    week4Comment: found.week4Comment || '',
    week4Score: week4Score,
    finalReviewerId: found.finalReviewerId || '',
    finalComment: found.finalComment || '',
    finalScore: finalScore,
    totalScore: totalScore,
    maxScore: 50,
    createdAt: found.createdAt || '',
    updatedAt: found.updatedAt || '',
  };
}

function upsertPerformanceRecord(body) {
  if (!body || !body.employeeId) throw new Error('employeeId is required');
  const month = Number(body.month);
  const year = Number(body.year);
  if (!month || !year) throw new Error('month and year are required');

  const sheet = getSheet(PERFORMANCE_SHEET);
  const data = sheet.getDataRange().getValues();
  const now = new Date().toISOString();
  let savedRecord = null;

  function getEmployeeRoleById(empId) {
    if (!empId) return '';
    const employees = getEmployees();
    const found = employees.find(function(e) { return String(e.id) === String(empId); });
    return String((found && found.role) || '').toLowerCase().replace(/\s+/g, '-').replace(/_/g, '-');
  }

  const hasWeeklyInput =
    body.week1Comment !== undefined || body.week1Score !== undefined ||
    body.week2Comment !== undefined || body.week2Score !== undefined ||
    body.week3Comment !== undefined || body.week3Score !== undefined ||
    body.week4Comment !== undefined || body.week4Score !== undefined;

  const hasFinalInput =
    body.finalComment !== undefined || body.finalScore !== undefined;

  if (hasWeeklyInput) {
    const weeklyEditorId = body.leadId;
    const weeklyRole = getEmployeeRoleById(weeklyEditorId);
    if (weeklyRole !== 'lead' && weeklyRole !== 'manager') {
      throw new Error('Only lead or manager can add weekly performance and score.');
    }
  }

  if (hasFinalInput) {
    const reviewerId = body.finalReviewerId;
    const reviewerRole = getEmployeeRoleById(reviewerId);
    if (reviewerRole !== 'hr' && reviewerRole !== 'higher-management') {
      throw new Error('Only HR or Higher Management can add final performance review and score.');
    }
  }

  for (let i = 1; i < data.length; i++) {
    if (
      String(data[i][1]) === String(body.employeeId) &&
      Number(data[i][3] || 0) === month &&
      Number(data[i][4] || 0) === year
    ) {
      const nextLeadId = body.leadId === undefined ? String(data[i][2] || '') : String(body.leadId || '');
      const nextWeek1Comment = body.week1Comment === undefined ? String(data[i][5] || '') : String(body.week1Comment || '');
      const nextWeek1Score = body.week1Score === undefined ? normalizeScore(data[i][6]) : normalizeScore(body.week1Score);
      const nextWeek2Comment = body.week2Comment === undefined ? String(data[i][7] || '') : String(body.week2Comment || '');
      const nextWeek2Score = body.week2Score === undefined ? normalizeScore(data[i][8]) : normalizeScore(body.week2Score);
      const nextWeek3Comment = body.week3Comment === undefined ? String(data[i][9] || '') : String(body.week3Comment || '');
      const nextWeek3Score = body.week3Score === undefined ? normalizeScore(data[i][10]) : normalizeScore(body.week3Score);
      const nextWeek4Comment = body.week4Comment === undefined ? String(data[i][11] || '') : String(body.week4Comment || '');
      const nextWeek4Score = body.week4Score === undefined ? normalizeScore(data[i][12]) : normalizeScore(body.week4Score);
      const nextFinalReviewerId = body.finalReviewerId === undefined ? String(data[i][13] || '') : String(body.finalReviewerId || '');
      const nextFinalComment = body.finalComment === undefined ? String(data[i][14] || '') : String(body.finalComment || '');
      const nextFinalScore = body.finalScore === undefined ? normalizeScore(data[i][15]) : normalizeScore(body.finalScore);

      sheet.getRange(i + 1, 3).setValue(nextLeadId);
      sheet.getRange(i + 1, 6).setValue(nextWeek1Comment);
      sheet.getRange(i + 1, 7).setValue(nextWeek1Score);
      sheet.getRange(i + 1, 8).setValue(nextWeek2Comment);
      sheet.getRange(i + 1, 9).setValue(nextWeek2Score);
      sheet.getRange(i + 1, 10).setValue(nextWeek3Comment);
      sheet.getRange(i + 1, 11).setValue(nextWeek3Score);
      sheet.getRange(i + 1, 12).setValue(nextWeek4Comment);
      sheet.getRange(i + 1, 13).setValue(nextWeek4Score);
      sheet.getRange(i + 1, 14).setValue(nextFinalReviewerId);
      sheet.getRange(i + 1, 15).setValue(nextFinalComment);
      sheet.getRange(i + 1, 16).setValue(nextFinalScore);
      sheet.getRange(i + 1, 18).setValue(now);
      savedRecord = getPerformanceRecord(body.employeeId, month, year);
      break;
    }
  }

  if (!savedRecord) {
    const id = generateId();
    const week1Score = normalizeScore(body.week1Score);
    const week2Score = normalizeScore(body.week2Score);
    const week3Score = normalizeScore(body.week3Score);
    const week4Score = normalizeScore(body.week4Score);
    const finalScore = normalizeScore(body.finalScore);
    sheet.appendRow([
      id,
      String(body.employeeId),
      String(body.leadId || ''),
      month,
      year,
      String(body.week1Comment || ''),
      week1Score,
      String(body.week2Comment || ''),
      week2Score,
      String(body.week3Comment || ''),
      week3Score,
      String(body.week4Comment || ''),
      week4Score,
      String(body.finalReviewerId || ''),
      String(body.finalComment || ''),
      finalScore,
      now,
      now,
    ]);
    savedRecord = getPerformanceRecord(body.employeeId, month, year);
  }

  if (!savedRecord) {
    throw new Error('Unable to save performance record');
  }

  const attendanceSheet = getSheet(ATTENDANCE_SHEET);
  const attendanceData = attendanceSheet.getDataRange().getValues();
  for (let i = 1; i < attendanceData.length; i++) {
    if (String(attendanceData[i][1]) !== String(body.employeeId)) continue;
    const dateStr = String(attendanceData[i][2] || '');
    if (!dateStr) continue;
    const d = new Date(dateStr + 'T00:00:00Z');
    if (d.getUTCFullYear() !== year || (d.getUTCMonth() + 1) !== month) continue;

    attendanceSheet.getRange(i + 1, 11).setValue(String(savedRecord.week1Comment || ''));
    attendanceSheet.getRange(i + 1, 12).setValue(String(savedRecord.week2Comment || ''));
    attendanceSheet.getRange(i + 1, 13).setValue(String(savedRecord.week3Comment || ''));
    attendanceSheet.getRange(i + 1, 14).setValue(String(savedRecord.week4Comment || ''));
    attendanceSheet.getRange(i + 1, 16).setValue(now);
  }

  return savedRecord;
}

const SLIP_HEADERS = ['id', 'payrollId', 'employeeId', 'employeeName', 'salaryMonth', 'salaryYear', 'payDate', 'amount', 'basicPay', 'leaveDeduction', 'lateDeduction', 'totalDeductions', 'netPay', 'workingDays', 'paidLeave', 'unpaidLeave', 'lateComings', 'slipHtml', 'createdAt'];

function getSalarySlipsForEmployee(employeeId) {
  if (!employeeId) throw new Error('employeeId is required');
  const sheet = getSheet(SALARY_SLIPS_SHEET);
  const rows = sheetToObjects(sheet, SLIP_HEADERS);
  return rows
    .filter(r => String(r.employeeId) === String(employeeId))
    .map(parseSalarySlip)
    .sort(function(a, b) { return String(b.createdAt).localeCompare(String(a.createdAt)); });
}

function getSalarySlipsByPayroll(payrollId) {
  if (!payrollId) throw new Error('payrollId is required');
  const sheet = getSheet(SALARY_SLIPS_SHEET);
  const rows = sheetToObjects(sheet, SLIP_HEADERS);
  return rows
    .filter(r => String(r.payrollId) === String(payrollId))
    .map(parseSalarySlip);
}

function parseSalarySlip(r) {
  return {
    id: r.id,
    payrollId: r.payrollId,
    employeeId: r.employeeId,
    employeeName: r.employeeName,
    salaryMonth: r.salaryMonth,
    salaryYear: Number(r.salaryYear || 0),
    payDate: r.payDate,
    amount: Number(r.amount || 0),
    basicPay: Number(r.basicPay || 0),
    leaveDeduction: Number(r.leaveDeduction || 0),
    lateDeduction: Number(r.lateDeduction || 0),
    totalDeductions: Number(r.totalDeductions || 0),
    netPay: Number(r.netPay || 0),
    workingDays: Number(r.workingDays || 22),
    paidLeave: Number(r.paidLeave || 1),
    unpaidLeave: Number(r.unpaidLeave || 0),
    lateComings: Number(r.lateComings || 0),
    slipHtml: r.slipHtml || '',
    createdAt: r.createdAt,
  };
}

function addSalarySlipsForPayroll(payrollId) {
  if (!payrollId) throw new Error('payrollId is required');

  const payrolls = getPayrollRecords();
  const payroll = payrolls.find(p => String(p.id) === String(payrollId));
  if (!payroll) throw new Error('Payroll record not found: ' + payrollId);

  const slipSheet = getSheet(SALARY_SLIPS_SHEET);
  const existingRows = sheetToObjects(slipSheet, SLIP_HEADERS);
  const createdAt = new Date().toISOString();
  const slips = [];

  for (let i = 0; i < payroll.lineItems.length; i++) {
    const line = payroll.lineItems[i];
    if (!line || !line.employeeId) continue;

    const existing = existingRows.find(r => String(r.payrollId) === String(payrollId) && String(r.employeeId) === String(line.employeeId));
    if (existing) {
      slips.push(parseSalarySlip(existing));
      continue;
    }

    const amount = Number(line.amount || 0);
    const unpaidLeave = 0;
    const lateComings = 0;
    const leaveDeduction = 0;
    const lateDeduction = 0;
    const totalDeductions = leaveDeduction + lateDeduction;
    const netPay = amount;
    const slipHtml = buildSalarySlipHtml({
      payDate: payroll.payrollDate,
      employeeName: line.employeeName,
      employeeId: line.employeeId,
      salaryMonth: payroll.salaryMonth,
      salaryYear: payroll.salaryYear,
      workingDays: 22,
      paidLeave: 1,
      unpaidLeave: unpaidLeave,
      lateComings: lateComings,
      basicPay: amount,
      leaveDeduction: leaveDeduction,
      lateDeduction: lateDeduction,
      totalDeductions: totalDeductions,
      netPay: netPay,
    });

    const newId = generateId();
    const row = [
      newId,
      payrollId,
      String(line.employeeId),
      String(line.employeeName || ''),
      String(payroll.salaryMonth || ''),
      Number(payroll.salaryYear || 0),
      String(payroll.payrollDate || ''),
      amount,
      amount,
      leaveDeduction,
      lateDeduction,
      totalDeductions,
      netPay,
      22,
      1,
      unpaidLeave,
      lateComings,
      slipHtml,
      createdAt,
    ];

    slipSheet.appendRow(row);
    slips.push(parseSalarySlip({
      id: newId,
      payrollId: payrollId,
      employeeId: String(line.employeeId),
      employeeName: String(line.employeeName || ''),
      salaryMonth: String(payroll.salaryMonth || ''),
      salaryYear: Number(payroll.salaryYear || 0),
      payDate: String(payroll.payrollDate || ''),
      amount: amount,
      basicPay: amount,
      leaveDeduction: leaveDeduction,
      lateDeduction: lateDeduction,
      totalDeductions: totalDeductions,
      netPay: netPay,
      workingDays: 22,
      paidLeave: 1,
      unpaidLeave: unpaidLeave,
      lateComings: lateComings,
      slipHtml: slipHtml,
      createdAt: createdAt,
    }));
  }

  return slips;
}

function buildSalarySlipHtml(slip) {
  return '<!doctype html><html><head><meta charset="utf-8" /><title>Payslip</title></head><body>' +
    '<h1>Payslip</h1>' +
    '<p>Employee: ' + String(slip.employeeName || '') + '</p>' +
    '<p>Employee ID: ' + String(slip.employeeId || '') + '</p>' +
    '<p>Pay Date: ' + String(slip.payDate || '') + '</p>' +
    '<p>Salary Month: ' + String(slip.salaryMonth || '') + ' ' + String(slip.salaryYear || '') + '</p>' +
    '<p>Net Pay: ' + String(slip.netPay || 0) + '</p>' +
    '</body></html>';
}
