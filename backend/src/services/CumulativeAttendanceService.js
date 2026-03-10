/**
 * CumulativeAttendanceService - Business logic for cumulative attendance tracking
 * Depends on CumulativeAttendanceRepository, CourseRepository (Dependency Injection)
 * Single Responsibility: Cumulative attendance operations
 */
class CumulativeAttendanceService {
    constructor(cumulativeAttendanceRepository, courseRepository, classRepository, attendanceRepository) {
        this.cumulativeAttendanceRepository = cumulativeAttendanceRepository;
        this.courseRepository = courseRepository;
        this.classRepository = classRepository;
        this.attendanceRepository = attendanceRepository;
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
     * @returns {Promise<Object>}
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

        // Get all classes for this course (chronological)
        const classes = await this.classRepository.findByCourse(courseId);
        const totalClassesHeld = classes.length;

        // Get cumulative attendance records
        const baseAttendanceRecords = await this.cumulativeAttendanceRepository.findByCourse(courseId);

        // Enhance records with per-class data and percentages
        const enhancedRecords = await Promise.all(baseAttendanceRecords.map(async (record) => {
            const studentId = record.student;
            const classAttendanceMap = {};
            let actualAttendanceCount = 0;

            // Check attendance for each class sequentially
            for (const cls of classes) {
                const attended = await this.attendanceRepository.findExisting(cls._id, studentId);
                const isPresent = !!attended;

                if (isPresent) {
                    actualAttendanceCount++;
                }

                classAttendanceMap[cls._id.toString()] = {
                    date: cls.date,
                    status: isPresent ? '✓' : '✗'
                };
            }

            const attendancePercentage = totalClassesHeld > 0
                ? ((record.attendanceCount / totalClassesHeld) * 100).toFixed(2) + '%'
                : '0%';

            return {
                ...record.toObject(),
                totalClassesHeld,
                attendancePercentage,
                classAttendanceMap // Detailed per class mapping
            };
        }));

        return {
            classes,
            records: enhancedRecords
        };
    }
}

module.exports = CumulativeAttendanceService;
