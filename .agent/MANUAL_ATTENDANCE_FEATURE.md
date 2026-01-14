# Manual Attendance Feature

## Overview
This feature allows teachers to manually add student attendance by entering only the student's registration number. This is designed for cases where students face technical issues preventing them from submitting attendance themselves.

## Key Requirements Met
✅ Teachers can add attendance using only registration number  
✅ Student must already be registered in the system  
✅ Registration number extracted from email (e.g., 2021331006@student.sust.edu)  
✅ Validates 10-digit registration number format  
✅ Prevents duplicate attendance entries  
✅ Updates cumulative attendance if class is linked to a course  

## Backend Changes

### 1. **UserRepository.js**
- Added `findByRegistrationNumber(registrationNumber)` method to query students by registration number

### 2. **AttendanceService.js**
- Added `manuallyAddAttendance(classId, registrationNumber, teacherId)` method
- Validates registration number format (must be 10 digits)
- Verifies teacher owns the class
- Finds student by registration number
- Checks for duplicate attendance
- Creates attendance record with `validationCodeUsed: 'MANUAL_ENTRY'`
- Updates cumulative attendance if applicable

### 3. **AttendanceController.js**
- Added `manuallyAddAttendance(req, res)` controller method
- Handles HTTP requests for manual attendance

### 4. **attendance.routes.js**
- Added `POST /attendance/manual` route (teacher only)

## Frontend Changes

### 1. **teacher-dashboard.html**
- Added manual attendance input section in the attendance modal
- Includes:
  - Input field for 10-digit registration number
  - "Add Attendance" button
  - Helper text and instructions
  - Attractive card-style UI with icons

### 2. **teacher.js**
- Added `addManualAttendance()` function
- Validates registration number format
- Sends API request to `/attendance/manual`
- Displays success/error messages
- Automatically refreshes attendance list on success
- Clears input field after submission

## Usage

1. Teacher creates a class as usual
2. Teacher clicks "View Attendance" for any class
3. In the attendance modal, a "Manual Attendance Entry" section appears at the top
4. Teacher enters the 10-digit registration number (e.g., 2021331006)
5. Clicks "Add Attendance" button
6. System validates:
   - Registration number is exactly 10 digits
   - Student exists in the system
   - Student hasn't already submitted attendance
   - Teacher owns the class
7. On success:
   - Attendance is marked
   - Success message shows student name and registration number
   - Attendance list automatically refreshes
   - Input field is cleared

## Error Handling

The feature handles various error cases:
- Invalid registration number format
- Student not found
- Student already submitted attendance
- Teacher doesn't own the class
- Network errors

## Database

Manual attendance entries are marked with:
- `validationCodeUsed: 'MANUAL_ENTRY'`
- `distance: null`
- `imageUrl: null`

This allows easy identification of manually added records.

## Security

- Only teachers can access the manual attendance endpoint
- JWT authentication required
- Teacher must own the class to add attendance
- All validations performed server-side
