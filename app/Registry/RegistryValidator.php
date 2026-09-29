<?php

namespace App\Registry;

final class RegistryValidator
{
    /**
     * @param  list<string>  $engines
     */
    public function __construct(private readonly array $engines) {}

    /**
     * @param  list<array<string, mixed>>  $clusters
     * @param  list<array<string, mixed>>  $tools
     * @param  list<array<string, mixed>>  $guides
     *
     * @throws RegistryException
     */
    public function validate(array $clusters, array $tools, array $guides): void
    {
        $errors = [];

        $clusterIds = [];
        $clusterSlugs = [];

        foreach ($clusters as $cluster) {
            foreach (['id', 'slug', 'title', 'promise', 'status'] as $field) {
                if (! isset($cluster[$field]) || $cluster[$field] === '') {
                    $errors[] = 'Cluster is missing '.$field.'.';
                }
            }

            if (isset($cluster['status']) && ! in_array($cluster['status'], ['draft', 'live'], true)) {
                $errors[] = 'Cluster '.$this->label($cluster, 'id').' has invalid status.';
            }

            if (isset($cluster['id'])) {
                if (isset($clusterIds[$cluster['id']])) {
                    $errors[] = 'Duplicate cluster id '.$cluster['id'].'.';
                }
                $clusterIds[$cluster['id']] = true;
            }

            if (isset($cluster['slug'])) {
                if (isset($clusterSlugs[$cluster['slug']])) {
                    $errors[] = 'Duplicate cluster slug '.$cluster['slug'].'.';
                }
                $clusterSlugs[$cluster['slug']] = true;
            }
        }

        $toolIds = [];
        $toolSlugs = [];
        $guideSlugs = [];

        foreach ($guides as $guide) {
            foreach (['slug', 'title', 'seo_title', 'seo_description', 'updated', 'status'] as $field) {
                if (! isset($guide[$field]) || $guide[$field] === '') {
                    $errors[] = 'Guide is missing '.$field.'.';
                }
            }

            if (isset($guide['status']) && ! in_array($guide['status'], ['draft', 'live'], true)) {
                $errors[] = 'Guide '.$this->label($guide, 'slug').' has invalid status.';
            }

            if (isset($guide['slug'])) {
                if (isset($guideSlugs[$guide['slug']])) {
                    $errors[] = 'Duplicate guide slug '.$guide['slug'].'.';
                }
                $guideSlugs[$guide['slug']] = true;
            }
        }

        foreach ($tools as $tool) {
            $label = $this->label($tool, 'id');

            foreach ([
                'id', 'slug', 'cluster', 'status', 'engine', 'processing',
                'title', 'promise', 'seo_title', 'seo_description',
                'related', 'limits', 'faq', 'suffix',
            ] as $field) {
                if (! array_key_exists($field, $tool) || $tool[$field] === null || $tool[$field] === '') {
                    $errors[] = "Tool {$label} is missing {$field}.";
                }
            }

            if (isset($tool['id'])) {
                if (isset($toolIds[$tool['id']])) {
                    $errors[] = 'Duplicate tool id '.$tool['id'].'.';
                }
                $toolIds[$tool['id']] = true;
            }

            if (isset($tool['slug'])) {
                if (isset($toolSlugs[$tool['slug']])) {
                    $errors[] = 'Duplicate tool slug '.$tool['slug'].'.';
                }
                $toolSlugs[$tool['slug']] = true;
            }

            if (isset($tool['status']) && ! in_array($tool['status'], ['draft', 'live'], true)) {
                $errors[] = "Tool {$label} has invalid status.";
            }

            if (isset($tool['processing']) && ! in_array($tool['processing'], ['browser', 'server'], true)) {
                $errors[] = "Tool {$label} has invalid processing.";
            }

            if (isset($tool['engine']) && ! in_array($tool['engine'], $this->engines, true)) {
                $errors[] = "Tool {$label} has unknown engine {$tool['engine']}.";
            }

            if (isset($tool['cluster']) && $tool['cluster'] !== '' && ! isset($clusterIds[$tool['cluster']])) {
                $errors[] = "Tool {$label} references missing cluster {$tool['cluster']}.";
            }

            if (($tool['processing'] ?? null) === 'server' && ($tool['status'] ?? null) === 'live') {
                if (empty($tool['cost_note'])) {
                    $errors[] = "Tool {$label} is live with processing=server and has no cost_note.";
                }
            }

            $limits = $tool['limits'] ?? null;
            if (! is_array($limits) || ! isset($limits['max_bytes'], $limits['max_edge'])) {
                $errors[] = "Tool {$label} limits must include max_bytes and max_edge.";
            }

            $faq = $tool['faq'] ?? [];
            if (! is_array($faq) || count($faq) < 3) {
                $errors[] = "Tool {$label} needs at least three FAQ items.";
            }

            if (isset($tool['preset_of']) && $tool['preset_of'] !== null && $tool['preset_of'] !== '') {
                if (! is_array($tool['preset'] ?? null) || $tool['preset'] === []) {
                    $errors[] = "Tool {$label} is a preset and needs a preset frame list.";
                }
            }
        }

        foreach ($tools as $tool) {
            $label = $this->label($tool, 'id');

            if (isset($tool['preset_of']) && $tool['preset_of'] !== null && $tool['preset_of'] !== '') {
                if (! isset($toolIds[$tool['preset_of']])) {
                    $errors[] = "Tool {$label} preset_of {$tool['preset_of']} does not exist.";
                }
            }

            foreach ($tool['related'] ?? [] as $related) {
                if (! is_string($related) || $related === '') {
                    $errors[] = "Tool {$label} has an invalid related entry.";

                    continue;
                }

                if (! isset($toolIds[$related]) && ! isset($guideSlugs[$related])) {
                    $errors[] = "Tool {$label} related entry {$related} is not a tool id or guide slug.";
                }
            }
        }

        foreach ($toolSlugs as $slug => $_) {
            if (isset($clusterSlugs[$slug])) {
                $errors[] = "Slug {$slug} is used by both a cluster and a tool.";
            }
        }

        if ($errors !== []) {
            throw new RegistryException($errors);
        }
    }

    /**
     * @param  array<string, mixed>  $record
     */
    private function label(array $record, string $key): string
    {
        return isset($record[$key]) && is_string($record[$key]) && $record[$key] !== ''
            ? $record[$key]
            : '(unknown)';
    }
}
