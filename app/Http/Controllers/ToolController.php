<?php

namespace App\Http\Controllers;

use App\Registry\ToolRegistry;
use Illuminate\View\View;

class ToolController extends Controller
{
    public function __invoke(ToolRegistry $registry, string $slug): View
    {
        $tool = $registry->toolBySlug($slug);

        if (! $tool || ! $registry->isVisibleTool($tool)) {
            abort(404);
        }

        $cluster = $registry->clusters()->first(fn ($item) => $item->id === $tool->cluster);

        return view('pages.tool', [
            'tool' => $tool,
            'cluster' => $cluster,
            'related' => $registry->relatedLinks($tool),
        ]);
    }
}
