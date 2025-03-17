import {
  ChainMap,
  ChainMetadata,
  MultiProtocolProvider,
  WarpCore,
  WarpCoreConfig,
} from '@hyperlane-xyz/sdk';
import { objFilter } from '@hyperlane-xyz/utils';

import { IRegistry, GithubRegistry } from '@hyperlane-xyz/registry';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { assembleWarpCoreConfig } from './warp-core/warpCoreConfig';
import { assembleChainMetadata } from './chains/metadata';
import { config } from '@/constants/config';

export interface AppState {
  // Chains and providers
  chainMetadata: ChainMap<ChainMetadata>;
  // Overrides to chain metadata set by user via the chain picker
  chainMetadataOverrides: ChainMap<Partial<ChainMetadata>>;
  setChainMetadataOverrides: (
    overrides?: ChainMap<Partial<ChainMetadata> | undefined>
  ) => void;
  // Overrides to warp core configs added by user
  warpCoreConfigOverrides: WarpCoreConfig[];
  setWarpCoreConfigOverrides: (
    overrides?: WarpCoreConfig[] | undefined
  ) => void;
  multiProvider: MultiProtocolProvider;
  registry: IRegistry;
  warpCore: WarpCore;
  setWarpContext: (context: {
    registry: IRegistry;
    chainMetadata: ChainMap<ChainMetadata>;
    multiProvider: MultiProtocolProvider;
    warpCore: WarpCore;
  }) => void;
}

export const useStore = create<AppState>()(
  persist(
    // Store reducers
    (set, get) => ({
      // Chains and providers
      chainMetadata: {},
      chainMetadataOverrides: {},
      setChainMetadataOverrides: async (
        overrides: ChainMap<Partial<ChainMetadata> | undefined> = {}
      ) => {
        const { multiProvider, warpCore } = await initWarpContext({
          ...get(),
          chainMetadataOverrides: overrides,
        });
        const filtered = objFilter(overrides, (_, metadata) => !!metadata);
        set({ chainMetadataOverrides: filtered, multiProvider, warpCore });
      },
      warpCoreConfigOverrides: [],
      setWarpCoreConfigOverrides: async (
        overrides: WarpCoreConfig[] | undefined = []
      ) => {
        console.debug('Setting warp core config overrides in store');
        const { multiProvider, warpCore } = await initWarpContext({
          ...get(),
          warpCoreConfigOverrides: overrides,
        });
        set({ warpCoreConfigOverrides: overrides, multiProvider, warpCore });
      },
      multiProvider: new MultiProtocolProvider({}),
      registry: new GithubRegistry({
        uri: config.registryUrl,
        branch: config.registryBranch,
        proxyUrl: config.registryProxyUrl,
      }),
      warpCore: new WarpCore(new MultiProtocolProvider({}), []),
      setWarpContext: ({
        registry,
        chainMetadata,
        multiProvider,
        warpCore,
      }) => {
        console.debug('Setting warp context in store');
        set({ registry, chainMetadata, multiProvider, warpCore });
      },
    }),
    // Store config
    {
      name: 'app-state', // name in storage
      partialize: (state) => ({
        // fields to persist
        chainMetadataOverrides: state.chainMetadataOverrides,
      }),
      version: 2,
      onRehydrateStorage: () => {
        console.debug('Rehydrating state');
        return (state, error) => {
          if (error || !state) {
            console.error('Error during hydration', error);
            return;
          }
          initWarpContext(state).then(
            ({ registry, chainMetadata, multiProvider, warpCore }) => {
              state.setWarpContext({
                registry,
                chainMetadata,
                multiProvider,
                warpCore,
              });
              console.debug('Rehydration complete');
            }
          );
        };
      },
    }
  )
);


async function initWarpContext({
  registry,
  chainMetadataOverrides,
  warpCoreConfigOverrides,
}: {
  registry: IRegistry;
  chainMetadataOverrides: ChainMap<Partial<ChainMetadata> | undefined>;
  warpCoreConfigOverrides: WarpCoreConfig[];
}) {
  try {
    const coreConfig = await assembleWarpCoreConfig(warpCoreConfigOverrides);
    const chainsInTokens = Array.from(new Set(coreConfig.tokens.map((t) => t.chainName)));
    // Pre-load registry content to avoid repeated requests
    await registry.listRegistryContent();
    const { chainMetadata, chainMetadataWithOverrides } = await assembleChainMetadata(
      chainsInTokens,
      registry,
      chainMetadataOverrides,
    );
    const multiProvider = new MultiProtocolProvider(chainMetadataWithOverrides);
    const warpCore = WarpCore.FromConfig(multiProvider, coreConfig);
    return { registry, chainMetadata, multiProvider, warpCore };
  } catch (error) {
    console.error('Error initializing warp context. Please check connection status and configs.');
    console.error('Error initializing warp context', error);
    return {
      registry,
      chainMetadata: {},
      multiProvider: new MultiProtocolProvider({}),
      warpCore: new WarpCore(new MultiProtocolProvider({}), []),
    };
  }
}
