<?php

namespace Tests\Feature;

use Tests\TestCase;

class SitemapTest extends TestCase
{
    public function test_sitemap_omits_draft_tools(): void
    {
        config(['registry.show_drafts' => false]);

        $response = $this->get('/sitemap.xml');

        $response->assertOk();
        $response->assertHeader('Content-Type', 'application/xml');
        $response->assertDontSee('compress-image', false);
        $response->assertDontSee('resize-image', false);
        $response->assertDontSee('webp-vs-jpeg', false);
        $response->assertSee(url('/'), false);
        $response->assertSee(url('/about'), false);
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
