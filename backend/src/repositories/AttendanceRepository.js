const { adminClient } = require('../config/supabase');

const TABLE = 'attendance';

function toAttendance(row) {
    if (!row) return null;
    const attendance = {
        _id: row.id,
        class: row.class_id,
        student: row.student_id,
        studentName: row.student_name,
        registrationNumber: row.registration_number,
        studentLocation: (row.student_latitude != null && row.student_longitude != null)
            ? { latitude: row.student_latitude, longitude: row.student_longitude }
            : undefined,
        validationCodeUsed: row.validation_code_used,
        distance: row.distance,
        imageUrl: row.image_url,
        timestamp: row.timestamp
    };

    // Present when the row was fetched with the `classes` embed (findByStudent)
    if (row.classes) {
        attendance.class = {
            name: row.classes.name,
            type: row.classes.type,
            date: row.classes.date
        };
    }

    return attendance;
}

function toRow(attendanceData) {
    const row = {};
    if (attendanceData.class !== undefined) row.class_id = attendanceData.class;
    if (attendanceData.student !== undefined) row.student_id = attendanceData.student;
    if (attendanceData.studentName !== undefined) row.student_name = attendanceData.studentName;
    if (attendanceData.registrationNumber !== undefined) row.registration_number = attendanceData.registrationNumber;
    if (attendanceData.validationCodeUsed !== undefined) row.validation_code_used = attendanceData.validationCodeUsed;
    if (attendanceData.distance !== undefined) row.distance = attendanceData.distance;
    if (attendanceData.imageUrl !== undefined) row.image_url = attendanceData.imageUrl;
    if (attendanceData.studentLocation !== undefined) {
        row.student_latitude = attendanceData.studentLocation ? attendanceData.studentLocation.latitude : null;
        row.student_longitude = attendanceData.studentLocation ? attendanceData.studentLocation.longitude : null;
    }
    return row;
}

/**
 * AttendanceRepository - Data access layer for the `attendance` table
 * Implements Repository Pattern (Dependency Inversion Principle)
 */
class AttendanceRepository {
    /**
     * Find attendance records by class ID
     * @param {string} classId
     * @returns {Promise<Array<Object>>}
     */
    async findByClass(classId) {
        const { data, error } = await adminClient
            .from(TABLE)
            .select('*')
            .eq('class_id', classId)
            .order('registration_number', { ascending: true });

        if (error) throw new Error(error.message);
        return data.map(toAttendance);
    }

    /**
     * Find attendance records by student ID
     * @param {string} studentId
     * @returns {Promise<Array<Object>>}
     */
    async findByStudent(studentId) {
        const { data, error } = await adminClient
            .from(TABLE)
            .select('*, classes(name, type, date)')
            .eq('student_id', studentId)
            .order('timestamp', { ascending: false });

        if (error) throw new Error(error.message);
        return data.map(toAttendance);
    }

    /**
     * Create attendance record
     * @param {Object} attendanceData
     * @returns {Promise<Object>}
     */
    async create(attendanceData) {
        const { data, error } = await adminClient
            .from(TABLE)
            .insert(toRow(attendanceData))
            .select()
            .single();

        if (error) throw new Error(error.message);
        return toAttendance(data);
    }

    /**
     * Check if attendance already exists for student in class
     * @param {string} classId
     * @param {string} studentId
     * @returns {Promise<Object|null>}
     */
    async findExisting(classId, studentId) {
        const { data, error } = await adminClient
            .from(TABLE)
            .select('*')
            .eq('class_id', classId)
            .eq('student_id', studentId)
            .maybeSingle();

        if (error) throw new Error(error.message);
        return toAttendance(data);
    }

    /**
     * Check for duplicate attendance
     * @param {string} classId
     * @param {string} studentId
     * @returns {Promise<boolean>}
     */
    async isDuplicate(classId, studentId) {
        const existing = await this.findExisting(classId, studentId);
        return !!existing;
    }

    /**
     * Delete all attendance records for a class
     * @param {string} classId
     * @returns {Promise<void>}
     */
    async deleteByClass(classId) {
        const { error } = await adminClient
            .from(TABLE)
            .delete()
            .eq('class_id', classId);

        if (error) throw new Error(error.message);
    }

    /**
     * Get attendance count for a class
     * @param {string} classId
     * @returns {Promise<number>}
     */
    async countByClass(classId) {
        const { count, error } = await adminClient
            .from(TABLE)
            .select('*', { count: 'exact', head: true })
            .eq('class_id', classId);

        if (error) throw new Error(error.message);
        return count || 0;
    }

    /**
     * Get attendance records for export (minimal fields)
     * @param {string} classId
     * @returns {Promise<Array>}
     */
    async findForExport(classId) {
        const { data, error } = await adminClient
            .from(TABLE)
            .select('registration_number, student_name, timestamp')
            .eq('class_id', classId);

        if (error) throw new Error(error.message);
        return data.map(row => ({
            registrationNumber: row.registration_number,
            studentName: row.student_name,
            timestamp: row.timestamp
        }));
    }
}

module.exports = AttendanceRepository;
