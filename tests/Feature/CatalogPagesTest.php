<?php

namespace Tests\Feature;

use Tests\TestCase;

class CatalogPagesTest extends TestCase
{
    public function test_draft_tools_are_not_found_when_drafts_are_hidden(): void
    {
        config(['registry.show_drafts' => false]);

        $this->get('/compress-image')->assertNotFound();
        $this->get('/resize-image')->assertNotFound();
        $this->get('/not-a-real-tool')->assertNotFound();
        $this->get('/images')->assertNotFound();
        $this->get('/guides/webp-vs-jpeg')->assertNotFound();
    }

    public function test_two_draft_tools_share_the_same_view_when_drafts_are_visible(): void
    {
        config(['registry.show_drafts' => true]);

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
    }

    public function test_policy_pages_are_available(): void
    {
        $this->get('/about')->assertOk();
        $this->get('/contact')->assertOk();
        $this->get('/privacy')->assertOk();
        $this->get('/cookies')->assertOk();
        $this->get('/terms')->assertOk();
        $this->get('/editorial-policy')->assertOk();
    }
}
