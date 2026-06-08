import { atom } from "jotai";
import { atomWithStorage, createJSONStorage } from "jotai/utils";

export const balanceAtom = atom<number>(0);
export const isBalanceLoadingAtom = atom<boolean>(true);
export const userAtom = atom<any>(null);
export const isUserLoadingAtom = atom<boolean>(true);


const memoryStorage: Storage = {
  length: 0,
  clear: () => undefined,
  getItem: () => null,
  key: () => null,
  removeItem: () => undefined,
  setItem: () => undefined,
};

const getStorage = () => {
  if (typeof window === "undefined") {
    return memoryStorage;
  }

  return window.localStorage;
};

const temporaryDeviceIdStorage = createJSONStorage<string>(getStorage);

export const temporaryDeviceIdAtom = atomWithStorage(
  "temporaryDeviceId",
  "",
  temporaryDeviceIdStorage,
  { getOnInit: true }
);
