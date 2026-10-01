<?php

namespace App\Http\Controllers;

use App\Registry\Tool;
use App\Registry\ToolRegistry;
use Illuminate\View\View;

class HomeController extends Controller
{
    public function __invoke(ToolRegistry $registry): View
    {
        $clusters = $registry->headerClusters();

        $sections = $clusters->map(function ($cluster) use ($registry) {
            $listed = $registry->listedToolsIn($cluster->id);

            return [
                'cluster' => $cluster,
                'tools' => $listed->reject(fn (Tool $tool) => $tool->isPreset())->values(),
                'presets' => $listed->filter(fn (Tool $tool) => $tool->isPreset())->values(),
            ];
        })->values();

        return view('pages.home', [
            'sections' => $sections,
            'guides' => $registry->listedGuides(),
        ]);
    }
}
