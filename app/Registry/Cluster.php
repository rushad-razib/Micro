<?php

namespace App\Registry;

final class Cluster
{
    public function __construct(
        public readonly string $id,
        public readonly string $slug,
        public readonly string $title,
        public readonly string $promise,
        public readonly string $status,
    ) {}

    public function isLive(): bool
    {
        return $this->status === 'live';
    }

    public static function fromArray(array $data): self
    {
        return new self(
            id: $data['id'],
            slug: $data['slug'],
            title: $data['title'],
            promise: $data['promise'],
            status: $data['status'],
        );
    }

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'slug' => $this->slug,
            'title' => $this->title,
            'promise' => $this->promise,
            'status' => $this->status,
        ];
    }
}
