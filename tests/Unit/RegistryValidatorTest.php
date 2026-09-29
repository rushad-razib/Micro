<?php

namespace Tests\Unit;

use App\Registry\RegistryException;
use App\Registry\RegistryValidator;
use PHPUnit\Framework\TestCase;

class RegistryValidatorTest extends TestCase
{
    public function test_it_rejects_a_tool_missing_a_slug(): void
    {
        $validator = new RegistryValidator(['canvas-transform']);

        $this->expectException(RegistryException::class);
        $this->expectExceptionMessage('missing slug');

        $validator->validate(
            [$this->cluster()],
            [$this->tool(['slug' => ''])],
            [],
        );
    }

    public function test_it_rejects_live_server_tools_without_a_cost_note(): void
    {
        $validator = new RegistryValidator(['canvas-transform']);

        try {
            $validator->validate(
                [$this->cluster()],
                [$this->tool([
                    'status' => 'live',
                    'processing' => 'server',
                    'cost_note' => null,
                ])],
                [],
            );
            $this->fail('Expected RegistryException');
        } catch (RegistryException $exception) {
            $matched = false;
            foreach ($exception->errors as $error) {
                if (str_contains($error, 'cost_note')) {
                    $matched = true;
                    break;
                }
            }
            $this->assertTrue($matched, implode("\n", $exception->errors));
        }
    }

    public function test_it_accepts_a_valid_browser_tool(): void
    {
        $validator = new RegistryValidator(['canvas-transform']);

        $validator->validate(
            [$this->cluster()],
            [$this->tool()],
            [],
        );

        $this->addToAssertionCount(1);
    }

    /**
     * @return array<string, mixed>
     */
    private function cluster(): array
    {
        return [
            'id' => 'images',
            'slug' => 'images',
            'title' => 'Image tools',
            'promise' => 'Promise',
            'status' => 'draft',
        ];
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    private function tool(array $overrides = []): array
    {
        return array_merge([
            'id' => 'resize-image',
            'slug' => 'resize-image',
            'cluster' => 'images',
            'status' => 'draft',
            'engine' => 'canvas-transform',
            'processing' => 'browser',
            'title' => 'Resize image',
            'promise' => 'Promise',
            'seo_title' => 'Resize image',
            'seo_description' => 'Description',
            'related' => [],
            'limits' => ['max_bytes' => 26214400, 'max_edge' => 8192],
            'faq' => [
                ['question' => 'Q1', 'answer' => 'A1'],
                ['question' => 'Q2', 'answer' => 'A2'],
                ['question' => 'Q3', 'answer' => 'A3'],
            ],
            'suffix' => 'resized',
        ], $overrides);
    }
}
