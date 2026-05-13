import { useSettingsStore } from '../store/useSettingsStore';
import { useSalesStore } from '../store/useSalesStore';
import { useExpenseStore } from '../store/useExpenseStore';
import { useInventoryStore } from '../store/useInventoryStore';
import { useNotificationStore } from '../store/useNotificationStore';

export async function rehydrateScopedStores() {
  const stores = [useSettingsStore, useSalesStore, useExpenseStore, useInventoryStore, useNotificationStore];

  await Promise.all(
    stores.map((store) => {
      const persistApi = (store as any).persist;
      if (persistApi?.rehydrate) {
        return persistApi.rehydrate();
      }
      return Promise.resolve();
    })
  );
}