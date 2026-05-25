import { keystoneAdapter } from './keystone'
import { turn14Adapter } from './turn14'
import { meyerAdapter } from './meyer'
import type { SupplierAdapter } from './types'

const adapters: Record<string, SupplierAdapter> = {
  keystone: keystoneAdapter,
  turn14: turn14Adapter,
  meyer: meyerAdapter,
}

export function getAdapter(adapterKey: string): SupplierAdapter {
  const adapter = adapters[adapterKey]
  if (!adapter) throw new Error(`No supplier adapter found for key: ${adapterKey}`)
  return adapter
}

export type { SupplierAdapter, CatalogItem, SupplierOrderPayload } from './types'
