<?php

namespace App\Registry;

final class RelatedLink
{
    public function __construct(
        public readonly string $href,
        public readonly string $title,
        public readonly string $type,
    ) {}
}
