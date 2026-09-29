<?php

namespace App\Http\Controllers;

use App\Registry\Tool;
use App\Registry\ToolRegistry;
use Illuminate\View\View;

class HomeController extends Controller
{
    public function __invoke(ToolRegistry $registry): View
    {
        $cluster = $registry->clusterBySlug('images');
        $tools = $cluster
            ? $registry->listedToolsIn($cluster->id)->reject(fn (Tool $tool) => $tool->isPreset())
            : collect();
        $presets = $cluster
            ? $registry->listedToolsIn($cluster->id)->filter(fn (Tool $tool) => $tool->isPreset())
            : collect();

        return view('pages.home', [
            'cluster' => $cluster,
            'tools' => $tools,
            'presets' => $presets,
            'guides' => $registry->listedGuides(),
        ]);
    }
}
