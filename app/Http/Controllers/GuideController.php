<?php

namespace App\Http\Controllers;

use App\Registry\ToolRegistry;
use Illuminate\View\View;

class GuideController extends Controller
{
    public function __invoke(ToolRegistry $registry, string $slug): View
    {
        $guide = $registry->guideBySlug($slug);

        if (! $guide || ! $registry->isVisibleGuide($guide)) {
            abort(404);
        }

        return view('pages.guide', [
            'guide' => $guide,
        ]);
    }
}
