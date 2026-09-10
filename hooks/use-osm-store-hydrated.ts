"use client"

import { useOsmStore } from "@/stores/osm-store"
import { useSyncExternalStore } from "react"

function subscribeToPersistHydration(onStoreChange: () => void) {
  const unsubscribeHydrate = useOsmStore.persist.onHydrate(onStoreChange)
  const unsubscribeFinishHydration =
    useOsmStore.persist.onFinishHydration(onStoreChange)

  return () => {
    unsubscribeHydrate()
    unsubscribeFinishHydration()
  }
}

function getClientHydrationSnapshot() {
  return useOsmStore.persist.hasHydrated()
}

function getServerHydrationSnapshot() {
  return false
}

export function useOsmStoreHydrated() {
  return useSyncExternalStore(
    subscribeToPersistHydration,
    getClientHydrationSnapshot,
    getServerHydrationSnapshot
  )
}
