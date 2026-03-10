/**
 * CourseService - Business logic for course management
 * Depends on CourseRepository, CumulativeAttendanceRepository, UserRepository (Dependency Injection)
 * Single Responsibility: Course operations
 */
class CourseService {
    constructor(courseRepository, cumulativeAttendanceRepository, userRepository, classRepository, attendanceRepository) {
        this.courseRepository = courseRepository;
        this.cumulativeAttendanceRepository = cumulativeAttendanceRepository;
        this.userRepository = userRepository;
        this.classRepository = classRepository;
        this.attendanceRepository = attendanceRepository;
    }

    /**
     * Create a new course
     * @param {Object} courseData - { courseCode, courseName, session }
     * @param {string} teacherId 
     * @returns {Promise<Object>}
     */
    async createCourse(courseData, teacherId) {
        const { courseCode, courseName, session } = courseData;

        // Validate required fields
        if (!courseCode || !courseName || !session) {
            throw new Error('Course code, course name, and session are required');
        }

        // Get teacher info
        const teacher = await this.userRepository.findById(teacherId);
        if (!teacher) {
            throw new Error('Teacher not found');
        }

        // Check if course already exists with same composite key
        const existingCourse = await this.courseRepository.findByCourseCode(
            courseCode,
            teacherId,
            session
        );

        if (existingCourse) {
            throw new Error(
                `Course ${courseCode} for session ${session} already exists`
            );
        }

        // Create course object
        const newCourseData = {
            courseCode: courseCode.toUpperCase().trim(),
            courseName: courseName.trim(),
            teacher: teacherId,
            teacherName: teacher.name,
            session: session.trim()
        };

        // Save course
        const newCourse = await this.courseRepository.create(newCourseData);

        return newCourse;
    }

    /**
     * Get teacher's courses
     * @param {string} teacherId 
     * @returns {Promise<Array>}
     */
    async getTeacherCourses(teacherId) {
        return await this.courseRepository.findByTeacher(teacherId);
    }

    /**
     * Get course by ID
     * @param {string} courseId 
     * @returns {Promise<Object>}
     */
    async getCourseById(courseId) {
        const course = await this.courseRepository.findById(courseId);
        if (!course) {
            throw new Error('Course not found');
        }
        return course;
    }

    /**
     * Delete course
     * @param {string} courseId 
     * @param {string} teacherId 
     * @returns {Promise<void>}
     */
    async deleteCourse(courseId, teacherId) {
        const course = await this.getCourseById(courseId);

        // Verify ownership
        this.verifyTeacherOwnership(course, teacherId);

        // Delete associated cumulative attendance records
        await this.cumulativeAttendanceRepository.deleteByCourse(courseId);

        // Delete all classes linked to this course and their attendance records
        const classes = await this.classRepository.findByCourse(courseId);
        for (const cls of classes) {
            await this.attendanceRepository.deleteByClass(cls._id);
            await this.classRepository.delete(cls._id);
        }

        // Delete the course
        await this.courseRepository.delete(courseId);
    }

    /**
     * Verify that teacher owns the course
     * @param {Object} course 
     * @param {string} teacherId 
     */
    verifyTeacherOwnership(course, teacherId) {
        if (course.teacher.toString() !== teacherId) {
            throw new Error('You can only modify your own courses');
        }
    }
}

module.exports = CourseService;
