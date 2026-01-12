const ExcelJS = require('exceljs');

/**
 * Export cumulative attendance data to Excel format
 * @param {Array} cumulativeData - Array of cumulative attendance records
 * @param {string} courseCode - Course code
 * @param {string} session - Academic session
 * @returns {Promise<Buffer>} Excel file buffer
 */
async function exportCumulativeToExcel(cumulativeData, courseCode, session) {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Digital Attendance System';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet('Cumulative Attendance');

    // Define columns
    worksheet.columns = [
        { header: 'SL', key: 'sl', width: 8 },
        { header: 'Registration Number', key: 'registrationNumber', width: 25 },
        { header: 'Name', key: 'studentName', width: 30 },
        { header: 'Classes Attended', key: 'attendanceCount', width: 18 },
        { header: 'First Attendance', key: 'firstAttendance', width: 25 },
        { header: 'Last Attendance', key: 'lastAttendance', width: 25 }
    ];

    // Style the header row
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' }
    };
    worksheet.getRow(1).alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getRow(1).height = 25;

    // Sort by registration number
    const sortedData = [...cumulativeData].sort((a, b) =>
        a.registrationNumber.localeCompare(b.registrationNumber)
    );

    // Add data rows
    sortedData.forEach((record, index) => {
        worksheet.addRow({
            sl: index + 1,
            registrationNumber: record.registrationNumber,
            studentName: record.studentName,
            attendanceCount: record.attendanceCount,
            firstAttendance: new Date(record.firstAttendanceDate).toLocaleString('en-US', {
                timeZone: 'Asia/Dhaka',
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            }),
            lastAttendance: new Date(record.lastAttendanceDate).toLocaleString('en-US', {
                timeZone: 'Asia/Dhaka',
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            })
        });
    });

    // Add borders to all cells
    worksheet.eachRow((row, rowNumber) => {
        row.eachCell((cell) => {
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
        });
        // Alternate row colors for better readability (skip header)
        if (rowNumber > 1 && rowNumber % 2 === 0) {
            row.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFE9EFF7' }
            };
        }
    });

    // Add title row at the top
    worksheet.insertRow(1, []);
    worksheet.insertRow(1, [`Cumulative Attendance Report - ${courseCode}`]);
    worksheet.insertRow(2, [`Session: ${session}`]);
    worksheet.insertRow(3, [`Generated: ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Dhaka' })}`]);
    worksheet.insertRow(4, [`Total Students: ${sortedData.length}`]);
    worksheet.insertRow(5, []);

    // Style title
    worksheet.getCell('A1').font = { bold: true, size: 16 };
    worksheet.getCell('A2').font = { bold: true, size: 12 };
    worksheet.getCell('A3').font = { italic: true, size: 11, color: { argb: 'FF666666' } };
    worksheet.getCell('A4').font = { bold: true, size: 11 };

    // Merge title cells
    worksheet.mergeCells('A1:F1');
    worksheet.mergeCells('A2:F2');
    worksheet.mergeCells('A3:F3');
    worksheet.mergeCells('A4:F4');

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
}

module.exports = {
    exportCumulativeToExcel
};
