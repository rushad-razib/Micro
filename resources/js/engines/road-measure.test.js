import assert from 'node:assert/strict';
import test from 'node:test';
import {
    MAX_CLUSTER_RADIUS_M,
    MAX_MARK_ACCURACY_M,
    MAX_TRACK_ACCURACY_M,
    averageMark,
    filterTrack,
    isMarkSample,
    isUsableFix,
    measure,
    pathLength,
    vincentyDistance,
} from './road-measure.js';

const METERS_PER_DEGREE_LAT = 110574;

/**
 * @param {number} meters
 */
function northOfEquator(meters) {
    return meters / METERS_PER_DEGREE_LAT;
}

/**
 * @param {{ count?: number, spanMs?: number, spreadMeters?: number, accuracy?: number, speed?: number, startMs?: number }} [options]
 */
function stillFixes(options = {}) {
    const count = options.count ?? 15;
    const spanMs = options.spanMs ?? 20_000;
    const spreadMeters = options.spreadMeters ?? 1;
    const accuracy = options.accuracy ?? 12;
    const speed = options.speed ?? 0;
    const startMs = options.startMs ?? 0;

    return Array.from({ length: count }, (_, index) => ({
        latitude: northOfEquator(index % 2 === 0 ? 0 : spreadMeters),
        longitude: 0,
        accuracy,
        speed,
        timestamp: startMs + (count === 1 ? 0 : Math.round(index * spanMs / (count - 1))),
    }));
}

test('one degree of longitude on the equator is about 111319 m', () => {
    const meters = vincentyDistance(0, 0, 0, 1);

    assert.ok(Math.abs(meters - 111319.49079327358) < 0.001);
});

test('a published geodesic stays within 5 cm', () => {
    const meters = vincentyDistance(
        -37.95103341666667,
        144.42486788888888,
        -37.65282113888889,
        143.92649552777777,
    );

    assert.ok(Math.abs(meters - 54972.271) < 0.05);
});

test('a fix worse than 10 m is rejected from the track', () => {
    const reading = { latitude: 23.8, longitude: 90.4, timestamp: 0 };

    assert.equal(isUsableFix({ ...reading, accuracy: MAX_TRACK_ACCURACY_M }), true);
    assert.equal(isUsableFix({ ...reading, accuracy: MAX_TRACK_ACCURACY_M + 0.1 }), false);
});

test('a 1 m jitter does not add path length', () => {
    const start = { latitude: 0, longitude: 0, accuracy: 5, timestamp: 0 };
    const jitter = {
        latitude: northOfEquator(1),
        longitude: 0,
        accuracy: 5,
        timestamp: 1000,
    };
    const moved = vincentyDistance(0, 0, jitter.latitude, 0);

    assert.ok(moved > 0.5 && moved < 5);

    const track = filterTrack(start, [jitter]);

    assert.equal(track.length, 1);
    assert.equal(pathLength(track), 0);
});

test('a jump faster than 3 m/s is dropped', () => {
    const start = { latitude: 0, longitude: 0, accuracy: 5, timestamp: 0 };
    const jump = {
        latitude: northOfEquator(30),
        longitude: 0,
        accuracy: 5,
        timestamp: 1000,
    };
    const moved = vincentyDistance(0, 0, jump.latitude, 0);

    assert.ok(moved / 1 > 3);

    const track = filterTrack(start, [jump]);

    assert.equal(track.length, 1);
    assert.equal(pathLength(track), 0);
});

test('a walking step of at least 5 m is kept', () => {
    const start = { latitude: 0, longitude: 0, accuracy: 5, timestamp: 0 };
    const step = {
        latitude: northOfEquator(8),
        longitude: 0,
        accuracy: 4,
        timestamp: 4000,
    };
    const track = filterTrack(start, [step]);

    assert.equal(track.length, 2);
    assert.ok(pathLength(track) > 7 && pathLength(track) < 9);
});

test('fifteen fixes over 20 seconds inside 2 m lock even when each reports 12 m', () => {
    const mark = averageMark(stillFixes({ accuracy: 12, spreadMeters: 1 }));

    assert.ok(mark);
    assert.ok(mark.accuracy <= 2);
    assert.ok(mark.accuracy <= MAX_CLUSTER_RADIUS_M);
    assert.equal(mark.timestamp, 20_000);
});

test('fixes spread over 8 m do not lock', () => {
    const spread = Array.from({ length: 15 }, (_, index) => ({
        latitude: northOfEquator(index < 8 ? 0 : 8),
        longitude: 0,
        accuracy: 5,
        speed: 0,
        timestamp: Math.round(index * 20_000 / 14),
    }));

    assert.equal(averageMark(spread), null);
});

test('a 40 m accuracy fix is ignored and does not move the mark', () => {
    const fixes = stillFixes({ accuracy: 12, spreadMeters: 1 });
    const outlier = {
        latitude: northOfEquator(50),
        longitude: 0,
        accuracy: 40,
        speed: 0,
        timestamp: 8_000,
    };

    assert.equal(isMarkSample(outlier), false);
    assert.ok(outlier.accuracy > MAX_MARK_ACCURACY_M);

    const mark = averageMark([...fixes, outlier]);

    assert.ok(mark);
    assert.ok(Math.abs(mark.latitude) < northOfEquator(2));
});

test('a moving fix and a short still do not lock', () => {
    assert.equal(isMarkSample({
        latitude: 0,
        longitude: 0,
        accuracy: 5,
        speed: 1.2,
        timestamp: 0,
    }), false);
    assert.equal(averageMark(stillFixes({ speed: 1.2 })), null);
    assert.equal(averageMark(stillFixes({ spanMs: 19_000 })), null);
    assert.equal(averageMark(stillFixes({ count: 14 })), null);
});

test('an earlier jump falls outside the 30 second window', () => {
    const early = Array.from({ length: 10 }, (_, index) => ({
        latitude: northOfEquator(index * 5),
        longitude: 0,
        accuracy: 8,
        speed: 0,
        timestamp: index * 1000,
    }));
    const late = stillFixes({ startMs: 20_000, spanMs: 25_000, spreadMeters: 1, accuracy: 12 });
    const mark = averageMark([...early, ...late]);

    assert.ok(mark);
    assert.ok(mark.accuracy <= 2);
});

test('two 2 m marks return both lengths and a combined error of 3 m', () => {
    const start = { latitude: 0, longitude: 0, accuracy: 2, timestamp: 0 };
    const step = {
        latitude: northOfEquator(8),
        longitude: 0,
        accuracy: 5,
        timestamp: 4000,
    };
    const end = {
        latitude: northOfEquator(16),
        longitude: 0,
        accuracy: 2,
        timestamp: 8000,
    };
    const result = measure(start, end, [step]);

    assert.equal(result.uncertaintyMeters, 3);
    assert.equal(result.straightMeters, result.pathMeters);
    assert.ok(result.pathMeters !== null && result.pathMeters >= 15 && result.pathMeters <= 17);
    assert.equal(result.pointCount, 3);
});

test('two 4 m radii return no lengths', () => {
    const start = { latitude: 0, longitude: 0, accuracy: 4, timestamp: 0 };
    const end = {
        latitude: northOfEquator(16),
        longitude: 0,
        accuracy: 4,
        timestamp: 8000,
    };
    const result = measure(start, end, []);

    assert.equal(result.uncertaintyMeters, 6);
    assert.equal(result.straightMeters, null);
    assert.equal(result.pathMeters, null);
});
