const { exportCumulativeToExcel } = require('../utils/excelExportCumulative');

/**
 * CourseController - Thin controller layer for courses
 * Only handles HTTP request/response
 * Delegates business logic to CourseService and CumulativeAttendanceService
 */
class CourseController {
    constructor(courseService, cumulativeAttendanceService) {
        this.courseService = courseService;
        this.cumulativeAttendanceService = cumulativeAttendanceService;
    }

    /**
     * Create a new course
     */
    async createCourse(req, res) {
        try {
            const newCourse = await this.courseService.createCourse(
                req.body,
                req.user.userId
            );

            res.status(201).json({
                message: 'Course created successfully',
                course: newCourse
            });
        } catch (error) {
            console.error('Create course error:', error);
            res.status(400).json({ error: error.message });
        }
    }

    /**
     * Get teacher's courses
     */
    async getTeacherCourses(req, res) {
        try {
            const courses = await this.courseService.getTeacherCourses(req.user.userId);
            res.json({ courses });
        } catch (error) {
            console.error('Get teacher courses error:', error);
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * Get course by ID
     */
    async getCourseById(req, res) {
        try {
            const course = await this.courseService.getCourseById(req.params.courseId);
            res.json({ course });
        } catch (error) {
            console.error('Get course error:', error);
            res.status(404).json({ error: error.message });
        }
    }

    /**
     * Get cumulative attendance for a course
     */
    async getCumulativeAttendance(req, res) {
        try {
            const attendanceData = await this.cumulativeAttendanceService.getCumulativeAttendance(
                req.params.courseId,
                req.user.userId
            );

            const course = await this.courseService.getCourseById(req.params.courseId);

            res.json({
                course: {
                    courseCode: course.courseCode,
                    courseName: course.courseName,
                    session: course.session
                },
                totalStudents: attendanceData.records.length,
                attendance: attendanceData.records,
                classesHeld: attendanceData.classes
            });
        } catch (error) {
            console.error('Get cumulative attendance error:', error);
            res.status(error.message.includes('not found') ? 404 : 403)
                .json({ error: error.message });
        }
    }

    /**
     * Download cumulative attendance as Excel
     */
    async downloadCumulativeAttendance(req, res) {
        try {
            const attendanceData = await this.cumulativeAttendanceService.getCumulativeAttendance(
                req.params.courseId,
                req.user.userId
            );

            const course = await this.courseService.getCourseById(req.params.courseId);

            if (attendanceData.records.length === 0) {
                return res.status(404).json({
                    error: 'No cumulative attendance records found for this course'
                });
            }

            // Generate Excel file
            const excelBuffer = await exportCumulativeToExcel(
                attendanceData,
                course.courseCode,
                course.session
            );

            // Set response headers for file download
            const date = new Date().toISOString().split('T')[0];
            const filename = `CumulativeAttendance_${course.courseCode}_${course.session}_${date}.xlsx`;

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            res.setHeader('Content-Length', excelBuffer.length);

            res.send(excelBuffer);
        } catch (error) {
            console.error('Download cumulative attendance error:', error);
            res.status(error.message.includes('not found') ? 404 : 500)
                .json({ error: error.message });
        }
    }

    /**
     * Delete course
     */
    async deleteCourse(req, res) {
        try {
            await this.courseService.deleteCourse(req.params.courseId, req.user.userId);

            res.json({
                message: 'Course deleted successfully'
            });
        } catch (error) {
            console.error('Delete course error:', error);
            res.status(error.message.includes('not found') ? 404 : 403)
                .json({ error: error.message });
        }
    }
}

module.exports = CourseController;
