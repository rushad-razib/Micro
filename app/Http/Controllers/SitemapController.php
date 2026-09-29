<?php

namespace App\Http\Controllers;

use App\Registry\ToolRegistry;
use Illuminate\Http\Response;

class SitemapController extends Controller
{
    public function __invoke(ToolRegistry $registry): Response
    {
        $urls = array_map(
            fn (string $path) => rtrim(config('app.url'), '/').$path,
            $registry->sitemapPaths(),
        );

        return response()
            ->view('seo.sitemap', ['urls' => $urls])
            ->header('Content-Type', 'application/xml');
    }
}
