const { exportToExcel } = require('../utils/excelExport');

/**
 * AttendanceController - Thin controller layer
 * Only handles HTTP request/response
 * Delegates business logic to AttendanceService
 */
class AttendanceController {
    constructor(attendanceService) {
        this.attendanceService = attendanceService;
    }

    /**
     * Submit attendance
     */
    async submitAttendance(req, res) {
        try {
            const result = await this.attendanceService.submitAttendance(
                req.body,
                req.user.userId
            );

            res.status(201).json({
                message: 'Attendance submitted successfully',
                attendance: result
            });
        } catch (error) {
            console.error('Submit attendance error:', error);
            res.status(400).json({ error: error.message });
        }
    }

    /**
     * Get attendance for a class
     */
    async getClassAttendance(req, res) {
        try {
            const result = await this.attendanceService.getClassAttendance(
                req.params.classId,
                req.user.userId
            );

            res.json(result);
        } catch (error) {
            console.error('Get attendance error:', error);
            res.status(error.message.includes('not found') ? 404 : 403)
                .json({ error: error.message });
        }
    }

    /**
     * Get student's attendance history
     */
    async getStudentAttendance(req, res) {
        try {
            const result = await this.attendanceService.getStudentAttendance(req.user.userId);
            res.json(result);
        } catch (error) {
            console.error('Get student attendance error:', error);
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * Export attendance to Excel
     */
    async exportAttendance(req, res) {
        try {
            const { attendanceRecords, className, classDate, courseCode, courseName } =
                await this.attendanceService.getAttendanceForExport(
                    req.params.classId,
                    req.user.userId
                );

            // Generate Excel file
            const excelBuffer = await exportToExcel(attendanceRecords, className);

            // Build a descriptive, specific filename
            const date = classDate
                ? new Date(classDate).toISOString().split('T')[0]
                : new Date().toISOString().split('T')[0];
            const safeClassName = className.replace(/[^a-zA-Z0-9]/g, '_');

            let filename;
            if (courseCode) {
                const safeCourseCode = courseCode.replace(/[^a-zA-Z0-9]/g, '_');
                // e.g. CSE_3105_Lec_01_2025-07-20.xlsx
                filename = `${safeCourseCode}_${safeClassName}_${date}.xlsx`;
            } else {
                // No course linked — just class name + date
                filename = `Attendance_${safeClassName}_${date}.xlsx`;
            }

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            res.send(excelBuffer);
        } catch (error) {
            console.error('Export attendance error:', error);
            res.status(error.message.includes('not found') ? 404 : 403)
                .json({ error: error.message });
        }
    }

    /**
     * Manually add attendance by registration number (teacher only)
     */
    async manuallyAddAttendance(req, res) {
        try {
            const { classId, registrationNumber } = req.body;

            const result = await this.attendanceService.manuallyAddAttendance(
                classId,
                registrationNumber,
                req.user.userId
            );

            res.status(201).json({
                message: 'Attendance added successfully',
                attendance: result
            });
        } catch (error) {
            console.error('Manual attendance error:', error);
            res.status(400).json({ error: error.message });
        }
    }
}

module.exports = AttendanceController;

