import { convert, unitName } from './engines/land-calculator.js';

/**
 * Alpine factory for calculators that convert a typed amount between units.
 */
export function calculatorIsland() {
    return {
        amount: '',
        from: 'shotangsho',
        to: 'katha',

        get result() {
            const value = convert(this.amount, this.from, this.to);

            if (value === null) {
                return null;
            }

            return `${value} ${unitName(this.to)}`;
        },

        swap() {
            const next = this.from;
            this.from = this.to;
            this.to = next;
        },
    };
}
