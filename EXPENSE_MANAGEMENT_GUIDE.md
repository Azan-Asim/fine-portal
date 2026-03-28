# Expense Management System - Documentation

## Overview

The Expense Management System is a comprehensive module for the Fine Portal admin dashboard that allows administrators to:
- Manage penalty-related expenses
- Manage company-wide expenses
- Track company income
- Generate detailed monthly finance reports with PDF download capability

## Features

### 1. Penalty Expenses Section
**Purpose**: Track and manage expenses related to penalties

**Functionality**:
- **Add Penalty Expense**: Create new expense entries with:
  - Date of expense
  - Description of the expense
  - Amount (numeric value)
  - Approved by (manager/administrator name)
  - Optional notes
  
- **View All Expenses**: Display in a table format with:
  - Date
  - Description
  - Amount
  - Approved By
  - Notes
  - Delete action

- **Monthly Finance Report for Penalties**:
  - Total penalties received (paid)
  - Pending penalties amount
  - Total expenses against penalties
  - Remaining balance after expenses
  - Download as PDF report

### 2. Company Expenses Section
**Purpose**: Track all company-wide expenses

**Functionality**:
- **Add Company Expense**: Create expense entries with:
  - Date of expense
  - Description
  - Amount
  - Paid by (employee/department name)
  - Approved by (manager name)
  - Payment method (Cash, Bank Transfer, JazzCash, Check)
  - Receipt/Document upload
  - Optional notes

- **View All Expenses**: Display in table with:
  - Date
  - Description
  - Amount
  - Paid by
  - Approved by
  - Payment method badge
  - Receipt file link
  - Delete action

### 3. Company Income Section
**Purpose**: Track all company income sources

**Functionality**:
- **Add Company Income**: Create income entries with:
  - Date received
  - Description of income source
  - Amount received
  - Received by (Cash/Bank Transfer/JazzCash/Check)
  - Receipt/Document upload
  - Optional notes

- **View All Income**: Display in table with:
  - Date
  - Description
  - Amount (highlighted in green)
  - Received by method badge
  - Receipt file link
  - Notes
  - Delete action

### 4. Finance Reports
**Purpose**: Generate comprehensive financial summaries

**Features**:
- **Month & Year Selection**: Filter reports by specific month and year
- **Summary Statistics**: Key metrics displayed as cards:
  - Total amounts
  - Transaction counts
  - Averages
  
- **Detailed Monthly Reports**:
  - Income breakdown
  - Expense breakdown
  - Net balance calculation
  - Surplus/Deficit indicator
  - Spending percentage

- **PDF Download**: Generate professional PDF reports with:
  - Selected month and year
  - Status summary cards
  - Detailed transaction table
  - Generated date and time
  - Company branding

## Technical Implementation

### File Structure

```
src/
├── app/admin/expenses/
│   └── page.tsx                    # Main expenses page
├── components/
│   ├── PenaltyExpenseForm.tsx      # Add penalty expense form
│   ├── PenaltyExpenseTable.tsx     # Display penalty expenses
│   ├── PenaltyFinanceReport.tsx    # Penalty monthly report
│   ├── CompanyExpenseForm.tsx      # Add company expense form
│   ├── CompanyExpenseTable.tsx     # Display company expenses
│   ├── CompanyIncomeForm.tsx       # Add company income form
│   ├── CompanyIncomeTable.tsx      # Display company income
│   └── CompanyFinanceReport.tsx    # Company monthly report
├── lib/
│   └── pdfGenerator.ts             # PDF generation utilities
└── types/
    └── index.ts                    # TypeScript type definitions
```

### Data Storage

Currently, data is stored in **localStorage** for demo purposes. For production:

**Recommended changes**:
1. Replace localStorage with Google Sheets API calls (like penalties/employees)
2. Or integrate with a backend database (PostgreSQL, MongoDB, Firebase, etc.)
3. Update `googleSheets.ts` with new functions for expenses and income

```typescript
// Example functions to add to googleSheets.ts
export async function addPenaltyExpense(expense: PenaltyExpense): Promise<void> { }
export async function getPenaltyExpenses(): Promise<PenaltyExpense[]> { }
export async function deletePenaltyExpense(id: string): Promise<void> { }

export async function addCompanyExpense(expense: CompanyExpense): Promise<void> { }
export async function getCompanyExpenses(): Promise<CompanyExpense[]> { }
export async function deleteCompanyExpense(id: string): Promise<void> { }

export async function addCompanyIncome(income: CompanyIncome): Promise<void> { }
export async function getCompanyIncomes(): Promise<CompanyIncome[]> { }
export async function deleteCompanyIncome(id: string): Promise<void> { }
```

### Type Definitions

```typescript
// Penalty Expense
interface PenaltyExpense {
  id: string;
  date: string;
  description: string;
  amount: number;
  approvedBy: string;
  notes: string;
  createdAt: string;
}

// Company Expense
interface CompanyExpense {
  id: string;
  date: string;
  description: string;
  amount: number;
  paidBy: string;
  approvedBy: string;
  paymentMethod: PaymentMethod;
  receiptUrl: string;
  notes: string;
  createdAt: string;
}

// Company Income
interface CompanyIncome {
  id: string;
  date: string;
  description: string;
  amount: number;
  receivedBy: PaymentMethod;
  receiptUrl: string;
  notes: string;
  createdAt: string;
}
```

### PDF Generation

The `pdfGenerator.ts` utility handles PDF generation using the browser's built-in print functionality:

**Function**: `generateFinanceReportPDF()`

**Parameters**:
- `reportTitle`: Title of the report
- `month`: Month name
- `year`: Year as number
- `data`: Array of {label, value} pairs
- `tableData`: Optional table with headers and rows

**Implementation**: Opens a new window with formatted HTML and triggers print dialog (user can save as PDF)

## User Navigation

To access the Expense Management System:

1. **Log in** as an Admin
2. **Click** "Expenses" in the left sidebar (new navigation link)
3. **View** four main tabs:
   - **Penalty Expenses**: Manage penalty-related expenses
   - **Company Expenses**: Manage all company expenses
   - **Company Income**: Track income sources
   - **Finance Reports**: View monthly financial summaries

## Using the Features

### Adding a Penalty Expense

1. Click the "Expenses" tab
2. Click "Add Expense" button
3. Fill in the form:
   - Select date
   - Enter description
   - Enter amount
   - Enter approver name
   - Add notes (optional)
4. Click "Add Expense"

### Viewing & Deleting Expenses

1. Navigate to the appropriate section
2. View all entries in the table
3. Click the trash icon to delete an entry
4. Confirm the deletion

### Generating Reports

1. Click the "Finance Reports" tab
2. Select the desired month and year
3. View the summary statistics and detailed breakdowns
4. Click "Download PDF" to generate a printable report

### PDF Download

1. Click "Download PDF" on any finance report
2. A new window opens with formatted report
3. Use browser's print dialog (Cmd+P on Mac, Ctrl+P on Windows)
4. Select "Save as PDF" option
5. Choose location and save

## Sidebar Navigation Update

The Sidebar component has been updated to include the new "Expenses" link:

```typescript
const adminLinks = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/employees', label: 'Employees', icon: Users },
  { href: '/admin/penalties', label: 'Penalties', icon: FileText },
  { href: '/admin/issue-penalty', label: 'Issue Penalty', icon: ShieldCheck },
  { href: '/admin/expenses', label: 'Expenses', icon: DollarSign },  // NEW
  { href: '/bank-info', label: 'Bank Info', icon: Building2 },
];
```

## Next Steps for Production

### 1. Database Integration
- Migrate from localStorage to a persistent data store
- Implement CRUD operations in `googleSheets.ts` or backend API

### 2. File Upload
- Integrate with cloud storage (Google Drive, AWS S3, Azure Blob)
- Update receipt handling to store actual file references

### 3. Enhanced PDF Generation
- Integrate jsPDF or similar library for better PDF control
- Add company logo and branding
- Support for multiple languages/currencies

### 4. Authentication & Permissions
- Implement role-based access (view-only, edit, delete)
- Track who made changes (audit trail)

### 5. Data Validation
- Add input validation for amounts (prevent negative values)
- Email validation for approvers
- Date range restrictions

### 6. Reporting Enhancements
- Add charts and visualizations
- Compare month-over-month trends
- Budget vs. actual analysis

### 7. Integration with Penalties
- Automatically deduct penalty expenses from received penalties
- Link companies income to penalties received

## Troubleshooting

### Data Not Persisting
- Check browser's localStorage is enabled
- Clear browser cache and reload
- Check browser console for errors

### PDF Not Opening
- Ensure pop-up windows are allowed
- Check browser compatibility
- Try a different browser

### Forms Not Validating
- Ensure all required fields are filled (marked with *)
- Check for special characters in text fields
- Verify numeric values are actual numbers

## Support & Maintenance

For issues or feature requests:
1. Check the browser console (F12) for error messages
2. Verify all data is properly formatted
3. Contact the development team with specific error messages

---

**Last Updated**: March 28, 2026
**Version**: 1.0.0
**Status**: Ready for Production Integration
