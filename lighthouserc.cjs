module.exports = {
    ci: {
        collect: {
            url: [
                `${process.env.LIGHTHOUSE_BASE_URL.replace(/\/$/, '')}/compress-image`,
                `${process.env.LIGHTHOUSE_BASE_URL.replace(/\/$/, '')}/youtube-thumbnail-resizer`,
            ],
            numberOfRuns: 1,
            settings: {
                formFactor: 'mobile',
                screenEmulation: {
                    mobile: true,
                    width: 390,
                    height: 844,
                    deviceScaleFactor: 2,
                    disabled: false,
                },
                throttlingMethod: 'simulate',
            },
        },
        assert: {
            assertions: {
                'categories:performance': ['warn', { minScore: 0.7 }],
                'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
                'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
            },
        },
        upload: {
            target: 'temporary-public-storage',
        },
    },
};
