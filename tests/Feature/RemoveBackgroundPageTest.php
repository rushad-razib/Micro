<?php

namespace Tests\Feature;

use Tests\TestCase;

class RemoveBackgroundPageTest extends TestCase
{
    public function test_remove_background_page_renders_the_browser_tool(): void
    {
        config(['registry.show_drafts' => false]);

        $this->get('/remove-background')
            ->assertOk()
            ->assertViewIs('pages.tool')
            ->assertSee('data-engine="background-remove"', false)
            ->assertSee('data-tool="remove-background"', false)
            ->assertSee('Stays on this device.', false)
            ->assertSee('Save and make another area transparent', false)
            ->assertDontSee('Tolerance', false)
            ->assertSee('Images you open are processed in your browser. We do not upload them, and we do not keep a copy.', false);
    }
}
