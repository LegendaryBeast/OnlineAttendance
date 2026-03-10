const Class = require('../models/Class');

/**
 * ClassRepository - Data access layer for Class model
 * Implements Repository Pattern (Dependency Inversion Principle)
 */
class ClassRepository {
    /**
     * Find all active classes
     * @returns {Promise<Array<Class>>}
     */
    async findActive() {
        return await Class.find({ isActive: true })
            .sort({ createdAt: -1 })
            .select('-__v');
    }

    /**
     * Find classes by teacher ID
     * @param {string} teacherId 
     * @returns {Promise<Array<Class>>}
     */
    async findByTeacher(teacherId) {
        return await Class.find({ teacher: teacherId })
            .sort({ createdAt: -1 })
            .select('-__v');
    }

    /**
     * Find classes by course ID
     * @param {string} courseId 
     * @returns {Promise<Array<Class>>}
     */
    async findByCourse(courseId) {
        return await Class.find({ course: courseId })
            .sort({ createdAt: 1 })
            .select('-__v');
    }

    /**
     * Find class by ID
     * @param {string} classId 
     * @returns {Promise<Class|null>}
     */
    async findById(classId) {
        return await Class.findById(classId);
    }

    /**
     * Create new class
     * @param {Object} classData 
     * @returns {Promise<Class>}
     */
    async create(classData) {
        const newClass = new Class(classData);
        return await newClass.save();
    }

    /**
     * Update class
     * @param {string} classId 
     * @param {Object} updates 
     * @returns {Promise<Class|null>}
     */
    async update(classId, updates) {
        return await Class.findByIdAndUpdate(classId, updates, { new: true });
    }

    /**
     * Delete class
     * @param {string} classId 
     * @returns {Promise<Class|null>}
     */
    async delete(classId) {
        return await Class.findByIdAndDelete(classId);
    }

    /**
     * Toggle class active status
     * @param {string} classId 
     * @returns {Promise<Class|null>}
     */
    async toggleActive(classId) {
        const classData = await this.findById(classId);
        if (!classData) return null;

        classData.isActive = !classData.isActive;
        return await classData.save();
    }

    /**
     * Update validation code
     * @param {string} classId 
     * @param {string} validationCode 
     * @returns {Promise<Class|null>}
     */
    async updateValidationCode(classId, validationCode) {
        return await this.update(classId, { validationCode });
    }
}

module.exports = ClassRepository;
