import { Pool } from 'pg'
import type { AppConfig } from '../config'

export function createPool(config: AppConfig): Pool {
  const opts = config.dbSchema === 'desk' ? { options: '-c search_path=desk,public' } : {}
  return new Pool({ connectionString: config.databaseUrl, ...opts })
}

export function createPoolFromUrl(connectionString: string): Pool {
  return new Pool({ connectionString })
}
