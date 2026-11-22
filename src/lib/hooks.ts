import { useState, useEffect, useCallback } from "react";
import type {
  Account,
  Instance,
  DownloadProgress,
  GameStatus,
  GameLog,
  CreateInstancePayload,
  UpdateInstancePayload,
} from "./types";
import {
  getActiveAccount,
  setActiveAccount as cmdSetActiveAccount,
  getActiveInstance,
  setActiveInstance as cmdSetActiveInstance,
  getInstances,
  createInstance as cmdCreateInstance,
  updateInstance as cmdUpdateInstance,
  deleteInstance as cmdDeleteInstance,
  launchInstance as cmdLaunchInstance,
  killInstance as cmdKillInstance,
  onDownloadProgress,
  onGameStatus,
  onGameLog,
} from "./commands";

// Default fallback account matching Figma design
const DEFAULT_ACCOUNT: Account = {
  id: "account-astral",
  username: "astral",
  uuid: "069a79f4-44e9-4726-a5be-fca90e38aaf5",
  account_type: "microsoft",
  access_token: "",
  skin_url: "https://textures.minecraft.net/texture/292009a4925b58f02c77d6d330e88d40ec6a66ab0d839649a69dc7974f84ae",
  cape_url: "https://textures.minecraft.net/texture/2340c0e03dd66 default_cape",
  is_active: true,
};

// Default fallback instance matching Figma design
const DEFAULT_INSTANCE: Instance = {
  id: "vanilla-plus",
  name: "VANILLA+",
  minecraft_version: "1.21.11",
  loader_type: "fabric",
  loader_version: "0.16.5",
  mod_count: 32,
  created_at: Date.now(),
  last_played: Date.now() - 3600000,
  is_active: true,
};

/**
 * Hook to manage active Minecraft account
 */
export function useActiveAccount() {
  const [account, setAccount] = useState<Account | null>(DEFAULT_ACCOUNT);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActive = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getActiveAccount();
      if (res) {
        setAccount(res);
      } else {
        // Fallback to default if no account stored yet
        setAccount(DEFAULT_ACCOUNT);
      }
    } catch (err) {
      // In development or when Tauri isn't wired yet, retain default
      setError(err instanceof Error ? err.message : String(err));
      setAccount(DEFAULT_ACCOUNT);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActive();
  }, [fetchActive]);

  const selectAccount = async (accountId: string) => {
    try {
      await cmdSetActiveAccount(accountId);
      await fetchActive();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  return {
    account,
    loading,
    error,
    refresh: fetchActive,
    setActiveAccount: selectAccount,
  };
}

/**
 * Hook to manage active Minecraft instance
 */
export function useActiveInstance() {
  const [instance, setInstance] = useState<Instance | null>(DEFAULT_INSTANCE);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActive = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getActiveInstance();
      if (res) {
        setInstance(res);
      } else {
        setInstance(DEFAULT_INSTANCE);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setInstance(DEFAULT_INSTANCE);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActive();
  }, [fetchActive]);

  const selectInstance = async (id: string) => {
    try {
      await cmdSetActiveInstance(id);
      await fetchActive();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  return {
    instance,
    loading,
    error,
    refresh: fetchActive,
    setActiveInstance: selectInstance,
  };
}

/**
 * Hook to manage instances list with full CRUD operations
 */
export function useInstances() {
  const [instances, setInstances] = useState<Instance[]>([DEFAULT_INSTANCE]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchList = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getInstances();
      if (res && res.length > 0) {
        setInstances(res);
      } else {
        setInstances([DEFAULT_INSTANCE]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setInstances([DEFAULT_INSTANCE]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const create = async (payload: CreateInstancePayload): Promise<Instance | null> => {
    try {
      const created = await cmdCreateInstance(payload);
      setInstances((prev) => [...prev, created]);
      return created;
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      return null;
    }
  };

  const update = async (payload: UpdateInstancePayload): Promise<Instance | null> => {
    try {
      const updated = await cmdUpdateInstance(payload);
      setInstances((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item))
      );
      return updated;
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      return null;
    }
  };

  const remove = async (id: string): Promise<boolean> => {
    try {
      await cmdDeleteInstance(id);
      setInstances((prev) => prev.filter((item) => item.id !== id));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      return false;
    }
  };

  return {
    instances,
    loading,
    error,
    refresh: fetchList,
    create,
    update,
    remove,
  };
}

/**
 * Hook to listen to download progress events
 */
export function useDownloadProgress() {
  const [progress, setProgress] = useState<DownloadProgress | null>(null);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);

  useEffect(() => {
    let unlisten: (() => void) | undefined;

    const setupListener = async () => {
      try {
        unlisten = await onDownloadProgress((data) => {
          setProgress(data);
          if (data.status === "downloading" || data.status === "extracting" || data.status === "verifying") {
            setIsDownloading(true);
          } else {
            setIsDownloading(false);
          }
        });
      } catch (err) {
        console.warn("Could not attach download progress listener:", err);
      }
    };

    setupListener();

    return () => {
      if (unlisten) {
        unlisten();
      }
    };
  }, []);

  return {
    progress,
    isDownloading,
  };
}

/**
 * Hook to monitor game launch and runtime status
 */
export function useLaunchStatus() {
  const [status, setStatus] = useState<GameStatus>({
    instance_id: "",
    state: "idle",
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unlisten: (() => void) | undefined;

    const setupListener = async () => {
      try {
        unlisten = await onGameStatus((newStatus) => {
          setStatus(newStatus);
        });
      } catch (err) {
        console.warn("Could not attach game status listener:", err);
      }
    };

    setupListener();

    return () => {
      if (unlisten) {
        unlisten();
      }
    };
  }, []);

  const launch = async (instanceId: string) => {
    try {
      setError(null);
      setStatus({ instance_id: instanceId, state: "launching" });
      await cmdLaunchInstance(instanceId);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      setStatus({ instance_id: instanceId, state: "crashed", error: msg });
    }
  };

  const kill = async (instanceId: string) => {
    try {
      await cmdKillInstance(instanceId);
      setStatus({ instance_id: instanceId, state: "idle" });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  return {
    status,
    isLaunching: status.state === "launching" || status.state === "downloading",
    isRunning: status.state === "running",
    error,
    launch,
    kill,
  };
}

/**
 * Hook to accumulate real-time game logs
 */
export function useGameLogs(maxLogs: number = 500) {
  const [logs, setLogs] = useState<GameLog[]>([]);

  useEffect(() => {
    let unlisten: (() => void) | undefined;

    const setupListener = async () => {
      try {
        unlisten = await onGameLog((log) => {
          setLogs((prev) => {
            const next = [...prev, log];
            return next.length > maxLogs ? next.slice(next.length - maxLogs) : next;
          });
        });
      } catch (err) {
        console.warn("Could not attach game log listener:", err);
      }
    };

    setupListener();

    return () => {
      if (unlisten) {
        unlisten();
      }
    };
  }, [maxLogs]);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  return {
    logs,
    clearLogs,
  };
}
