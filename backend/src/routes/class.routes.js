const express = require('express');

/**
 * Class Routes
 * Routes are just for URL mapping, controllers handle the logic
 */
function createClassRoutes(classController, auth) {
    const router = express.Router();
    const { authenticateToken, requireRole } = auth;

    // Create class (teacher only)
    router.post('/create',
        authenticateToken,
        requireRole('teacher'),
        (req, res) => classController.createClass(req, res)
    );

    // Get active classes
    router.get('/active',
        authenticateToken,
        (req, res) => classController.getActiveClasses(req, res)
    );

    // Get class by ID
    router.get('/:classId',
        authenticateToken,
        (req, res) => classController.getClassById(req, res)
    );

    // Update validation code (teacher only)
    router.post('/generate-code/:classId',
        authenticateToken,
        requireRole('teacher'),
        (req, res) => classController.updateValidationCode(req, res)
    );

    // Update location (teacher only)
    router.patch('/:classId/location',
        authenticateToken,
        requireRole('teacher'),
        (req, res) => classController.updateLocation(req, res)
    );

    // Toggle class active status (teacher only)
    router.patch('/:classId/toggle',
        authenticateToken,
        requireRole('teacher'),
        (req, res) => classController.toggleClassStatus(req, res)
    );

    // Get teacher's classes (teacher only)
    router.get('/teacher/my-classes',
        authenticateToken,
        requireRole('teacher'),
        (req, res) => classController.getTeacherClasses(req, res)
    );

    // Delete class (teacher only)
    router.delete('/:classId',
        authenticateToken,
        requireRole('teacher'),
        (req, res) => classController.deleteClass(req, res)
    );

    return router;
}

module.exports = createClassRoutes;
