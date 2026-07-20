const { adminClient } = require('../config/supabase');

const TABLE = 'classes';

function toClass(row) {
    if (!row) return null;
    return {
        _id: row.id,
        name: row.name,
        type: row.type,
        validationCode: row.validation_code,
        teacher: row.teacher_id,
        teacherName: row.teacher_name,
        course: row.course_id,
        courseCode: row.courses?.course_code || null,
        courseName: row.courses?.course_name || null,
        teacherLocation: (row.teacher_latitude != null && row.teacher_longitude != null)
            ? { latitude: row.teacher_latitude, longitude: row.teacher_longitude }
            : undefined,
        date: row.date,
        isActive: row.is_active,
        createdAt: row.created_at
    };
}

function toRow(classData) {
    const row = {};
    if (classData.name !== undefined) row.name = classData.name;
    if (classData.type !== undefined) row.type = classData.type;
    if (classData.validationCode !== undefined) row.validation_code = classData.validationCode;
    if (classData.teacher !== undefined) row.teacher_id = classData.teacher;
    if (classData.teacherName !== undefined) row.teacher_name = classData.teacherName;
    if (classData.course !== undefined) row.course_id = classData.course;
    if (classData.isActive !== undefined) row.is_active = classData.isActive;
    if (classData.teacherLocation !== undefined) {
        row.teacher_latitude = classData.teacherLocation ? classData.teacherLocation.latitude : null;
        row.teacher_longitude = classData.teacherLocation ? classData.teacherLocation.longitude : null;
    }
    return row;
}

/**
 * ClassRepository - Data access layer for the `classes` table
 * Implements Repository Pattern (Dependency Inversion Principle)
 */
class ClassRepository {
    /**
     * Find all active classes
     * @returns {Promise<Array<Object>>}
     */
    async findActive() {
        const { data, error } = await adminClient
            .from(TABLE)
            .select('*')
            .eq('is_active', true)
            .order('created_at', { ascending: false });

        if (error) throw new Error(error.message);
        return data.map(toClass);
    }

    /**
     * Find classes by teacher ID
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
        return data.map(toClass);
    }

    /**
     * Find classes by course ID
     * @param {string} courseId
     * @returns {Promise<Array<Object>>}
     */
    async findByCourse(courseId) {
        const { data, error } = await adminClient
            .from(TABLE)
            .select('*')
            .eq('course_id', courseId)
            .order('created_at', { ascending: true });

        if (error) throw new Error(error.message);
        return data.map(toClass);
    }

    /**
     * Find class by ID
     * @param {string} classId
     * @returns {Promise<Object|null>}
     */
    async findById(classId) {
        const { data, error } = await adminClient
            .from(TABLE)
            .select('*, courses(course_code, course_name)')
            .eq('id', classId)
            .maybeSingle();

        if (error) throw new Error(error.message);
        return toClass(data);
    }

    /**
     * Create new class
     * @param {Object} classData
     * @returns {Promise<Object>}
     */
    async create(classData) {
        const { data, error } = await adminClient
            .from(TABLE)
            .insert(toRow(classData))
            .select()
            .single();

        if (error) throw new Error(error.message);
        return toClass(data);
    }

    /**
     * Update class
     * @param {string} classId
     * @param {Object} updates
     * @returns {Promise<Object|null>}
     */
    async update(classId, updates) {
        const { data, error } = await adminClient
            .from(TABLE)
            .update(toRow(updates))
            .eq('id', classId)
            .select()
            .maybeSingle();

        if (error) throw new Error(error.message);
        return toClass(data);
    }

    /**
     * Delete class
     * @param {string} classId
     * @returns {Promise<Object|null>}
     */
    async delete(classId) {
        const { data, error } = await adminClient
            .from(TABLE)
            .delete()
            .eq('id', classId)
            .select()
            .maybeSingle();

        if (error) throw new Error(error.message);
        return toClass(data);
    }

    /**
     * Toggle class active status
     * @param {string} classId
     * @returns {Promise<Object|null>}
     */
    async toggleActive(classId) {
        const classData = await this.findById(classId);
        if (!classData) return null;

        return await this.update(classId, { isActive: !classData.isActive });
    }

    /**
     * Update validation code
     * @param {string} classId
     * @param {string} validationCode
     * @returns {Promise<Object|null>}
     */
    async updateValidationCode(classId, validationCode) {
        return await this.update(classId, { validationCode });
    }
}

module.exports = ClassRepository;
