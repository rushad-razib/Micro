<?php

namespace Tests\Feature;

use Tests\TestCase;

class RegistryCommandTest extends TestCase
{
    public function test_registry_validate_passes_for_the_catalog(): void
    {
        $this->artisan('registry:validate')->assertSuccessful();
    }
}
