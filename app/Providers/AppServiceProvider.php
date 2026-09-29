<?php

namespace App\Providers;

use App\Registry\RegistryValidator;
use App\Registry\ToolRegistry;
use Illuminate\Support\Facades\View;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(RegistryValidator::class, function () {
            return new RegistryValidator(config('registry.engines'));
        });

        $this->app->singleton(ToolRegistry::class);
    }

    public function boot(): void
    {
        View::share('siteName', config('app.name'));

        View::composer('components.layouts.app', function ($view) {
            $registry = app(ToolRegistry::class);

            $view->with([
                'siteName' => config('app.name'),
                'headerClusters' => $registry->headerClusters(),
                'footerToolsByCluster' => $registry->liveToolsByCluster(),
                'footerClusters' => $registry->clusters()->keyBy('id'),
                'footerGuides' => $registry->guides()->filter(fn ($guide) => $guide->isLive()),
            ]);
        });
    }
}
