<?php

namespace App\Http\Controllers;

use Illuminate\View\View;

class PageController extends Controller
{
    public function __invoke(string $page): View
    {
        $views = [
            'about' => 'pages.about',
            'privacy' => 'pages.privacy',
            'cookies' => 'pages.cookies',
            'terms' => 'pages.terms',
            'editorial-policy' => 'pages.editorial',
        ];

        abort_unless(isset($views[$page]), 404);

        return view($views[$page]);
    }
}
