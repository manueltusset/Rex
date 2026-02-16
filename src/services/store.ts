import { load } from "@tauri-apps/plugin-store";

type Store = Awaited<ReturnType<typeof load>>;
let storeInstance: Store | null = null;

async function getStore(): Promise<Store> {
  if (!storeInstance) {
    storeInstance = await load("rex-settings.json", {
      defaults: {},
      autoSave: true,
    });
  }
  return storeInstance;
}

export async function getValue<T>(key: string): Promise<T | null> {
  const store = await getStore();
  return ((await store.get<T>(key)) as T) ?? null;
}

export async function setValue<T>(key: string, value: T): Promise<void> {
  const store = await getStore();
  await store.set(key, value);
}

export async function deleteValue(key: string): Promise<void> {
  const store = await getStore();
  await store.delete(key);
}
