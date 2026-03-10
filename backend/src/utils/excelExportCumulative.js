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

    // Expected Data format changes from earlier PR
    // If it's the old format (array) handle gracefully, else extract classes and records
    const isNewFormat = !Array.isArray(cumulativeData) && cumulativeData.records && cumulativeData.classes;
    const records = isNewFormat ? cumulativeData.records : cumulativeData;
    const classes = isNewFormat ? cumulativeData.classes : [];

    // Define Base columns
    const columns = [
        { header: 'SL', key: 'sl', width: 8 },
        { header: 'Registration Number', key: 'registrationNumber', width: 25 },
        { header: 'Name', key: 'studentName', width: 30 }
    ];

    // Dynamically add a column for each class held
    classes.forEach((cls, index) => {
        // e.g. "Class 1 (10/05)"
        const dateStr = new Date(cls.date).toLocaleDateString('en-US', { day: '2-digit', month: '2-digit' });
        columns.push({
            header: `Class ${index + 1}\n(${dateStr})`,
            key: `class_${cls._id.toString()}`,
            width: 15
        });
    });

    // Add aggregate columns at the end
    columns.push(
        { header: 'Classes Attended', key: 'attendanceCount', width: 18 },
        { header: 'Attendance %', key: 'attendancePercent', width: 15 }
    );

    worksheet.columns = columns;

    // Style the header row
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' }
    };
    worksheet.getRow(1).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    worksheet.getRow(1).height = 40; // Taller for class date wrapping

    // Sort by registration number
    const sortedData = [...records].sort((a, b) =>
        a.registrationNumber.localeCompare(b.registrationNumber)
    );

    // Add data rows
    sortedData.forEach((record, index) => {
        const rowData = {
            sl: index + 1,
            registrationNumber: record.registrationNumber,
            studentName: record.studentName,
            attendanceCount: record.attendanceCount,
            attendancePercent: record.attendancePercentage || '-'
        };

        // Populate dynamic class attendance if available
        if (record.classAttendanceMap) {
            classes.forEach((cls) => {
                const mapEntry = record.classAttendanceMap[cls._id.toString()];
                rowData[`class_${cls._id.toString()}`] = mapEntry ? mapEntry.status : '✗';
            });
        }

        const row = worksheet.addRow(rowData);

        // Center align the dynamic checkmark columns and percentage
        classes.forEach((cls) => {
            const colIndex = worksheet.getColumn(`class_${cls._id.toString()}`).number;
            row.getCell(colIndex).alignment = { horizontal: 'center', vertical: 'middle' };
            const status = rowData[`class_${cls._id.toString()}`];
            if (status === '✓') {
                row.getCell(colIndex).font = { color: { argb: 'FF00B050' }, bold: true }; // Green check
            } else {
                row.getCell(colIndex).font = { color: { argb: 'FFFF0000' }, bold: true }; // Red cross
            }
        });

        row.getCell(worksheet.getColumn('attendancePercent').number).alignment = { horizontal: 'center', vertical: 'middle' };
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
    worksheet.insertRow(4, [`Total Classes Held: ${classes.length}`]);
    worksheet.insertRow(5, [`Total Students Enrolled: ${sortedData.length}`]);
    worksheet.insertRow(6, []);

    // Style title
    worksheet.getCell('A1').font = { bold: true, size: 16 };
    worksheet.getCell('A2').font = { bold: true, size: 12 };
    worksheet.getCell('A3').font = { italic: true, size: 11, color: { argb: 'FF666666' } };
    worksheet.getCell('A4').font = { bold: true, size: 11 };
    worksheet.getCell('A5').font = { bold: true, size: 11 };

    // Merge title cells across all dynamic columns
    const totalCols = columns.length;
    const mergeEndObj = worksheet.getColumn(totalCols).letter;
    worksheet.mergeCells(`A1:${mergeEndObj}1`);
    worksheet.mergeCells(`A2:${mergeEndObj}2`);
    worksheet.mergeCells(`A3:${mergeEndObj}3`);
    worksheet.mergeCells(`A4:${mergeEndObj}4`);
    worksheet.mergeCells(`A5:${mergeEndObj}5`);

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
}

module.exports = {
    exportCumulativeToExcel
};
