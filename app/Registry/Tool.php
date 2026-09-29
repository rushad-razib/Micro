<?php

namespace App\Registry;

final class Tool
{
    /**
     * @param  list<FaqItem>  $faq
     * @param  list<string>  $related
     * @param  list<PresetFrame>  $preset
     * @param  array{max_bytes: int, max_edge: int}  $limits
     */
    public function __construct(
        public readonly string $id,
        public readonly string $slug,
        public readonly string $cluster,
        public readonly string $status,
        public readonly string $engine,
        public readonly string $processing,
        public readonly string $title,
        public readonly string $promise,
        public readonly string $seoTitle,
        public readonly string $seoDescription,
        public readonly array $related,
        public readonly array $limits,
        public readonly array $faq,
        public readonly string $suffix,
        public readonly string $guideHtml,
        public readonly string $guideMarkdown,
        public readonly ?string $presetOf = null,
        public readonly array $preset = [],
        public readonly ?string $costNote = null,
    ) {}

    public function isLive(): bool
    {
        return $this->status === 'live';
    }

    public function isPreset(): bool
    {
        return $this->presetOf !== null;
    }

    public function defaultFrame(): ?PresetFrame
    {
        foreach ($this->preset as $frame) {
            if ($frame->default) {
                return $frame;
            }
        }

        return $this->preset[0] ?? null;
    }

    public static function fromArray(array $data): self
    {
        return new self(
            id: $data['id'],
            slug: $data['slug'],
            cluster: $data['cluster'],
            status: $data['status'],
            engine: $data['engine'],
            processing: $data['processing'],
            title: $data['title'],
            promise: $data['promise'],
            seoTitle: $data['seo_title'],
            seoDescription: $data['seo_description'],
            related: $data['related'] ?? [],
            limits: $data['limits'],
            faq: array_map(fn (array $item) => FaqItem::fromArray($item), $data['faq'] ?? []),
            suffix: $data['suffix'],
            guideHtml: $data['guide_html'] ?? '',
            guideMarkdown: $data['guide_markdown'] ?? '',
            presetOf: $data['preset_of'] ?? null,
            preset: array_map(fn (array $item) => PresetFrame::fromArray($item), $data['preset'] ?? []),
            costNote: $data['cost_note'] ?? null,
        );
    }

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'slug' => $this->slug,
            'cluster' => $this->cluster,
            'status' => $this->status,
            'engine' => $this->engine,
            'processing' => $this->processing,
            'title' => $this->title,
            'promise' => $this->promise,
            'seo_title' => $this->seoTitle,
            'seo_description' => $this->seoDescription,
            'related' => $this->related,
            'limits' => $this->limits,
            'faq' => array_map(fn (FaqItem $item) => $item->toArray(), $this->faq),
            'suffix' => $this->suffix,
            'guide_html' => $this->guideHtml,
            'guide_markdown' => $this->guideMarkdown,
            'preset_of' => $this->presetOf,
            'preset' => array_map(fn (PresetFrame $frame) => $frame->toArray(), $this->preset),
            'cost_note' => $this->costNote,
        ];
    }
}
