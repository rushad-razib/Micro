<?php

namespace App\Registry;

final class PresetFrame
{
    public function __construct(
        public readonly string $key,
        public readonly string $label,
        public readonly int $width,
        public readonly int $height,
        public readonly bool $default = false,
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            key: $data['key'],
            label: $data['label'],
            width: (int) $data['width'],
            height: (int) $data['height'],
            default: (bool) ($data['default'] ?? false),
        );
    }

    public function toArray(): array
    {
        return [
            'key' => $this->key,
            'label' => $this->label,
            'width' => $this->width,
            'height' => $this->height,
            'default' => $this->default,
        ];
    }
}
