import api from "./api";

export const IMPORT_SOURCES = {
  dummyjson: { label: "DummyJSON", skuPrefix: "DUMMY-" },
  fakestore: { label: "Fake Store", skuPrefix: "FS-" },
  openapi: { label: "OpenAPI Data", skuPrefix: "OPENAPI-" },
};

const fakeStoreShape = (item) => ({
  title: item.title,
  description: item.description,
  category: item.category,
  price: item.price,
  stock: 50,
  image: item.image,
});

// Each API returns a different shape, so map them all to one shape for the UI.
// Keep these defaults in sync with productImportController.js on the backend.
const normalizers = {
  dummyjson: (item) => ({
    title: item.title,
    description: item.description,
    category: item.category,
    price: item.price,
    stock: Number.isSafeInteger(item.stock) && item.stock >= 0 ? item.stock : 50,
    image: item.thumbnail || item.images?.[0],
  }),
  // Fake Store and OpenAPI Data share the same shape and don't supply stock (backend saves 50).
  fakestore: (item) => fakeStoreShape(item),
  openapi: (item) => fakeStoreShape(item),
};

const normalize = (source, item) => ({
  id: item.id,
  sku: `${IMPORT_SOURCES[source].skuPrefix}${item.id}`,
  ...normalizers[source](item),
});

// GET /api/admin/import/:source → { success, count, products }
export const previewExternalProducts = async (source) => {
  const { data } = await api.get(`/admin/import/${source}`);
  return (data.products ?? []).map((item) => normalize(source, item));
};

// POST /api/admin/import → { success, message, importedCount, skippedCount, imported, skipped }
export const importProducts = async (source, productIds) => {
  const { data } = await api.post("/admin/import", { source, productIds });
  return data;
};
