<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureCanonicalHost
{
    /**
     * @param  Closure(Request): Response  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (app()->isProduction()) {
            $redirect = $this->canonicalRedirect($request);

            if ($redirect !== null) {
                return $redirect;
            }
        }

        return $this->redirectTrailingSlash($request, $next);
    }

    private function canonicalRedirect(Request $request): ?Response
    {
        $appUrl = config('app.url');

        if (! is_string($appUrl) || $appUrl === '') {
            return null;
        }

        $canonical = parse_url($appUrl);

        if (! isset($canonical['host'])) {
            return null;
        }

        $canonicalHost = strtolower($canonical['host']);
        $canonicalScheme = $canonical['scheme'] ?? 'https';
        $requestHost = strtolower($request->getHost());
        $requestScheme = $request->getScheme();

        if ($requestHost === $canonicalHost && $requestScheme === $canonicalScheme) {
            return null;
        }

        $path = $request->getPathInfo();
        $query = $request->getQueryString();

        if ($path !== '/' && str_ends_with($path, '/')) {
            $path = rtrim($path, '/');
        }

        $target = rtrim($appUrl, '/').($path === '/' ? '/' : $path);

        if ($query !== null && $query !== '') {
            $target .= '?'.$query;
        }

        return redirect()->away($target, 301);
    }

    /**
     * @param  Closure(Request): Response  $next
     */
    private function redirectTrailingSlash(Request $request, Closure $next): Response
    {
        $uri = $request->getRequestUri();
        $path = parse_url($uri, PHP_URL_PATH) ?? '/';

        if ($path !== '/' && str_ends_with($path, '/')) {
            $target = rtrim($path, '/');
            $query = $request->getQueryString();

            if ($query !== null && $query !== '') {
                $target .= '?'.$query;
            }

            return redirect()->to($target, 301);
        }

        return $next($request);
    }
}
