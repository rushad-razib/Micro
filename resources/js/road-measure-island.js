import {
    MAX_CLUSTER_RADIUS_M,
    MAX_MARK_ACCURACY_M,
    MAX_STILL_SPEED_M_S,
    MIN_MARK_SPAN_MS,
    averageMark,
    filterTrack,
    inspectStill,
    isMarkSample,
    localMeters,
    measure,
} from './engines/road-measure.js';

const GEO_OPTIONS = {
    enableHighAccuracy: true,
    maximumAge: 0,
    timeout: 10000,
};

/**
 * @param {number} meters
 */
function formatAccuracy(meters) {
    const rounded = Math.round(meters * 10) / 10;

    return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

/**
 * @param {{ latitude: number, longitude: number, accuracy: number, timestamp: number }} fix
 */
function formatFix(fix) {
    return `${fix.latitude.toFixed(7)}, ${fix.longitude.toFixed(7)} (accuracy ${formatAccuracy(fix.accuracy)} m)`;
}

/**
 * Alpine factory for the road distance field tool.
 */
export function roadMeasureIsland() {
    return {
        phase: 'idle',
        latest: null,
        unavailable: false,
        samples: [],
        rawTrack: [],
        start: null,
        result: null,
        watchId: null,
        pollId: null,
        pendingFix: false,
        wakeLock: null,

        init() {
            if (typeof navigator === 'undefined' || ! navigator.geolocation) {
                this.phase = 'unsupported';
            }

            this.onVisible = () => {
                if (document.visibilityState === 'visible' && this.phase === 'walking') {
                    this.requestWakeLock();
                }
            };

            document.addEventListener('visibilitychange', this.onVisible);
        },

        destroy() {
            document.removeEventListener('visibilitychange', this.onVisible);
            this.stopGps();
            this.releaseWakeLock();
        },

        get canLockMark() {
            return averageMark(this.samples) !== null;
        },

        get canMarkStart() {
            if (this.phase === 'unsupported' || this.phase === 'denied') {
                return false;
            }

            if (this.phase === 'idle') {
                return true;
            }

            return this.phase === 'marking-start' && this.canLockMark;
        },

        get canMarkEnd() {
            return this.phase === 'walking' && this.canLockMark;
        },

        get statusLine() {
            if (this.phase === 'unsupported') {
                return 'This browser has no location service.';
            }

            if (this.phase === 'denied') {
                return 'Location permission was denied. Allow location for this site, then reload.';
            }

            if (this.phase === 'idle') {
                return 'Stand on the start, then hold still for about 30 seconds.';
            }

            if (this.phase === 'done') {
                return '';
            }

            if (this.unavailable && ! this.latest) {
                return 'Position is unavailable.';
            }

            if (! this.latest) {
                return 'Looking for a position.';
            }

            if (! isMarkSample(this.latest)) {
                if (this.latest.accuracy > MAX_MARK_ACCURACY_M) {
                    return `Accuracy ${formatAccuracy(this.latest.accuracy)} m. Waiting for a GPS fix.`;
                }

                if (typeof this.latest.speed === 'number' && this.latest.speed > MAX_STILL_SPEED_M_S) {
                    return 'Hold still.';
                }
            }

            const still = inspectStill(this.samples);

            if (still.ready) {
                return this.phase === 'marking-start'
                    ? 'The fixes agree. Ready to mark the start.'
                    : 'The fixes agree. Ready to mark the end.';
            }

            if (still.radius !== null && still.radius > MAX_CLUSTER_RADIUS_M && still.sampleCount >= 5) {
                return 'The fixes are still moving. Step into open sky and hold still.';
            }

            const seconds = Math.min(MIN_MARK_SPAN_MS / 1000, Math.floor(still.spanMs / 1000));

            return `Hold still. ${seconds} s of ${MIN_MARK_SPAN_MS / 1000} s.`;
        },

        get keptPointCount() {
            if (! this.start) {
                return 0;
            }

            return filterTrack(this.start, this.rawTrack).length;
        },

        markStart() {
            if (this.phase === 'idle') {
                this.phase = 'marking-start';
                this.startGps();

                return;
            }

            const start = averageMark(this.samples);

            if (! start) {
                return;
            }

            this.start = start;
            this.samples = [];
            this.rawTrack = [];
            this.phase = 'walking';
            this.requestWakeLock();
            this.queuePlot();
        },

        markEnd() {
            const end = averageMark(this.samples);

            if (! end || ! this.start) {
                return;
            }

            this.result = measure(this.start, end, this.rawTrack);
            this.phase = 'done';
            this.stopGps();
            this.releaseWakeLock();
            this.queuePlot();
        },

        measureAgain() {
            this.stopGps();
            this.releaseWakeLock();
            this.phase = 'idle';
            this.latest = null;
            this.unavailable = false;
            this.samples = [];
            this.rawTrack = [];
            this.start = null;
            this.result = null;
        },

        downloadRecord() {
            if (! this.result) {
                return;
            }

            const result = this.result;
            const lines = [
                'Road distance record',
                `Time: ${new Date(result.end.timestamp).toISOString()}`,
            ];

            if (result.straightMeters === null) {
                lines.push(
                    'No distance.',
                    `The fixes on these two marks combine to ${result.uncertaintyMeters} m.`,
                    'A distance is shown only at 5 m or less.',
                    'A steady fix beside a building can still be shifted.',
                );
            } else {
                const walked = result.pathMeters === null
                    ? 'Walked path: not recorded'
                    : `Walked path: ${result.pathMeters} m`;

                lines.push(
                    `Straight line: ${result.straightMeters} m`,
                    `Cluster estimate: ± ${result.uncertaintyMeters} m`,
                    'The ± is how tightly the phone repeated each mark, not a survey tolerance.',
                    'A steady fix beside a building can still be shifted.',
                    walked,
                    `Track points: ${result.pointCount}`,
                    `Worst accuracy on track: ${formatAccuracy(result.worstAccuracy)} m`,
                    'Walked length can still be long if the fix wanders, or short if a bend was sampled sparsely.',
                );
            }

            lines.push(
                '',
                `Start: ${formatFix(result.start)}`,
                `End: ${formatFix(result.end)}`,
                '',
                'Track:',
                ...result.track.map((point) => formatFix(point)),
            );

            const blob = new Blob([`${lines.join('\n')}\n`], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'road-distance.txt';
            link.click();
            URL.revokeObjectURL(url);
        },

        startGps() {
            if (this.watchId !== null || ! navigator.geolocation) {
                return;
            }

            this.watchId = navigator.geolocation.watchPosition(
                (position) => this.ingest(position, false),
                (error) => this.onLocationError(error),
                GEO_OPTIONS,
            );
            this.pollFix();
            this.pollId = window.setInterval(() => this.pollFix(), 1000);
        },

        pollFix() {
            if (this.pendingFix || this.phase === 'idle' || this.phase === 'done' || this.phase === 'denied') {
                return;
            }

            this.pendingFix = true;
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    this.pendingFix = false;
                    this.ingest(position, true);
                },
                (error) => {
                    this.pendingFix = false;
                    this.onLocationError(error);
                },
                GEO_OPTIONS,
            );
        },

        /**
         * @param {GeolocationPosition} position
         * @param {boolean} countAsSample
         */
        ingest(position, countAsSample) {
            if (this.phase !== 'marking-start' && this.phase !== 'walking') {
                return;
            }

            const fix = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy,
                speed: position.coords.speed,
                timestamp: position.timestamp,
            };

            this.latest = fix;
            this.unavailable = false;

            if (this.phase === 'walking' && this.start) {
                this.rawTrack.push(fix);
                this.queuePlot();
            }

            if (! countAsSample || ! isMarkSample(fix)) {
                return;
            }

            this.samples.push(fix);
        },

        /**
         * @param {GeolocationPositionError} error
         */
        onLocationError(error) {
            if (this.phase !== 'marking-start' && this.phase !== 'walking') {
                return;
            }

            if (error.code === 1) {
                this.phase = 'denied';
                this.stopGps();
                this.releaseWakeLock();

                return;
            }

            if (! this.latest) {
                this.unavailable = true;
            }
        },

        stopGps() {
            if (this.watchId !== null && navigator.geolocation) {
                navigator.geolocation.clearWatch(this.watchId);
            }

            this.watchId = null;

            if (this.pollId !== null) {
                window.clearInterval(this.pollId);
            }

            this.pollId = null;
            this.pendingFix = false;
        },

        async requestWakeLock() {
            try {
                this.wakeLock = await navigator.wakeLock?.request('screen');
            } catch {
                this.wakeLock = null;
            }
        },

        async releaseWakeLock() {
            try {
                await this.wakeLock?.release();
            } catch {
                // The lock was already released with the screen.
            }

            this.wakeLock = null;
        },

        queuePlot() {
            this.$nextTick(() => this.drawPlot());
        },

        drawPlot() {
            const canvas = this.$refs.plot;

            if (! canvas || ! this.start) {
                return;
            }

            const track = this.result
                ? this.result.track
                : filterTrack(this.start, this.rawTrack);
            const width = canvas.clientWidth;
            const height = canvas.clientHeight;

            if (width < 2 || height < 2) {
                return;
            }

            const ratio = window.devicePixelRatio || 1;
            canvas.width = Math.round(width * ratio);
            canvas.height = Math.round(height * ratio);

            const context = canvas.getContext('2d');

            if (! context) {
                return;
            }

            context.setTransform(ratio, 0, 0, ratio, 0, 0);
            context.clearRect(0, 0, width, height);
            context.fillStyle = '#1a1f1e';
            context.fillRect(0, 0, width, height);

            const projected = track.map((point) => localMeters(this.start, point));
            let minEast = Math.min(...projected.map((point) => point.east));
            let maxEast = Math.max(...projected.map((point) => point.east));
            let minNorth = Math.min(...projected.map((point) => point.north));
            let maxNorth = Math.max(...projected.map((point) => point.north));

            if (maxEast - minEast < 1 && maxNorth - minNorth < 1) {
                minEast -= 5;
                maxEast += 5;
                minNorth -= 5;
                maxNorth += 5;
            }

            const padding = 16;
            const scale = Math.min(
                (width - padding * 2) / (maxEast - minEast || 1),
                (height - padding * 2) / (maxNorth - minNorth || 1),
            );
            const xOf = (east) => padding + (east - minEast) * scale;
            const yOf = (north) => height - padding - (north - minNorth) * scale;

            context.strokeStyle = '#2dd4bf';
            context.lineWidth = 2;
            context.lineJoin = 'round';
            context.lineCap = 'round';
            context.beginPath();
            projected.forEach((point, index) => {
                const x = xOf(point.east);
                const y = yOf(point.north);

                if (index === 0) {
                    context.moveTo(x, y);
                } else {
                    context.lineTo(x, y);
                }
            });
            context.stroke();

            const drawDot = (point, color) => {
                context.fillStyle = color;
                context.beginPath();
                context.arc(xOf(point.east), yOf(point.north), 4, 0, Math.PI * 2);
                context.fill();
            };

            drawDot(projected[0], '#f5f5f4');
            drawDot(projected[projected.length - 1], '#2dd4bf');
        },
    };
}
