/**
 * LocationService - Single Responsibility: Location validation and distance calculation
 * Extracted from attendance route for better separation of concerns
 */
class LocationService {
    /**
     * Calculate distance between two coordinates using Haversine formula
     * @param {Object} coord1 - { latitude, longitude }
     * @param {Object} coord2 - { latitude, longitude }
     * @returns {number} Distance in meters
     */
    /**
     * Calculate distance between two coordinates using Vincenty's formula
     * This provides higher accuracy (up to 0.5mm) by modeling the Earth as an ellipsoid (WGS-84)
     * rather than a sphere (Haversine).
     * 
     * @param {Object} coord1 - { latitude, longitude }
     * @param {Object} coord2 - { latitude, longitude }
     * @returns {number} Distance in meters
     */
    calculateDistance(coord1, coord2) {
        const a = 6378137; // WGS-84 semi-major axis (meters)
        const b = 6356752.314245; // WGS-84 semi-minor axis (meters)
        const f = 1 / 298.257223563; // WGS-84 flattening

        const L = this.toRadians(coord2.longitude - coord1.longitude);
        const U1 = Math.atan((1 - f) * Math.tan(this.toRadians(coord1.latitude)));
        const U2 = Math.atan((1 - f) * Math.tan(this.toRadians(coord2.latitude)));

        const sinU1 = Math.sin(U1), cosU1 = Math.cos(U1);
        const sinU2 = Math.sin(U2), cosU2 = Math.cos(U2);

        let lambda = L;
        let lambdaP;
        let iterLimit = 100;
        let sinLambda, cosLambda, sinSigma, cosSigma, sigma, sinAlpha, cosSqAlpha, cos2SigmaM, C;

        do {
            sinLambda = Math.sin(lambda);
            cosLambda = Math.cos(lambda);
            sinSigma = Math.sqrt(
                (cosU2 * sinLambda) * (cosU2 * sinLambda) +
                (cosU1 * sinU2 - sinU1 * cosU2 * cosLambda) * (cosU1 * sinU2 - sinU1 * cosU2 * cosLambda)
            );

            if (sinSigma === 0) return 0; // Co-incident points

            cosSigma = sinU1 * sinU2 + cosU1 * cosU2 * cosLambda;
            sigma = Math.atan2(sinSigma, cosSigma);
            sinAlpha = cosU1 * cosU2 * sinLambda / sinSigma;
            cosSqAlpha = 1 - sinAlpha * sinAlpha;

            // Handle singularity at equator
            if (cosSqAlpha === 0) {
                cos2SigmaM = 0;
            } else {
                cos2SigmaM = cosSigma - 2 * sinU1 * sinU2 / cosSqAlpha;
            }

            C = f / 16 * cosSqAlpha * (4 + f * (4 - 3 * cosSqAlpha));
            lambdaP = lambda;
            lambda = L + (1 - C) * f * sinAlpha * (sigma + C * sinSigma * (cos2SigmaM + C * cosSigma * (-1 + 2 * cos2SigmaM * cos2SigmaM)));
        } while (Math.abs(lambda - lambdaP) > 1e-12 && --iterLimit > 0);

        if (iterLimit === 0) {
            // Fallback to Haversine if formula fails to converge
            return this.calculateHaversineDistance(coord1, coord2);
        }

        const uSq = cosSqAlpha * (a * a - b * b) / (b * b);
        const A = 1 + uSq / 16384 * (4096 + uSq * (-768 + uSq * (320 - 175 * uSq)));
        const B = uSq / 1024 * (256 + uSq * (-128 + uSq * (74 - 47 * uSq)));
        const deltaSigma = B * sinSigma * (cos2SigmaM + B / 4 * (cosSigma * (-1 + 2 * cos2SigmaM * cos2SigmaM) -
            B / 6 * cos2SigmaM * (-3 + 4 * sinSigma * sinSigma) * (-3 + 4 * cos2SigmaM * cos2SigmaM)));

        const s = b * A * (sigma - deltaSigma);
        return Math.round(s * 1000) / 1000; // Round to millimeters
    }

    /**
     * Fallback Haversine calculation
     */
    calculateHaversineDistance(coord1, coord2) {
        const R = 6371e3;
        const φ1 = this.toRadians(coord1.latitude);
        const φ2 = this.toRadians(coord2.latitude);
        const Δφ = this.toRadians(coord2.latitude - coord1.latitude);
        const Δλ = this.toRadians(coord2.longitude - coord1.longitude);

        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return Math.round(R * c);
    }

    /**
     * Convert degrees to radians
     * @param {number} degrees 
     * @returns {number}
     */
    toRadians(degrees) {
        return degrees * Math.PI / 180;
    }

    /**
     * Check if location is within acceptable range
     * @param {Object} teacherLocation 
     * @param {Object} studentLocation 
     * @param {number} maxDistance - Maximum allowed distance in meters
     * @returns {Object} { isWithinRange: boolean, distance: number }
     */
    validateLocation(teacherLocation, studentLocation, maxDistance = 50) {
        const distance = this.calculateDistance(teacherLocation, studentLocation);

        return {
            isWithinRange: distance <= maxDistance,
            distance
        };
    }
}

module.exports = LocationService;
