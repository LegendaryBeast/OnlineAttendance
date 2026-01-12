const mongoose = require('mongoose');

const cumulativeAttendanceSchema = new mongoose.Schema({
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    studentName: {
        type: String,
        required: true
    },
    registrationNumber: {
        type: String,
        required: true
    },
    attendanceCount: {
        type: Number,
        default: 1,
        min: 0
    },
    firstAttendanceDate: {
        type: Date,
        required: true
    },
    lastAttendanceDate: {
        type: Date,
        required: true
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Compound index to ensure one record per student per course
cumulativeAttendanceSchema.index({ course: 1, student: 1 }, { unique: true });

module.exports = mongoose.model('CumulativeAttendance', cumulativeAttendanceSchema);
