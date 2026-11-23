import assert from 'node:assert/strict';
import test from 'node:test';
import { convert } from '../../resources/js/engines/land-calculator.js';

test('15 shotangsho is 9.075 katha', () => {
    assert.equal(convert('15', 'shotangsho', 'katha'), '9.075');
});

test('one acre is 100 shotangsho, 60.5 katha, and 3.025 bigha', () => {
    assert.equal(convert('1', 'acre', 'shotangsho'), '100');
    assert.equal(convert('1', 'acre', 'katha'), '60.5');
    assert.equal(convert('1', 'acre', 'bigha'), '3.025');
});

test('one bigha is 20 katha and 16 chhatak make one katha', () => {
    assert.equal(convert('1', 'bigha', 'katha'), '20');
    assert.equal(convert('16', 'chhatak', 'katha'), '1');
});

test('shotangsho and katha keep their survey square feet', () => {
    assert.equal(convert('1', 'shotangsho', 'square-foot'), '435.6');
    assert.equal(convert('1', 'katha', 'square-foot'), '720');
    assert.equal(convert('100', 'ojutangsho', 'shotangsho'), '1');
});

test('an acre converts to the survey hectare and square metres', () => {
    assert.equal(convert('1', 'acre', 'hectare'), '0.40468564');
    assert.equal(convert('1', 'acre', 'square-meter'), '4046.8564224');
});

test('an empty or invalid amount has no result', () => {
    assert.equal(convert('', 'shotangsho', 'katha'), null);
    assert.equal(convert('abc', 'shotangsho', 'katha'), null);
    assert.equal(convert('-2', 'shotangsho', 'katha'), null);
});
