import { PayrollDraft } from '@/types';

const MAX_PAYROLL_EMPLOYEES_PER_PAGE = 6;

function escapeHtml(value: string): string {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function formatNumber(value: number): string {
    return Number(value || 0).toLocaleString('en-PK');
}

export function generatePayrollLetterPdf(draft: PayrollDraft, existingWindow?: Window | null): string {
  const limitedLineItems = draft.lineItems.slice(0, MAX_PAYROLL_EMPLOYEES_PER_PAGE);
    const monthLabel = `${draft.salaryMonth} - ${draft.salaryYear}`;
    const dateLabel = new Date(draft.payrollDate).toLocaleDateString('en-GB');
  const rows = limitedLineItems.map((line, index) => `
        <tr>
            <td class="c1">${index + 1}</td>
            <td class="c2">${escapeHtml(line.employeeName)}</td>
            <td class="c3">${escapeHtml(line.accountNo || '-')}</td>
            <td class="c4">${formatNumber(line.amount)}</td>
        </tr>
    `).join('');

  const total = limitedLineItems.reduce((sum, item) => sum + Number(item.amount || 0), 0);

    const html = `
<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Monthly Payroll Letter</title>
<style>
  :root {
    --fit-scale: 1;
  }

  @page {
    size: A4;
    margin-top: 2in;
    margin-bottom: 1.5in;
    margin-left: 0.7in;
    margin-right: 0.7in;
  }

  html, body {
    margin: 0;
    padding: 0;
    background: #fff;
    color: #222;
    font-family: Arial, Helvetica, sans-serif;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .page {
    width: 100%;
    line-height: calc(1.55 * var(--fit-scale));
    font-size: calc(14px * var(--fit-scale));
    page-break-after: avoid;
    height: calc(11.69in - 3.5in);
    overflow: hidden;
  }

  .mb8 { margin-bottom: 8px; }
  .mb12 { margin-bottom: 12px; }
  .mb16 { margin-bottom: 16px; }
  .mb20 { margin-bottom: 20px; }

  .subject {
    font-weight: 500;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin-top: calc(18px * var(--fit-scale));
    break-inside: avoid;
    table-layout: fixed;
  }

  th, td {
    border: 2px solid #333;
    padding: calc(10px * var(--fit-scale)) calc(8px * var(--fit-scale));
    font-size: calc(14px * var(--fit-scale));
  }

  th {
    text-align: center;
    font-weight: 700;
  }

  td.c1 { width: 10%; text-align: center; }
  td.c2 { width: 34%; text-align: center; }
  td.c3 { width: 38%; text-align: center; }
  td.c4 { width: 18%; text-align: center; }

  .sign {
    margin-top: calc(28px * var(--fit-scale));
  }

  .name-gap {
    margin-top: calc(20px * var(--fit-scale));
  }

  .bold { font-weight: 700;
  margin-top: calc(4px * var(--fit-scale));
  }

  tr, td, th {
    page-break-inside: avoid;
  }
</style>
</head>
<body>
  <div class="page">
    <div class="mb8">The Manager,</div>
    <div>Meezan Bank Limited,</div>
    <div>Samnabad Branch,</div>
    <div class="mb12">Lahore.</div>

    <div class="subject mb8">Subject: Employees Salary for the Month of ${escapeHtml(monthLabel)}</div>

    <div>Dear Sir,</div>
    <div class="mb16">With reference to above mentioned subject you are requested to transfer amounts in their names of our following employees being salary for the month of ${escapeHtml(monthLabel)}. The cheque No. ${escapeHtml(draft.chequeNo)}, dated ${escapeHtml(dateLabel)} draw on your bank is enclosed please.</div>

    <table>
      <thead>
        <tr>
          <th>Sr no</th>
          <th>Name of Employee</th>
          <th>Acount no</th>
          <th>Amount Rs.</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
        <tr>
          <td class="c1"></td>
          <td class="c2"></td>
          <td class="c3 bold">Total</td>
          <td class="c4 bold">${formatNumber(total)}</td>
        </tr>
      </tbody>
    </table>

    <div class="sign">Your's Trully,</div>
    <div class="bold mb20">For Dev's Inn Technologies</div>

    <div class="bold name-gap">${escapeHtml(draft.preparedBy || 'Ubaid Ullah Asim')}</div>
    <div>${escapeHtml(draft.designation || 'Chief Executive')}</div>
  </div>

  <script>
    function fitToSinglePage() {
      const root = document.documentElement;
      const page = document.querySelector('.page');
      if (!page) return;

      let scale = 1;
      const minScale = 0.72;
      const step = 0.02;

      root.style.setProperty('--fit-scale', String(scale));

      // Decrease scale only when needed so content remains on one page.
      while (page.scrollHeight > page.clientHeight && scale > minScale) {
        scale = Number((scale - step).toFixed(2));
        root.style.setProperty('--fit-scale', String(scale));
      }
    }

    window.onload = () => {
      fitToSinglePage();
      window.print();
    };
  </script>
</body>
</html>
`;

    const popup = existingWindow ?? window.open('', '_blank');
    if (!popup) {
        throw new Error('Unable to open print window. Please allow popups for this site.');
    }

    popup.document.open();
    popup.document.write(html);
    popup.document.close();

    return html;
}
