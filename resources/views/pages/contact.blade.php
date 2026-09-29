<x-layouts.article
    :document-title="'Contact — '.$siteName"
    :meta-description="'How to reach the operator of this site.'"
    :canonical="url('/contact')"
>
    <h1 class="type-h1">Contact</h1>
    <p class="mt-3 text-muted">Operated by [Operator name]. Messages are read by a person. Expected reply: a few days.</p>

    <form class="mt-8 max-w-lg space-y-4" method="post" action="{{ url('/contact') }}">
        @csrf
        <div>
            <label for="name" class="type-label">Name</label>
            <input id="name" name="name" type="text" autocomplete="name" class="mt-1 min-h-11 w-full rounded-control border border-line bg-surface px-3 text-ink">
        </div>
        <div>
            <label for="email" class="type-label">Email</label>
            <input id="email" name="email" type="email" autocomplete="email" class="mt-1 min-h-11 w-full rounded-control border border-line bg-surface px-3 text-ink">
        </div>
        <div>
            <label for="message" class="type-label">Message</label>
            <textarea id="message" name="message" rows="6" class="mt-1 w-full rounded-control border border-line bg-surface px-3 py-2 text-ink"></textarea>
        </div>
        <button type="submit" disabled class="min-h-11 rounded-control border border-line bg-stage px-4 text-muted">
            Send (mail is not configured yet)
        </button>
    </form>

    <p class="mt-6 type-label">Until mail is configured, use [contact email].</p>
</x-layouts.article>
