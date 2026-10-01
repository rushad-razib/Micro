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
            $this->assertStringNotContainsString("from 'pdf-lib'", $source);
            $this->assertStringNotContainsString("from 'mammoth'", $source);
            $this->assertStringNotContainsString("from 'docx'", $source);
            $this->assertStringNotContainsString('pdfjs-dist', $source);
        }

        $compress = File::get(resource_path('js/engines/squoosh-compress.js'));
        $this->assertStringContainsString('@jsquash/jpeg', $compress);
        $this->assertStringContainsString('import(', $compress);

        $strip = File::get(resource_path('js/engines/metadata-strip.js'));
        $this->assertStringContainsString("from 'exifr'", $strip);

        $pdf = File::get(resource_path('js/engines/pdf-toolkit.js'));
        $this->assertStringContainsString("from 'pdf-lib'", $pdf);

        $office = File::get(resource_path('js/engines/office-convert.js'));
        $this->assertStringContainsString("from 'mammoth'", $office);
        $this->assertStringContainsString("from 'docx'", $office);
        $this->assertStringContainsString('pdfjs-dist', $office);
    }

    public function test_compress_page_does_not_embed_pdf_modules(): void
    {
        config(['registry.show_drafts' => false]);

        $html = $this->get('/compress-image')->assertOk()->getContent();

        $this->assertStringNotContainsString('pdf-lib', $html);
        $this->assertStringNotContainsString('pdfjs-dist', $html);
        $this->assertStringNotContainsString('mammoth', $html);
    }
}
