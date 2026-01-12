const express = require('express');

/**
 * Course Routes
 * Routes are just for URL mapping, controllers handle the logic
 */
function createCourseRoutes(courseController, auth) {
    const router = express.Router();
    const { authenticateToken, requireRole } = auth;

    // Create course (teacher only)
    router.post('/create',
        authenticateToken,
        requireRole('teacher'),
        (req, res) => courseController.createCourse(req, res)
    );

    // Get teacher's courses (teacher only)
    router.get('/teacher/my-courses',
        authenticateToken,
        requireRole('teacher'),
        (req, res) => courseController.getTeacherCourses(req, res)
    );

    // Get course by ID
    router.get('/:courseId',
        authenticateToken,
        (req, res) => courseController.getCourseById(req, res)
    );

    // Get cumulative attendance for a course (teacher only)
    router.get('/:courseId/cumulative-attendance',
        authenticateToken,
        requireRole('teacher'),
        (req, res) => courseController.getCumulativeAttendance(req, res)
    );

    // Download cumulative attendance as Excel (teacher only)
    router.get('/:courseId/download-cumulative',
        authenticateToken,
        requireRole('teacher'),
        (req, res) => courseController.downloadCumulativeAttendance(req, res)
    );

    // Delete course (teacher only)
    router.delete('/:courseId',
        authenticateToken,
        requireRole('teacher'),
        (req, res) => courseController.deleteCourse(req, res)
    );

    return router;
}

module.exports = createCourseRoutes;
