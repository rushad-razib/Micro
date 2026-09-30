<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\File;
use Tests\TestCase;

class EngineIsolationTest extends TestCase
{
    public function test_resize_page_does_not_embed_squoosh_modules(): void
    {
        config(['registry.show_drafts' => false]);

        $html = $this->get('/resize-image')->assertOk()->getContent();

        $this->assertStringNotContainsString('@jsquash/jpeg', $html);
        $this->assertStringNotContainsString('@jsquash/oxipng', $html);
        $this->assertStringNotContainsString('@jsquash/webp', $html);
        $this->assertStringNotContainsString('mozjpeg', $html);
        $this->assertStringContainsString('data-engine="canvas-transform"', $html);
    }

    public function test_app_bundle_does_not_statically_import_squoosh(): void
    {
        $appJs = File::get(resource_path('js/app.js'));
        $islandJs = File::get(resource_path('js/tool-island.js'));
        $indexJs = File::get(resource_path('js/engines/index.js'));

        foreach ([$appJs, $islandJs, $indexJs] as $source) {
            $this->assertStringNotContainsString('@jsquash/', $source);
            $this->assertStringNotContainsString("from 'exifr'", $source);
        }

        $compress = File::get(resource_path('js/engines/squoosh-compress.js'));
        $this->assertStringContainsString('@jsquash/jpeg', $compress);
        $this->assertStringContainsString('import(', $compress);

        $strip = File::get(resource_path('js/engines/metadata-strip.js'));
        $this->assertStringContainsString("from 'exifr'", $strip);
    }
}
