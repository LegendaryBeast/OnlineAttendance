const { adminClient } = require('../config/supabase');

const TABLE = 'courses';

function toCourse(row) {
    if (!row) return null;
    return {
        _id: row.id,
        courseCode: row.course_code,
        courseName: row.course_name,
        teacher: row.teacher_id,
        teacherName: row.teacher_name,
        session: row.session,
        createdAt: row.created_at
    };
}

function toRow(courseData) {
    const row = {};
    if (courseData.courseCode !== undefined) row.course_code = courseData.courseCode;
    if (courseData.courseName !== undefined) row.course_name = courseData.courseName;
    if (courseData.teacher !== undefined) row.teacher_id = courseData.teacher;
    if (courseData.teacherName !== undefined) row.teacher_name = courseData.teacherName;
    if (courseData.session !== undefined) row.session = courseData.session;
    return row;
}

/**
 * CourseRepository - Data access layer for the `courses` table
 * Implements Repository Pattern
 */
class CourseRepository {
    /**
     * Create a new course
     * @param {Object} courseData
     * @returns {Promise<Object>}
     */
    async create(courseData) {
        const { data, error } = await adminClient
            .from(TABLE)
            .insert(toRow(courseData))
            .select()
            .single();

        if (error) throw new Error(error.message);
        return toCourse(data);
    }

    /**
     * Find course by ID
     * @param {string} courseId
     * @returns {Promise<Object|null>}
     */
    async findById(courseId) {
        const { data, error } = await adminClient
            .from(TABLE)
            .select('*')
            .eq('id', courseId)
            .maybeSingle();

        if (error) throw new Error(error.message);
        return toCourse(data);
    }

    /**
     * Find all courses by teacher ID
     * @param {string} teacherId
     * @returns {Promise<Array<Object>>}
     */
    async findByTeacher(teacherId) {
        const { data, error } = await adminClient
            .from(TABLE)
            .select('*')
            .eq('teacher_id', teacherId)
            .order('created_at', { ascending: false });

        if (error) throw new Error(error.message);
        return data.map(toCourse);
    }

    /**
     * Find course by composite key (courseCode, teacher, session)
     * @param {string} courseCode
     * @param {string} teacherId
     * @param {string} session
     * @returns {Promise<Object|null>}
     */
    async findByCourseCode(courseCode, teacherId, session) {
        const { data, error } = await adminClient
            .from(TABLE)
            .select('*')
            .eq('course_code', courseCode.toUpperCase())
            .eq('teacher_id', teacherId)
            .eq('session', session)
            .maybeSingle();

        if (error) throw new Error(error.message);
        return toCourse(data);
    }

    /**
     * Delete course
     * @param {string} courseId
     * @returns {Promise<Object|null>}
     */
    async delete(courseId) {
        const { data, error } = await adminClient
            .from(TABLE)
            .delete()
            .eq('id', courseId)
            .select()
            .maybeSingle();

        if (error) throw new Error(error.message);
        return toCourse(data);
    }

    /**
     * Update course
     * @param {string} courseId
     * @param {Object} updates
     * @returns {Promise<Object|null>}
     */
    async update(courseId, updates) {
        const { data, error } = await adminClient
            .from(TABLE)
            .update(toRow(updates))
            .eq('id', courseId)
            .select()
            .maybeSingle();

        if (error) throw new Error(error.message);
        return toCourse(data);
    }
}

module.exports = CourseRepository;
