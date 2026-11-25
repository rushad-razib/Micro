/**
 * Field distances on the WGS84 ellipsoid.
 * A mark is the average of a still: at least 15 fixes over at least 20 seconds,
 * all inside the last 30 seconds, and all within 3.5 m of that average.
 * The mark's error is that cluster radius. A reported accuracy worse than 20 m,
 * or a speed above 0.5 m/s, is left out of the still.
 * Track points are kept only when they move at least 5 m at a walking speed of 3 m/s or less.
 */

export const MAX_TRACK_ACCURACY_M = 10;

export const MAX_MARK_ACCURACY_M = 20;

export const MAX_STILL_SPEED_M_S = 0.5;

export const MIN_MARK_SAMPLES = 15;

export const MIN_MARK_SPAN_MS = 20_000;

export const MAX_MARK_SPAN_MS = 30_000;

export const MAX_CLUSTER_RADIUS_M = 3.5;

export const MAX_RESULT_UNCERTAINTY_M = 5;

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
 * @param {unknown} value
 * @returns {value is number}
 */
function isFiniteNumber(value) {
    return typeof value === 'number' && Number.isFinite(value);
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
function hasPosition(fix) {
    if (fix === null || typeof fix !== 'object') {
        return false;
    }

    const reading = /** @type {{ latitude?: unknown, longitude?: unknown, accuracy?: unknown }} */ (fix);

    return isFiniteNumber(reading.latitude)
        && isFiniteNumber(reading.longitude)
        && isFiniteNumber(reading.accuracy)
        && reading.accuracy >= 0;
}

/**
 * @param {unknown} fix
 * @returns {fix is { latitude: number, longitude: number, accuracy: number, timestamp: number }}
 */
export function isUsableFix(fix) {
    return hasPosition(fix) && fix.accuracy <= MAX_TRACK_ACCURACY_M;
}

/**
 * A still sample. Reported accuracy above 20 m, or speed above 0.5 m/s, is ignored.
 *
 * @param {unknown} fix
 * @returns {fix is { latitude: number, longitude: number, accuracy: number, timestamp: number, speed?: number|null }}
 */
export function isMarkSample(fix) {
    if (! hasPosition(fix)) {
        return false;
    }

    const reading = /** @type {{ accuracy: number, timestamp?: unknown, speed?: unknown }} */ (fix);

    if (reading.accuracy > MAX_MARK_ACCURACY_M || ! isFiniteNumber(reading.timestamp)) {
        return false;
    }

    return ! (isFiniteNumber(reading.speed) && reading.speed > MAX_STILL_SPEED_M_S);
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
 * @param {Array<{ latitude: number, longitude: number, accuracy: number, timestamp: number }>} fixes
 * @returns {{ window: Array<{ latitude: number, longitude: number, accuracy: number, timestamp: number }>, latitude: number, longitude: number, radius: number, spanMs: number }|null}
 */
function markWindow(fixes) {
    if (! Array.isArray(fixes)) {
        return null;
    }

    const samples = fixes
        .filter((fix) => isMarkSample(fix))
        .sort((left, right) => left.timestamp - right.timestamp);

    if (samples.length === 0) {
        return null;
    }

    const endTime = samples[samples.length - 1].timestamp;
    const window = samples.filter((fix) => endTime - fix.timestamp <= MAX_MARK_SPAN_MS);
    const latitude = window.reduce((sum, fix) => sum + fix.latitude, 0) / window.length;
    const longitude = window.reduce((sum, fix) => sum + fix.longitude, 0) / window.length;
    let radius = 0;

    for (const fix of window) {
        radius = Math.max(radius, vincentyDistance(latitude, longitude, fix.latitude, fix.longitude));
    }

    return {
        window,
        latitude,
        longitude,
        radius,
        spanMs: window[window.length - 1].timestamp - window[0].timestamp,
    };
}

/**
 * @param {{ window: unknown[], spanMs: number, radius: number }} mark
 */
function stillIsReady(mark) {
    return mark.window.length >= MIN_MARK_SAMPLES
        && mark.spanMs >= MIN_MARK_SPAN_MS
        && mark.radius <= MAX_CLUSTER_RADIUS_M;
}

/**
 * @param {Array<{ latitude: number, longitude: number, accuracy: number, timestamp: number, speed?: number|null }>} fixes
 * @returns {{ sampleCount: number, spanMs: number, radius: number|null, ready: boolean }}
 */
export function inspectStill(fixes) {
    const mark = markWindow(fixes);

    if (! mark) {
        return { sampleCount: 0, spanMs: 0, radius: null, ready: false };
    }

    return {
        sampleCount: mark.window.length,
        spanMs: mark.spanMs,
        radius: mark.radius,
        ready: stillIsReady(mark),
    };
}

/**
 * Average the latest still when its fixes agree within 3.5 m.
 * The returned accuracy is that cluster radius.
 *
 * @param {Array<{ latitude: number, longitude: number, accuracy: number, timestamp: number, speed?: number|null }>} fixes
 * @returns {{ latitude: number, longitude: number, accuracy: number, timestamp: number }|null}
 */
export function averageMark(fixes) {
    const mark = markWindow(fixes);

    if (! mark || ! stillIsReady(mark)) {
        return null;
    }

    return {
        latitude: mark.latitude,
        longitude: mark.longitude,
        accuracy: mark.radius,
        timestamp: mark.window[mark.window.length - 1].timestamp,
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
    const uncertaintyMeters = wholeMeters(Math.hypot(start.accuracy, end.accuracy));
    const accepted = uncertaintyMeters !== null && uncertaintyMeters <= MAX_RESULT_UNCERTAINTY_M;

    return {
        straightMeters: accepted ? wholeMeters(straight) : null,
        uncertaintyMeters,
        pathMeters: accepted && recorded ? wholeMeters(pathLength(track)) : null,
        pointCount: track.length,
        worstAccuracy: Math.max(...track.map((point) => point.accuracy)),
        start,
        end,
        track,
    };
}
