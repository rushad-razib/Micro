<?php

namespace App\Registry;

final class FaqItem
{
    public function __construct(
        public readonly string $question,
        public readonly string $answer,
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            question: $data['question'],
            answer: $data['answer'],
        );
    }

    public function toArray(): array
    {
        return [
            'question' => $this->question,
            'answer' => $this->answer,
        ];
    }
}
