const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
    courseCode: {
        type: String,
        required: true,
        trim: true,
        uppercase: true
    },
    courseName: {
        type: String,
        required: true,
        trim: true
    },
    teacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    teacherName: {
        type: String,
        required: true
    },
    session: {
        type: String,
        required: true,
        trim: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Composite unique index to differentiate courses
// Same course code can exist for different teachers or sessions
courseSchema.index({ courseCode: 1, teacher: 1, session: 1 }, { unique: true });

module.exports = mongoose.model('Course', courseSchema);
