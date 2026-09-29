<?php

namespace App\Http\Controllers;

use App\Registry\Tool;
use App\Registry\ToolRegistry;
use Illuminate\Http\Response;
use Illuminate\View\View;

class ClusterController extends Controller
{
    public function __invoke(ToolRegistry $registry, string $slug): View|Response
    {
        $cluster = $registry->clusterBySlug($slug);

        if (! $cluster || ! $registry->isVisibleCluster($cluster)) {
            abort(404);
        }

        $tools = $registry->listedToolsIn($cluster->id);

        return view('pages.cluster', [
            'cluster' => $cluster,
            'tools' => $tools->reject(fn (Tool $tool) => $tool->isPreset()),
            'presets' => $tools->filter(fn (Tool $tool) => $tool->isPreset()),
            'guides' => $registry->listedGuides(),
        ]);
    }
}
