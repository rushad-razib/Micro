<?php

namespace App\Registry;

final class Guide
{
    public function __construct(
        public readonly string $slug,
        public readonly string $title,
        public readonly string $seoTitle,
        public readonly string $seoDescription,
        public readonly string $updated,
        public readonly string $status,
        public readonly string $bodyHtml,
        public readonly string $bodyMarkdown,
    ) {}

    public function isLive(): bool
    {
        return $this->status === 'live';
    }

    public static function fromArray(array $data): self
    {
        return new self(
            slug: $data['slug'],
            title: $data['title'],
            seoTitle: $data['seo_title'],
            seoDescription: $data['seo_description'],
            updated: $data['updated'],
            status: $data['status'],
            bodyHtml: $data['body_html'],
            bodyMarkdown: $data['body_markdown'] ?? '',
        );
    }

    public function toArray(): array
    {
        return [
            'slug' => $this->slug,
            'title' => $this->title,
            'seo_title' => $this->seoTitle,
            'seo_description' => $this->seoDescription,
            'updated' => $this->updated,
            'status' => $this->status,
            'body_html' => $this->bodyHtml,
            'body_markdown' => $this->bodyMarkdown,
        ];
    }
}
