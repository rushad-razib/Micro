<?php

namespace App\Http\Controllers;

use Illuminate\Http\Response;

class AdsTxtController extends Controller
{
    public function __invoke(): Response
    {
        $clientId = (string) config('site.adsense.client_id');

        if ($clientId === '') {
            abort(404);
        }

        $publisherId = str_starts_with($clientId, 'ca-')
            ? substr($clientId, 3)
            : $clientId;

        if ($publisherId === '' || ! str_starts_with($publisherId, 'pub-')) {
            abort(404);
        }

        $body = "google.com, {$publisherId}, DIRECT, f08c47fec0942fa0\n";

        return response($body, 200)->header('Content-Type', 'text/plain; charset=UTF-8');
    }
}
