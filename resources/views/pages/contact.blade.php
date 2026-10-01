@php
    $operator = config('site.operator_name');
    $email = config('site.contact_email');
@endphp

<x-layouts.article
    :document-title="'Contact — '.$siteName"
    :meta-description="'How to reach the operator of this site.'"
    :canonical="url('/contact')"
>
    <h1 class="type-h1">Contact</h1>
    <p class="mt-3 text-muted">Operated by {{ $operator }}. Messages are read by a person. Expected reply: a few days.</p>

    @if (session('status'))
        <p class="mt-6 rounded-control border border-line bg-stage px-4 py-3 text-ink" role="status">{{ session('status') }}</p>
    @endif

    <form class="mt-8 max-w-lg space-y-4" method="post" action="{{ url('/contact') }}">
        @csrf
        <div>
            <label for="name" class="type-label">Name</label>
            <input id="name" name="name" type="text" autocomplete="name" required value="{{ old('name') }}" class="mt-1 min-h-11 w-full rounded-control border border-line bg-surface px-3 text-ink">
            @error('name')
                <p class="mt-1 text-sm text-ink">{{ $message }}</p>
            @enderror
        </div>
        <div>
            <label for="email" class="type-label">Email</label>
            <input id="email" name="email" type="email" autocomplete="email" required value="{{ old('email') }}" class="mt-1 min-h-11 w-full rounded-control border border-line bg-surface px-3 text-ink">
            @error('email')
                <p class="mt-1 text-sm text-ink">{{ $message }}</p>
            @enderror
        </div>
        <div>
            <label for="message" class="type-label">Message</label>
            <textarea id="message" name="message" rows="6" required class="mt-1 w-full rounded-control border border-line bg-surface px-3 py-2 text-ink">{{ old('message') }}</textarea>
            @error('message')
                <p class="mt-1 text-sm text-ink">{{ $message }}</p>
            @enderror
        </div>
        <button type="submit" class="min-h-11 rounded-control bg-accent px-4 text-on-accent">
            Send message
        </button>
    </form>

    <p class="mt-6 type-label">You can also write to <a href="mailto:{{ $email }}">{{ $email }}</a>.</p>
</x-layouts.article>
