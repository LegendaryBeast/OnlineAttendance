const express = require('express');

/**
 * Attendance Routes
 * Routes are just for URL mapping, controllers handle the logic
 */
function createAttendanceRoutes(attendanceController, auth) {
    const router = express.Router();
    const { authenticateToken, requireRole } = auth;

    // Submit attendance (student only)
    router.post('/submit',
        authenticateToken,
        requireRole('student'),
        (req, res) => attendanceController.submitAttendance(req, res)
    );

    // Get attendance for a class (teacher only)
    router.get('/class/:classId',
        authenticateToken,
        requireRole('teacher'),
        (req, res) => attendanceController.getClassAttendance(req, res)
    );

    // Export attendance to Excel (teacher only)
    router.get('/export/:classId',
        authenticateToken,
        requireRole('teacher'),
        (req, res) => attendanceController.exportAttendance(req, res)
    );

    // Get student's attendance history (student only)
    router.get('/my-attendance',
        authenticateToken,
        requireRole('student'),
        (req, res) => attendanceController.getStudentAttendance(req, res)
    );

    // Manually add attendance by registration number (teacher only)
    router.post('/manual',
        authenticateToken,
        requireRole('teacher'),
        (req, res) => attendanceController.manuallyAddAttendance(req, res)
    );

    return router;
}

module.exports = createAttendanceRoutes;

