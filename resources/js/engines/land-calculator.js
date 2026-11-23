/**
 * Bangladesh survey land units, as square feet in lowest terms.
 * Shotangsho, katha, and bigha follow the Bangladesh Bureau of Statistics
 * table: 1 shotangsho = 435.6 sq ft, 1 katha = 720 sq ft, 1 bigha = 14,400 sq ft.
 * One square metre is the international foot (1 in = 2.54 cm).
 *
 * Option ids match the selects in calculator-island.blade.php.
 *
 * @type {Array<{ id: string, name: string, num: bigint, den: bigint }>}
 */
const UNITS = [
    { id: 'shotangsho', name: 'shotangsho', ...ratio(2178n, 5n) },
    { id: 'katha', name: 'katha', ...ratio(720n, 1n) },
    { id: 'bigha', name: 'bigha', ...ratio(14400n, 1n) },
    { id: 'acre', name: 'acre', ...ratio(43560n, 1n) },
    { id: 'hectare', name: 'hectare', ...ratio(250000000000n, 2322576n) },
    { id: 'square-foot', name: 'sq ft', ...ratio(1n, 1n) },
    { id: 'square-meter', name: 'sq m', ...ratio(25000000n, 2322576n) },
    { id: 'square-yard', name: 'sq yd', ...ratio(9n, 1n) },
    { id: 'chhatak', name: 'chhatak', ...ratio(45n, 1n) },
    { id: 'ojutangsho', name: 'ojutangsho', ...ratio(1089n, 250n) },
];

const BY_ID = new Map(UNITS.map((unit) => [unit.id, unit]));

const PLACES = 8;

/**
 * @param {bigint} num
 * @param {bigint} den
 */
function ratio(num, den) {
    const divisor = gcd(num, den);

    return { num: num / divisor, den: den / divisor };
}

/**
 * @param {bigint} left
 * @param {bigint} right
 */
function gcd(left, right) {
    let a = left < 0n ? -left : left;
    let b = right < 0n ? -right : right;

    while (b !== 0n) {
        const next = a % b;
        a = b;
        b = next;
    }

    return a;
}

/**
 * @param {unknown} amount
 */
function parseDecimal(amount) {
    const text = String(amount ?? '').trim();

    if (! /^\d+(\.\d+)?$/.test(text)) {
        return null;
    }

    const [whole, fraction = ''] = text.split('.');
    const digits = `${whole}${fraction}`.replace(/^0+(?=\d)/, '');

    return {
        num: BigInt(digits === '' ? '0' : digits),
        den: 10n ** BigInt(fraction.length),
    };
}

/**
 * @param {bigint} numerator
 * @param {bigint} denominator
 */
function formatRatio(numerator, denominator) {
    let num = numerator;
    let den = denominator;

    if (den < 0n) {
        num = -num;
        den = -den;
    }

    const whole = num / den;
    let remainder = num % den;

    if (remainder === 0n) {
        return whole.toString();
    }

    let digits = '';

    for (let place = 0; place < PLACES; place += 1) {
        remainder *= 10n;
        digits += (remainder / den).toString();
        remainder %= den;
    }

    if (remainder * 2n >= den) {
        const bumped = BigInt(digits) + 1n;
        const limit = 10n ** BigInt(PLACES);

        if (bumped === limit) {
            return (whole + 1n).toString();
        }

        digits = bumped.toString().padStart(PLACES, '0');
    }

    return `${whole}.${digits.replace(/0+$/, '')}`;
}

/**
 * @param {unknown} amount
 * @param {string} fromId
 * @param {string} toId
 * @returns {string|null}
 */
export function convert(amount, fromId, toId) {
    const value = parseDecimal(amount);
    const from = BY_ID.get(fromId);
    const to = BY_ID.get(toId);

    if (! value || ! from || ! to) {
        return null;
    }

    return formatRatio(
        value.num * from.num * to.den,
        value.den * from.den * to.num,
    );
}

/**
 * @param {string} id
 */
export function unitName(id) {
    return BY_ID.get(id)?.name ?? '';
}
