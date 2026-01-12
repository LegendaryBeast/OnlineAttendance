// Import repositories
const UserRepository = require('./repositories/UserRepository');
const ClassRepository = require('./repositories/ClassRepository');
const AttendanceRepository = require('./repositories/AttendanceRepository');
const CourseRepository = require('./repositories/CourseRepository');
const CumulativeAttendanceRepository = require('./repositories/CumulativeAttendanceRepository');

// Import services
const AuthService = require('./services/AuthService');
const ClassService = require('./services/ClassService');
const AttendanceService = require('./services/AttendanceService');
const LocationService = require('./services/LocationService');
const ImageService = require('./services/ImageService');
const CourseService = require('./services/CourseService');
const CumulativeAttendanceService = require('./services/CumulativeAttendanceService');

// Import controllers
const AuthController = require('./controllers/AuthController');
const ClassController = require('./controllers/ClassController');
const AttendanceController = require('./controllers/AttendanceController');
const CourseController = require('./controllers/CourseController');

/**
 * Dependency Injection Container
 * Creates and wires all dependencies following Dependency Inversion Principle
 * This is where we construct our object graph
 */
class Container {
    constructor() {
        this.services = {};
        this.repositories = {};
        this.controllers = {};

        this.initializeRepositories();
        this.initializeServices();
        this.initializeControllers();
    }

    /**
     * Initialize all repositories
     */
    initializeRepositories() {
        this.repositories.userRepository = new UserRepository();
        this.repositories.classRepository = new ClassRepository();
        this.repositories.attendanceRepository = new AttendanceRepository();
        this.repositories.courseRepository = new CourseRepository();
        this.repositories.cumulativeAttendanceRepository = new CumulativeAttendanceRepository();
    }

    /**
     * Initialize all services with dependency injection
     */
    initializeServices() {
        // Standalone services (no dependencies)
        this.services.locationService = new LocationService();
        this.services.imageService = new ImageService();

        // Services with repository dependencies
        this.services.authService = new AuthService(
            this.repositories.userRepository
        );

        this.services.classService = new ClassService(
            this.repositories.classRepository,
            this.repositories.attendanceRepository,
            this.repositories.userRepository
        );

        // Initialize cumulative attendance service first
        this.services.cumulativeAttendanceService = new CumulativeAttendanceService(
            this.repositories.cumulativeAttendanceRepository,
            this.repositories.courseRepository
        );

        // Initialize course service
        this.services.courseService = new CourseService(
            this.repositories.courseRepository,
            this.repositories.cumulativeAttendanceRepository,
            this.repositories.userRepository
        );

        this.services.attendanceService = new AttendanceService(
            this.repositories.attendanceRepository,
            this.repositories.classRepository,
            this.repositories.userRepository,
            this.services.locationService,
            this.services.imageService,
            this.services.cumulativeAttendanceService  // Pass cumulative attendance service
        );
    }

    /**
     * Initialize all controllers with service dependencies
     */
    initializeControllers() {
        this.controllers.authController = new AuthController(
            this.services.authService
        );

        this.controllers.classController = new ClassController(
            this.services.classService
        );

        this.controllers.attendanceController = new AttendanceController(
            this.services.attendanceService
        );

        this.controllers.courseController = new CourseController(
            this.services.courseService,
            this.services.cumulativeAttendanceService
        );
    }

    /**
     * Get a controller by name
     */
    getController(name) {
        return this.controllers[name];
    }

    /**
     * Get a service by name
     */
    getService(name) {
        return this.services[name];
    }

    /**
     * Get a repository by name
     */
    getRepository(name) {
        return this.repositories[name];
    }
}

module.exports = Container;
