const CumulativeAttendance = require('../models/CumulativeAttendance');

/**
 * CumulativeAttendanceRepository - Data access layer for CumulativeAttendance model
 * Implements Repository Pattern
 */
class CumulativeAttendanceRepository {
    /**
     * Find or create cumulative attendance entry
     * @param {string} courseId 
     * @param {string} studentId 
     * @param {Object} studentData - { studentName, registrationNumber }
     * @returns {Promise<CumulativeAttendance>}
     */
    async findOrCreate(courseId, studentId, studentData) {
        const now = new Date();

        // Try to find existing entry
        let cumulativeAttendance = await CumulativeAttendance.findOne({
            course: courseId,
            student: studentId
        });

        if (cumulativeAttendance) {
            return cumulativeAttendance;
        }

        // Create new entry if doesn't exist
        const newEntry = new CumulativeAttendance({
            course: courseId,
            student: studentId,
            studentName: studentData.studentName,
            registrationNumber: studentData.registrationNumber,
            attendanceCount: 0,
            firstAttendanceDate: now,
            lastAttendanceDate: now
        });

        return await newEntry.save();
    }

    /**
     * Increment attendance count for a student in a course
     * @param {string} courseId 
     * @param {string} studentId 
     * @returns {Promise<CumulativeAttendance|null>}
     */
    async incrementAttendance(courseId, studentId) {
        const now = new Date();

        return await CumulativeAttendance.findOneAndUpdate(
            { course: courseId, student: studentId },
            {
                $inc: { attendanceCount: 1 },
                $set: {
                    lastAttendanceDate: now,
                    updatedAt: now
                }
            },
            { new: true }
        );
    }

    /**
     * Get all cumulative attendance records for a course
     * @param {string} courseId 
     * @returns {Promise<Array<CumulativeAttendance>>}
     */
    async findByCourse(courseId) {
        return await CumulativeAttendance.find({ course: courseId })
            .sort({ registrationNumber: 1 })
            .select('-__v');
    }

    /**
     * Delete all cumulative attendance records for a course
     * @param {string} courseId 
     * @returns {Promise<Object>}
     */
    async deleteByCourse(courseId) {
        return await CumulativeAttendance.deleteMany({ course: courseId });
    }

    /**
     * Find specific cumulative attendance record
     * @param {string} courseId 
     * @param {string} studentId 
     * @returns {Promise<CumulativeAttendance|null>}
     */
    async findOne(courseId, studentId) {
        return await CumulativeAttendance.findOne({
            course: courseId,
            student: studentId
        });
    }
}

module.exports = CumulativeAttendanceRepository;
