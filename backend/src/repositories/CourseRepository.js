const Course = require('../models/Course');

/**
 * CourseRepository - Data access layer for Course model
 * Implements Repository Pattern
 */
class CourseRepository {
    /**
     * Create a new course
     * @param {Object} courseData 
     * @returns {Promise<Course>}
     */
    async create(courseData) {
        const newCourse = new Course(courseData);
        return await newCourse.save();
    }

    /**
     * Find course by ID
     * @param {string} courseId 
     * @returns {Promise<Course|null>}
     */
    async findById(courseId) {
        return await Course.findById(courseId);
    }

    /**
     * Find all courses by teacher ID
     * @param {string} teacherId 
     * @returns {Promise<Array<Course>>}
     */
    async findByTeacher(teacherId) {
        return await Course.find({ teacher: teacherId })
            .sort({ createdAt: -1 })
            .select('-__v');
    }

    /**
     * Find course by composite key (courseCode, teacher, session)
     * @param {string} courseCode 
     * @param {string} teacherId 
     * @param {string} session 
     * @returns {Promise<Course|null>}
     */
    async findByCourseCode(courseCode, teacherId, session) {
        return await Course.findOne({
            courseCode: courseCode.toUpperCase(),
            teacher: teacherId,
            session: session
        });
    }

    /**
     * Delete course
     * @param {string} courseId 
     * @returns {Promise<Course|null>}
     */
    async delete(courseId) {
        return await Course.findByIdAndDelete(courseId);
    }

    /**
     * Update course
     * @param {string} courseId 
     * @param {Object} updates 
     * @returns {Promise<Course|null>}
     */
    async update(courseId, updates) {
        return await Course.findByIdAndUpdate(courseId, updates, { new: true });
    }
}

module.exports = CourseRepository;
