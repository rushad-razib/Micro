<?php

namespace Tests\Feature;

use App\Http\Middleware\EnsureCanonicalHost;
use Illuminate\Http\Request;
use Tests\TestCase;

class CanonicalHostTest extends TestCase
{
    public function test_trailing_slash_redirects_to_clean_path(): void
    {
        $middleware = new EnsureCanonicalHost;
        $request = Request::create('http://localhost/compress-image/', 'GET');

        $response = $middleware->handle($request, function () {
            return response('ok');
        });

        $this->assertSame(301, $response->getStatusCode());
        $this->assertSame(url('/compress-image'), $response->headers->get('Location'));
    }

    public function test_root_trailing_slash_is_not_redirected_in_a_loop(): void
    {
        $middleware = new EnsureCanonicalHost;
        $request = Request::create('http://localhost/', 'GET');

        $response = $middleware->handle($request, function () {
            return response('ok', 200);
        });

        $this->assertSame(200, $response->getStatusCode());
    }

    public function test_production_redirects_wrong_host_to_app_url(): void
    {
        config(['app.url' => 'https://tools.rushadrazib.com']);
        $this->app['env'] = 'production';

        $middleware = new EnsureCanonicalHost;
        $request = Request::create('http://wrong.example/compress-image', 'GET');

        $response = $middleware->handle($request, function () {
            return response('ok');
        });

        $this->assertSame(301, $response->getStatusCode());
        $this->assertSame('https://tools.rushadrazib.com/compress-image', $response->headers->get('Location'));
    }

    public function test_robots_comes_from_the_controller_not_a_static_stub(): void
    {
        $this->assertFileDoesNotExist(public_path('robots.txt'));

        $this->get('/robots.txt')
            ->assertOk()
            ->assertSee('Allow: /', false)
            ->assertSee('Sitemap:', false)
            ->assertSee(url('/sitemap.xml'), false);
    }

    public function test_layout_includes_og_image_and_optional_verification(): void
    {
        config(['site.google_site_verification' => 'test-token-abc']);

        $this->get('/')
            ->assertOk()
            ->assertSee('og:image', false)
            ->assertSee(url('/og-default.png'), false)
            ->assertSee('google-site-verification', false)
            ->assertSee('test-token-abc', false);
    }
}
