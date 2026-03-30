import { EmployeeMonthlyAttendanceSummary } from '@/types';

function escapeHtml(value: string): string {
    return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

export function generateEmployeeAttendancePdf(summary: EmployeeMonthlyAttendanceSummary) {
    const employeeName = summary.employee?.name || 'Unknown Employee';
    const employeeEmail = summary.employee?.email || '-';
    const employeeRole = summary.employee?.jobPosition || '-';

    const performanceSummary = [
      `W1: ${summary.performance?.week1Comment || '-'} (${Number(summary.performance?.week1Score || 0).toFixed(1)}/10)`,
      `W2: ${summary.performance?.week2Comment || '-'} (${Number(summary.performance?.week2Score || 0).toFixed(1)}/10)`,
      `W3: ${summary.performance?.week3Comment || '-'} (${Number(summary.performance?.week3Score || 0).toFixed(1)}/10)`,
      `W4: ${summary.performance?.week4Comment || '-'} (${Number(summary.performance?.week4Score || 0).toFixed(1)}/10)`,
      `Final: ${summary.performance?.finalComment || '-'} (${Number(summary.performance?.finalScore || 0).toFixed(1)}/10)`,
    ];

    const rows = summary.records
        .map((r, index) => {
            const sessions = r.workSessions.map((s) => `${escapeHtml(s.checkIn)} - ${escapeHtml(s.checkOut)}`).join(', ') || '-';
            return `
                <tr>
                    <td>${index + 1}</td>
                    <td>${escapeHtml(r.date)}</td>
                    <td>${escapeHtml(r.status)}</td>
                    <td>${escapeHtml(r.leaveReason || '-')}</td>
                    <td>${escapeHtml(sessions)}</td>
                    <td>${Number(r.workingHours || 0).toFixed(2)}</td>
                    <td>${Number(r.trackingHours || 0).toFixed(2)}</td>
                    <td>${escapeHtml(performanceSummary.join(' | '))}</td>
                </tr>
            `;
        })
        .join('');

    const html = `
<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Performance Record - ${escapeHtml(employeeName)}</title>
<style>
  @page { size: A4; margin: 0.6in; }
  body { font-family: Arial, Helvetica, sans-serif; color: #111; margin: 0; }
  h1 { margin: 0 0 6px; font-size: 22px; }
  .muted { color: #555; font-size: 13px; }
  .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin: 18px 0; }
  .card { border: 1px solid #ccc; border-radius: 8px; padding: 10px; }
  .label { font-size: 12px; color: #666; }
  .value { font-size: 18px; font-weight: 700; margin-top: 4px; }
  table { width: 100%; border-collapse: collapse; margin-top: 14px; }
  th, td { border: 1px solid #333; padding: 8px; font-size: 12px; text-align: left; vertical-align: top; }
  th { background: #f3f3f3; }
</style>
</head>
<body>
  <h1>Monthly Performance Record</h1>
  <div class="muted">Employee: ${escapeHtml(employeeName)} | ${escapeHtml(employeeRole)} | ${escapeHtml(employeeEmail)}</div>
  <div class="muted">Month: ${summary.month} / ${summary.year}</div>

  <div class="grid">
    <div class="card"><div class="label">Total Working Hours</div><div class="value">${summary.totalWorkingHours.toFixed(2)}</div></div>
    <div class="card"><div class="label">Total Tracking Hours</div><div class="value">${summary.totalTrackingHours.toFixed(2)}</div></div>
    <div class="card"><div class="label">Total Presents</div><div class="value">${summary.totalPresents}</div></div>
    <div class="card"><div class="label">Total Leaves</div><div class="value">${summary.totalLeaves}</div></div>
    <div class="card"><div class="label">Total Absents</div><div class="value">${summary.totalAbsents}</div></div>
    <div class="card"><div class="label">Total Holidays</div><div class="value">${summary.totalHolidays}</div></div>
    <div class="card"><div class="label">Performance Score</div><div class="value">${Number(summary.totalPerformanceScore || 0).toFixed(1)} / ${Number(summary.maxPerformanceScore || 50).toFixed(0)}</div></div>
  </div>

  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Date</th>
        <th>Status</th>
        <th>Leave Reason</th>
        <th>Check In / Out</th>
        <th>Working Hours</th>
        <th>Tracking Hours</th>
        <th>Weekly Performance Notes (1-4)</th>
      </tr>
    </thead>
    <tbody>
      ${rows || '<tr><td colspan="8">No performance records in selected month.</td></tr>'}
    </tbody>
  </table>

  <script>
    window.onload = () => window.print();
  </script>
</body>
</html>
`;

    const popup = window.open('', '_blank');
    if (!popup) {
        throw new Error('Unable to open print window. Please allow popups for this site.');
    }

    popup.document.open();
    popup.document.write(html);
    popup.document.close();
}
