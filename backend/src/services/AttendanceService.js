/**
 * AttendanceService - Business logic for attendance operations
 * Depends on AttendanceRepository, ClassRepository, UserRepository, LocationService, ImageService
 * Single Responsibility: Attendance operations
 */
class AttendanceService {
    constructor(attendanceRepository, classRepository, userRepository, locationService, imageService, cumulativeAttendanceService = null) {
        this.attendanceRepository = attendanceRepository;
        this.classRepository = classRepository;
        this.userRepository = userRepository;
        this.locationService = locationService;
        this.imageService = imageService;
        this.cumulativeAttendanceService = cumulativeAttendanceService; // Optional for cumulative attendance
    }

    /**
     * Submit attendance
     * @param {Object} data - { classId, validationCode, location, imageData }
     * @param {string} studentId 
     * @returns {Promise<Object>}
     */
    async submitAttendance(data, studentId) {
        const { classId, validationCode, location, imageData } = data;

        // Validate required fields
        if (!classId || !validationCode) {
            throw new Error('Class ID and validation code are required');
        }

        // Get class details
        const classData = await this.classRepository.findById(classId);
        if (!classData) {
            throw new Error('Class not found');
        }

        // Check if class is active
        if (!classData.isActive) {
            throw new Error('This class is no longer active');
        }

        // Verify validation code
        if (classData.validationCode !== validationCode) {
            throw new Error('Invalid validation code');
        }

        // Get student info
        const student = await this.userRepository.findById(studentId);
        if (!student) {
            throw new Error('Student not found');
        }

        // Check for duplicate attendance
        const isDuplicate = await this.attendanceRepository.isDuplicate(classId, studentId);
        if (isDuplicate) {
            throw new Error('You have already submitted attendance for this class');
        }

        // Process offline class requirements
        let distance = null;
        let imageUrl = null;

        if (classData.type === 'offline') {
            const offlineData = await this.processOfflineAttendance(
                classData,
                location,
                imageData
            );
            distance = offlineData.distance;
            imageUrl = offlineData.imageUrl;
        }

        // Create attendance record
        const attendanceData = {
            class: classId,
            student: studentId,
            studentName: student.name,
            registrationNumber: student.registrationNumber,
            studentLocation: location ? {
                latitude: location.latitude,
                longitude: location.longitude
            } : undefined,
            validationCodeUsed: validationCode,
            distance,
            imageUrl
        };

        const attendance = await this.attendanceRepository.create(attendanceData);

        // Update cumulative attendance if class is linked to a course
        if (classData.course && this.cumulativeAttendanceService) {
            try {
                await this.cumulativeAttendanceService.updateCumulativeAttendance(
                    classData.course,
                    studentId,
                    {
                        studentName: student.name,
                        registrationNumber: student.registrationNumber
                    }
                );
            } catch (error) {
                // Log error but don't fail the attendance submission
                console.error('Error updating cumulative attendance:', error);
            }
        }

        return {
            className: classData.name,
            timestamp: attendance.timestamp,
            distance: distance ? `${distance}m` : 'N/A (online class)',
            imageUrl: imageUrl || null
        };
    }

    /**
     * Process offline class attendance requirements
     * @param {Object} classData 
     * @param {Object} location 
     * @param {string} imageData 
     * @returns {Promise<Object>}
     */
    async processOfflineAttendance(classData, location, imageData) {
        // Verify image is provided
        if (!imageData) {
            throw new Error('Photo verification is required for offline class attendance');
        }

        // Verify location
        if (!location || !location.latitude || !location.longitude) {
            throw new Error('Location is required for offline class attendance');
        }

        // Validate location
        const locationCheck = this.locationService.validateLocation(
            classData.teacherLocation,
            location,
            50 // 50 meters
        );

        if (!locationCheck.isWithinRange) {
            throw new Error(
                `You are too far from the class location. Distance: ${locationCheck.distance}m (max: 50m)`
            );
        }

        // Upload image
        let imageUrl;
        try {
            imageUrl = await this.imageService.uploadImage(
                imageData,
                `attendance/${classData._id}`
            );
        } catch (error) {
            throw new Error('Failed to upload verification photo. Please try again.');
        }

        return {
            distance: locationCheck.distance,
            imageUrl
        };
    }

    /**
     * Get attendance for a class
     * @param {string} classId 
     * @param {string} teacherId 
     * @returns {Promise<Object>}
     */
    async getClassAttendance(classId, teacherId) {
        const classData = await this.classRepository.findById(classId);
        if (!classData) {
            throw new Error('Class not found');
        }

        // Verify teacher owns this class
        if (classData.teacher.toString() !== teacherId) {
            throw new Error('You can only view attendance for your own classes');
        }

        const attendanceRecords = await this.attendanceRepository.findByClass(classId);
        const totalStudents = await this.attendanceRepository.countByClass(classId);

        return {
            class: {
                name: classData.name,
                type: classData.type,
                date: classData.date
            },
            totalStudents,
            attendance: attendanceRecords
        };
    }

    /**
     * Get student's attendance history
     * @param {string} studentId 
     * @returns {Promise<Object>}
     */
    async getStudentAttendance(studentId) {
        const attendanceRecords = await this.attendanceRepository.findByStudent(studentId);

        return {
            totalClasses: attendanceRecords.length,
            attendance: attendanceRecords
        };
    }

    /**
     * Get attendance records for export
     * @param {string} classId 
     * @param {string} teacherId 
     * @returns {Promise<Array>}
     */
    async getAttendanceForExport(classId, teacherId) {
        const classData = await this.classRepository.findById(classId);
        if (!classData) {
            throw new Error('Class not found');
        }

        // Verify teacher owns this class
        if (classData.teacher.toString() !== teacherId) {
            throw new Error('You can only export attendance for your own classes');
        }

        const attendanceRecords = await this.attendanceRepository.findForExport(classId);

        if (attendanceRecords.length === 0) {
            throw new Error('No attendance records found for this class');
        }

        return {
            attendanceRecords,
            className: classData.name,
            classDate: classData.date,
            courseCode: classData.course?.courseCode || null,
            courseName: classData.course?.courseName || null
        };
    }

    /**
     * Manually add attendance by registration number (teacher only)
     * @param {string} classId 
     * @param {string} registrationNumber 
     * @param {string} teacherId 
     * @returns {Promise<Object>}
     */
    async manuallyAddAttendance(classId, registrationNumber, teacherId) {
        // Validate required fields
        if (!classId || !registrationNumber) {
            throw new Error('Class ID and registration number are required');
        }

        // Validate registration number format (10 digits)
        if (!/^[0-9]{10}$/.test(registrationNumber)) {
            throw new Error('Invalid registration number format. Must be 10 digits.');
        }

        // Get class details
        const classData = await this.classRepository.findById(classId);
        if (!classData) {
            throw new Error('Class not found');
        }

        // Verify teacher owns this class
        if (classData.teacher.toString() !== teacherId) {
            throw new Error('You can only add attendance for your own classes');
        }

        // Find student by registration number
        const student = await this.userRepository.findByRegistrationNumber(registrationNumber);
        if (!student) {
            throw new Error(`No student found with registration number: ${registrationNumber}`);
        }

        // Verify student role
        if (student.role !== 'student') {
            throw new Error('The provided registration number does not belong to a student');
        }

        // Check for duplicate attendance
        const isDuplicate = await this.attendanceRepository.isDuplicate(classId, student._id);
        if (isDuplicate) {
            throw new Error(`Student ${student.name} (${registrationNumber}) has already submitted attendance for this class`);
        }

        // Create attendance record (manually added by teacher)
        const attendanceData = {
            class: classId,
            student: student._id,
            studentName: student.name,
            registrationNumber: student.registrationNumber,
            validationCodeUsed: 'MANUAL_ENTRY', // Special marker for manual entries
            distance: null,
            imageUrl: null
        };

        const attendance = await this.attendanceRepository.create(attendanceData);

        // Update cumulative attendance if class is linked to a course
        if (classData.course && this.cumulativeAttendanceService) {
            try {
                await this.cumulativeAttendanceService.updateCumulativeAttendance(
                    classData.course,
                    student._id,
                    {
                        studentName: student.name,
                        registrationNumber: student.registrationNumber
                    }
                );
            } catch (error) {
                // Log error but don't fail the attendance submission
                console.error('Error updating cumulative attendance:', error);
            }
        }

        return {
            studentName: student.name,
            registrationNumber: student.registrationNumber,
            className: classData.name,
            timestamp: attendance.timestamp
        };
    }
}

module.exports = AttendanceService;
