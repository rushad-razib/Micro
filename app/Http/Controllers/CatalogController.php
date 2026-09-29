<?php

namespace App\Http\Controllers;

use App\Registry\ToolRegistry;
use Illuminate\Http\Response;
use Illuminate\View\View;

class CatalogController extends Controller
{
    public function __construct(
        private readonly ClusterController $clusters,
        private readonly ToolController $tools,
    ) {}

    public function __invoke(ToolRegistry $registry, string $slug): View|Response
    {
        if ($registry->clusterBySlug($slug)) {
            return ($this->clusters)($registry, $slug);
        }

        return ($this->tools)($registry, $slug);
    }
}
