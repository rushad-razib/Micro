<?php

namespace App\Http\Controllers;

use Illuminate\Http\Response;

class RobotsController extends Controller
{
    public function __invoke(): Response
    {
        $sitemap = rtrim(config('app.url'), '/').'/sitemap.xml';

        $body = "User-agent: *\nAllow: /\n\nSitemap: {$sitemap}\n";

        return response($body, 200)->header('Content-Type', 'text/plain');
    }
}
