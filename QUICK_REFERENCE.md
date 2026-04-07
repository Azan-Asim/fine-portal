# Attendance & Payroll System - Quick Reference Guide

## 🚀 What's New

A complete automated attendance, daily reporting, and payroll system with:
- **Dual-entry daily forms** (Check-In & Check-Out)
- **Automatic hour calculations**
- **Late arrival detection** (after 9:10 AM)
- **Leave penalties** (4 lates = 1 unpaid day)
- **Auto-locking** at midnight
- **One-click payroll generation** from attendance
- **Automatic expense creation** when payroll is received

---

## 📱 Components Created

### 1. **DailyWorkReportForm.tsx**
Employee form for submitting check-in and check-out.
- **Auto-detects** check-in vs check-out based on time
- **Different fields** for morning (plan) vs evening (summary)
- Shows current timestamp on check-out

**Usage:**
```tsx
<DailyWorkReportForm
  employeeId={user.id}
  employeeEmail={user.email}
  onSuccess={() => { /* refresh */ }}
/>
```

### 2. **DailyAttendanceView.tsx**
Real-time dashboard for admin/hr to view daily attendance.
- **Date picker** to select any date
- **Grid view** of all employee records
- **Summary stats** (total, on-time, late, avg hours)
- **Expandable details** for each employee

**Usage:**
```tsx
<DailyAttendanceView userRole={user.activeRole} />
```

### 3. **PayrollManagement.tsx**
Monthly payroll generation and management.
- **Auto-generate** payroll from attendance
- **Month/year selector**
- **Expandable records** showing breakdown
- **Status workflow**: Pending → Received → creates expense
- **Summary cards** with totals

**Usage:**
```tsx
<PayrollManagement />
```

---

## 📊 Key Formulas

### Working Hours
```
ROUND(([Check-Out Time] - [Check-In Time]) * 24, 2)
```

### Late Detection
```
IF(Hour > 9 OR (Hour = 9 AND Minute > 10), "Late", "On Time")
```

### Leave Deduction
```
Unpaid Leaves = FLOOR(Late Comings / 4)
Deduction = (Unpaid + Paid) * (Base Salary / 30)
Net Pay = Base Salary - Total Deductions
```

---

## ⚙️ Setup Checklist

- [ ] Deploy updated `Code.gs` to Google Apps Script
- [ ] Set `NEXT_PUBLIC_APPS_SCRIPT_URL` environment variable
- [ ] Create scheduled trigger: `lockPreviousDaysAttendance` @ 12:00 AM
- [ ] Create `/employee/attendance` page (provided)
- [ ] Create `/admin/attendance` page (provided)
- [ ] Create `/admin/payroll` page (provided)
- [ ] Add routes to navigation menu
- [ ] Test employee check-in/check-out
- [ ] Test admin attendance viewing
- [ ] Test payroll generation
- [ ] Deploy to production

---

## 👤 Employee Workflow

### Morning (9:00 AM)
1. Go to **Attendance** page
2. Form auto-shows **Check-In**
3. Fill:
   - Yesterday's Plan / What's supposed to happen today?
   - Any challenges/blockers?
4. Click **Submit Check-In** ✅

### Evening (5:00 PM)
1. Go to **Attendance** page
2. Form auto-shows **Check-Out**
3. Fill:
   - Today's Work Summary
   - Tomorrow's Plan
   - Any challenges/blockers?
4. Click **Submit Check-Out** ✅
5. System automatically:
   - Merges with morning check-in
   - Calculates working hours
   - Detects if late
   - Creates daily record

---

## 👨‍💼 Admin/HR Workflow

### Daily Monitoring
1. Go to **Attendance Dashboard**
2. Pick a date
3. See all employees:
   - Check-in/out times
   - Working hours
   - Late flag
   - Notes/challenges

### Monthly Payroll
1. Go to **Payroll Management**
2. Select Month & Year
3. Click **Generate Payroll**
4. System creates records with:
   - Attendance metrics
   - Late days count
   - Leave calculations
   - Deduction breakdown
5. Review each employee:
   - Expand to see details
   - Verify calculations
6. When satified:
   - Click **Mark as Received**
   - System creates company expense automatically

---

## 🔐 Business Rules

| Rule | Details |
|------|---------|
| **Start Time** | 9:00 AM |
| **Late Threshold** | 9:10 AM |
| **Late Penalty** | 4 lates = 1 unpaid day |
| **Leave Policy** | 1 paid/month, others unpaid |
| **Record Lock** | Auto-lock at midnight (previous day) |
| **Deduction** | (Unpaid Leaves) × (Base ÷ 30) |
| **Expense Creation** | Auto-create when payroll "Received" |

---

## 📋 Google Sheets Structure

Three new sheets created automatically:

1. **Daily Work Reports**
   - Raw form submissions
   - Check-in & check-out entries
   - Employee notes/plans

2. **Daily Attendance Summary**
   - One record per employee per day
   - Merged data from both submissions
   - Calculated hours and late flags
   - Status: Open or Locked

3. **Monthly Payroll Data**
   - One record per employee per month
   - Attendance metrics
   - Leave calculations
   - Deductions & final pay
   - Payroll status tracking

---

## 🔧 Customization Points

### Late Time Threshold
In `Code.gs`, function `mergeDailySubmissions`:
```javascript
const isLateCheckIn = checkInHour > 9 || (checkInHour === 9 && checkInMinute > 10);
// Change the 9 and 10 to desired time
```

### Late Penalty Rate
In `generateMonthlyPayroll`:
```javascript
const unpaidLeavesCalculated = Math.floor(empData.totalLateComings / 4);
// Change the 4 to any divisor (e.g., 3 or 5)
```

### Paid Leaves Per Month
In `generateMonthlyPayroll`:
```javascript
const paidLeavesAllowed = 1;
// Change to any number
```

### Base Salary Source
Currently hardcoded to 50,000. Should fetch from Employee record:
```javascript
// TODO: Fetch from employee record
const baseSalary = getEmployeeBaseSalary(employeeId);
```

---

## 📞 API Functions Available

```typescript
// Submissions
submitDailyWorkReport(data)
getDailyWorkSubmissions()

// Daily Attendance
getDailyAttendanceSummariesByDate(date)
getDailyAttendanceSummaries(startDate?, endDate?)

// Payroll
getMonthlyPayrollData(employeeId, month, year)
getAllMonthlyPayrollData(month, year)
generateMonthlyPayroll(month, year)
updatePayrollStatus(payrollId, status)

// Automation (Apps Script only)
lockPreviousDaysAttendance() // runs at 12 AM
mergeDailySubmissions() // runs on check-out
createCompanyExpenseFromPayroll() // runs on "Received"
```

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Apps Script URL not working | Check `.env.local` has correct URL, redeploy Apps Script |
| Midnight lock not running | Check Apps Script trigger exists and is set to 12:00 AM |
| Hours calculation wrong | Check timestamp format (should be ISO), verify timezone |
| Late arrivals not detected | Verify time is after 9:10 AM, check system time |
| Expense not creating | Verify payroll status changed to "Received" |

---

## 📁 File Structure

```
/src/
  /components/
    DailyWorkReportForm.tsx     # Employee form
    DailyAttendanceView.tsx     # Admin view
    PayrollManagement.tsx       # Payroll system
  /app/
    /employee/
      /attendance/
        page.tsx                # Employee attendance page
    /admin/
      /attendance/
        page.tsx                # Admin attendance page
      /payroll/
        page.tsx                # Admin payroll page
  /types/
    index.ts                    # Includes new types
  /lib/
    googleSheets.ts             # Includes new API functions

/google-apps-script/
  Code.gs                       # Updated with attendance logic

ATTENDANCE_PAYROLL_SETUP.md     # Full setup guide (this file)
```

---

## ✅ Testing Checklist

- [ ] Employee submits check-in → record created
- [ ] Employee submits check-out → merged with check-in
- [ ] Working hours calculated correctly
- [ ] Late arrivals flagged properly
- [ ] Previous day locked at midnight
- [ ] Payroll generated with correct calculations
- [ ] Deductions calculated properly
- [ ] Marking "Received" creates expense
- [ ] Admin can edit locked records
- [ ] All data persists in Google Sheets

---

## 🚀 Next Steps

1. **Deploy**: Push Code.gs updates and set up trigger
2. **Test**: Run through employee & admin workflows
3. **Train**: Teach employees how to submit check-in/out
4. **Monitor**: Check attendance dashboard daily
5. **Generate**: Create payroll monthly
6. **Track**: Monitor leave deductions and late trends

---

## 📚 Related Documentation

- [Full Setup Guide](./ATTENDANCE_PAYROLL_SETUP.md)
- Component comments in source files
- Google Sheets column descriptions
- Apps Script function documentation

---

**System Version**: 1.0.0  
**Last Updated**: April 7, 2026
