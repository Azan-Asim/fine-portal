# Attendance, Daily Reporting & Payroll System - Implementation Guide

## Overview

This system implements a comprehensive attendance tracking, daily work reporting, and automated payroll calculation system for your organization. It includes:

- **Daily Work Reports**: Employees submit twice daily (Check-In and Check-Out)
- **Automatic Attendance Tracking**: Check-in/out times are merged to calculate working hours
- **Late Arrival Detection**: Automatically flags arrivals after 9:10 AM
- **Midnight Lock**: Records auto-lock at 12:00 AM (previous day only)
- **Leave Penalties**: 4 late arrivals = 1 unpaid leave day deducted from salary
- **Automatic Payroll**: Generated from attendance data with deductions
- **Expense Automation**: When payroll is marked "Received", creates company expense automatically

---

## System Architecture

### Three Main Tables (Google Sheets)

#### 1. **Daily Work Reports** (`Daily Work Reports` sheet)
Raw submission data from the public form.

| Field | Type | Description |
|-------|------|-------------|
| ID | String | Unique identifier |
| Employee ID | String | Links to employee |
| Employee Email | String | For merging submissions |
| Date | String | YYYY-MM-DD format |
| Submission Type | String | "Check-In" or "Check-Out" |
| Submission Time | String | ISO timestamp |
| Todays Summary | String | What was done (Check-Out only) |
| Yesterdays Plan | String | What was planned (Check-In only) |
| Tomorrows Plan | String | Next day plan (Check-Out only) |
| Challenges | String | Blockers/issues |
| Support Needed | String | Resources needed |
| Created At | String | Timestamp |

#### 2. **Daily Attendance Summary** (`Daily Attendance Summary` sheet)
Merged daily records with automatic calculations.

| Field | Type | Description |
|-------|------|-------------|
| ID | String | Unique daily record ID |
| Employee ID | String | Links to employee |
| Employee Email | String | Email address |
| Employee Name | String | Full name |
| Date | String | YYYY-MM-DD |
| Check-In Time | String | ISO timestamp |
| Check-Out Time | String | ISO timestamp |
| Total Working Hours | Number | Calculated: (check-out - check-in) * 24 |
| Is Late Check-In | Boolean | true if after 9:10 AM |
| Check-In Status | String | "On Time" or "Late" |
| Status | String | "Open" or "Locked" |
| Work Summary | String | From check-out submission |
| Day Plan | String | From submissions |
| Challenges And Support | String | Merged from submissions |
| Created At | String | Timestamp |
| Locked At | String | Midnight lock timestamp |

#### 3. **Monthly Payroll Data** (`Monthly Payroll Data` sheet)
Calculated monthly payroll for each employee.

| Field | Type | Description |
|-------|------|-------------|
| ID | String | Unique payroll ID |
| Employee ID | String | Links to employee |
| Employee Name | String | Full name |
| Email | String | Email |
| Month | Number | 1-12 |
| Year | Number | 2024, 2025, etc. |
| Base Salary | Number | From employee record |
| Total Working Days | Number | Days in month |
| Total Present | Number | Days with check-in/out |
| Total Late Comings | Number | Count of late arrivals |
| Paid Leaves Allowed | Number | 1 per month policy |
| Paid Leaves Used | Number | From leave requests |
| Unpaid Leaves Calculated | Number | (Total Late Coming / 4) |
| Remaining Paid Leaves | Number | Allowed - Used |
| Total Leave Deduction | Number | (unpaid + paid) * daily_salary |
| Late Penalty Deduction | Number | Can be manual or auto |
| Other Deductions | Number | Loans, etc. |
| Total Deductions | Number | Sum of all |
| Net Pay | Number | Base - Deductions |
| Payroll Status | String | "Pending", "Received", or "Cancelled" |
| Audit Fields | Timestamps | createdAt, updatedAt, approvedBy, approvedAt |

---

## Formulas & Calculations Explained

### 1. **Total Working Hours**
```
(Check-Out Time - Check-In Time) * 24
Example: 9:00 AM to 5:00 PM = 8 hours
```
The formula calculates the difference in milliseconds, divides by (1000 * 60 * 60) to get hours, then rounds to 2 decimals.

### 2. **Late Check-In Detection**
```
IF(Hour > 9 OR (Hour = 9 AND Minute > 10), "Late", "On Time")
```
Official start time is 9:00 AM. Any check-in after 9:10 AM is flagged as late.

### 3. **Leave Deduction Rule**
```
Unpaid Leaves = FLOOR(Total Late Comings / 4)

Daily Salary = Base Salary / 30
Leave Deduction = Unpaid Leaves * Daily Salary

Example:
- Base Salary: Rs. 50,000
- 8 late arrivals = 2 unpaid leave days
- Leave Deduction = 2 * (50,000 / 30) = 2 * 1,666.67 = 3,333.34
- Net Pay = 50,000 - 3,333.34 = 46,666.66
```

### 4. **Net Pay Calculation**
```
Net Pay = Base Salary - (Leave Deduction + Late Penalty + Other Deductions)
```

---

## Setup Instructions

### Step 1: Deploy the Updated Google Apps Script

1. Go to your Google Sheet that this project uses
2. Go to **Extensions → Apps Script**
3. Replace all code in `Code.gs` with the updated code (already done in this implementation)
4. **Deploy as Web App**:
   - Click **Deploy → New Deployment**
   - Type: Select **Web App**
   - Execute as: **Me** (your account)
   - Execute as users who access the app: **Anyone**
   - Click **Deploy**
   - **IMPORTANT**: Copy the deployment URL and update `NEXT_PUBLIC_APPS_SCRIPT_URL` in your `.env.local` file

### Step 2: Set Up Scheduled Midnight Lock

1. In the Apps Script editor where you deployed Code.gs:
2. Go to **Triggers** (left sidebar, clock icon)
3. Click **Create a new trigger**
4. Configure:
   - Function to execute: `lockPreviousDaysAttendance`
   - Deployment: `Head`
   - Event source: `Time-driven`
   - Type of time-based trigger: `Day timer`
   - Time of day: `12:00 AM`
5. Click **Save**

This will automatically lock all previous day's records at midnight every night.

### Step 3: Create the Public Form (Optional)

If you want a public web form instead of in-app submission:

1. Create a Google Form with these fields:
   - **Official Email** (Short answer, required)
   - **Status Type** (Multiple choice: Check-In / Check-Out)
   - **Work Summary / Plan** (Paragraph)
   - **Challenges** (Paragraph)
   - **Support Needed** (Paragraph)

2. Go to **Responses** → **Create Spreadsheet**
3. Use the sheet name `Daily Work Reports Form Responses`
4. Set up a trigger in Apps Script that reads from the form responses and calls `submitDailyWorkReport()`

**Alternative**: Use the in-app components directly (recommended, already built!)

### Step 4: Add Components to Your Application

#### For Employee - Daily Check-In/Check-Out Page

Create a new page in your app: `/src/app/employee/attendance/page.tsx`

```tsx
'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import DailyWorkReportForm from '@/components/DailyWorkReportForm';

export default function AttendancePage() {
    const { user } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!user) {
            router.push('/login');
        }
    }, [user, router]);

    if (!user) return null;

    return (
        <div className="min-h-screen bg-gray-100 py-8 px-4">
            <div className="max-w-2xl mx-auto">
                <DailyWorkReportForm
                    employeeId={user.id}
                    employeeEmail={user.email}
                    onSuccess={() => {
                        // Optional: Show success animation or redirect
                    }}
                />
            </div>
        </div>
    );
}
```

#### For Admin/HR - Attendance Dashboard

Create: `/src/app/admin/attendance/page.tsx`

```tsx
'use client';

import { useAuth } from '@/context/AuthContext';
import DailyAttendanceView from '@/components/DailyAttendanceView';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AttendancePage() {
    const { user } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!user || (user.activeRole !== 'admin' && user.activeRole !== 'hr')) {
            router.push('/');
        }
    }, [user, router]);

    if (!user) return null;

    return (
        <div className="min-h-screen bg-gray-100 py-8 px-4">
            <div className="max-w-7xl mx-auto">
                <DailyAttendanceView userRole={user.activeRole} />
            </div>
        </div>
    );
}
```

#### For Admin/HR - Payroll Management

Create: `/src/app/admin/payroll/page.tsx`

```tsx
'use client';

import { useAuth } from '@/context/AuthContext';
import PayrollManagement from '@/components/PayrollManagement';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function PayrollPage() {
    const { user } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!user || (user.activeRole !== 'admin' && user.activeRole !== 'hr')) {
            router.push('/');
        }
    }, [user, router]);

    if (!user) return null;

    return (
        <div className="min-h-screen bg-gray-100 py-8 px-4">
            <div className="max-w-7xl mx-auto">
                <PayrollManagement />
            </div>
        </div>
    );
}
```

### Step 5: Update Navigation

Add these routes to your sidebar/navigation menu:

```tsx
// For employees
<NavLink href="/employee/attendance">Attendance</NavLink>

// For admin/hr
<NavLink href="/admin/attendance">Daily Attendance</NavLink>
<NavLink href="/admin/payroll">Payroll Management</NavLink>
```

---

## Employee Workflow

### Daily Check-In Process (Morning)

1. Employee logs in to the portal
2. Navigates to **Attendance** section
3. Form auto-detects "Check-In" (before 12 PM)
4. Employee fills:
   - ✅ Yesterday's Plan (what was supposed to be done today)
   - ✅ Challenges/Support (optional)
5. Clicks **Submit Check-In**
6. System records:
   - Check-in timestamp
   - Creates initial daily record (if first submission of the day)

### Daily Check-Out Process (Evening)

1. Employee navigates to **Attendance** again
2. Form auto-detects "Check-Out" (after 12 PM)
3. Employee fills:
   - ✅ Today's Work Summary (what was actually done)
   - ✅ Tomorrow's Plan (what's next)
   - ✅ Challenges/Support (if any)
4. Clicks **Submit Check-Out**
5. System:
   - Records check-out timestamp
   - **Merges** check-in and check-out
   - **Calculates** total working hours
   - **Flags** if late arrival (auto)
   - Creates complete daily attendance record

### Late Arrival Scenario

- Employee checks in at 9:15 AM (**Late**)
- System flags: `isLateCheckIn = true`, `checkInStatus = "Late"`
- **4 late arrivals in a month = 1 unpaid leave day deducted from salary**

### Day Locking

- At 12:00 AM (midnight) every night
- Apps Script trigger runs `lockPreviousDaysAttendance()`
- Previous day's record: `status = "Locked"`
- Employees **cannot edit locked records**
- Admin/HR **can still edit** (audit trail recommended)

---

## Admin/HR Workflow

### 1. Viewing Daily Attendance (Real-time)

1. Go to **Attendance Dashboard**
2. Select a date using date picker
3. See all employees' check-ins/outs for that day
4. View:
   - ✓ Check-in/out times
   - ✓ Total working hours
   - ✓ Late flag
   - ✓ Work summary
   - ✓ Status (Open/Locked)
5. Summary stats:
   - Total employees
   - On-time arrivals
   - Late arrivals
   - Average working hours

### 2. Generating Monthly Payroll

1. Go to **Payroll Management**
2. Select **Month** and **Year**
3. Click **Generate Payroll**
4. System:
   - Reads all daily records for that month
   - Counts late arrivals
   - Calculates leave deductions
   - Creates payroll record for each employee
5. HR reviews:
   - Base Salary
   - Attendance metrics
   - Late comings → Unpaid leaves
   - Deduction breakdown
   - Net pay

### 3. Processing Payroll

1. Review each employee's payroll record
2. Click to expand and see:
   - Attendance details
   - Leave calculations
   - Salary breakdown
3. When salary is paid:
   - Click **Mark as Received**
   - System **automatically creates** company expense
4. Expense shows:
   - Employee name
   - Net pay amount
   - Month/year
   - Links to payroll record

### 4. Reporting (Optional Feature to Add)

Generate reports:
- Monthly attendance summary by employee
- Late arrival trends
- Payroll disbursement schedule
- Deduction audit trail

---

## Business Rules Enforced by System

### 1. **Official Working Hours**
- **Start Time**: 9:00 AM
- **Late Threshold**: 9:10 AM
- Any check-in after 9:10 AM = Late

### 2. **Late Penalty**
- 1 late arrival = 1 work day marked
- 4 late arrivals = 1 full unpaid leave deducted
- Formula: `Unpaid Leaves = FLOOR(Late Comings / 4)`

### 3. **Leave Policy**
- Employees get 1 paid holiday per month
- Additional leaves (or leaves accumulated via penalties) are **unpaid**
- Unpaid leave deduction: `(Unpaid Leaves) * (Base Salary / 30)`

### 4. **Record Immutability**
- Previous day's records auto-lock at midnight
- **Prevents** accidental/intentional tampering
- **Allows** admin override (with audit logging recommended)

### 5. **Expense Integration**
- When payroll is marked "Received"
- Automatically creates company expense entry
- Amount = Net Pay after deductions
- Links back to payroll for audit trail

---

## Advanced Customizations

### Adding More Deductions

In `Code.gs`, update the payroll generation:

```javascript
// In generateMonthlyPayroll function
const latePenaltyDeduction = 0; // Can be set based on rules
const otherDeductions = 0; // Loans, advances, etc.
const totalDeductions = totalLeaveDeduction + latePenaltyDeduction + otherDeductions;
```

### Customizing Late Time

In `Code.gs`, update the check-in logic:

```javascript
// Currently: 9:10 AM
const isLateCheckIn = checkInHour > 9 || (checkInHour === 9 && checkInMinute > 10);

// To change to 9:00 AM exactly:
// const isLateCheckIn = checkInHour > 9 || (checkInHour === 9 && checkInMinute > 0);
```

### Custom Paid Leave Allowance

In `generateMonthlyPayroll`:

```javascript
const paidLeavesAllowed = 1; // Change to any number per month
```

### Adding Performance Scores

Components already support performance integration - use the existing `PerformanceRecord` type and create UI to link to daily records.

---

## Troubleshooting

### Issue: "Apps Script URL is not configured"

**Solution**: 
1. Check `.env.local` has `NEXT_PUBLIC_APPS_SCRIPT_URL` set
2. Deploy the Apps Script and copy the new URL
3. Restart your dev server

### Issue: Scheduled lock not working

**Solution**:
1. Go to Apps Script **Triggers**
2. Verify `lockPreviousDaysAttendance` is set to **12:00 AM daily**
3. Check execution logs for errors

### Issue: Working hours calculation seems off

**Possible causes**:
- Timezone mismatch in timestamp
- Time stored in wrong format
- Check the `submissionTime` is ISO format

### Issue: Late arrivals not being flagged

**Check**:
1. Is check-in time after 9:10 AM?
2. Verify timezone (9:10 AM in what timezone?)
3. Check `mergeDailySubmissions` is being called on check-out

---

## Future Enhancements

1. **Biometric Integration**: Connect with fingerprint scanners
2. **Mobile App**: Native mobile app for check-in/out
3. **Geolocation**: Auto-location tagging for on-site work
4. **Overtime Tracking**: Calculate and pay overtime hours
5. **Leave Request System**: Formal leave requests with approvals
6. **Attendance Reports**: PDF reports and email summaries
7. **Salary Advance**: Track and manage advance salary requests
8. **Performance Bonuses**: Link attendance/performance to bonuses
9. **Department Analytics**: Analyze attendance by department
10. **WhatsApp Notifications**: Send payroll/attendance via WhatsApp

---

## Implementation Checklist

- [ ] Deploy updated Code.gs to Google Apps Script
- [ ] Set environment variable: `NEXT_PUBLIC_APPS_SCRIPT_URL`
- [ ] Create scheduled trigger for `lockPreviousDaysAttendance`
- [ ] Create attendance page at `/employee/attendance`
- [ ] Create attendance dashboard at `/admin/attendance`
- [ ] Create payroll management at `/admin/payroll`
- [ ] Update sidebar navigation with new routes
- [ ] Test employee check-in/check-out flow
- [ ] Test admin attendance viewing
- [ ] Test payroll generation
- [ ] Test midnight lock trigger
- [ ] Test "Mark as Received" creates expense
- [ ] Deploy to production

---

## Support & Questions

For issues or questions:
1. Check the Troubleshooting section
2. Review the Business Rules
3. Check Apps Script execution logs
4. Review component comments for usage details

---

**Last Updated**: April 7, 2026  
**System Version**: 1.0.0
