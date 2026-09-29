<?php

namespace App\Console\Commands;

use App\Registry\RegistryException;
use App\Registry\ToolRegistry;
use Illuminate\Console\Command;

class ValidateRegistryCommand extends Command
{
    protected $signature = 'registry:validate';

    protected $description = 'Validate the file catalog and fail if a record is broken';

    public function handle(ToolRegistry $registry): int
    {
        try {
            $registry->validateFromDisk();
        } catch (RegistryException $exception) {
            foreach ($exception->errors as $error) {
                $this->error($error);
            }

            return self::FAILURE;
        }

        $this->info('Registry is valid.');

        return self::SUCCESS;
    }
}
