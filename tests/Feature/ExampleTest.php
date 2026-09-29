<?php

namespace Tests\Feature;

use Tests\TestCase;

class ExampleTest extends TestCase
{
    public function test_the_homepage_returns_a_successful_response_without_a_database(): void
    {
        $this->assertSame('array', config('session.driver'));
        $this->assertSame('array', config('cache.default'));

        $this->get('/')->assertOk();
    }
}
