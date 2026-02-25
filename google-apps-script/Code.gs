/**
 * Fine Portal - Google Apps Script
 * Deploy as a Web App (Execute as: Me, Access: Anyone)
 * 
 * Sheet names: "Employees" and "Penalties"
 * All requests use GET with ?action=xxx&payload=JSON
 */

const SS = SpreadsheetApp.getActiveSpreadsheet();
const EMPLOYEES_SHEET = 'Employees';
const PENALTIES_SHEET = 'Penalties';

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

    if (!action) return respond({ status: 'Fine Portal API online' });

    if (action === 'getEmployees') return respond(getEmployees());
    if (action === 'addEmployee')  return respond(addEmployee(payload.name, payload.email));
    if (action === 'deleteEmployee') return respond(deleteEmployee(payload.id));
    if (action === 'getPenalties') return respond(getPenalties());
    if (action === 'addPenalty')   return respond(addPenalty(payload));
    if (action === 'updatePenalty') return respond(updatePenalty(payload.id, payload.updates));
    if (action === 'deletePenalty') return respond(deletePenalty(payload.id));

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
      sheet.appendRow(['ID', 'Name', 'Email', 'Created At']);
    } else if (name === PENALTIES_SHEET) {
      sheet.appendRow(['ID', 'Employee ID', 'Employee Name', 'Email', 'Reason',
        'Reference URL', 'Amount', 'Date', 'Status', 'Payment Proof',
        'Payment Date', 'Payment Type', 'Notes', 'Created At']);
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

function getEmployees() {
  const sheet = getSheet(EMPLOYEES_SHEET);
  return sheetToObjects(sheet, ['id', 'name', 'email', 'createdAt']);
}

function addEmployee(name, email) {
  const sheet = getSheet(EMPLOYEES_SHEET);
  const id = generateId();
  const createdAt = new Date().toISOString();
  sheet.appendRow([id, name, email, createdAt]);
  return { id, name, email, createdAt };
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
