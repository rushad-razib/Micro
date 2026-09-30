<?php

namespace Tests\Feature;

use Tests\TestCase;

class SitemapTest extends TestCase
{
    public function test_sitemap_lists_live_tools_and_omits_unknown_paths(): void
    {
        config(['registry.show_drafts' => false]);

        $response = $this->get('/sitemap.xml');

        $response->assertOk();
        $response->assertHeader('Content-Type', 'application/xml');
        $response->assertSee(url('/compress-image'), false);
        $response->assertSee(url('/resize-image'), false);
        $response->assertSee(url('/youtube-thumbnail-resizer'), false);
        $response->assertSee(url('/guides/webp-vs-jpeg'), false);
        $response->assertSee(url('/'), false);
        $response->assertSee(url('/about'), false);
        $response->assertDontSee('favicon-generator', false);
        $response->assertDontSee('heic-to-jpeg', false);
    }

    public function test_robots_allows_the_site_and_points_at_the_sitemap(): void
    {
        $this->get('/robots.txt')
            ->assertOk()
            ->assertSee('Allow: /', false)
            ->assertSee(url('/sitemap.xml'), false)
            ->assertDontSee('Disallow: /css', false);
    }
}
