const { adminClient } = require('../config/supabase');

const TABLE = 'cumulative_attendance';

function toCumulative(row) {
    if (!row) return null;
    return {
        _id: row.id,
        course: row.course_id,
        student: row.student_id,
        studentName: row.student_name,
        registrationNumber: row.registration_number,
        attendanceCount: row.attendance_count,
        firstAttendanceDate: row.first_attendance_date,
        lastAttendanceDate: row.last_attendance_date,
        updatedAt: row.updated_at
    };
}

/**
 * CumulativeAttendanceRepository - Data access layer for the `cumulative_attendance` table
 * Implements Repository Pattern
 */
class CumulativeAttendanceRepository {
    /**
     * Find or create cumulative attendance entry
     * @param {string} courseId
     * @param {string} studentId
     * @param {Object} studentData - { studentName, registrationNumber }
     * @returns {Promise<Object>}
     */
    async findOrCreate(courseId, studentId, studentData) {
        const existing = await this.findOne(courseId, studentId);
        if (existing) {
            return existing;
        }

        const now = new Date().toISOString();
        const { data, error } = await adminClient
            .from(TABLE)
            .insert({
                course_id: courseId,
                student_id: studentId,
                student_name: studentData.studentName,
                registration_number: studentData.registrationNumber,
                attendance_count: 0,
                first_attendance_date: now,
                last_attendance_date: now
            })
            .select()
            .single();

        if (error) throw new Error(error.message);
        return toCumulative(data);
    }

    /**
     * Increment attendance count for a student in a course
     * @param {string} courseId
     * @param {string} studentId
     * @returns {Promise<Object|null>}
     */
    async incrementAttendance(courseId, studentId) {
        const { data, error } = await adminClient
            .rpc('increment_cumulative_attendance', {
                p_course_id: courseId,
                p_student_id: studentId
            })
            .single();

        if (error) throw new Error(error.message);
        return toCumulative(data);
    }

    /**
     * Get all cumulative attendance records for a course
     * @param {string} courseId
     * @returns {Promise<Array<Object>>}
     */
    async findByCourse(courseId) {
        const { data, error } = await adminClient
            .from(TABLE)
            .select('*')
            .eq('course_id', courseId)
            .order('registration_number', { ascending: true });

        if (error) throw new Error(error.message);
        return data.map(toCumulative);
    }

    /**
     * Delete all cumulative attendance records for a course
     * @param {string} courseId
     * @returns {Promise<void>}
     */
    async deleteByCourse(courseId) {
        const { error } = await adminClient
            .from(TABLE)
            .delete()
            .eq('course_id', courseId);

        if (error) throw new Error(error.message);
    }

    /**
     * Find specific cumulative attendance record
     * @param {string} courseId
     * @param {string} studentId
     * @returns {Promise<Object|null>}
     */
    async findOne(courseId, studentId) {
        const { data, error } = await adminClient
            .from(TABLE)
            .select('*')
            .eq('course_id', courseId)
            .eq('student_id', studentId)
            .maybeSingle();

        if (error) throw new Error(error.message);
        return toCumulative(data);
    }
}

module.exports = CumulativeAttendanceRepository;
