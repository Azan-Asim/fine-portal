import { SalarySlip } from '@/types';

function escapeHtml(value: string): string {
    return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function toNumber(value: number): string {
    return Number(value || 0).toLocaleString('en-PK');
}

export function getSalarySlipHtml(slip: SalarySlip) {
    return `
<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Payslip - ${escapeHtml(slip.employeeName)}</title>
<style>
  @page { size: A4; margin: 0.7in; }
  body { font-family: Arial, Helvetica, sans-serif; color: #111; margin: 0; }
  .center { text-align: center; }
  .title { font-size: 38px; font-weight: 700; margin: 4px 0; }
  .subtitle { font-size: 24px; font-weight: 700; margin: 0 0 32px; }
  .meta { width: 100%; margin-bottom: 28px; font-size: 14px; }
  .meta td { padding: 2px 0; }
  table.pay { width: 100%; border-collapse: collapse; margin-top: 12px; }
  table.pay th, table.pay td { border: 1px solid #222; padding: 8px; font-size: 14px; }
  table.pay th { background: #e2e2e2; text-align: center; }
  .right { text-align: right; }
  .signatures { margin-top: 70px; display: grid; grid-template-columns: 1fr 1fr; gap: 48px; }
  .sign-label { font-size: 14px; margin-bottom: 56px; text-align: center; }
  .line { border-top: 1px solid #222; }
</style>
</head>
<body>
  <div class="center">
    <div class="title">Payslip</div>
    <div class="subtitle">Dev's Inn Technologies</div>
  </div>

  <table class="meta">
    <tr>
      <td>Pay Date</td><td>: ${escapeHtml(slip.payDate)}</td>
      <td>Employee Name</td><td>: ${escapeHtml(slip.employeeName)}</td>
    </tr>
    <tr>
      <td>Working Days</td><td>: ${escapeHtml(String(slip.workingDays))}</td>
      <td>Employee ID</td><td>: ${escapeHtml(String(slip.employeeId))}</td>
    </tr>
    <tr>
      <td>Paid Leave</td><td>: ${escapeHtml(String(slip.paidLeave))}</td>
      <td>Salary Month</td><td>: ${escapeHtml(`${slip.salaryMonth} ${slip.salaryYear}`)}</td>
    </tr>
    <tr>
      <td>Unpaid Leave</td><td>: ${escapeHtml(String(slip.unpaidLeave))}</td>
      <td></td><td></td>
    </tr>
    <tr>
      <td>Late Comings</td><td>: ${escapeHtml(String(slip.lateComings))}</td>
      <td></td><td></td>
    </tr>
  </table>

  <table class="pay">
    <thead>
      <tr>
        <th>Earnings</th>
        <th>Amount</th>
        <th>Deductions</th>
        <th>Amount</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Basic Pay</td>
        <td class="right">${toNumber(slip.basicPay)}</td>
        <td>Deduction for leaves</td>
        <td class="right">${toNumber(slip.leaveDeduction)}</td>
      </tr>
      <tr>
        <td></td>
        <td></td>
        <td>Deduction for Late comings</td>
        <td class="right">${toNumber(slip.lateDeduction)}</td>
      </tr>
      <tr>
        <td class="right"><strong>Total Earnings</strong></td>
        <td class="right"><strong>${toNumber(slip.basicPay)}</strong></td>
        <td class="right"><strong>Total Deductions</strong></td>
        <td class="right"><strong>${toNumber(slip.totalDeductions)}</strong></td>
      </tr>
      <tr>
        <td></td>
        <td></td>
        <td class="right"><strong>Net Pay (without Deductions)</strong></td>
        <td class="right"><strong>${toNumber(slip.netPay)}</strong></td>
      </tr>
    </tbody>
  </table>

  <div class="signatures">
    <div>
      <div class="sign-label">Employer Signature</div>
      <div class="line"></div>
    </div>
    <div>
      <div class="sign-label">Employee Signature</div>
      <div class="line"></div>
    </div>
  </div>
</body>
</html>
`;
}

export function printSalarySlip(slip: SalarySlip) {
    const popup = window.open('', '_blank');
    if (!popup) {
        throw new Error('Unable to open salary slip. Please allow popups for this site.');
    }

    popup.document.open();
    popup.document.write(getSalarySlipHtml(slip));
    popup.document.close();

    popup.onload = () => {
        popup.print();
    };
}
