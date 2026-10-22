import "server-only";

import { readSnapshot, removeAssets, uploadAsset, writeSnapshot } from "./blob";
import { fetchBody, fetchPage } from "./notion";
import { uuid } from "./model";
import type { SyncPorts } from "./sync";

export function publishingPorts(): SyncPorts {
  const dataSourceId = process.env.NOTION_DATA_SOURCE_ID;
  if (!dataSourceId) throw new Error("Notion data source is not configured.");
  return {
    dataSourceId: uuid.parse(dataSourceId),
    read: readSnapshot,
    write: writeSnapshot,
    page: fetchPage,
    body: (id) => fetchBody(id, uploadAsset),
    removeAssets,
  };
}
