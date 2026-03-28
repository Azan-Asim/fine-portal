// PDF generation utilities for finance reports

export const generateFinanceReportPDF = (
    reportTitle: string,
    month: string,
    year: number,
    data: {
        label: string;
        value: string | number;
    }[],
    tableData?: {
        headers: string[];
        rows: string[][];
    }
) => {
    // This function creates HTML and converts it to printable PDF using browser's print functionality
    const htmlContent = generateHTMLReport(reportTitle, month, year, data, tableData);
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        setTimeout(() => {
            printWindow.print();
        }, 250);
    }
};

const generateHTMLReport = (
    reportTitle: string,
    month: string,
    year: number,
    data: {
        label: string;
        value: string | number;
    }[],
    tableData?: {
        headers: string[];
        rows: string[][];
    }
) => {
    const currentDate = new Date().toLocaleDateString();
    
    const statsHTML = data.map(item => `
        <div style="margin: 15px 0; padding: 10px; background: #f5f5f5; border-radius: 4px;">
            <div style="color: #666; font-size: 12px;">${item.label}</div>
            <div style="font-size: 20px; font-weight: bold; color: #333;">${item.value}</div>
        </div>
    `).join('');

    let tableHTML = '';
    if (tableData) {
        tableHTML = `
            <table style="width: 100%; border-collapse: collapse; margin-top: 30px;">
                <thead>
                    <tr style="background: #f0f0f0;">
                        ${tableData.headers.map(h => `<th style="padding: 10px; text-align: left; border: 1px solid #ddd; font-weight: bold;">${h}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
                    ${tableData.rows.map(row => `
                        <tr>
                            ${row.map(cell => `<td style="padding: 10px; border: 1px solid #ddd;">${cell}</td>`).join('')}
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>${reportTitle}</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    margin: 0;
                    padding: 20px;
                    background: white;
                }
                .container {
                    max-width: 1000px;
                    margin: 0 auto;
                }
                .header {
                    text-align: center;
                    margin-bottom: 30px;
                    border-bottom: 2px solid #333;
                    padding-bottom: 20px;
                }
                .header h1 {
                    margin: 0 0 10px 0;
                    color: #333;
                }
                .header p {
                    margin: 5px 0;
                    color: #666;
                    font-size: 14px;
                }
                .stats {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 15px;
                    margin: 20px 0;
                }
                .stat-item {
                    padding: 15px;
                    background: #f9f9f9;
                    border-left: 4px solid #007bff;
                    border-radius: 4px;
                }
                .stat-label {
                    color: #666;
                    font-size: 12px;
                    text-transform: uppercase;
                }
                .stat-value {
                    font-size: 24px;
                    font-weight: bold;
                    color: #333;
                    margin-top: 5px;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 30px;
                }
                thead {
                    background: #f0f0f0;
                }
                th, td {
                    padding: 12px;
                    text-align: left;
                    border: 1px solid #ddd;
                }
                th {
                    font-weight: bold;
                    background: #f0f0f0;
                }
                .footer {
                    text-align: center;
                    margin-top: 30px;
                    padding-top: 20px;
                    border-top: 1px solid #ddd;
                    color: #999;
                    font-size: 12px;
                }
                @media print {
                    body { margin: 0; padding: 10px; }
                    .container { max-width: 100%; }
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>${reportTitle}</h1>
                    <p><strong>Period:</strong> ${month} ${year}</p>
                    <p style="color: #999; font-size: 12px;">Generated on: ${currentDate}</p>
                </div>
                
                <div class="stats">
                    ${data.map(item => `
                        <div class="stat-item">
                            <div class="stat-label">${item.label}</div>
                            <div class="stat-value">${item.value}</div>
                        </div>
                    `).join('')}
                </div>
                
                ${tableHTML}
                
                <div class="footer">
                    <p>This is an automated report generated by Devsinn Team Management Portal</p>
                </div>
            </div>
        </body>
        </html>
    `;
};
