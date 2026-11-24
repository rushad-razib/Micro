import assert from 'node:assert/strict';
import test from 'node:test';
import {
    MAX_ACCURACY_M,
    averageMark,
    filterTrack,
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

test('a fix worse than 10 m is rejected', () => {
    const reading = { latitude: 23.8, longitude: 90.4, timestamp: 0 };

    assert.equal(isUsableFix({ ...reading, accuracy: MAX_ACCURACY_M }), true);
    assert.equal(isUsableFix({ ...reading, accuracy: MAX_ACCURACY_M + 0.1 }), false);
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

test('five clustered fixes average and a spread-out run does not', () => {
    const clustered = Array.from({ length: 5 }, (_, index) => ({
        latitude: northOfEquator(index * 0.2),
        longitude: 0,
        accuracy: index === 2 ? 9 : 4,
        timestamp: index * 1000,
    }));
    const mark = averageMark(clustered);

    assert.ok(mark);
    assert.equal(mark.accuracy, 9);
    assert.equal(mark.timestamp, 4000);

    const spread = Array.from({ length: 5 }, (_, index) => ({
        latitude: northOfEquator(index * 4),
        longitude: 0,
        accuracy: 5,
        timestamp: index * 1000,
    }));

    assert.equal(averageMark(spread), null);
    assert.equal(averageMark(clustered.slice(0, 4)), null);
});

test('a rejected walk still reports the straight line', () => {
    const start = { latitude: 0, longitude: 0, accuracy: 6, timestamp: 0 };
    const end = {
        latitude: northOfEquator(20),
        longitude: 0,
        accuracy: 8,
        timestamp: 1000,
    };
    const result = measure(start, end, [end]);

    assert.ok(result.straightMeters >= 19 && result.straightMeters <= 21);
    assert.equal(result.uncertaintyMeters, 10);
    assert.equal(result.pathMeters, null);
    assert.equal(result.pointCount, 1);
});

test('a walked step reports both lengths', () => {
    const start = { latitude: 0, longitude: 0, accuracy: 5, timestamp: 0 };
    const step = {
        latitude: northOfEquator(8),
        longitude: 0,
        accuracy: 5,
        timestamp: 4000,
    };
    const end = {
        latitude: northOfEquator(16),
        longitude: 0,
        accuracy: 5,
        timestamp: 8000,
    };
    const result = measure(start, end, [step]);

    assert.equal(result.straightMeters, result.pathMeters);
    assert.ok(result.pathMeters >= 15 && result.pathMeters <= 17);
    assert.equal(result.pointCount, 3);
});
