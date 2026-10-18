import type {
  Chunk,
  Collection,
  CollectionDetail,
  CollectionVisibility,
  SearchHit,
  Source,
  SourceDetail,
} from "@/types/api";
import { apiRequest } from "./api-client";

export const sourcesApi = {
  listCollections: async () =>
    (await apiRequest<{ collections: Collection[] }>("/collections")).collections,

  createCollection: (input: {
    name: string;
    description?: string;
    visibility: CollectionVisibility;
  }) => apiRequest<Collection>("/collections", { method: "POST", body: input }),

  getCollection: (id: string) => apiRequest<CollectionDetail>(`/collections/${id}`),

  deleteCollection: (id: string) => apiRequest<void>(`/collections/${id}`, { method: "DELETE" }),

  upload: (collectionId: string, file: File) => {
    const form = new FormData();
    form.append("file", file);
    return apiRequest<{ source: Source; duplicate: boolean }>(
      `/collections/${collectionId}/sources`,
      { method: "POST", body: form },
    );
  },

  removeFromCollection: (collectionId: string, sourceId: string) =>
    apiRequest<void>(`/collections/${collectionId}/sources/${sourceId}`, { method: "DELETE" }),

  getSource: (id: string) => apiRequest<SourceDetail>(`/sources/${id}`),

  listChunks: async (id: string, limit = 200) =>
    (await apiRequest<{ chunks: Chunk[] }>(`/sources/${id}/chunks?limit=${limit}`)).chunks,

  search: async (query: string, collectionIds?: string[]) =>
    (
      await apiRequest<{ hits: SearchHit[] }>("/search", {
        method: "POST",
        body: { query, collectionIds },
      })
    ).hits,
};

export function formatPages(start: number | null, end: number | null): string | null {
  if (start === null) return null;
  return end !== null && end !== start ? `pp. ${start}–${end}` : `p. ${start}`;
}

export function formatBytes(bytes: number | null): string {
  if (bytes === null) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
