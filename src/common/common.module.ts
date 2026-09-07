import { Module } from '@nestjs/common';

/**
 * Shared cross-cutting utilities (filters, interceptors, pipes) land here
 * in later phases. Kept as a module so both API and worker can import it.
 */
@Module({})
export class CommonModule {}
