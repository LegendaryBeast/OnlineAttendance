/**
 * ClassController - Thin controller layer
 * Only handles HTTP request/response
 * Delegates business logic to ClassService
 */
class ClassController {
    constructor(classService) {
        this.classService = classService;
    }

    /**
     * Create a new class
     */
    async createClass(req, res) {
        try {
            const newClass = await this.classService.createClass(req.body, req.user.userId);

            res.status(201).json({
                message: 'Class created successfully',
                class: newClass
            });
        } catch (error) {
            console.error('Create class error:', error);
            res.status(400).json({ error: error.message });
        }
    }

    /**
     * Get all active classes
     */
    async getActiveClasses(req, res) {
        try {
            const classes = await this.classService.getActiveClasses();
            res.json({ classes });
        } catch (error) {
            console.error('Get classes error:', error);
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * Get class by ID
     */
    async getClassById(req, res) {
        try {
            const classData = await this.classService.getClassById(req.params.classId);
            res.json({ class: classData });
        } catch (error) {
            console.error('Get class error:', error);
            res.status(404).json({ error: error.message });
        }
    }

    /**
     * Get teacher's classes
     */
    async getTeacherClasses(req, res) {
        try {
            const classes = await this.classService.getTeacherClasses(req.user.userId);
            res.json({ classes });
        } catch (error) {
            console.error('Get teacher classes error:', error);
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * Update validation code
     */
    async updateValidationCode(req, res) {
        try {
            const result = await this.classService.updateValidationCode(
                req.params.classId,
                req.body.validationCode,
                req.user.userId
            );

            res.json({
                message: 'Validation code updated successfully',
                validationCode: result.validationCode
            });
        } catch (error) {
            console.error('Update validation code error:', error);
            res.status(error.message.includes('not found') ? 404 : 403)
                .json({ error: error.message });
        }
    }

    /**
     * Update class location
     */
    async updateLocation(req, res) {
        try {
            const updatedClass = await this.classService.updateLocation(
                req.params.classId,
                req.body.location,
                req.user.userId
            );

            res.json({
                message: 'Class location updated successfully',
                class: updatedClass
            });
        } catch (error) {
            console.error('Update location error:', error);
            res.status(error.message.includes('not found') ? 404 : 403)
                .json({ error: error.message });
        }
    }

    /**
     * Toggle class active status
     */
    async toggleClassStatus(req, res) {
        try {
            const updatedClass = await this.classService.toggleClassStatus(
                req.params.classId,
                req.user.userId
            );

            res.json({
                message: `Class ${updatedClass.isActive ? 'activated' : 'deactivated'} successfully`,
                class: updatedClass
            });
        } catch (error) {
            console.error('Toggle class error:', error);
            res.status(error.message.includes('not found') ? 404 : 403)
                .json({ error: error.message });
        }
    }

    /**
     * Delete class
     */
    async deleteClass(req, res) {
        try {
            await this.classService.deleteClass(req.params.classId, req.user.userId);

            res.json({
                message: 'Class deleted successfully'
            });
        } catch (error) {
            console.error('Delete class error:', error);
            res.status(error.message.includes('not found') ? 404 : 403)
                .json({ error: error.message });
        }
    }
}

module.exports = ClassController;
