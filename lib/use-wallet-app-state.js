import { useMemo } from "react";
import {
  mapLiveActivityToFeedItem,
  mergeActivityFeedItems,
  useLocalActivityHistory
} from "./local-activity";
import { useArcWalletActivity } from "./use-arc-wallet-activity";
import { useArcWalletSnapshot } from "./use-arc-wallet-snapshot";

export function useWalletAppState() {
  const walletSnapshot = useArcWalletSnapshot();
  const liveActivityState = useArcWalletActivity(walletSnapshot.address);
  const localActivityState = useLocalActivityHistory(walletSnapshot.address);

  const mergedActivity = useMemo(
    () =>
      mergeActivityFeedItems(
        localActivityState.items,
        liveActivityState.activity.map(mapLiveActivityToFeedItem)
      ),
    [liveActivityState.activity, localActivityState.items]
  );

  return {
    walletSnapshot,
    liveActivity: liveActivityState.activity,
    liveActivityStatus: liveActivityState.status,
    liveActivityError: liveActivityState.error,
    localActivity: localActivityState.items,
    saveLocalActivity: localActivityState.save,
    refreshLocalActivity: localActivityState.refresh,
    mergedActivity
  };
}
