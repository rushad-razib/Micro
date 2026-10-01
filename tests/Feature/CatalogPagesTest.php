<?php

namespace Tests\Feature;

use Tests\TestCase;

class CatalogPagesTest extends TestCase
{
    public function test_unknown_slugs_are_not_found(): void
    {
        config(['registry.show_drafts' => false]);

        $this->get('/not-a-real-tool')->assertNotFound();
        $this->get('/guides/not-a-real-guide')->assertNotFound();
    }

    public function test_live_tools_share_the_same_view(): void
    {
        config(['registry.show_drafts' => false]);

        $compress = $this->get('/compress-image');
        $resize = $this->get('/resize-image');

        $compress->assertOk()->assertViewIs('pages.tool');
        $resize->assertOk()->assertViewIs('pages.tool');
        $this->assertSame(
            $compress->original->name(),
            $resize->original->name(),
        );
        $compress->assertSee('Drop an image, paste, or browse', false);
        $compress->assertSee('data-engine="squoosh-compress"', false);
        $resize->assertSee('data-engine="canvas-transform"', false);
        $resize->assertSee('data-tool="resize-image"', false);
        $resize->assertSee('data-suffix="resized"', false);
    }

    public function test_phase_one_urls_are_live(): void
    {
        config(['registry.show_drafts' => false]);

        foreach ([
            '/compress-image',
            '/resize-image',
            '/convert-image',
            '/crop-image',
            '/rotate-image',
            '/strip-image-metadata',
            '/resize-image-for-instagram',
            '/youtube-thumbnail-resizer',
            '/resize-image-for-facebook',
            '/resize-image-for-linkedin',
            '/images',
            '/guides/webp-vs-jpeg',
            '/guides/how-to-compress-images-for-the-web',
            '/guides/what-exif-data-reveals',
        ] as $path) {
            $this->get($path)->assertOk();
        }
    }

    public function test_document_cluster_urls_are_live(): void
    {
        config(['registry.show_drafts' => false]);

        foreach ([
            '/documents',
            '/merge-pdf',
            '/split-pdf',
            '/images-to-pdf',
            '/rotate-pdf',
            '/word-to-pdf',
            '/pdf-to-word',
            '/guides/merge-pdfs-in-your-browser',
            '/guides/convert-word-and-pdf-in-your-browser',
        ] as $path) {
            $this->get($path)->assertOk();
        }

        $this->get('/merge-pdf')
            ->assertSee('data-engine="pdf-toolkit"', false)
            ->assertSee('Files you open are processed in your browser', false)
            ->assertSee('documentIsland', false);

        $this->get('/word-to-pdf')
            ->assertSee('data-engine="office-convert"', false)
            ->assertSee('documentIsland', false);
    }

    public function test_header_mega_menu_lists_cluster_tools(): void
    {
        config(['registry.show_drafts' => false]);

        $this->get('/')
            ->assertOk()
            ->assertSee('Image tools', false)
            ->assertSee('PDF tools', false)
            ->assertSee('Compress image', false)
            ->assertSee('Merge PDF', false)
            ->assertSee(url('/compress-image'), false)
            ->assertSee(url('/merge-pdf'), false)
            ->assertSee('All image tools', false)
            ->assertSee('All pdf tools', false)
            ->assertSee('grid-template-columns: repeat(2', false)
            ->assertSee('width: min(calc(100vw - 2rem), 28rem)', false);
    }

    public function test_policy_pages_are_available(): void
    {
        $this->get('/about')->assertOk()->assertSee('Rushad Razib', false);
        $this->get('/contact')->assertOk();
        $this->get('/privacy')->assertOk()->assertSee('We do not upload them', false);
        $this->get('/cookies')->assertOk();
        $this->get('/terms')->assertOk();
        $this->get('/editorial-policy')->assertOk();
    }
}
