/**
 * Field distances on the WGS84 ellipsoid.
 * A fix is usable at 10 m reported accuracy or better. A mark is the average
 * of five usable fixes that sit within 5 m of each other. Track points are
 * kept only when they move at least 5 m at a walking speed of 3 m/s or less.
 */

export const MAX_ACCURACY_M = 10;

export const SAMPLE_COUNT = 5;

export const MIN_STEP_M = 5;

export const MAX_SPEED_M_S = 3;

const EQUATORIAL_RADIUS_M = 6378137;

const FLATTENING = 1 / 298.257223563;

const POLAR_RADIUS_M = EQUATORIAL_RADIUS_M * (1 - FLATTENING);

/**
 * @param {number} degrees
 */
function toRadians(degrees) {
    return degrees * Math.PI / 180;
}

/**
 * @param {number} latitudeA
 * @param {number} longitudeA
 * @param {number} latitudeB
 * @param {number} longitudeB
 */
function haversineDistance(latitudeA, longitudeA, latitudeB, longitudeB) {
    const phiA = toRadians(latitudeA);
    const phiB = toRadians(latitudeB);
    const deltaPhi = toRadians(latitudeB - latitudeA);
    const deltaLambda = toRadians(longitudeB - longitudeA);
    const halfChord = Math.sin(deltaPhi / 2) ** 2
        + Math.cos(phiA) * Math.cos(phiB) * Math.sin(deltaLambda / 2) ** 2;

    return 2 * EQUATORIAL_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(halfChord)));
}

/**
 * Inverse Vincenty distance in meters.
 *
 * @param {number} latitudeA
 * @param {number} longitudeA
 * @param {number} latitudeB
 * @param {number} longitudeB
 */
export function vincentyDistance(latitudeA, longitudeA, latitudeB, longitudeB) {
    if (latitudeA === latitudeB && longitudeA === longitudeB) {
        return 0;
    }

    const reducedA = Math.atan((1 - FLATTENING) * Math.tan(toRadians(latitudeA)));
    const reducedB = Math.atan((1 - FLATTENING) * Math.tan(toRadians(latitudeB)));
    const longitudeDelta = toRadians(longitudeB - longitudeA);
    const sinA = Math.sin(reducedA);
    const cosA = Math.cos(reducedA);
    const sinB = Math.sin(reducedB);
    const cosB = Math.cos(reducedB);

    let lambda = longitudeDelta;
    let sineSigma = 0;
    let cosineSigma = 0;
    let sigma = 0;
    let cosineSquaredAlpha = 0;
    let cosineDoubleSigmaMid = 0;
    let iterations = 100;

    do {
        const sineLambda = Math.sin(lambda);
        const cosineLambda = Math.cos(lambda);
        sineSigma = Math.hypot(
            cosB * sineLambda,
            cosA * sinB - sinA * cosB * cosineLambda,
        );

        if (sineSigma === 0) {
            return 0;
        }

        cosineSigma = sinA * sinB + cosA * cosB * cosineLambda;
        sigma = Math.atan2(sineSigma, cosineSigma);
        const sineAlpha = cosA * cosB * sineLambda / sineSigma;
        cosineSquaredAlpha = 1 - sineAlpha ** 2;
        cosineDoubleSigmaMid = cosineSquaredAlpha === 0
            ? 0
            : cosineSigma - 2 * sinA * sinB / cosineSquaredAlpha;
        const correction = FLATTENING / 16 * cosineSquaredAlpha * (2 + FLATTENING * (4 - 3 * cosineSquaredAlpha));
        const nextLambda = longitudeDelta + (1 - correction) * FLATTENING * sineAlpha * (
            sigma + correction * sineSigma * (
                cosineDoubleSigmaMid + correction * cosineSigma * (-1 + 2 * cosineDoubleSigmaMid ** 2)
            )
        );

        if (Math.abs(nextLambda - lambda) <= 1e-12) {
            lambda = nextLambda;
            break;
        }

        lambda = nextLambda;
    } while (--iterations > 0);

    if (iterations === 0) {
        return haversineDistance(latitudeA, longitudeA, latitudeB, longitudeB);
    }

    const uSquared = cosineSquaredAlpha * (EQUATORIAL_RADIUS_M ** 2 - POLAR_RADIUS_M ** 2) / (POLAR_RADIUS_M ** 2);
    const seriesA = 1 + uSquared / 16384 * (4096 + uSquared * (-768 + uSquared * (320 - 175 * uSquared)));
    const seriesB = uSquared / 1024 * (256 + uSquared * (-128 + uSquared * (74 - 47 * uSquared)));
    const deltaSigma = seriesB * sineSigma * (
        cosineDoubleSigmaMid + seriesB / 4 * (
            cosineSigma * (-1 + 2 * cosineDoubleSigmaMid ** 2)
            - seriesB / 6 * cosineDoubleSigmaMid * (-3 + 4 * sineSigma ** 2) * (-3 + 4 * cosineDoubleSigmaMid ** 2)
        )
    );

    return POLAR_RADIUS_M * seriesA * (sigma - deltaSigma);
}

/**
 * @param {unknown} fix
 * @returns {fix is { latitude: number, longitude: number, accuracy: number, timestamp: number }}
 */
export function isUsableFix(fix) {
    if (fix === null || typeof fix !== 'object') {
        return false;
    }

    const reading = /** @type {{ latitude?: unknown, longitude?: unknown, accuracy?: unknown }} */ (fix);

    return typeof reading.latitude === 'number'
        && Number.isFinite(reading.latitude)
        && typeof reading.longitude === 'number'
        && Number.isFinite(reading.longitude)
        && typeof reading.accuracy === 'number'
        && Number.isFinite(reading.accuracy)
        && reading.accuracy >= 0
        && reading.accuracy <= MAX_ACCURACY_M;
}

/**
 * @param {number} meters
 * @returns {number|null}
 */
export function wholeMeters(meters) {
    if (! Number.isFinite(meters)) {
        return null;
    }

    return Math.round(meters);
}

/**
 * Average the latest five usable fixes when every pair is within 5 m.
 *
 * @param {Array<{ latitude: number, longitude: number, accuracy: number, timestamp: number }>} fixes
 * @returns {{ latitude: number, longitude: number, accuracy: number, timestamp: number }|null}
 */
export function averageMark(fixes) {
    if (! Array.isArray(fixes) || fixes.length < SAMPLE_COUNT) {
        return null;
    }

    const sample = fixes.slice(-SAMPLE_COUNT);

    if (! sample.every((fix) => isUsableFix(fix))) {
        return null;
    }

    const latitude = sample.reduce((sum, fix) => sum + fix.latitude, 0) / SAMPLE_COUNT;
    const longitude = sample.reduce((sum, fix) => sum + fix.longitude, 0) / SAMPLE_COUNT;
    const clustered = sample.every((fix, index) => {
        return sample.every((other, otherIndex) => {
            if (otherIndex <= index) {
                return true;
            }

            return vincentyDistance(fix.latitude, fix.longitude, other.latitude, other.longitude) <= MIN_STEP_M;
        });
    });

    if (! clustered) {
        return null;
    }

    return {
        latitude,
        longitude,
        accuracy: Math.max(...sample.map((fix) => fix.accuracy)),
        timestamp: sample[SAMPLE_COUNT - 1].timestamp,
    };
}

/**
 * @param {{ latitude: number, longitude: number, accuracy: number, timestamp: number }} anchor
 * @param {Array<{ latitude: number, longitude: number, accuracy: number, timestamp: number }>} points
 */
export function filterTrack(anchor, points) {
    const track = [anchor];

    for (const point of points) {
        if (! isUsableFix(point)) {
            continue;
        }

        const previous = track[track.length - 1];
        const meters = vincentyDistance(
            previous.latitude,
            previous.longitude,
            point.latitude,
            point.longitude,
        );

        if (meters < MIN_STEP_M) {
            continue;
        }

        const elapsedSeconds = (point.timestamp - previous.timestamp) / 1000;

        if (! (elapsedSeconds > 0) || meters / elapsedSeconds > MAX_SPEED_M_S) {
            continue;
        }

        track.push(point);
    }

    return track;
}

/**
 * @param {Array<{ latitude: number, longitude: number }>} track
 */
export function pathLength(track) {
    let total = 0;

    for (let index = 1; index < track.length; index += 1) {
        total += vincentyDistance(
            track[index - 1].latitude,
            track[index - 1].longitude,
            track[index].latitude,
            track[index].longitude,
        );
    }

    return total;
}

/**
 * North and east offsets in meters. North is positive.
 *
 * @param {{ latitude: number, longitude: number }} origin
 * @param {{ latitude: number, longitude: number }} point
 */
export function localMeters(origin, point) {
    let longitudeDelta = point.longitude - origin.longitude;

    if (longitudeDelta > 180) {
        longitudeDelta -= 360;
    }

    if (longitudeDelta < -180) {
        longitudeDelta += 360;
    }

    const north = vincentyDistance(origin.latitude, origin.longitude, point.latitude, origin.longitude)
        * Math.sign(point.latitude - origin.latitude);
    const east = vincentyDistance(origin.latitude, origin.longitude, origin.latitude, origin.longitude + longitudeDelta)
        * Math.sign(longitudeDelta);

    return { east, north };
}

/**
 * @param {{ latitude: number, longitude: number, accuracy: number, timestamp: number }} start
 * @param {{ latitude: number, longitude: number, accuracy: number, timestamp: number }} end
 * @param {Array<{ latitude: number, longitude: number, accuracy: number, timestamp: number }>} points
 */
export function measure(start, end, points) {
    const straight = vincentyDistance(start.latitude, start.longitude, end.latitude, end.longitude);
    const track = filterTrack(start, [...points, end]);
    const recorded = track.length > 1;

    return {
        straightMeters: wholeMeters(straight),
        uncertaintyMeters: wholeMeters(Math.hypot(start.accuracy, end.accuracy)),
        pathMeters: recorded ? wholeMeters(pathLength(track)) : null,
        pointCount: track.length,
        worstAccuracy: Math.max(...track.map((point) => point.accuracy)),
        start,
        end,
        track,
    };
}
