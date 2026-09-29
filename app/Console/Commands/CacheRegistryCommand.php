<?php

namespace App\Console\Commands;

use App\Registry\RegistryException;
use App\Registry\ToolRegistry;
use Illuminate\Console\Command;

class CacheRegistryCommand extends Command
{
    protected $signature = 'registry:cache';

    protected $description = 'Validate the file catalog and write the production registry cache';

    public function handle(ToolRegistry $registry): int
    {
        try {
            $path = $registry->cache();
        } catch (RegistryException $exception) {
            foreach ($exception->errors as $error) {
                $this->error($error);
            }

            return self::FAILURE;
        }

        $this->info('Registry cached at '.$path);

        return self::SUCCESS;
    }
}
