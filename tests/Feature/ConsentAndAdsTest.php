<?php

namespace Tests\Feature;

use Tests\TestCase;

class ConsentAndAdsTest extends TestCase
{
    public function test_first_party_consent_banner_is_present_by_default(): void
    {
        config([
            'site.consent_provider' => 'first_party',
            'site.adsense.client_id' => null,
            'site.adsense.slot' => null,
        ]);

        $this->get('/')
            ->assertOk()
            ->assertSee('data-consent-banner', false)
            ->assertSee('data-consent-provider="first_party"', false)
            ->assertSee('Cookie preferences', false);
    }

    public function test_google_consent_provider_hides_first_party_banner(): void
    {
        config([
            'site.consent_provider' => 'google',
            'site.adsense.client_id' => 'ca-pub-1234567890123456',
            'site.adsense.slot' => '1234567890',
        ]);

        $this->get('/')
            ->assertOk()
            ->assertDontSee('data-consent-banner', false)
            ->assertSee('data-consent-provider="google"', false)
            ->assertDontSee('Cookie preferences', false);
    }

    public function test_cookies_page_documents_categories_and_storage_key(): void
    {
        config([
            'site.consent_provider' => 'first_party',
            'site.consent_storage_key' => 'site_consent_v1',
        ]);

        $this->get('/cookies')
            ->assertOk()
            ->assertSee('site_consent_v1', false)
            ->assertSee('Necessary', false)
            ->assertSee('Analytics', false)
            ->assertSee('Advertising', false)
            ->assertSee('Cloudflare', false)
            ->assertSee('Change cookie choices', false);
    }

    public function test_privacy_page_names_operator_and_edge_traffic(): void
    {
        config([
            'site.operator_name' => 'Rushad Razib',
            'site.adsense.client_id' => null,
        ]);

        $this->get('/privacy')
            ->assertOk()
            ->assertSee('Rushad Razib', false)
            ->assertSee('We do not upload them', false)
            ->assertSee('Cloudflare', false)
            ->assertSee('Advertising is not enabled', false);
    }

    public function test_ads_txt_is_absent_when_publisher_id_is_empty(): void
    {
        config([
            'site.adsense.client_id' => null,
        ]);

        $this->get('/ads.txt')->assertNotFound();
    }

    public function test_ads_txt_lists_publisher_when_client_id_is_set(): void
    {
        config([
            'site.adsense.client_id' => 'ca-pub-1234567890123456',
        ]);

        $this->get('/ads.txt')
            ->assertOk()
            ->assertHeader('Content-Type', 'text/plain; charset=UTF-8')
            ->assertSee('google.com, pub-1234567890123456, DIRECT, f08c47fec0942fa0', false);
    }

    public function test_tool_page_keeps_reserved_ad_slot_without_script_when_unconfigured(): void
    {
        config([
            'site.consent_provider' => 'first_party',
            'site.adsense.client_id' => null,
            'site.adsense.slot' => null,
            'registry.show_drafts' => false,
        ]);

        $this->get('/compress-image')
            ->assertOk()
            ->assertSee('data-ad-slot-host', false)
            ->assertDontSee('adsbygoogle.js', false)
            ->assertSee('Drop an image, paste, or browse', false);
    }
}
