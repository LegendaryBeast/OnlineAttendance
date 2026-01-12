/**
 * CumulativeAttendanceService - Business logic for cumulative attendance tracking
 * Depends on CumulativeAttendanceRepository, CourseRepository (Dependency Injection)
 * Single Responsibility: Cumulative attendance operations
 */
class CumulativeAttendanceService {
    constructor(cumulativeAttendanceRepository, courseRepository) {
        this.cumulativeAttendanceRepository = cumulativeAttendanceRepository;
        this.courseRepository = courseRepository;
    }

    /**
     * Update cumulative attendance when student marks attendance
     * @param {string} courseId 
     * @param {string} studentId 
     * @param {Object} studentData - { studentName, registrationNumber }
     * @returns {Promise<Object>}
     */
    async updateCumulativeAttendance(courseId, studentId, studentData) {
        // Find or create cumulative attendance entry
        let cumulativeEntry = await this.cumulativeAttendanceRepository.findOne(
            courseId,
            studentId
        );

        if (cumulativeEntry) {
            // Increment attendance count
            cumulativeEntry = await this.cumulativeAttendanceRepository.incrementAttendance(
                courseId,
                studentId
            );
        } else {
            // Create new entry with count 1
            cumulativeEntry = await this.cumulativeAttendanceRepository.findOrCreate(
                courseId,
                studentId,
                studentData
            );
            // Increment to 1
            cumulativeEntry = await this.cumulativeAttendanceRepository.incrementAttendance(
                courseId,
                studentId
            );
        }

        return cumulativeEntry;
    }

    /**
     * Get cumulative attendance for a course
     * @param {string} courseId 
     * @param {string} teacherId 
     * @returns {Promise<Array>}
     */
    async getCumulativeAttendance(courseId, teacherId) {
        // Verify course exists and teacher owns it
        const course = await this.courseRepository.findById(courseId);
        if (!course) {
            throw new Error('Course not found');
        }

        if (course.teacher.toString() !== teacherId) {
            throw new Error('You can only view cumulative attendance for your own courses');
        }

        // Get cumulative attendance records
        const attendanceRecords = await this.cumulativeAttendanceRepository.findByCourse(courseId);

        return attendanceRecords;
    }
}

module.exports = CumulativeAttendanceService;
