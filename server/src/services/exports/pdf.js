/**
 * server/src/services/exports/pdf.js
 *
 * PDF report generation using PDFMake.
 * Currently implements the monthly attendance summary PDF.
 */

const PdfPrinter = require('pdfmake');
const path = require('path');
const fs   = require('fs');
const env  = require('../../config/env');
const { minutesToHHMM, toDateStr } = require('../../utils/date');

// PDFMake requires font definitions — use built-in Roboto for zero dependency
const fonts = {
  Roboto: {
    normal:      path.join(__dirname, '../../../../node_modules/pdfmake/build/vfs_fonts.js'),
    bold:        path.join(__dirname, '../../../../node_modules/pdfmake/build/vfs_fonts.js'),
    italics:     path.join(__dirname, '../../../../node_modules/pdfmake/build/vfs_fonts.js'),
    bolditalics: path.join(__dirname, '../../../../node_modules/pdfmake/build/vfs_fonts.js'),
  },
};

// Use pdfmake's virtual file system fonts (self-contained, no external font files needed)
const pdfMakeVfs = require('pdfmake/build/vfs_fonts');

// ── Monthly Attendance Summary PDF ────────────────────────────────────────────
async function buildMonthlyAttendancePdf(records, { month, year, department }) {
  const monthName = new Date(year, month - 1)
    .toLocaleString('en-IN', { month: 'long', year: 'numeric' });

  const tableHeaders = [
    'Code', 'Name', 'Dept', 'Present', 'Absent',
    'Leave', 'WO', 'Holiday', 'Miss', 'Work Hrs', 'OT Hrs',
  ];

  const tableBody = [
    // Header row
    tableHeaders.map(h => ({
      text: h, bold: true, fontSize: 8,
      fillColor: '#1E3A5F', color: '#FFFFFF',
      alignment: 'center',
    })),
    // Data rows
    ...records.map((rec, i) => [
      { text: rec.employeeCode,   fontSize: 7 },
      { text: rec.employeeName,   fontSize: 7 },
      { text: rec.department || '', fontSize: 7 },
      { text: rec.presentDays,    fontSize: 7, alignment: 'center' },
      { text: rec.absentDays,     fontSize: 7, alignment: 'center' },
      { text: rec.leaveDays,      fontSize: 7, alignment: 'center' },
      { text: rec.weeklyOffDays,  fontSize: 7, alignment: 'center' },
      { text: rec.holidayDays,    fontSize: 7, alignment: 'center' },
      { text: rec.missPunchDays,  fontSize: 7, alignment: 'center' },
      { text: minutesToHHMM(rec.totalWorkMinutes), fontSize: 7, alignment: 'center' },
      { text: minutesToHHMM(rec.totalOtMinutes),   fontSize: 7, alignment: 'center' },
    ].map((cell, j) => ({
      ...cell,
      fillColor: i % 2 === 1 ? '#F0F4F8' : '#FFFFFF',
    }))),
  ];

  const docDefinition = {
    pageOrientation: 'landscape',
    pageMargins:     [20, 40, 20, 40],
    content: [
      {
        text:      `Monthly Attendance Register — ${monthName}${department ? `  (${department})` : ''}`,
        style:     'title',
        margin:    [0, 0, 0, 12],
      },
      {
        text:   `Generated: ${new Date().toLocaleString('en-IN')}  |  Total Employees: ${records.length}`,
        style:  'subtitle',
        margin: [0, 0, 0, 10],
      },
      {
        table:  { headerRows: 1, widths: ['auto','*','*','auto','auto','auto','auto','auto','auto','auto','auto'], body: tableBody },
        layout: {
          hLineWidth: () => 0.5,
          vLineWidth: () => 0.5,
          hLineColor: () => '#CDD5DF',
          vLineColor: () => '#CDD5DF',
        },
      },
    ],
    styles: {
      title:    { fontSize: 14, bold: true, color: '#1E3A5F' },
      subtitle: { fontSize: 8,  color: '#627D98' },
    },
    defaultStyle: { font: 'Roboto' },
  };

  return new Promise((resolve, reject) => {
    try {
      const printer  = new PdfPrinter(fonts);
      const pdfDoc   = printer.createPdfKitDocument(docDefinition, { tableLayouts: {}, vfs: pdfMakeVfs.pdfMake.vfs });
      const filename = `attendance_${year}_${String(month).padStart(2,'0')}${department ? `_${department.replace(/\s+/g,'_')}` : ''}_${Date.now()}.pdf`;
      const filepath = path.join(path.resolve(env.EXPORT_DIR, 'temp'), filename);

      const stream = fs.createWriteStream(filepath);
      pdfDoc.pipe(stream);
      pdfDoc.end();

      stream.on('finish', () => resolve({ filepath, filename }));
      stream.on('error',  reject);
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = { buildMonthlyAttendancePdf };