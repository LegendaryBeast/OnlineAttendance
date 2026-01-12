/**
 * ClassService - Business logic for class management
 * Depends on ClassRepository, AttendanceRepository, UserRepository (Dependency Injection)
 * Single Responsibility: Class operations
 */
class ClassService {
    constructor(classRepository, attendanceRepository, userRepository) {
        this.classRepository = classRepository;
        this.attendanceRepository = attendanceRepository;
        this.userRepository = userRepository;
    }

    /**
     * Create a new class
     * @param {Object} classData - { name, type, validationCode, location, courseId }
     * @param {string} teacherId 
     * @returns {Promise<Object>}
     */
    async createClass(classData, teacherId) {
        const { name, type, validationCode, location, courseId } = classData;

        // Validate required fields
        if (!name || !type || !validationCode) {
            throw new Error('Name, type, and validation code are required');
        }

        // Validate type
        if (!['online', 'offline'].includes(type)) {
            throw new Error('Type must be either "online" or "offline"');
        }

        // Validate location for offline classes
        if (type === 'offline') {
            if (!location || !location.latitude || !location.longitude) {
                throw new Error(
                    'Location (latitude and longitude) is required for offline classes'
                );
            }
        }

        // Get teacher info
        const teacher = await this.userRepository.findById(teacherId);
        if (!teacher) {
            throw new Error('Teacher not found');
        }

        // Create class object
        const newClassData = {
            name,
            type,
            validationCode,
            teacher: teacherId,
            teacherName: teacher.name,
            teacherLocation: type === 'offline' ? {
                latitude: location.latitude,
                longitude: location.longitude
            } : undefined,
            course: courseId || null // Add courseId (null if "Individual Class")
        };

        // Save class
        const newClass = await this.classRepository.create(newClassData);

        return newClass;
    }

    /**
     * Get all active classes
     * @returns {Promise<Array>}
     */
    async getActiveClasses() {
        return await this.classRepository.findActive();
    }

    /**
     * Get class by ID
     * @param {string} classId 
     * @returns {Promise<Object>}
     */
    async getClassById(classId) {
        const classData = await this.classRepository.findById(classId);
        if (!classData) {
            throw new Error('Class not found');
        }
        return classData;
    }

    /**
     * Get teacher's classes
     * @param {string} teacherId 
     * @returns {Promise<Array>}
     */
    async getTeacherClasses(teacherId) {
        return await this.classRepository.findByTeacher(teacherId);
    }

    /**
     * Update validation code
     * @param {string} classId 
     * @param {string} validationCode 
     * @param {string} teacherId 
     * @returns {Promise<Object>}
     */
    async updateValidationCode(classId, validationCode, teacherId) {
        if (!validationCode) {
            throw new Error('Validation code is required');
        }

        const classData = await this.getClassById(classId);

        // Verify ownership
        this.verifyTeacherOwnership(classData, teacherId);

        await this.classRepository.updateValidationCode(classId, validationCode);

        return { validationCode };
    }

    /**
     * Update class location
     * @param {string} classId 
     * @param {Object} location - { latitude, longitude }
     * @param {string} teacherId 
     * @returns {Promise<Object>}
     */
    async updateLocation(classId, location, teacherId) {
        if (!location || !location.latitude || !location.longitude) {
            throw new Error('Location (latitude and longitude) is required');
        }

        const classData = await this.getClassById(classId);

        // Verify ownership
        this.verifyTeacherOwnership(classData, teacherId);

        // Check if class type allows location update (only offline)
        if (classData.type !== 'offline') {
            throw new Error('Can only update location for offline classes');
        }

        const updatedClass = await this.classRepository.update(classId, {
            teacherLocation: {
                latitude: location.latitude,
                longitude: location.longitude
            }
        });

        return updatedClass;
    }

    /**
     * Toggle class active status
     * @param {string} classId 
     * @param {string} teacherId 
     * @returns {Promise<Object>}
     */
    async toggleClassStatus(classId, teacherId) {
        const classData = await this.getClassById(classId);

        // Verify ownership
        this.verifyTeacherOwnership(classData, teacherId);

        const updatedClass = await this.classRepository.toggleActive(classId);

        return updatedClass;
    }

    /**
     * Delete class
     * @param {string} classId 
     * @param {string} teacherId 
     * @returns {Promise<void>}
     */
    async deleteClass(classId, teacherId) {
        const classData = await this.getClassById(classId);

        // Verify ownership
        this.verifyTeacherOwnership(classData, teacherId);

        // Delete associated attendance records
        await this.attendanceRepository.deleteByClass(classId);

        // Delete the class
        await this.classRepository.delete(classId);
    }

    /**
     * Verify that teacher owns the class
     * @param {Object} classData 
     * @param {string} teacherId 
     */
    verifyTeacherOwnership(classData, teacherId) {
        if (classData.teacher.toString() !== teacherId) {
            throw new Error('You can only modify your own classes');
        }
    }
}

module.exports = ClassService;
