<?php

return [

    'name' => env('SITE_NAME', env('APP_NAME', 'Image tools')),

    'operator_name' => env('SITE_OPERATOR_NAME', 'Rushad Razib'),

    'contact_email' => env('SITE_CONTACT_EMAIL', 'hello@rushadrazib.com'),

    'google_site_verification' => env('GOOGLE_SITE_VERIFICATION'),

    /*
    |--------------------------------------------------------------------------
    | Consent provider
    |--------------------------------------------------------------------------
    |
    | first_party — Alpine banner + Consent Mode v2 (pre-AdSense approval).
    | google — Privacy & messaging owns the UI; first-party banner is hidden.
    |
    */
    'consent_provider' => env('CONSENT_PROVIDER', 'first_party'),

    'consent_storage_key' => 'site_consent_v1',

    'adsense' => [
        'client_id' => env('ADSENSE_CLIENT_ID'),
        'slot' => env('ADSENSE_SLOT'),
    ],

];
