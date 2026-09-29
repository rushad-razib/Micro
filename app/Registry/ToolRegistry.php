<?php

namespace App\Registry;

use Illuminate\Support\Collection;
use Illuminate\Support\Str;

final class ToolRegistry
{
    /** @var Collection<int, Cluster> */
    private Collection $clusters;

    /** @var Collection<int, Tool> */
    private Collection $tools;

    /** @var Collection<int, Guide> */
    private Collection $guides;

    private bool $loaded = false;

    public function __construct(
        private readonly MarkdownRenderer $markdown,
        private readonly RegistryValidator $validator,
    ) {
        $this->clusters = collect();
        $this->tools = collect();
        $this->guides = collect();
    }

    public function showDrafts(): bool
    {
        return (bool) config('registry.show_drafts');
    }

    /**
     * @return Collection<int, Cluster>
     */
    public function clusters(): Collection
    {
        $this->ensureLoaded();

        return $this->clusters;
    }

    /**
     * @return Collection<int, Tool>
     */
    public function tools(): Collection
    {
        $this->ensureLoaded();

        return $this->tools;
    }

    /**
     * @return Collection<int, Guide>
     */
    public function guides(): Collection
    {
        $this->ensureLoaded();

        return $this->guides;
    }

    public function clusterBySlug(string $slug): ?Cluster
    {
        return $this->clusters()->first(fn (Cluster $cluster) => $cluster->slug === $slug);
    }

    public function toolBySlug(string $slug): ?Tool
    {
        return $this->tools()->first(fn (Tool $tool) => $tool->slug === $slug);
    }

    public function toolById(string $id): ?Tool
    {
        return $this->tools()->first(fn (Tool $tool) => $tool->id === $id);
    }

    public function guideBySlug(string $slug): ?Guide
    {
        return $this->guides()->first(fn (Guide $guide) => $guide->slug === $slug);
    }

    public function isVisibleCluster(Cluster $cluster): bool
    {
        return $cluster->isLive() || $this->showDrafts();
    }

    public function isVisibleTool(Tool $tool): bool
    {
        return $tool->isLive() || $this->showDrafts();
    }

    public function isVisibleGuide(Guide $guide): bool
    {
        return $guide->isLive() || $this->showDrafts();
    }

    /**
     * @return Collection<int, Cluster>
     */
    public function headerClusters(): Collection
    {
        return $this->clusters()
            ->filter(fn (Cluster $cluster) => $cluster->isLive())
            ->filter(fn (Cluster $cluster) => $this->liveToolsIn($cluster->id)->isNotEmpty());
    }

    /**
     * @return Collection<int, Tool>
     */
    public function liveTools(): Collection
    {
        return $this->tools()->filter(fn (Tool $tool) => $tool->isLive());
    }

    /**
     * @return Collection<int, Tool>
     */
    public function liveToolsIn(string $clusterId): Collection
    {
        return $this->liveTools()->filter(fn (Tool $tool) => $tool->cluster === $clusterId);
    }

    /**
     * Tools listed on a hub or homepage: live, or drafts when previews are on.
     *
     * @return Collection<int, Tool>
     */
    public function listedToolsIn(string $clusterId): Collection
    {
        return $this->tools()
            ->filter(fn (Tool $tool) => $tool->cluster === $clusterId)
            ->filter(fn (Tool $tool) => $this->isVisibleTool($tool));
    }

    /**
     * @return Collection<int, Guide>
     */
    public function listedGuides(): Collection
    {
        return $this->guides()->filter(fn (Guide $guide) => $this->isVisibleGuide($guide));
    }

    /**
     * Footer and sitemap use live records only.
     *
     * @return Collection<string, Collection<int, Tool>>
     */
    public function liveToolsByCluster(): Collection
    {
        return $this->liveTools()->groupBy(fn (Tool $tool) => $tool->cluster);
    }

    /**
     * @return list<RelatedLink>
     */
    public function relatedLinks(Tool $tool): array
    {
        $links = [];

        foreach ($tool->related as $key) {
            $relatedTool = $this->toolById($key);
            if ($relatedTool && $this->isVisibleTool($relatedTool)) {
                $links[] = new RelatedLink('/'.$relatedTool->slug, $relatedTool->title, 'tool');

                continue;
            }

            $guide = $this->guideBySlug($key);
            if ($guide && $this->isVisibleGuide($guide)) {
                $links[] = new RelatedLink('/guides/'.$guide->slug, $guide->title, 'guide');
            }
        }

        return $links;
    }

    /**
     * @return list<string>
     */
    public function sitemapPaths(): array
    {
        $paths = ['/'];

        foreach (config('registry.policy_paths') as $path) {
            $paths[] = '/'.$path;
        }

        foreach ($this->clusters() as $cluster) {
            if ($cluster->isLive() && $this->liveToolsIn($cluster->id)->isNotEmpty()) {
                $paths[] = '/'.$cluster->slug;
            }
        }

        foreach ($this->liveTools() as $tool) {
            $paths[] = '/'.$tool->slug;
        }

        foreach ($this->guides() as $guide) {
            if ($guide->isLive()) {
                $paths[] = '/guides/'.$guide->slug;
            }
        }

        return array_values(array_unique($paths));
    }

    /**
     * Scan files, validate, and write the production cache.
     */
    public function cache(): string
    {
        $payload = $this->scanFiles();
        $this->validator->validate($payload['clusters'], $payload['tools'], $payload['guides']);

        $path = config('registry.cache_path');
        $export = "<?php\n\nreturn ".var_export($payload, true).";\n";
        file_put_contents($path, $export);

        $this->hydrate($payload);
        $this->loaded = true;

        return $path;
    }

    /**
     * Scan and validate without writing the cache.
     */
    public function validateFromDisk(): void
    {
        $payload = $this->scanFiles();
        $this->validator->validate($payload['clusters'], $payload['tools'], $payload['guides']);
        $this->hydrate($payload);
        $this->loaded = true;
    }

    public function reload(): void
    {
        $this->loaded = false;
        $this->ensureLoaded();
    }

    private function ensureLoaded(): void
    {
        if ($this->loaded) {
            return;
        }

        $cachePath = config('registry.cache_path');
        $useCache = app()->environment('production') && is_file($cachePath);

        $payload = $useCache
            ? require $cachePath
            : $this->scanFiles();

        $this->validator->validate($payload['clusters'], $payload['tools'], $payload['guides']);
        $this->hydrate($payload);
        $this->loaded = true;
    }

    /**
     * @return array{clusters: list<array<string, mixed>>, tools: list<array<string, mixed>>, guides: list<array<string, mixed>>}
     */
    private function scanFiles(): array
    {
        $root = config('registry.path');

        $clusters = [];
        foreach (glob($root.'/clusters/*.php') ?: [] as $file) {
            $clusters[] = require $file;
        }

        $tools = [];
        foreach (glob($root.'/tools/*/tool.php') ?: [] as $file) {
            $directory = basename(dirname($file));
            $record = require $file;
            $record['id'] = $record['id'] ?? $directory;

            $guidePath = dirname($file).'/guide.md';
            $markdown = is_file($guidePath) ? file_get_contents($guidePath) : '';
            $record['guide_markdown'] = $markdown === false ? '' : $markdown;
            $record['guide_html'] = $this->markdown->render($record['guide_markdown']);

            $tools[] = $record;
        }

        $guides = [];
        foreach (glob($root.'/guides/*.md') ?: [] as $file) {
            $guides[] = $this->parseGuideFile($file);
        }

        return compact('clusters', 'tools', 'guides');
    }

    /**
     * @return array<string, mixed>
     */
    private function parseGuideFile(string $path): array
    {
        $raw = file_get_contents($path);
        if ($raw === false) {
            $raw = '';
        }

        $slug = basename($path, '.md');
        $front = [
            'title' => Str::headline($slug),
            'seo_title' => Str::headline($slug),
            'seo_description' => '',
            'updated' => '',
            'status' => 'draft',
        ];
        $body = $raw;

        if (preg_match('/^---\r?\n(.*?)\r?\n---\r?\n(.*)$/s', $raw, $matches)) {
            $front = array_merge($front, $this->parseFrontMatter($matches[1]));
            $body = $matches[2];
        }

        return [
            'slug' => $slug,
            'title' => $front['title'],
            'seo_title' => $front['seo_title'],
            'seo_description' => $front['seo_description'],
            'updated' => $front['updated'],
            'status' => $front['status'],
            'body_markdown' => $body,
            'body_html' => $this->markdown->render($body),
        ];
    }

    /**
     * @return array<string, string>
     */
    private function parseFrontMatter(string $yaml): array
    {
        $data = [];

        foreach (preg_split('/\r?\n/', $yaml) as $line) {
            if (! str_contains($line, ':')) {
                continue;
            }

            [$key, $value] = explode(':', $line, 2);
            $data[trim($key)] = trim($value, " \t\"'");
        }

        return $data;
    }

    /**
     * @param  array{clusters: list<array<string, mixed>>, tools: list<array<string, mixed>>, guides: list<array<string, mixed>>}  $payload
     */
    private function hydrate(array $payload): void
    {
        $this->clusters = collect($payload['clusters'])->map(fn (array $row) => Cluster::fromArray($row))->values();
        $this->tools = collect($payload['tools'])->map(fn (array $row) => Tool::fromArray($row))->values();
        $this->guides = collect($payload['guides'])->map(fn (array $row) => Guide::fromArray($row))->values();
    }
}
