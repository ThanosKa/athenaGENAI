import { test as base } from "@playwright/test";
import { storageService } from "@/lib/services/storage";

export const test = base.extend<{
  cleanStorage: void;
}>({
  cleanStorage: [
    async ({}, use) => {
      storageService.clear();
      await use();
      storageService.clear();
    },
    { auto: true },
  ],
});

export { expect } from "@playwright/test";
