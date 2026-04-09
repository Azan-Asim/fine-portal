/**
 * Devsinn Team Management Portal - Google Apps Script
 * Deploy as a Web App (Execute as: Me, Access: Anyone)
 * 
 * Sheet names: "Employees", "Penalties", "Penalty Expenses", "Company Expenses", "Company Income", "Company Assets", "Payroll Letters", "Attendance", "Performance Records", "Salary Slips", "Projects", "Daily Work Reports", "Daily Attendance Summary", "Monthly Payroll Data"
 * Requests support GET (?action=xxx&payload=JSON) and POST JSON body ({ action, payload })
 */

const SS = SpreadsheetApp.getActiveSpreadsheet();
const EMPLOYEES_SHEET = 'Employees';
const PENALTIES_SHEET = 'Penalties';
const PENALTY_EXPENSES_SHEET = 'Penalty Expenses';
const COMPANY_EXPENSES_SHEET = 'Company Expenses';
const COMPANY_INCOME_SHEET = 'Company Income';
const COMPANY_ASSETS_SHEET = 'Company Assets';
const PAYROLL_SHEET = 'Payroll Letters';
const ATTENDANCE_SHEET = 'Attendance';
const PERFORMANCE_SHEET = 'Performance Records';
const SALARY_SLIPS_SHEET = 'Salary Slips';
const PROJECTS_SHEET = 'Projects';
const RULES_SHEET = 'Rules';
const DAILY_WORK_REPORTS_SHEET = 'Daily Work Reports';
const DAILY_ATTENDANCE_SUMMARY_SHEET = 'Daily Attendance Summary';
const ATTENDANCE_SESSIONS_SHEET = 'Attendance Sessions';
const MONTHLY_PAYROLL_DATA_SHEET = 'Monthly Payroll Data';
const PROJECT_FOLDER_PROPERTY_KEY = 'PROJECT_DOCS_ROOT_FOLDER_ID';

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
    if (action === 'updateCompanyExpense') return respond(updateCompanyExpense(payload.id, payload.updates));
    if (action === 'deleteCompanyExpense') return respond(deleteCompanyExpense(payload.id));
    
    // Company Income
    if (action === 'getCompanyIncomes') return respond(getCompanyIncomes());
    if (action === 'addCompanyIncome') return respond(addCompanyIncome(payload));
    if (action === 'deleteCompanyIncome') return respond(deleteCompanyIncome(payload.id));

    // Company Assets
    if (action === 'getCompanyAssets') return respond(getCompanyAssets());
    if (action === 'addCompanyAsset') return respond(addCompanyAsset(payload));
    if (action === 'updateCompanyAsset') return respond(updateCompanyAsset(payload.id, payload.updates));
    if (action === 'deleteCompanyAsset') return respond(deleteCompanyAsset(payload.id));

    // Payroll
    if (action === 'getPayrollRecords') return respond(getPayrollRecords());
    if (action === 'addPayrollRecord') return respond(addPayrollRecord(payload));
    if (action === 'updatePayrollRecord') return respond(updatePayrollRecord(payload.id, payload.updates));
    if (action === 'addSalarySlipsForPayroll') return respond(addSalarySlipsForPayroll(payload.payrollId));
    if (action === 'getSalarySlipsForEmployee') return respond(getSalarySlipsForEmployee(payload.employeeId));
    if (action === 'getSalarySlipsByPayroll') return respond(getSalarySlipsByPayroll(payload.payrollId));

    // Attendance
    if (action === 'getAttendanceByDate') return respond(getAttendanceByDate(payload.date));
    if (action === 'getAttendanceRecords') return respond(getAttendanceRecords());
    if (action === 'upsertAttendanceRecord') return respond(upsertAttendanceRecord(payload));
    if (action === 'setHolidayForDate') return respond(setHolidayForDate(payload.date));
    if (action === 'getEmployeeMonthlyAttendance') return respond(getEmployeeMonthlyAttendance(payload.employeeId, payload.month, payload.year));
    if (action === 'upsertPerformanceRecord') return respond(upsertPerformanceRecord(payload));
    if (action === 'getPerformanceRecord') return respond(getPerformanceRecord(payload.employeeId, payload.month, payload.year));
    if (action === 'getPerformanceRecords') return respond(getPerformanceRecords());

    // Project Documents
    if (action === 'getProjects') return respond(getProjects());
    if (action === 'getProjectDocumentCounts') return respond(getProjectDocumentCounts());
    if (action === 'getProjectDocuments') return respond(getProjectDocuments(payload.projectId));
    if (action === 'uploadProjectDocument') return respond(uploadProjectDocument(payload));
    if (action === 'updateProjectDocumentAccess') return respond(updateProjectDocumentAccess(payload));

    // Dashboards
    if (action === 'getManagementDashboardData') return respond(getManagementDashboardData());
    if (action === 'getStaffDashboardData') return respond(getStaffDashboardData(payload.employeeId, payload.month, payload.year));

    // Rules
    if (action === 'getRules') return respond(getRules());
    if (action === 'addRule') return respond(addRule(payload));
    if (action === 'updateRule') return respond(updateRule(payload.id, payload.updates));
    if (action === 'deleteRule') return respond(deleteRule(payload.id));

    // Daily Work Reports & Attendance System
    if (action === 'submitDailyWorkReport') return respond(submitDailyWorkReport(payload));
    if (action === 'getDailyWorkSubmissions') return respond(getDailyWorkSubmissions());
    if (action === 'getDailyAttendanceSummariesByDate') return respond(getDailyAttendanceSummariesByDate(payload.date));
    if (action === 'getDailyAttendanceSummaries') return respond(getDailyAttendanceSummaries(payload.startDate, payload.endDate));
    if (action === 'getAttendanceTodayTracker') return respond(getAttendanceTodayTracker(payload.employeeId));
    if (action === 'checkInAttendance') return respond(checkInAttendance(payload.employeeId));
    if (action === 'checkOutAttendance') return respond(checkOutAttendance(payload.employeeId));
    if (action === 'updateAttendancePolicy') return respond(updateAttendancePolicy(payload.employeeId, payload.policy));
    if (action === 'getMonthlyAttendancePerformance') return respond(getMonthlyAttendancePerformance(payload.month, payload.year));
    if (action === 'getMonthlyPayrollData') return respond(getMonthlyPayrollData(payload.employeeId, payload.month, payload.year));
    if (action === 'getAllMonthlyPayrollData') return respond(getAllMonthlyPayrollData(payload.month, payload.year));
    if (action === 'generateMonthlyPayroll') return respond(generateMonthlyPayroll(payload.month, payload.year));
    if (action === 'updatePayrollStatus') return respond(updatePayrollStatus(payload.payrollId, payload.status));

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
      sheet.appendRow(['ID', 'Name', 'Email', 'Father Name', 'CNIC', 'Picture', 'Bank Name', 'Bank Title', 'Bank Account Number', 'Address', 'Job Position', 'Role', 'Permissions', 'Department', 'Lead ID', 'Status', 'Joining Date', 'Contact Number', 'Start Working Time', 'Created At', 'Grace Period Minutes', 'Required Daily Working Hours', 'Allowed Leaves Per Month', 'Auto Checkout Hours', 'Timezone']);
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
    } else if (name === COMPANY_ASSETS_SHEET) {
      sheet.appendRow(['ID', 'Asset Name', 'Allocated Resource ID', 'Allocated Resource Name', 'Allocated Resource Role', 'Issuance Date', 'Return Date', 'Condition at Issuance', 'Notes', 'Created At', 'Updated At']);
    } else if (name === PAYROLL_SHEET) {
      sheet.appendRow(['ID', 'Payroll Date', 'Cheque No', 'Salary Month', 'Salary Year', 'Prepared By', 'Designation', 'Total', 'Line Items JSON', 'Payroll PDF HTML', 'Cheque Proof URL', 'Salary Received', 'Salary Received At', 'Created At']);
    } else if (name === ATTENDANCE_SHEET) {
      sheet.appendRow(['ID', 'Employee ID', 'Date', 'Day Type', 'Status', 'Leave Reason', 'Tracking Hours', 'Working Hours', 'Work Sessions JSON', 'Break Sessions JSON', 'Week1 Comment', 'Week2 Comment', 'Week3 Comment', 'Week4 Comment', 'Created At', 'Updated At']);
    } else if (name === PERFORMANCE_SHEET) {
      sheet.appendRow(['ID', 'Employee ID', 'Lead ID', 'Month', 'Year', 'Week1 Comment', 'Week1 Score', 'Week2 Comment', 'Week2 Score', 'Week3 Comment', 'Week3 Score', 'Week4 Comment', 'Week4 Score', 'Final Reviewer ID', 'Final Comment', 'Final Score', 'Created At', 'Updated At']);
    } else if (name === SALARY_SLIPS_SHEET) {
      sheet.appendRow(['ID', 'Payroll ID', 'Employee ID', 'Employee Name', 'Salary Month', 'Salary Year', 'Pay Date', 'Amount', 'Basic Pay', 'Leave Deduction', 'Late Deduction', 'Total Deductions', 'Net Pay', 'Working Days', 'Paid Leave', 'Unpaid Leave', 'Late Comings', 'Slip HTML', 'Created At']);
    } else if (name === PROJECTS_SHEET) {
      sheet.appendRow(['Project ID', 'Project Name', 'Description', 'Allowed Departments', 'Sheet Name', 'Sheet Link', 'Drive Folder ID', 'Created At']);
    } else if (name === RULES_SHEET) {
      sheet.appendRow(['ID', 'Target Role', 'Title', 'Content', 'Active', 'Sort Order', 'Created By', 'Created By Name', 'Updated By', 'Updated By Name', 'Created At', 'Updated At']);
    } else if (name === DAILY_WORK_REPORTS_SHEET) {
      sheet.appendRow(['ID', 'Employee ID', 'Employee Email', 'Date', 'Submission Type', 'Submission Time', 'Todays Summary', 'Yesterdays Plan', 'Tomorrows Plan', 'Challenges', 'Support Needed', 'Created At']);
    } else if (name === DAILY_ATTENDANCE_SUMMARY_SHEET) {
      sheet.appendRow(['ID', 'Employee ID', 'Employee Email', 'Employee Name', 'Date', 'Check-In Time', 'Check-Out Time', 'Total Working Hours', 'Is Late Check-In', 'Check-In Status', 'Status', 'Work Summary', 'Day Plan', 'Challenges And Support', 'Created At', 'Locked At', 'Session Count', 'Attendance Status', 'Required Hours', 'Overtime Hours', 'Half Day Threshold', 'Updated At']);
    } else if (name === ATTENDANCE_SESSIONS_SHEET) {
      sheet.appendRow(['ID', 'Employee ID', 'Date', 'Session Number', 'Check-In UTC', 'Check-Out UTC', 'Check-In Local', 'Check-Out Local', 'Duration Seconds', 'Is Late', 'Auto Closed', 'Created At', 'Updated At']);
    } else if (name === MONTHLY_PAYROLL_DATA_SHEET) {
      sheet.appendRow(['ID', 'Employee ID', 'Employee Name', 'Email', 'Month', 'Year', 'Base Salary', 'Total Working Days', 'Total Present', 'Total Late Comings', 'Paid Leaves Allowed', 'Paid Leaves Used', 'Unpaid Leaves Calculated', 'Remaining Paid Leaves', 'Total Leave Deduction', 'Late Penalty Deduction', 'Other Deductions', 'Total Deductions', 'Net Pay', 'Payroll Status', 'Created At', 'Updated At', 'Approved By', 'Approved At']);
    }
  }

  if (name === EMPLOYEES_SHEET && sheet.getLastRow() > 0 && sheet.getLastColumn() === 18) {
    sheet.insertColumnAfter(12);
  }
  if (name === EMPLOYEES_SHEET && sheet.getLastRow() > 0 && sheet.getLastColumn() === 19) {
    sheet.insertColumnAfter(18);
  }
  if (name === EMPLOYEES_SHEET && sheet.getLastRow() > 0 && sheet.getLastColumn() < 25) {
    if (sheet.getLastColumn() < 25) {
      sheet.insertColumnsAfter(sheet.getLastColumn(), 25 - sheet.getLastColumn());
    }
    sheet.getRange(1, 1, 1, 25).setValues([['ID', 'Name', 'Email', 'Father Name', 'CNIC', 'Picture', 'Bank Name', 'Bank Title', 'Bank Account Number', 'Address', 'Job Position', 'Role', 'Permissions', 'Department', 'Lead ID', 'Status', 'Joining Date', 'Contact Number', 'Start Working Time', 'Created At', 'Grace Period Minutes', 'Required Daily Working Hours', 'Allowed Leaves Per Month', 'Auto Checkout Hours', 'Timezone']]);
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
  if (name === PROJECTS_SHEET && sheet.getLastRow() > 0 && sheet.getLastColumn() < 8) {
    sheet.getRange(1, 1, 1, 8).setValues([['Project ID', 'Project Name', 'Description', 'Allowed Departments', 'Sheet Name', 'Sheet Link', 'Drive Folder ID', 'Created At']]);
  }
  if (name === COMPANY_ASSETS_SHEET && sheet.getLastRow() > 0 && sheet.getLastColumn() < 11) {
    sheet.getRange(1, 1, 1, 11).setValues([['ID', 'Asset Name', 'Allocated Resource ID', 'Allocated Resource Name', 'Allocated Resource Role', 'Issuance Date', 'Return Date', 'Condition at Issuance', 'Notes', 'Created At', 'Updated At']]);
  }
  if (name === RULES_SHEET && sheet.getLastRow() > 0 && sheet.getLastColumn() < 12) {
    sheet.getRange(1, 1, 1, 12).setValues([['ID', 'Target Role', 'Title', 'Content', 'Active', 'Sort Order', 'Created By', 'Created By Name', 'Updated By', 'Updated By Name', 'Created At', 'Updated At']]);
  }
  if (name === DAILY_ATTENDANCE_SUMMARY_SHEET && sheet.getLastRow() > 0 && sheet.getLastColumn() < 22) {
    if (sheet.getLastColumn() < 22) {
      sheet.insertColumnsAfter(sheet.getLastColumn(), 22 - sheet.getLastColumn());
    }
    sheet.getRange(1, 1, 1, 22).setValues([['ID', 'Employee ID', 'Employee Email', 'Employee Name', 'Date', 'Check-In Time', 'Check-Out Time', 'Total Working Hours', 'Is Late Check-In', 'Check-In Status', 'Status', 'Work Summary', 'Day Plan', 'Challenges And Support', 'Created At', 'Locked At', 'Session Count', 'Attendance Status', 'Required Hours', 'Overtime Hours', 'Half Day Threshold', 'Updated At']]);
  }
  if (name === ATTENDANCE_SESSIONS_SHEET && sheet.getLastRow() > 0 && sheet.getLastColumn() < 13) {
    if (sheet.getLastColumn() < 13) {
      sheet.insertColumnsAfter(sheet.getLastColumn(), 13 - sheet.getLastColumn());
    }
    sheet.getRange(1, 1, 1, 13).setValues([['ID', 'Employee ID', 'Date', 'Session Number', 'Check-In UTC', 'Check-Out UTC', 'Check-In Local', 'Check-Out Local', 'Duration Seconds', 'Is Late', 'Auto Closed', 'Created At', 'Updated At']]);
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

const E_HEADERS = ['id', 'name', 'email', 'fatherName', 'cnic', 'picture', 'bankName', 'bankTitle', 'bankAccountNumber', 'address', 'jobPosition', 'role', 'permissions', 'department', 'leadId', 'status', 'joiningDate', 'contactNumber', 'startWorkingTime', 'createdAt', 'gracePeriodMinutes', 'requiredDailyWorkingHours', 'allowedLeavesPerMonth', 'autoCheckoutHours', 'timezone'];

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
    body.jobPosition || '', body.role || 'employee', body.permissions || '', body.department || '', body.leadId || '', body.status || '', body.joiningDate || '', body.contactNumber || '', body.startWorkingTime || '09:00',
    createdAt, Number(body.gracePeriodMinutes || 10), Number(body.requiredDailyWorkingHours || 8), Number(body.allowedLeavesPerMonth || 1), Number(body.autoCheckoutHours || 12), String(body.timezone || Session.getScriptTimeZone() || 'UTC')
  ];
  sheet.appendRow(row);
  return { 
    id, name: body.name, email: body.email, 
    fatherName: body.fatherName || '', cnic: body.cnic || '', picture: body.picture || '',
    bankName: body.bankName || '', bankTitle: body.bankTitle || '', bankAccountNumber: body.bankAccountNumber || '',
    address: body.address || '', jobPosition: body.jobPosition || '', role: body.role || 'employee', permissions: body.permissions || '',
    department: body.department || '', leadId: body.leadId || '', status: body.status || '',
    joiningDate: body.joiningDate || '', contactNumber: body.contactNumber || '', startWorkingTime: body.startWorkingTime || '09:00', createdAt,
    gracePeriodMinutes: Number(body.gracePeriodMinutes || 10),
    requiredDailyWorkingHours: Number(body.requiredDailyWorkingHours || 8),
    allowedLeavesPerMonth: Number(body.allowedLeavesPerMonth || 1),
    autoCheckoutHours: Number(body.autoCheckoutHours || 12),
    timezone: String(body.timezone || Session.getScriptTimeZone() || 'UTC')
  };
}

function updateEmployee(id, updates) {
  const sheet = getSheet(EMPLOYEES_SHEET);
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === id) {
      const colMap = { id: 0, name: 1, email: 2, fatherName: 3, cnic: 4, picture: 5, bankName: 6, bankTitle: 7, bankAccountNumber: 8, address: 9, jobPosition: 10, role: 11, permissions: 12, department: 13, leadId: 14, status: 15, joiningDate: 16, contactNumber: 17, startWorkingTime: 18, createdAt: 19, gracePeriodMinutes: 20, requiredDailyWorkingHours: 21, allowedLeavesPerMonth: 22, autoCheckoutHours: 23, timezone: 24 };
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
const COMPANY_EXPENSE_MONTH_REGEX = /^(Jan|January|Feb|February|Mar|March|Apr|April|May|Jun|June|Jul|July|Aug|August|Sep|Sept|September|Oct|October|Nov|November|Dec|December),\s*\d{4}$/i;

function isCompanyExpenseMonthSheet(sheetName) {
  return COMPANY_EXPENSE_MONTH_REGEX.test(String(sheetName || '').trim());
}

function getCompanyExpenseHeaderRow(sheet) {
  const scanRows = Math.min(sheet.getLastRow(), 12);
  const scanCols = Math.max(Math.min(sheet.getLastColumn(), 8), 6);
  if (scanRows <= 0) return 1;

  const values = sheet.getRange(1, 1, scanRows, scanCols).getValues();
  for (let r = 0; r < values.length; r++) {
    const normalized = values[r].map(function(cell) {
      return String(cell || '').trim().toUpperCase();
    });
    if (
      normalized.indexOf('DATE') > -1 &&
      normalized.indexOf('DESCRIPTION') > -1 &&
      normalized.indexOf('AMOUNT') > -1 &&
      normalized.indexOf('PAID BY') > -1
    ) {
      return r + 1;
    }
  }

  return 1;
}

function normalizeSheetDateValue(value) {
  if (value instanceof Date) {
    return Utilities.formatDate(value, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  }
  return String(value || '');
}

function formatMonthSheetNameFromDate(dateText) {
  const date = new Date(String(dateText || ''));
  if (isNaN(date.getTime())) {
    throw new Error('Invalid company expense date');
  }
  return Utilities.formatDate(date, Session.getScriptTimeZone(), 'MMMM, yyyy');
}

function parseMonthlyCompanyExpenseRow(sheetName, rowNumber, row) {
  const rowId = String(row[10] || '').trim() || (sheetName + '__' + rowNumber);
  return {
    id: rowId,
    date: normalizeSheetDateValue(row[1]),
    description: String(row[2] || ''),
    amount: Number(row[4] || 0),
    paidBy: String(row[5] || ''),
    approvedBy: String(row[6] || ''),
    paymentMethod: String(row[7] || ''),
    receiptUrl: String(row[8] || ''),
    notes: String(row[9] || ''),
    createdAt: String(row[11] || ''),
  };
}

function getMonthlyCompanyExpenses() {
  const expenses = [];
  const sheets = SS.getSheets().filter(function(sheet) {
    return isCompanyExpenseMonthSheet(sheet.getName());
  });

  sheets.forEach(function(sheet) {
    const headerRow = getCompanyExpenseHeaderRow(sheet);
    const firstDataRow = headerRow + 1;
    const lastRow = sheet.getLastRow();
    if (lastRow < firstDataRow) return;

    const values = sheet.getRange(firstDataRow, 1, lastRow - firstDataRow + 1, Math.max(sheet.getLastColumn(), 12)).getValues();
    values.forEach(function(row, index) {
      const hasAnyValue = row.some(function(cell) {
        return String(cell || '').trim() !== '';
      });
      if (!hasAnyValue) return;

      const amount = Number(row[4] || 0);
      const description = String(row[2] || '').trim();
      const paidBy = String(row[5] || '').trim();
      if (!description && !paidBy && amount === 0) return;

      const rowNumber = firstDataRow + index;
      expenses.push(parseMonthlyCompanyExpenseRow(sheet.getName(), rowNumber, row));
    });
  });

  return expenses;
}

function getCompanyExpenses() {
  const monthly = getMonthlyCompanyExpenses();

  // Keep legacy sheet compatibility if old records exist there.
  const legacySheet = getSheet(COMPANY_EXPENSES_SHEET);
  const legacyRows = sheetToObjects(legacySheet, CE_HEADERS).map(function(r) {
    return { ...r, amount: Number(r.amount) };
  });

  return monthly.concat(legacyRows).sort(function(a, b) {
    const dateSort = String(b.date || '').localeCompare(String(a.date || ''));
    if (dateSort !== 0) return dateSort;
    return String(b.createdAt || '').localeCompare(String(a.createdAt || ''));
  });
}

function addCompanyExpense(body) {
  const targetSheetName = formatMonthSheetNameFromDate(body.date);
  let sheet = SS.getSheetByName(targetSheetName);
  if (!sheet) {
    sheet = SS.insertSheet(targetSheetName);
    sheet.appendRow(['SR NO', 'DATE', 'DESCRIPTION', 'REF NO', 'AMOUNT', 'PAID BY', 'APPROVED BY', 'PAYMENT METHOD', 'RECEIPT URL', 'NOTES', 'ID', 'CREATED AT']);
  }

  const headerRow = getCompanyExpenseHeaderRow(sheet);
  const firstDataRow = headerRow + 1;
  const nextRow = Math.max(sheet.getLastRow() + 1, firstDataRow);
  const serialNo = Math.max(1, nextRow - headerRow);
  const id = generateId();
  const createdAt = new Date().toISOString();
  const row = [
    serialNo,
    body.date,
    body.description,
    body.referenceNo || '',
    body.amount,
    body.paidBy,
    body.approvedBy,
    body.paymentMethod || '',
    body.receiptUrl || '',
    body.notes || '',
    id,
    createdAt,
  ];
  sheet.getRange(nextRow, 1, 1, row.length).setValues([row]);
  return { 
    id, date: body.date, description: body.description, amount: Number(body.amount),
    paidBy: body.paidBy, approvedBy: body.approvedBy, 
    paymentMethod: body.paymentMethod || '', receiptUrl: body.receiptUrl || '',
    notes: body.notes || '', createdAt 
  };
}

function updateCompanyExpense(id, updates) {
  if (!id) throw new Error('id is required');
  if (!updates || typeof updates !== 'object') throw new Error('updates are required');

  // Update monthly sheets first.
  const monthlySheets = SS.getSheets().filter(function(sheet) {
    return isCompanyExpenseMonthSheet(sheet.getName());
  });

  for (let s = 0; s < monthlySheets.length; s++) {
    const sheet = monthlySheets[s];
    const headerRow = getCompanyExpenseHeaderRow(sheet);
    const firstDataRow = headerRow + 1;
    const lastRow = sheet.getLastRow();
    if (lastRow < firstDataRow) continue;

    const values = sheet.getRange(firstDataRow, 1, lastRow - firstDataRow + 1, Math.max(sheet.getLastColumn(), 12)).getValues();
    for (let i = 0; i < values.length; i++) {
      const rowNumber = firstDataRow + i;
      const row = values[i];
      const rowId = String(row[10] || '').trim() || (sheet.getName() + '__' + rowNumber);
      if (rowId !== String(id)) continue;

      const updated = {
        id: rowId,
        date: updates.date !== undefined ? updates.date : row[1],
        description: updates.description !== undefined ? updates.description : row[2],
        amount: updates.amount !== undefined ? Number(updates.amount) : Number(row[4] || 0),
        paidBy: updates.paidBy !== undefined ? updates.paidBy : row[5],
        approvedBy: updates.approvedBy !== undefined ? updates.approvedBy : row[6],
        paymentMethod: updates.paymentMethod !== undefined ? updates.paymentMethod : row[7],
        receiptUrl: updates.receiptUrl !== undefined ? updates.receiptUrl : row[8],
        notes: updates.notes !== undefined ? updates.notes : row[9],
        createdAt: String(row[11] || ''),
      };

      sheet.getRange(rowNumber, 2).setValue(updated.date);
      sheet.getRange(rowNumber, 3).setValue(updated.description);
      sheet.getRange(rowNumber, 5).setValue(updated.amount);
      sheet.getRange(rowNumber, 6).setValue(updated.paidBy);
      sheet.getRange(rowNumber, 7).setValue(updated.approvedBy);
      sheet.getRange(rowNumber, 8).setValue(updated.paymentMethod);
      sheet.getRange(rowNumber, 9).setValue(updated.receiptUrl);
      sheet.getRange(rowNumber, 10).setValue(updated.notes);

      return updated;
    }
  }

  // Legacy sheet fallback.
  const legacySheet = getSheet(COMPANY_EXPENSES_SHEET);
  const data = legacySheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) !== String(id)) continue;

    const colMap = {
      date: 1,
      description: 2,
      amount: 3,
      paidBy: 4,
      approvedBy: 5,
      paymentMethod: 6,
      receiptUrl: 7,
      notes: 8,
    };

    for (const key in updates) {
      if (colMap[key] === undefined) continue;
      legacySheet.getRange(i + 1, colMap[key] + 1).setValue(updates[key]);
      data[i][colMap[key]] = updates[key];
    }

    return {
      id: String(data[i][0] || ''),
      date: String(data[i][1] || ''),
      description: String(data[i][2] || ''),
      amount: Number(data[i][3] || 0),
      paidBy: String(data[i][4] || ''),
      approvedBy: String(data[i][5] || ''),
      paymentMethod: String(data[i][6] || ''),
      receiptUrl: String(data[i][7] || ''),
      notes: String(data[i][8] || ''),
      createdAt: String(data[i][9] || ''),
    };
  }

  throw new Error('Company expense not found: ' + id);
}

function deleteCompanyExpense(id) {
  if (!id) throw new Error('id is required');

  // Delete from monthly sheets (ID column or composite ID fallback).
  const monthlySheets = SS.getSheets().filter(function(sheet) {
    return isCompanyExpenseMonthSheet(sheet.getName());
  });
  for (let s = 0; s < monthlySheets.length; s++) {
    const sheet = monthlySheets[s];
    const headerRow = getCompanyExpenseHeaderRow(sheet);
    const firstDataRow = headerRow + 1;
    const lastRow = sheet.getLastRow();
    if (lastRow < firstDataRow) continue;

    const values = sheet.getRange(firstDataRow, 1, lastRow - firstDataRow + 1, Math.max(sheet.getLastColumn(), 12)).getValues();
    for (let i = 0; i < values.length; i++) {
      const rowNumber = firstDataRow + i;
      const row = values[i];
      const rowId = String(row[10] || '').trim() || (sheet.getName() + '__' + rowNumber);
      if (rowId === String(id)) {
        sheet.deleteRow(rowNumber);
        return null;
      }
    }
  }

  // Legacy fallback.
  const legacySheet = getSheet(COMPANY_EXPENSES_SHEET);
  const data = legacySheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) {
      legacySheet.deleteRow(i + 1);
      return null;
    }
  }

  throw new Error('Company expense not found: ' + id);
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

// ============ COMPANY ASSETS ============

const CA_HEADERS = ['id', 'assetName', 'allocatedResourceId', 'allocatedResourceName', 'allocatedResourceRole', 'issuanceDate', 'returnDate', 'conditionAtIssuance', 'notes', 'createdAt', 'updatedAt'];

function parseCompanyAssetRow(row) {
  return {
    id: String(row[0] || ''),
    assetName: String(row[1] || ''),
    allocatedResourceId: String(row[2] || ''),
    allocatedResourceName: String(row[3] || ''),
    allocatedResourceRole: String(row[4] || ''),
    issuanceDate: String(row[5] || ''),
    returnDate: String(row[6] || ''),
    conditionAtIssuance: String(row[7] || ''),
    notes: String(row[8] || ''),
    createdAt: String(row[9] || ''),
    updatedAt: String(row[10] || ''),
  };
}

function getEmployeeAllocationById(employeeId) {
  if (!employeeId) {
    return { id: '', name: 'None', role: '' };
  }

  const sheet = getSheet(EMPLOYEES_SHEET);
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(employeeId)) {
      return {
        id: String(employeeId),
        name: String(data[i][1] || ''),
        role: String(data[i][11] || ''),
      };
    }
  }

  return { id: String(employeeId), name: 'None', role: '' };
}

function normalizeAssetAllocation(allocatedResourceId, allocatedResourceName, allocatedResourceRole) {
  const id = String(allocatedResourceId || '').trim();
  if (!id || id.toLowerCase() === 'none') {
    return {
      allocatedResourceId: '',
      allocatedResourceName: 'None',
      allocatedResourceRole: '',
    };
  }

  const employee = getEmployeeAllocationById(id);
  return {
    allocatedResourceId: id,
    allocatedResourceName: String(employee.name || allocatedResourceName || '').trim() || 'None',
    allocatedResourceRole: String(employee.role || allocatedResourceRole || '').trim(),
  };
}

function getCompanyAssets() {
  const sheet = getSheet(COMPANY_ASSETS_SHEET);
  const rows = sheetToObjects(sheet, CA_HEADERS);
  return rows.map((row) => ({
    ...row,
    allocatedResourceId: String(row.allocatedResourceId || ''),
    allocatedResourceName: String(row.allocatedResourceName || 'None'),
    allocatedResourceRole: String(row.allocatedResourceRole || ''),
  }));
}

function addCompanyAsset(body) {
  const sheet = getSheet(COMPANY_ASSETS_SHEET);
  const id = generateId();
  const createdAt = new Date().toISOString();
  const updatedAt = createdAt;
  const allocation = normalizeAssetAllocation(body.allocatedResourceId, body.allocatedResourceName, body.allocatedResourceRole);

  sheet.appendRow([
    id,
    String(body.assetName || '').trim(),
    allocation.allocatedResourceId,
    allocation.allocatedResourceName,
    allocation.allocatedResourceRole,
    String(body.issuanceDate || ''),
    String(body.returnDate || ''),
    String(body.conditionAtIssuance || ''),
    String(body.notes || ''),
    createdAt,
    updatedAt,
  ]);

  return {
    id,
    assetName: String(body.assetName || '').trim(),
    allocatedResourceId: allocation.allocatedResourceId,
    allocatedResourceName: allocation.allocatedResourceName,
    allocatedResourceRole: allocation.allocatedResourceRole,
    issuanceDate: String(body.issuanceDate || ''),
    returnDate: String(body.returnDate || ''),
    conditionAtIssuance: String(body.conditionAtIssuance || ''),
    notes: String(body.notes || ''),
    createdAt,
    updatedAt,
  };
}

function updateCompanyAsset(id, updates) {
  if (!id) throw new Error('id is required');

  const sheet = getSheet(COMPANY_ASSETS_SHEET);
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) !== String(id)) continue;

    const existing = parseCompanyAssetRow(data[i]);
    const merged = Object.assign({}, existing, updates || {});
    const allocation = normalizeAssetAllocation(merged.allocatedResourceId, merged.allocatedResourceName, merged.allocatedResourceRole);
    const nowIso = new Date().toISOString();

    const nextAsset = {
      id: existing.id,
      assetName: String(merged.assetName || '').trim(),
      allocatedResourceId: allocation.allocatedResourceId,
      allocatedResourceName: allocation.allocatedResourceName,
      allocatedResourceRole: allocation.allocatedResourceRole,
      issuanceDate: String(merged.issuanceDate || ''),
      returnDate: String(merged.returnDate || ''),
      conditionAtIssuance: String(merged.conditionAtIssuance || ''),
      notes: String(merged.notes || ''),
      createdAt: existing.createdAt,
      updatedAt: nowIso,
    };

    sheet.getRange(i + 1, 1, 1, 11).setValues([[
      nextAsset.id,
      nextAsset.assetName,
      nextAsset.allocatedResourceId,
      nextAsset.allocatedResourceName,
      nextAsset.allocatedResourceRole,
      nextAsset.issuanceDate,
      nextAsset.returnDate,
      nextAsset.conditionAtIssuance,
      nextAsset.notes,
      nextAsset.createdAt,
      nextAsset.updatedAt,
    ]]);

    return nextAsset;
  }

  throw new Error('Company asset not found: ' + id);
}

function deleteCompanyAsset(id) {
  if (!id) throw new Error('id is required');

  const sheet = getSheet(COMPANY_ASSETS_SHEET);
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) {
      sheet.deleteRow(i + 1);
      return null;
    }
  }

  throw new Error('Company asset not found: ' + id);
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

function getAttendanceRecords() {
  const sheet = getSheet(ATTENDANCE_SHEET);
  const rows = sheetToObjects(sheet, A_HEADERS);
  return rows.map(parseAttendanceObject);
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

function getPerformanceRecords() {
  const sheet = getSheet(PERFORMANCE_SHEET);
  const rows = sheetToObjects(sheet, PERF_HEADERS);

  return rows.map(function(found) {
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
  });
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
    if (reviewerRole !== 'hr' && reviewerRole !== 'admin' && reviewerRole !== 'higher-management') {
      throw new Error('Only HR or Admin can add final performance review and score.');
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

// ============ PROJECT DOCUMENTS ============

const DEFAULT_PROJECTS = [
  {
    id: 'portal-revamp',
    name: 'Portal Revamp',
    description: 'UI, UX, and platform modernization tasks for the internal portal.',
    allowedDepartments: ['web', 'overall'],
  },
  {
    id: 'mobile-app',
    name: 'Mobile App',
    description: 'Cross-platform mobile app feature development and release documents.',
    allowedDepartments: ['app', 'overall'],
  },
  {
    id: 'api-foundation',
    name: 'API Foundation',
    description: 'Backend architecture, API contracts, and integration documentation.',
    allowedDepartments: ['backend', 'overall'],
  },
  {
    id: 'company-wide',
    name: 'Company Wide Operations',
    description: 'Shared company-level docs, policy files, and cross-team standards.',
    allowedDepartments: ['overall', 'web', 'app', 'backend'],
  },
];

const PROJECT_DOC_HEADERS = ['ID', 'Title', 'Description', 'File Name', 'File Type', 'File Size', 'File URL', 'Uploaded By', 'Uploaded By Name', 'Uploaded At', 'Access List JSON', 'Drive File ID'];

function sanitizeSheetName(name) {
  const sanitized = String(name || '')
    .replace(/[\\\/?*\[\]:]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return sanitized.substring(0, 80) || 'Project';
}

function getProjectDocsRootFolder() {
  const props = PropertiesService.getScriptProperties();
  const existingId = props.getProperty(PROJECT_FOLDER_PROPERTY_KEY);
  if (existingId) {
    try {
      return DriveApp.getFolderById(existingId);
    } catch (err) {
      props.deleteProperty(PROJECT_FOLDER_PROPERTY_KEY);
    }
  }

  const folder = DriveApp.createFolder(SS.getName() + ' - Project Documents');
  props.setProperty(PROJECT_FOLDER_PROPERTY_KEY, folder.getId());
  return folder;
}

function getProjectIndexRows() {
  const sheet = getSheet(PROJECTS_SHEET);
  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) return [];

  return values.slice(1).map(function(row, index) {
    return {
      rowNumber: index + 2,
      projectId: String(row[0] || ''),
      name: String(row[1] || ''),
      description: String(row[2] || ''),
      allowedDepartments: String(row[3] || ''),
      sheetName: String(row[4] || ''),
      sheetLink: String(row[5] || ''),
      folderId: String(row[6] || ''),
      createdAt: String(row[7] || ''),
    };
  });
}

function ensureProjectSheet(projectId, projectName) {
  const targetName = sanitizeSheetName('Project - ' + projectName + ' [' + projectId + ']');
  let sheet = SS.getSheetByName(targetName);
  if (!sheet) {
    sheet = SS.insertSheet(targetName);
    sheet.appendRow(PROJECT_DOC_HEADERS);
  } else if (sheet.getLastRow() === 0) {
    sheet.appendRow(PROJECT_DOC_HEADERS);
  }
  return sheet;
}

function ensureProjectFolder(projectId, projectName) {
  const root = getProjectDocsRootFolder();
  const name = sanitizeSheetName(projectName + ' - ' + projectId);
  const folders = root.getFoldersByName(name);
  if (folders.hasNext()) return folders.next();
  return root.createFolder(name);
}

function getProjectSheetLink(sheet) {
  return SS.getUrl() + '#gid=' + sheet.getSheetId();
}

function ensureProjectInIndex(project, options) {
  var opts = options || {};
  var shouldEnsureDriveFolder = !!opts.ensureDriveFolder;
  const sheet = getSheet(PROJECTS_SHEET);
  const rows = getProjectIndexRows();
  const existing = rows.find(function(row) { return row.projectId === project.id; });
  const nowIso = new Date().toISOString();

  const projectSheet = ensureProjectSheet(project.id, project.name);
  let projectFolderId = '';
  if (existing && existing.folderId) {
    projectFolderId = existing.folderId;
  }
  if (shouldEnsureDriveFolder && !projectFolderId) {
    projectFolderId = ensureProjectFolder(project.id, project.name).getId();
  }
  const sheetLink = getProjectSheetLink(projectSheet);
  const allowedDepartmentsText = (project.allowedDepartments || []).join(',');

  if (existing) {
    sheet.getRange(existing.rowNumber, 2).setValue(project.name);
    sheet.getRange(existing.rowNumber, 3).setValue(project.description || '');
    sheet.getRange(existing.rowNumber, 4).setValue(allowedDepartmentsText);
    sheet.getRange(existing.rowNumber, 5).setValue(projectSheet.getName());
    sheet.getRange(existing.rowNumber, 6).setValue(sheetLink);
    if (shouldEnsureDriveFolder) {
      sheet.getRange(existing.rowNumber, 7).setValue(projectFolderId);
    }

    return {
      projectId: project.id,
      name: project.name,
      description: project.description || '',
      allowedDepartments: project.allowedDepartments || [],
      sheetName: projectSheet.getName(),
      sheetLink: sheetLink,
      folderId: projectFolderId,
      createdAt: existing.createdAt || nowIso,
    };
  }

  sheet.appendRow([
    project.id,
    project.name,
    project.description || '',
    allowedDepartmentsText,
    projectSheet.getName(),
    sheetLink,
    projectFolderId,
    nowIso,
  ]);

  return {
    projectId: project.id,
    name: project.name,
    description: project.description || '',
    allowedDepartments: project.allowedDepartments || [],
    sheetName: projectSheet.getName(),
    sheetLink: sheetLink,
    folderId: projectFolderId,
    createdAt: nowIso,
  };
}

function bootstrapDefaultProjects() {
  const existingRows = getProjectIndexRows();
  const existingIds = existingRows.map(function(row) { return row.projectId; });

  for (var i = 0; i < DEFAULT_PROJECTS.length; i++) {
    const project = DEFAULT_PROJECTS[i];
    if (existingIds.indexOf(project.id) === -1) {
      ensureProjectInIndex(project, { ensureDriveFolder: false });
    }
  }
}

function ensureProjectDriveFolderAndUpdate(projectRow) {
  if (projectRow && projectRow.folderId) {
    try {
      DriveApp.getFolderById(projectRow.folderId);
      return projectRow.folderId;
    } catch (err) {
      // Continue and recreate folder when stored ID is invalid.
    }
  }

  const project = {
    id: projectRow.projectId,
    name: projectRow.name,
    description: projectRow.description,
    allowedDepartments: String(projectRow.allowedDepartments || '')
      .split(',')
      .map(function(item) { return item.trim(); })
      .filter(function(item) { return item; }),
  };

  const ensured = ensureProjectInIndex(project, { ensureDriveFolder: true });
  return ensured.folderId;
}

function parseProjectItem(row) {
  const allowedDepartments = String(row.allowedDepartments || '')
    .split(',')
    .map(function(item) { return item.trim(); })
    .filter(function(item) { return item; });

  return {
    id: row.projectId,
    name: row.name,
    description: row.description,
    allowedDepartments: allowedDepartments,
    createdAt: row.createdAt,
  };
}

function getProjects() {
  bootstrapDefaultProjects();
  return getProjectIndexRows()
    .map(parseProjectItem)
    .sort(function(a, b) { return String(a.name).localeCompare(String(b.name)); });
}

function getProjectDocumentCounts() {
  bootstrapDefaultProjects();
  const rows = getProjectIndexRows();
  const counts = {};

  rows.forEach(function(row) {
    if (!row.projectId || !row.sheetName) return;
    const sheet = SS.getSheetByName(row.sheetName);
    if (!sheet) {
      counts[row.projectId] = 0;
      return;
    }
    counts[row.projectId] = Math.max(0, sheet.getLastRow() - 1);
  });

  return counts;
}

function getManagementDashboardData() {
  return {
    employees: getEmployees(),
    penalties: getPenalties(),
    companyExpenses: getCompanyExpenses(),
    companyIncomes: getCompanyIncomes(),
    payrollRecords: getPayrollRecords(),
    projects: getProjects(),
    projectDocumentCounts: getProjectDocumentCounts(),
    attendanceRecords: getAttendanceRecords(),
    performanceRecords: getPerformanceRecords(),
  };
}

function getStaffDashboardData(employeeId, month, year) {
  if (!employeeId) throw new Error('employeeId is required');
  const m = Number(month);
  const y = Number(year);
  if (!m || !y) throw new Error('month and year are required');

  return {
    employees: getEmployees(),
    penalties: getPenalties(),
    salarySlips: getSalarySlipsForEmployee(employeeId),
    monthlyAttendance: getEmployeeMonthlyAttendance(employeeId, m, y),
    currentPerformance: getPerformanceRecord(employeeId, m, y),
  };
}

function findProjectRow(projectId) {
  bootstrapDefaultProjects();
  const rows = getProjectIndexRows();
  return rows.find(function(row) { return row.projectId === String(projectId || ''); }) || null;
}

function parseDocumentRow(row) {
  var accessList = [];
  try {
    accessList = row[10] ? JSON.parse(String(row[10])) : [];
  } catch (err) {
    accessList = [];
  }

  return {
    id: String(row[0] || ''),
    title: String(row[1] || ''),
    description: String(row[2] || ''),
    fileName: String(row[3] || ''),
    fileType: String(row[4] || ''),
    fileSize: Number(row[5] || 0),
    fileUrl: String(row[6] || ''),
    uploadedBy: String(row[7] || ''),
    uploadedByName: String(row[8] || ''),
    uploadedAt: String(row[9] || ''),
    accessList: accessList,
    driveFileId: String(row[11] || ''),
  };
}

function getProjectDocuments(projectId) {
  if (!projectId) throw new Error('projectId is required');
  const projectRow = findProjectRow(projectId);
  if (!projectRow) return [];

  const sheet = SS.getSheetByName(projectRow.sheetName);
  if (!sheet) return [];

  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) return [];

  return values.slice(1).map(function(row) {
    const document = parseDocumentRow(row);
    document.projectId = String(projectId);
    return document;
  }).sort(function(a, b) {
    return String(b.uploadedAt).localeCompare(String(a.uploadedAt));
  });
}

function decodeDataUrl(content) {
  if (!content) throw new Error('fileContent is required');
  const raw = String(content);
  const commaIndex = raw.indexOf(',');
  if (raw.indexOf('data:') === 0 && commaIndex > -1) {
    return raw.substring(commaIndex + 1);
  }
  return raw;
}

function uploadProjectDocument(payload) {
  if (!payload || !payload.projectId) throw new Error('projectId is required');
  if (!payload.fileName) throw new Error('fileName is required');
  if (!payload.fileContent) throw new Error('fileContent is required');

  const projectRow = findProjectRow(payload.projectId);
  if (!projectRow) throw new Error('Project not found: ' + payload.projectId);

  const projectSheet = SS.getSheetByName(projectRow.sheetName) || ensureProjectSheet(projectRow.projectId, projectRow.name);
  const folderId = ensureProjectDriveFolderAndUpdate(projectRow);
  const folder = DriveApp.getFolderById(folderId);
  const base64 = decodeDataUrl(payload.fileContent);
  const bytes = Utilities.base64Decode(base64);
  const blob = Utilities.newBlob(bytes, payload.fileType || 'application/octet-stream', payload.fileName);
  const driveFile = folder.createFile(blob);

  const accessList = Array.isArray(payload.accessList) ? payload.accessList : [];
  const nowIso = new Date().toISOString();
  const documentId = generateId();

  projectSheet.appendRow([
    documentId,
    String(payload.title || payload.fileName),
    String(payload.description || ''),
    String(payload.fileName || ''),
    String(payload.fileType || 'application/octet-stream'),
    Number(payload.fileSize || blob.getBytes().length || 0),
    driveFile.getUrl(),
    String(payload.uploadedBy || ''),
    String(payload.uploadedByName || ''),
    nowIso,
    JSON.stringify(Array.from(new Set(accessList))),
    driveFile.getId(),
  ]);

  return {
    id: documentId,
    projectId: String(projectRow.projectId),
    title: String(payload.title || payload.fileName),
    description: String(payload.description || ''),
    fileName: String(payload.fileName || ''),
    fileType: String(payload.fileType || 'application/octet-stream'),
    fileSize: Number(payload.fileSize || blob.getBytes().length || 0),
    fileUrl: driveFile.getUrl(),
    uploadedBy: String(payload.uploadedBy || ''),
    uploadedByName: String(payload.uploadedByName || ''),
    uploadedAt: nowIso,
    accessList: Array.from(new Set(accessList)),
  };
}

function updateProjectDocumentAccess(payload) {
  if (!payload || !payload.projectId) throw new Error('projectId is required');
  if (!payload.documentId) throw new Error('documentId is required');

  const projectRow = findProjectRow(payload.projectId);
  if (!projectRow) throw new Error('Project not found: ' + payload.projectId);

  const sheet = SS.getSheetByName(projectRow.sheetName);
  if (!sheet) throw new Error('Project sheet not found: ' + projectRow.sheetName);

  const data = sheet.getDataRange().getValues();
  const accessList = Array.isArray(payload.accessList) ? Array.from(new Set(payload.accessList)) : [];

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) !== String(payload.documentId)) continue;
    sheet.getRange(i + 1, 11).setValue(JSON.stringify(accessList));
    data[i][10] = JSON.stringify(accessList);

    const updated = parseDocumentRow(data[i]);
    updated.projectId = String(payload.projectId);
    return updated;
  }

  throw new Error('Document not found: ' + payload.documentId);
}

// ============ RULES ============

const RULE_HEADERS = ['id', 'targetRole', 'title', 'content', 'active', 'sortOrder', 'createdBy', 'createdByName', 'updatedBy', 'updatedByName', 'createdAt', 'updatedAt'];

function normalizeRuleTargetRole(role) {
  const raw = String(role || 'all');
  const value = raw === 'higher-management' ? 'admin' : raw;
  const allowed = ['all', 'employee', 'lead', 'manager', 'hr', 'admin'];
  return allowed.indexOf(value) === -1 ? 'all' : value;
}

function parseRuleRow(row) {
  return {
    id: String(row[0] || ''),
    targetRole: normalizeRuleTargetRole(row[1]),
    title: String(row[2] || ''),
    content: String(row[3] || ''),
    active: String(row[4]).toLowerCase() !== 'false',
    sortOrder: Number(row[5] || 0),
    createdBy: String(row[6] || ''),
    createdByName: String(row[7] || ''),
    updatedBy: String(row[8] || ''),
    updatedByName: String(row[9] || ''),
    createdAt: String(row[10] || ''),
    updatedAt: String(row[11] || ''),
  };
}

function getRulesSheetRows() {
  const sheet = getSheet(RULES_SHEET);
  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) return [];

  return values.slice(1).map(function(row, index) {
    return {
      rowNumber: index + 2,
      rule: parseRuleRow(row),
    };
  });
}

function getRules() {
  const rows = getRulesSheetRows();
  const rules = rows.map(function(item) { return item.rule; }).sort(function(a, b) {
    const sortDiff = Number(a.sortOrder || 0) - Number(b.sortOrder || 0);
    if (sortDiff !== 0) return sortDiff;
    return String(b.updatedAt || b.createdAt || '').localeCompare(String(a.updatedAt || a.createdAt || ''));
  });

  const latestUpdatedAt = rules.reduce(function(latest, rule) {
    const timestamp = String(rule.updatedAt || rule.createdAt || '');
    return timestamp > latest ? timestamp : latest;
  }, '');

  return { rules: rules, latestUpdatedAt: latestUpdatedAt };
}

function addRule(payload) {
  if (!payload) throw new Error('payload is required');
  if (!String(payload.title || '').trim()) throw new Error('title is required');
  if (!String(payload.content || '').trim()) throw new Error('content is required');

  const sheet = getSheet(RULES_SHEET);
  const nowIso = new Date().toISOString();
  const id = generateId();
  const rule = {
    id: id,
    targetRole: normalizeRuleTargetRole(payload.targetRole),
    title: String(payload.title || '').trim(),
    content: String(payload.content || '').trim(),
    active: payload.active !== false,
    sortOrder: Number(payload.sortOrder || 0),
    createdBy: String(payload.createdBy || ''),
    createdByName: String(payload.createdByName || ''),
    updatedBy: String(payload.updatedBy || payload.createdBy || ''),
    updatedByName: String(payload.updatedByName || payload.createdByName || ''),
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  sheet.appendRow([
    rule.id,
    rule.targetRole,
    rule.title,
    rule.content,
    String(rule.active),
    rule.sortOrder,
    rule.createdBy,
    rule.createdByName,
    rule.updatedBy,
    rule.updatedByName,
    rule.createdAt,
    rule.updatedAt,
  ]);

  return rule;
}

function updateRule(id, updates) {
  if (!id) throw new Error('id is required');

  const sheet = getSheet(RULES_SHEET);
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) !== String(id)) continue;

    const nowIso = new Date().toISOString();
    const rule = parseRuleRow(data[i]);
    if (updates.targetRole !== undefined) {
      rule.targetRole = normalizeRuleTargetRole(updates.targetRole);
      sheet.getRange(i + 1, 2).setValue(rule.targetRole);
    }
    if (updates.title !== undefined) {
      rule.title = String(updates.title || '').trim();
      sheet.getRange(i + 1, 3).setValue(rule.title);
    }
    if (updates.content !== undefined) {
      rule.content = String(updates.content || '').trim();
      sheet.getRange(i + 1, 4).setValue(rule.content);
    }
    if (updates.active !== undefined) {
      rule.active = !!updates.active;
      sheet.getRange(i + 1, 5).setValue(String(rule.active));
    }
    if (updates.sortOrder !== undefined) {
      rule.sortOrder = Number(updates.sortOrder || 0);
      sheet.getRange(i + 1, 6).setValue(rule.sortOrder);
    }
    if (updates.updatedBy !== undefined) {
      rule.updatedBy = String(updates.updatedBy || '');
      sheet.getRange(i + 1, 9).setValue(rule.updatedBy);
    }
    if (updates.updatedByName !== undefined) {
      rule.updatedByName = String(updates.updatedByName || '');
      sheet.getRange(i + 1, 10).setValue(rule.updatedByName);
    }

    rule.updatedAt = nowIso;
    sheet.getRange(i + 1, 12).setValue(nowIso);
    return rule;
  }

  throw new Error('Rule not found: ' + id);
}

function deleteRule(id) {
  if (!id) throw new Error('id is required');

  const sheet = getSheet(RULES_SHEET);
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) {
      sheet.deleteRow(i + 1);
      return null;
    }
  }

  throw new Error('Rule not found: ' + id);
}

// ============ DAILY WORK REPORTS & ATTENDANCE SYSTEM ============

const DWR_HEADERS = ['id', 'employeeId', 'employeeEmail', 'date', 'submissionType', 'submissionTime', 'todaysSummary', 'yesterdaysPlan', 'tomorrowsPlan', 'challenges', 'supportNeeded', 'createdAt'];
const DAS_HEADERS = ['id', 'employeeId', 'employeeEmail', 'employeeName', 'date', 'checkInTime', 'checkOutTime', 'totalWorkingHours', 'isLateCheckIn', 'checkInStatus', 'status', 'workSummary', 'dayPlan', 'challengesAndSupport', 'createdAt', 'lockedAt', 'sessionCount', 'attendanceStatus', 'requiredHours', 'overtimeHours', 'halfDayThreshold', 'updatedAt'];
const SESSION_HEADERS = ['id', 'employeeId', 'date', 'sessionNumber', 'checkInUtc', 'checkOutUtc', 'checkInLocal', 'checkOutLocal', 'durationSeconds', 'isLate', 'autoClosed', 'createdAt', 'updatedAt'];
const MPD_HEADERS = ['id', 'employeeId', 'employeeName', 'email', 'month', 'year', 'baseSalary', 'totalWorkingDays', 'totalPresent', 'totalLateComings', 'paidLeavesAllowed', 'paidLeavesUsed', 'unpaidLeavesCalculated', 'remainingPaidLeaves', 'totalLeaveDeduction', 'latePenaltyDeduction', 'otherDeductions', 'totalDeductions', 'netPay', 'payrollStatus', 'createdAt', 'updatedAt', 'approvedBy', 'approvedAt'];

/**
 * Submit daily work report (check-in or check-out)
 * When a check-out is submitted, automatically creates/updates daily attendance summary
 */
function submitDailyWorkReport(body) {
  if (!body.employeeId || !body.employeeEmail || !body.date) {
    throw new Error('employeeId, employeeEmail, and date are required');
  }

  const existingRows = getSheet(DAILY_WORK_REPORTS_SHEET).getDataRange().getValues();
  let hasCheckIn = false;
  let hasSameType = false;
  for (let i = 1; i < existingRows.length; i++) {
    const row = existingRows[i];
    if (String(row[1]) === String(body.employeeId) && String(row[3]) === String(body.date)) {
      if (String(row[4]) === 'Check-In') hasCheckIn = true;
      if (String(row[4]) === String(body.submissionType)) hasSameType = true;
    }
  }

  if (hasSameType) {
    throw new Error(String(body.submissionType) + ' already submitted for today.');
  }
  if (String(body.submissionType) === 'Check-Out' && !hasCheckIn) {
    throw new Error('Please submit Check-In first, then Check-Out.');
  }

  const sheet = getSheet(DAILY_WORK_REPORTS_SHEET);
  const id = generateId();
  const now = new Date().toISOString();
  
  const newRow = [
    id,
    String(body.employeeId),
    String(body.employeeEmail).toLowerCase(),
    String(body.date),
    String(body.submissionType), // Check-In or Check-Out
    String(body.submissionTime),
    String(body.todaysSummary || ''),
    String(body.yesterdaysPlan || ''),
    String(body.tomorrowsPlan || ''),
    String(body.challenges || ''),
    String(body.supportNeeded || ''),
    now
  ];
  
  sheet.appendRow(newRow);
  
  const submission = {
    id, 
    employeeId: String(body.employeeId),
    employeeEmail: String(body.employeeEmail).toLowerCase(),
    date: String(body.date),
    submissionType: String(body.submissionType),
    submissionTime: String(body.submissionTime),
    todaysSummary: String(body.todaysSummary || ''),
    yesterdaysPlan: String(body.yesterdaysPlan || ''),
    tomorrowsPlan: String(body.tomorrowsPlan || ''),
    challenges: String(body.challenges || ''),
    supportNeeded: String(body.supportNeeded || ''),
    createdAt: now
  };

  // If this is a check-out, merge it with check-in and update daily attendance
  if (body.submissionType === 'Check-Out') {
    mergeDailySubmissions(String(body.employeeId), String(body.employeeEmail).toLowerCase(), String(body.date), String(body.submissionTime));
  }

  return submission;
}

/**
 * Get all daily work submissions
 */
function getDailyWorkSubmissions() {
  const sheet = getSheet(DAILY_WORK_REPORTS_SHEET);
  return sheetToObjects(sheet, DWR_HEADERS);
}

/**
 * Merge check-in and check-out submissions into daily attendance summary
 * This is called auto-matically when a check-out is submitted
 */
function mergeDailySubmissions(employeeId, employeeEmail, date, checkOutTime) {
  const submissionsSheet = getSheet(DAILY_WORK_REPORTS_SHEET);
  const attendanceSheet = getSheet(DAILY_ATTENDANCE_SUMMARY_SHEET);
  const employeesSheet = getSheet(EMPLOYEES_SHEET);
  
  // Get all submissions for this employee on this date
  const rows = submissionsSheet.getDataRange().getValues();
  let checkInTime = null;
  let workSummary = '';
  let dayPlan = '';
  let challengesAndSupport = '';
  
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (String(row[1]) === employeeId && String(row[3]) === date) {
      if (String(row[4]) === 'Check-In') {
        checkInTime = String(row[5]);
      } else if (String(row[4]) === 'Check-Out') {
        workSummary = String(row[6]);
        dayPlan = String(row[7]);
        challengesAndSupport = String(row[9]) + ' ' + String(row[10]);
      }
    }
  }
  
  if (!checkInTime) return; // Wait for check-in before creating record
  
  // Find employee name
  const empRows = employeesSheet.getDataRange().getValues();
  let employeeName = '';
  let startWorkingTime = '09:00';
  for (let i = 1; i < empRows.length; i++) {
    if (String(empRows[i][0]) === employeeId) {
      employeeName = String(empRows[i][1]);
      startWorkingTime = String(empRows[i][18] || '09:00');
      break;
    }
  }
  
  // Calculate working hours
  const checkInDate = new Date(checkInTime);
  const checkOutDate = new Date(checkOutTime);
  const diffMs = checkOutDate.getTime() - checkInDate.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  const totalWorkingHours = Math.round(diffHours * 100) / 100; // Round to 2 decimals
  
  // Check if late
  const checkInHour = checkInDate.getHours();
  const checkInMinute = checkInDate.getMinutes();
  const parsedStartTime = parseWorkingTime(startWorkingTime);
  const lateThresholdMinutes = (parsedStartTime.hour * 60) + parsedStartTime.minute + 10;
  const checkInTotalMinutes = (checkInHour * 60) + checkInMinute;
  const isLateCheckIn = checkInTotalMinutes > lateThresholdMinutes;
  const checkInStatus = isLateCheckIn ? 'Late' : 'On Time';
  
  // Check if record exists, update or create
  const attendanceRows = attendanceSheet.getDataRange().getValues();
  let found = false;
  
  for (let i = 1; i < attendanceRows.length; i++) {
    if (String(attendanceRows[i][1]) === employeeId && String(attendanceRows[i][4]) === date) {
      // Update existing record
      attendanceSheet.getRange(i + 1, 6).setValue(checkInTime);
      attendanceSheet.getRange(i + 1, 7).setValue(checkOutTime);
      attendanceSheet.getRange(i + 1, 8).setValue(totalWorkingHours);
      attendanceSheet.getRange(i + 1, 9).setValue(String(isLateCheckIn));
      attendanceSheet.getRange(i + 1, 10).setValue(checkInStatus);
      attendanceSheet.getRange(i + 1, 12).setValue(workSummary);
      attendanceSheet.getRange(i + 1, 13).setValue(dayPlan);
      attendanceSheet.getRange(i + 1, 14).setValue(challengesAndSupport);
      attendanceSheet.getRange(i + 1, 16).setValue('');
      found = true;
      break;
    }
  }
  
  if (!found) {
    // Create new record
    const id = generateId();
    const now = new Date().toISOString();
    attendanceSheet.appendRow([
      id,
      employeeId,
      employeeEmail,
      employeeName,
      date,
      checkInTime,
      checkOutTime,
      totalWorkingHours,
      String(isLateCheckIn),
      checkInStatus,
      'Open', // Status
      workSummary,
      dayPlan,
      challengesAndSupport,
      now,
      '' // lockedAt
    ]);
  }
}

function parseWorkingTime(value) {
  const parts = String(value || '').split(':');
  const hour = Number(parts[0]);
  const minute = Number(parts[1]);
  if (isNaN(hour) || isNaN(minute)) {
    return { hour: 9, minute: 0 };
  }
  return {
    hour: Math.max(0, Math.min(23, hour)),
    minute: Math.max(0, Math.min(59, minute)),
  };
}

function parseBoolean(value) {
  const v = String(value || '').toLowerCase();
  return v === 'true' || v === '1' || v === 'yes';
}

function getEmployeeById(employeeId) {
  const employees = getEmployees();
  return employees.find(function(employee) { return String(employee.id) === String(employeeId); }) || null;
}

function getEmployeeAttendancePolicy(employeeId) {
  const employee = getEmployeeById(employeeId);
  if (!employee) {
    throw new Error('Employee not found: ' + employeeId);
  }

  const timezone = String(employee.timezone || Session.getScriptTimeZone() || 'UTC');
  return {
    employee: employee,
    startWorkingTime: String(employee.startWorkingTime || '09:00'),
    gracePeriodMinutes: Number(employee.gracePeriodMinutes || 10),
    requiredDailyWorkingHours: Number(employee.requiredDailyWorkingHours || 8),
    allowedLeavesPerMonth: Number(employee.allowedLeavesPerMonth || 1),
    autoCheckoutHours: Number(employee.autoCheckoutHours || 12),
    timezone: timezone,
  };
}

function getDateInTimezone(timezone, dateObj) {
  return Utilities.formatDate(dateObj || new Date(), timezone, 'yyyy-MM-dd');
}

function getDateMonthInTimezone(timezone, dateObj) {
  return {
    month: Number(Utilities.formatDate(dateObj || new Date(), timezone, 'M')),
    year: Number(Utilities.formatDate(dateObj || new Date(), timezone, 'yyyy')),
  };
}

function getTimeInTimezone(timezone, dateObj) {
  return Utilities.formatDate(dateObj || new Date(), timezone, 'yyyy-MM-dd HH:mm:ss');
}

function getSessionRowsByEmployeeDate(employeeId, dateStr) {
  const sheet = getSheet(ATTENDANCE_SESSIONS_SHEET);
  const rows = sheet.getDataRange().getValues();
  const matches = [];
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][1]) === String(employeeId) && String(rows[i][2]) === String(dateStr)) {
      matches.push({ index: i + 1, row: rows[i] });
    }
  }
  return matches;
}

function isLateSession(checkInDate, policy) {
  const timezone = policy.timezone;
  const dateKey = getDateInTimezone(timezone, checkInDate);
  const startTime = parseWorkingTime(policy.startWorkingTime);
  const startMinutes = (startTime.hour * 60) + startTime.minute + Number(policy.gracePeriodMinutes || 0);

  const hour = Number(Utilities.formatDate(checkInDate, timezone, 'H'));
  const minute = Number(Utilities.formatDate(checkInDate, timezone, 'm'));
  const checkInMinutes = (hour * 60) + minute;
  return checkInMinutes > startMinutes;
}

function calculateHoursFromSeconds(seconds) {
  return Number((Number(seconds || 0) / 3600).toFixed(2));
}

function deriveDailyAttendanceStatus(totalWorkedHours, requiredHours, isLate, hasAnySession) {
  if (!hasAnySession || totalWorkedHours <= 0) return 'Absent';
  if (totalWorkedHours < (requiredHours / 2)) return 'Half Day';
  if (totalWorkedHours > requiredHours) return 'Overtime';
  if (isLate) return 'Late';
  return 'Present';
}

function autoCloseStaleSessions(employeeId, dateStr, policy) {
  const now = new Date();
  const sessionRows = getSessionRowsByEmployeeDate(employeeId, dateStr);
  const sheet = getSheet(ATTENDANCE_SESSIONS_SHEET);
  const maxMs = Number(policy.autoCheckoutHours || 12) * 3600 * 1000;

  sessionRows.forEach(function(entry) {
    const row = entry.row;
    const hasCheckout = !!String(row[5] || '').trim();
    if (hasCheckout) return;

    const checkInUtc = String(row[4] || '');
    const checkInDate = new Date(checkInUtc);
    if (isNaN(checkInDate.getTime())) return;

    if ((now.getTime() - checkInDate.getTime()) >= maxMs) {
      const autoCheckoutDate = new Date(checkInDate.getTime() + maxMs);
      const durationSeconds = Math.max(0, Math.round((autoCheckoutDate.getTime() - checkInDate.getTime()) / 1000));
      const nowIso = now.toISOString();
      sheet.getRange(entry.index, 6).setValue(autoCheckoutDate.toISOString());
      sheet.getRange(entry.index, 8).setValue(getTimeInTimezone(policy.timezone, autoCheckoutDate));
      sheet.getRange(entry.index, 9).setValue(durationSeconds);
      sheet.getRange(entry.index, 11).setValue('true');
      sheet.getRange(entry.index, 13).setValue(nowIso);
    }
  });
}

function upsertDailyAttendanceSummaryFromSessions(employeeId, dateStr, policy) {
  const sessionRows = getSessionRowsByEmployeeDate(employeeId, dateStr)
    .map(function(entry) { return entry.row; })
    .sort(function(a, b) { return Number(a[3] || 0) - Number(b[3] || 0); });

  const employee = getEmployeeById(employeeId);
  if (!employee) {
    throw new Error('Employee not found: ' + employeeId);
  }

  let totalWorkedSeconds = 0;
  let isLate = false;
  let firstCheckInUtc = '';
  let lastCheckOutUtc = '';

  sessionRows.forEach(function(row, idx) {
    const checkInUtc = String(row[4] || '');
    const checkOutUtc = String(row[5] || '');
    const checkInDate = new Date(checkInUtc);
    if (idx === 0) {
      firstCheckInUtc = checkInUtc;
      if (!isNaN(checkInDate.getTime())) {
        isLate = isLateSession(checkInDate, policy) || parseBoolean(row[9]);
      } else {
        isLate = parseBoolean(row[9]);
      }
    }
    if (checkOutUtc) {
      lastCheckOutUtc = checkOutUtc;
      const duration = Number(row[8] || 0);
      if (duration > 0) {
        totalWorkedSeconds += duration;
      } else if (!isNaN(new Date(checkOutUtc).getTime()) && !isNaN(checkInDate.getTime())) {
        totalWorkedSeconds += Math.max(0, Math.round((new Date(checkOutUtc).getTime() - checkInDate.getTime()) / 1000));
      }
    }
  });

  const totalHours = calculateHoursFromSeconds(totalWorkedSeconds);
  const requiredHours = Number(policy.requiredDailyWorkingHours || 8);
  const attendanceStatus = deriveDailyAttendanceStatus(totalHours, requiredHours, isLate, sessionRows.length > 0);
  const overtimeHours = Math.max(0, Number((totalHours - requiredHours).toFixed(2)));
  const halfDayThreshold = Number((requiredHours / 2).toFixed(2));
  const nowIso = new Date().toISOString();
  const checkInStatus = isLate ? 'Late' : 'On Time';

  const sheet = getSheet(DAILY_ATTENDANCE_SUMMARY_SHEET);
  const rows = sheet.getDataRange().getValues();
  let foundIndex = -1;
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][1]) === String(employeeId) && String(rows[i][4]) === String(dateStr)) {
      foundIndex = i + 1;
      break;
    }
  }

  const payload = [
    employeeId,
    String(employee.email || '').toLowerCase(),
    String(employee.name || ''),
    dateStr,
    firstCheckInUtc || '',
    lastCheckOutUtc || '',
    totalHours,
    String(isLate),
    checkInStatus,
    'Open',
    '',
    '',
    '',
    nowIso,
    '',
    sessionRows.length,
    attendanceStatus,
    requiredHours,
    overtimeHours,
    halfDayThreshold,
    nowIso,
  ];

  if (foundIndex > 0) {
    sheet.getRange(foundIndex, 2, 1, 21).setValues([payload]);
  } else {
    sheet.appendRow([generateId()].concat(payload));
  }
}

function getAttendanceTodayTracker(employeeId) {
  if (!employeeId) throw new Error('employeeId is required');
  const policy = getEmployeeAttendancePolicy(employeeId);
  const now = new Date();
  const dateStr = getDateInTimezone(policy.timezone, now);

  autoCloseStaleSessions(employeeId, dateStr, policy);
  upsertDailyAttendanceSummaryFromSessions(employeeId, dateStr, policy);

  const sessionRows = getSessionRowsByEmployeeDate(employeeId, dateStr)
    .map(function(entry) { return entry.row; })
    .sort(function(a, b) { return Number(a[3] || 0) - Number(b[3] || 0); });

  let totalWorkedSeconds = 0;
  let activeSession = null;
  let isLateToday = false;
  const sessions = [];

  sessionRows.forEach(function(row, idx) {
    const checkInUtc = String(row[4] || '');
    const checkOutUtc = String(row[5] || '');
    const checkInDate = new Date(checkInUtc);
    const hasCheckout = !!checkOutUtc;
    const durationSeconds = hasCheckout
      ? Number(row[8] || 0)
      : Math.max(0, Math.round((now.getTime() - checkInDate.getTime()) / 1000));

    if (idx === 0) {
      isLateToday = parseBoolean(row[9]) || (!isNaN(checkInDate.getTime()) && isLateSession(checkInDate, policy));
    }

    if (!hasCheckout) {
      activeSession = {
        sessionId: String(row[0]),
        checkInUtc: checkInUtc,
        checkInLocal: String(row[6] || ''),
        activeDurationSeconds: Math.max(0, durationSeconds),
      };
    }

    if (hasCheckout) totalWorkedSeconds += Math.max(0, Number(durationSeconds || 0));
    else totalWorkedSeconds += Math.max(0, Number(durationSeconds || 0));

    sessions.push({
      checkIn: checkInUtc,
      checkOut: checkOutUtc || '',
    });
  });

  const totalWorkedHours = calculateHoursFromSeconds(totalWorkedSeconds);
  const attendanceStatus = deriveDailyAttendanceStatus(totalWorkedHours, Number(policy.requiredDailyWorkingHours || 8), isLateToday, sessions.length > 0);

  const monthYear = getDateMonthInTimezone(policy.timezone, now);
  const summaries = getDailyAttendanceSummaries();
  const monthRows = summaries.filter(function(item) {
    if (String(item.employeeId) !== String(employeeId)) return false;
    const d = new Date(String(item.date || '') + 'T00:00:00');
    if (isNaN(d.getTime())) return false;
    return d.getFullYear() === monthYear.year && (d.getMonth() + 1) === monthYear.month;
  });
  const lateCountInMonth = monthRows.filter(function(item) { return !!item.isLateCheckIn; }).length;
  const leaveDeductionFromLate = Math.floor(lateCountInMonth / 4);
  const leavesAllowed = Number(policy.allowedLeavesPerMonth || 1);
  const leavesUsed = Math.min(leavesAllowed, leaveDeductionFromLate);
  const paidLeaveDeductions = Math.max(0, leaveDeductionFromLate - leavesAllowed);

  const threshold = parseWorkingTime(policy.startWorkingTime);
  const thresholdDate = new Date();
  thresholdDate.setHours(threshold.hour, threshold.minute + Number(policy.gracePeriodMinutes || 0), 0, 0);

  return {
    employeeId: String(policy.employee.id),
    employeeName: String(policy.employee.name || ''),
    date: dateStr,
    timezone: policy.timezone,
    policy: {
      startWorkingTime: policy.startWorkingTime,
      gracePeriodMinutes: Number(policy.gracePeriodMinutes || 10),
      requiredDailyWorkingHours: Number(policy.requiredDailyWorkingHours || 8),
      allowedLeavesPerMonth: Number(policy.allowedLeavesPerMonth || 1),
      autoCheckoutHours: Number(policy.autoCheckoutHours || 12),
      timezone: policy.timezone,
    },
    sessions: sessions,
    activeSession: activeSession,
    sessionCount: sessions.length,
    totalWorkedSeconds: totalWorkedSeconds,
    totalWorkedHours: totalWorkedHours,
    lateCountInMonth: lateCountInMonth,
    leaveDeductionFromLate: leaveDeductionFromLate,
    leavesAllowedThisMonth: leavesAllowed,
    leavesUsedThisMonth: leavesUsed,
    paidLeaveDeductions: paidLeaveDeductions,
    attendanceStatus: attendanceStatus,
    isLateToday: isLateToday,
    canCheckIn: activeSession === null,
    canCheckOut: activeSession !== null,
    lateThresholdLocal: getTimeInTimezone(policy.timezone, thresholdDate),
  };
}

function checkInAttendance(employeeId) {
  if (!employeeId) throw new Error('employeeId is required');
  const policy = getEmployeeAttendancePolicy(employeeId);
  const now = new Date();
  const dateStr = getDateInTimezone(policy.timezone, now);

  autoCloseStaleSessions(employeeId, dateStr, policy);
  const sessions = getSessionRowsByEmployeeDate(employeeId, dateStr);
  const hasOpenSession = sessions.some(function(entry) {
    return !String(entry.row[5] || '').trim();
  });
  if (hasOpenSession) {
    throw new Error('Already checked in. Please check out before starting another session.');
  }

  const checkInDate = new Date();
  const sessionNumber = sessions.length + 1;
  const isLate = isLateSession(checkInDate, policy);
  const nowIso = checkInDate.toISOString();

  const sheet = getSheet(ATTENDANCE_SESSIONS_SHEET);
  sheet.appendRow([
    generateId(),
    String(employeeId),
    dateStr,
    sessionNumber,
    nowIso,
    '',
    getTimeInTimezone(policy.timezone, checkInDate),
    '',
    0,
    String(isLate),
    'false',
    nowIso,
    nowIso,
  ]);

  upsertDailyAttendanceSummaryFromSessions(employeeId, dateStr, policy);
  return getAttendanceTodayTracker(employeeId);
}

function checkOutAttendance(employeeId) {
  if (!employeeId) throw new Error('employeeId is required');
  const policy = getEmployeeAttendancePolicy(employeeId);
  const now = new Date();
  const dateStr = getDateInTimezone(policy.timezone, now);
  autoCloseStaleSessions(employeeId, dateStr, policy);

  const sessions = getSessionRowsByEmployeeDate(employeeId, dateStr)
    .sort(function(a, b) { return Number(b.row[3] || 0) - Number(a.row[3] || 0); });
  const active = sessions.find(function(entry) {
    return !String(entry.row[5] || '').trim();
  });

  if (!active) {
    throw new Error('No active session found. Please check in first.');
  }

  const checkInDate = new Date(String(active.row[4] || ''));
  const nowIso = now.toISOString();
  const durationSeconds = isNaN(checkInDate.getTime())
    ? 0
    : Math.max(0, Math.round((now.getTime() - checkInDate.getTime()) / 1000));

  const sheet = getSheet(ATTENDANCE_SESSIONS_SHEET);
  sheet.getRange(active.index, 6).setValue(nowIso);
  sheet.getRange(active.index, 8).setValue(getTimeInTimezone(policy.timezone, now));
  sheet.getRange(active.index, 9).setValue(durationSeconds);
  sheet.getRange(active.index, 13).setValue(nowIso);

  upsertDailyAttendanceSummaryFromSessions(employeeId, dateStr, policy);
  return getAttendanceTodayTracker(employeeId);
}

function updateAttendancePolicy(employeeId, policy) {
  if (!employeeId) throw new Error('employeeId is required');
  if (!policy || typeof policy !== 'object') throw new Error('policy object is required');

  const normalizedUpdates = {};
  if (policy.startWorkingTime !== undefined) normalizedUpdates.startWorkingTime = String(policy.startWorkingTime || '09:00');
  if (policy.gracePeriodMinutes !== undefined) normalizedUpdates.gracePeriodMinutes = Number(policy.gracePeriodMinutes || 10);
  if (policy.requiredDailyWorkingHours !== undefined) normalizedUpdates.requiredDailyWorkingHours = Number(policy.requiredDailyWorkingHours || 8);
  if (policy.allowedLeavesPerMonth !== undefined) normalizedUpdates.allowedLeavesPerMonth = Number(policy.allowedLeavesPerMonth || 1);
  if (policy.autoCheckoutHours !== undefined) normalizedUpdates.autoCheckoutHours = Number(policy.autoCheckoutHours || 12);
  if (policy.timezone !== undefined) normalizedUpdates.timezone = String(policy.timezone || Session.getScriptTimeZone() || 'UTC');

  return updateEmployee(employeeId, normalizedUpdates);
}

function getMonthlyAttendancePerformance(month, year) {
  const m = Number(month);
  const y = Number(year);
  if (!m || !y) throw new Error('month and year are required');

  const employees = getEmployees().filter(function(employee) {
    return String(employee.status || '').toLowerCase() !== 'left';
  });
  const summaries = getDailyAttendanceSummaries();

  return employees.map(function(employee) {
    const policy = {
      requiredDailyWorkingHours: Number(employee.requiredDailyWorkingHours || 8),
      allowedLeavesPerMonth: Number(employee.allowedLeavesPerMonth || 1),
    };
    const rows = summaries.filter(function(item) {
      if (String(item.employeeId) !== String(employee.id)) return false;
      const d = new Date(String(item.date || '') + 'T00:00:00');
      if (isNaN(d.getTime())) return false;
      return d.getFullYear() === y && (d.getMonth() + 1) === m;
    });

    const totalHours = Number(rows.reduce(function(sum, row) {
      return sum + Number(row.totalWorkingHours || 0);
    }, 0).toFixed(2));
    const lateCount = rows.filter(function(row) { return !!row.isLateCheckIn; }).length;
    const lateLeaveDeductions = Math.floor(lateCount / 4);
    const leavesUsed = Math.min(policy.allowedLeavesPerMonth, lateLeaveDeductions);
    const paidLeaveDeductions = Math.max(0, lateLeaveDeductions - policy.allowedLeavesPerMonth);

    const requiredHoursForMonth = Number((rows.length * policy.requiredDailyWorkingHours).toFixed(2));
    let status = 'Good';
    if (paidLeaveDeductions > 0 || (requiredHoursForMonth > 0 && totalHours < requiredHoursForMonth * 0.7)) {
      status = 'Critical';
    } else if (lateCount >= 4 || (requiredHoursForMonth > 0 && totalHours < requiredHoursForMonth * 0.9)) {
      status = 'Attention';
    }

    return {
      employeeId: String(employee.id),
      employeeName: String(employee.name || ''),
      totalHours: totalHours,
      lateCount: lateCount,
      leavesUsed: leavesUsed,
      paidLeaveDeductions: paidLeaveDeductions,
      lateLeaveDeductions: lateLeaveDeductions,
      status: status,
    };
  });
}

/**
 * Get daily attendance summaries for a specific date
 */
function getDailyAttendanceSummariesByDate(date) {
  const sheet = getSheet(DAILY_ATTENDANCE_SUMMARY_SHEET);
  const data = sheet.getDataRange().getValues();
  const results = [];
  
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][4]) === String(date)) {
      results.push(parseRowToDAS(data[i]));
    }
  }
  
  return results;
}

/**
 * Get all daily attendance summaries (optionally filtered by date range)
 */
function getDailyAttendanceSummaries(startDate, endDate) {
  const sheet = getSheet(DAILY_ATTENDANCE_SUMMARY_SHEET);
  const data = sheet.getDataRange().getValues();
  const results = [];
  const start = startDate ? String(startDate) : '';
  const end = endDate ? String(endDate) : '';

  for (let i = 1; i < data.length; i++) {
    const item = parseRowToDAS(data[i]);
    if (!item.date) continue;
    if (start && item.date < start) continue;
    if (end && item.date > end) continue;
    results.push(item);
  }

  return results;
}

function parseRowToDAS(row) {
  return {
    id: String(row[0]),
    employeeId: String(row[1]),
    employeeEmail: String(row[2]),
    employeeName: String(row[3]),
    date: String(row[4]),
    checkInTime: String(row[5]) || undefined,
    checkOutTime: String(row[6]) || undefined,
    totalWorkingHours: Number(row[7]) || 0,
    isLateCheckIn: parseBoolean(row[8]),
    checkInStatus: String(row[9]),
    status: String(row[10]),
    workSummary: String(row[11]) || undefined,
    dayPlan: String(row[12]) || undefined,
    challengesAndSupport: String(row[13]) || undefined,
    createdAt: String(row[14]),
    lockedAt: String(row[15]) || undefined,
    sessionCount: Number(row[16] || 0),
    attendanceStatus: String(row[17] || ''),
    requiredDailyWorkingHours: Number(row[18] || 0),
    overtimeHours: Number(row[19] || 0),
    halfDayThresholdHours: Number(row[20] || 0),
    updatedAt: String(row[21] || '') || undefined,
  };
}

/**
 * Scheduled function to lock all previous day's attendance records at midnight
 * Run this via Apps Script trigger at 00:00 (12:00 AM) every day
 */
function lockPreviousDaysAttendance() {
  const sheet = getSheet(DAILY_ATTENDANCE_SUMMARY_SHEET);
  const data = sheet.getDataRange().getValues();
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yestdayStr = formatDateToYYYYMMDD(yesterday);
  
  const now = new Date().toISOString();
  
  for (let i = 1; i < data.length; i++) {
    const recordDate = String(data[i][4]);
    const currentStatus = String(data[i][10]);
    
    if (recordDate === yestdayStr && currentStatus === 'Open') {
      sheet.getRange(i + 1, 11).setValue('Locked');
      sheet.getRange(i + 1, 16).setValue(now);
    }
  }
}

function formatDateToYYYYMMDD(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get monthly payroll data for one employee
 */
function getMonthlyPayrollData(employeeId, month, year) {
  const sheet = getSheet(MONTHLY_PAYROLL_DATA_SHEET);
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][1]) === employeeId && 
        Number(data[i][4]) === month && 
        Number(data[i][5]) === year) {
      return parseRowToMPD(data[i]);
    }
  }
  
  throw new Error(`Payroll not found for employee ${employeeId}, month ${month}/${year}`);
}

/**
 * Get all monthly payroll data for a specific month/year
 */
function getAllMonthlyPayrollData(month, year) {
  const sheet = getSheet(MONTHLY_PAYROLL_DATA_SHEET);
  const data = sheet.getDataRange().getValues();
  const results = [];
  
  for (let i = 1; i < data.length; i++) {
    if (Number(data[i][4]) === month && Number(data[i][5]) === year) {
      results.push(parseRowToMPD(data[i]));
    }
  }
  
  return results;
}

function parseRowToMPD(row) {
  return {
    id: String(row[0]),
    employeeId: String(row[1]),
    employeeName: String(row[2]),
    email: String(row[3]),
    month: Number(row[4]),
    year: Number(row[5]),
    baseSalary: Number(row[6]),
    totalWorkingDays: Number(row[7]),
    totalPresent: Number(row[8]),
    totalLateComings: Number(row[9]),
    paidLeavesAllowed: Number(row[10]),
    paidLeavesUsed: Number(row[11]),
    unpaidLeavesCalculated: Number(row[12]),
    remainingPaidLeaves: Number(row[13]),
    totalLeaveDeduction: Number(row[14]),
    latePenaltyDeduction: Number(row[15]),
    otherDeductions: Number(row[16]),
    totalDeductions: Number(row[17]),
    netPay: Number(row[18]),
    payrollStatus: String(row[19]),
    createdAt: String(row[20]),
    updatedAt: String(row[21]),
    approvedBy: String(row[22]) || undefined,
    approvedAt: String(row[23]) || undefined
  };
}

/**
 * Generate monthly payroll for all employees based on attendance data
 */
function generateMonthlyPayroll(month, year) {
  const attendanceSheet = getSheet(DAILY_ATTENDANCE_SUMMARY_SHEET);
  const employeesSheet = getSheet(EMPLOYEES_SHEET);
  const payrollSheet = getSheet(MONTHLY_PAYROLL_DATA_SHEET);
  
  const attendanceData = attendanceSheet.getDataRange().getValues();
  const employeesData = employeesSheet.getDataRange().getValues();
  
  // Build employee map
  const employeeMap = {};
  for (let i = 1; i < employeesData.length; i++) {
    employeeMap[String(employeesData[i][0])] = {
      name: String(employeesData[i][1]),
      email: String(employeesData[i][2]),
    };
  }
  
  // Calculate attendance metrics for each employee
  const payrollData = {};
  const firstDayOfMonth = new Date(year, month - 1, 1);
  const lastDayOfMonth = new Date(year, month, 0);
  
  for (let i = 1; i < attendanceData.length; i++) {
    const date = String(attendanceData[i][4]); // YYYY-MM-DD
    const [dateYear, dateMonth, dateDay] = date.split('-').map(Number);
    
    if (dateYear === year && dateMonth === month) {
      const employeeId = String(attendanceData[i][1]);
      const employeeName = String(attendanceData[i][3]);
      const email = String(attendanceData[i][2]);
      const isLateCheckIn = String(attendanceData[i][8]) === 'true';
      const totalHours = Number(attendanceData[i][7]);
      
      if (!payrollData[employeeId]) {
        payrollData[employeeId] = {
          employeeId,
          employeeName,
          email,
          month,
          year,
          totalWorkingDays: 0,
          totalPresent: 0,
          totalLateComings: 0,
          totalWorkingHours: 0
        };
      }
      
      payrollData[employeeId].totalWorkingDays += 1;
      if (totalHours > 0) {
        payrollData[employeeId].totalPresent += 1;
      }
      if (isLateCheckIn) {
        payrollData[employeeId].totalLateComings += 1;
      }
      payrollData[employeeId].totalWorkingHours += totalHours;
    }
  }
  
  // Create payroll records
  const results = [];
  for (const employeeId in payrollData) {
    const empData = payrollData[employeeId];
    const employee = employeeMap[employeeId] || {};
    
    // Get employee base salary (you can store this in employee sheet)
    // For now, we use a default. You should fetch from employee record
    const baseSalary = 50000; // Example, fetch this from employee record
    
    // Calculations
    const paidLeavesAllowed = 1;
    const paidLeavesUsed = 0; // Track from leave requests
    const unpaidLeavesCalculated = Math.floor(empData.totalLateComings / 4);
    const remainingPaidLeaves = paidLeavesAllowed - paidLeavesUsed;
    
    const dailySalary = baseSalary / 30;
    const totalLeaveDeduction = (unpaidLeavesCalculated + paidLeavesUsed) * dailySalary;
    const latePenaltyDeduction = 0; // Can be set manually
    const otherDeductions = 0; // Can be set manually
    const totalDeductions = totalLeaveDeduction + latePenaltyDeduction + otherDeductions;
    const netPay = baseSalary - totalDeductions;
    
    const id = generateId();
    const now = new Date().toISOString();
    
    const record = {
      id,
      employeeId,
      employeeName: empData.employeeName,
      email: empData.email,
      month,
      year,
      baseSalary,
      totalWorkingDays: empData.totalWorkingDays,
      totalPresent: empData.totalPresent,
      totalLateComings: empData.totalLateComings,
      paidLeavesAllowed,
      paidLeavesUsed,
      unpaidLeavesCalculated,
      remainingPaidLeaves,
      totalLeaveDeduction: Math.round(totalLeaveDeduction * 100) / 100,
      latePenaltyDeduction,
      otherDeductions,
      totalDeductions: Math.round(totalDeductions * 100) / 100,
      netPay: Math.round(netPay * 100) / 100,
      payrollStatus: 'Pending',
      createdAt: now,
      updatedAt: now,
      approvedBy: '',
      approvedAt: ''
    };
    
    // Save to sheet
    payrollSheet.appendRow([
      record.id,
      record.employeeId,
      record.employeeName,
      record.email,
      record.month,
      record.year,
      record.baseSalary,
      record.totalWorkingDays,
      record.totalPresent,
      record.totalLateComings,
      record.paidLeavesAllowed,
      record.paidLeavesUsed,
      record.unpaidLeavesCalculated,
      record.remainingPaidLeaves,
      record.totalLeaveDeduction,
      record.latePenaltyDeduction,
      record.otherDeductions,
      record.totalDeductions,
      record.netPay,
      record.payrollStatus,
      record.createdAt,
      record.updatedAt,
      record.approvedBy,
      record.approvedAt
    ]);
    
    results.push(record);
  }
  
  return results;
}

/**
 * Update payroll status (Pending -> Received triggers automation)
 * When status changes to 'Received', automatically creates a company expense
 */
function updatePayrollStatus(payrollId, status) {
  if (!payrollId || !status) {
    throw new Error('payrollId and status are required');
  }

  const sheet = getSheet(MONTHLY_PAYROLL_DATA_SHEET);
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === payrollId) {
      const record = parseRowToMPD(data[i]);
      const oldStatus = record.payrollStatus;
      
      // Update status
      sheet.getRange(i + 1, 20).setValue(status);
      const now = new Date().toISOString();
      sheet.getRange(i + 1, 22).setValue(now);
      
      // If changing to 'Received', create company expense
      if (oldStatus !== 'Received' && status === 'Received') {
        createCompanyExpenseFromPayroll(record);
      }
      
      record.payrollStatus = status;
      record.updatedAt = now;
      return record;
    }
  }
  
  throw new Error(`Payroll not found: ${payrollId}`);
}

/**
 * Create company expense entry when payroll is received
 * This is the automation that links payroll to expenses
 */
function createCompanyExpenseFromPayroll(payrollRecord) {
  const expensesSheet = getSheet(COMPANY_EXPENSES_SHEET);
  const id = generateId();
  const now = new Date().toISOString();
  const description = `Payroll - ${payrollRecord.employeeName} (${getMonthName(payrollRecord.month)}, ${payrollRecord.year})`;
  
  expensesSheet.appendRow([
    id,
    formatDateToYYYYMMDD(new Date()), // today's date
    description,
    payrollRecord.netPay,
    'Payroll Department',
    'Admin',
    'Bank Transfer',
    '',
    `Generated from payroll record ${payrollRecord.id}`,
    now
  ]);
}

function getMonthName(month) {
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return months[month - 1] || '';
}
