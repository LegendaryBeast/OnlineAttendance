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

        // Get cumulative attendance records and all per-class attendance in parallel (2 queries instead of N*M)
        const classIds = classes.map(c => c._id);
        const [baseAttendanceRecords, allAttendance] = await Promise.all([
            this.cumulativeAttendanceRepository.findByCourse(courseId),
            this.attendanceRepository.findByClassIds(classIds)
        ]);

        // Fast O(1) lookup set: classId_studentId
        const attendanceSet = new Set(
            allAttendance.map(a => `${a.classId}_${a.studentId}`)
        );

        // Enhance records with per-class data and percentages using in-memory lookup
        const enhancedRecords = baseAttendanceRecords.map((record) => {
            const studentId = record.student;
            const classAttendanceMap = {};
            let actualAttendanceCount = 0;

            // Check attendance for each class in-memory O(1)
            for (const cls of classes) {
                const isPresent = attendanceSet.has(`${cls._id}_${studentId}`);

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
                ...record,
                totalClassesHeld,
                attendancePercentage,
                classAttendanceMap // Detailed per class mapping
            };
        });

        return {
            classes,
            records: enhancedRecords
        };
    }
}

module.exports = CumulativeAttendanceService;
