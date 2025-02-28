import { ChainId } from '@uniswap/sdk-core'
import { SingleJsonRpcProvider } from './SingleJsonRpcProvider'
import { UniJsonRpcProvider } from './UniJsonRpcProvider'
import Logger from 'bunyan'
import { SUPPORTED_CHAINS } from '@uniswap/smart-order-router'
import {
  DEFAULT_SINGLE_PROVIDER_CONFIG,
  DEFAULT_UNI_PROVIDER_CONFIG,
  SingleJsonRpcProviderConfig,
  UniJsonRpcProviderConfig,
} from './config'

export class GlobalRpcProviders {
  private static readonly PROVIDER_RPC_URL_RANKING: Map<ChainId, number[] | undefined> = new Map([
    [ChainId.AVALANCHE, undefined],
  ])

  private static readonly PROVIDER_RPC_URL_WEIGHTS: Map<ChainId, number[] | undefined> = new Map([
    [ChainId.AVALANCHE, undefined],
  ])

  private static SINGLE_RPC_PROVIDERS: Map<ChainId, SingleJsonRpcProvider[]> | null = null

  private static UNI_RPC_PROVIDERS: Map<ChainId, UniJsonRpcProvider> | null = null

  private static initGlobalSingleRpcProviders(log: Logger, config: SingleJsonRpcProviderConfig) {
    // Only Avalanche is supported for now.
    const infuraAvalancheUrl = process.env[`WEB3_RPC_${ChainId.AVALANCHE.toString()}`]!
    if (infuraAvalancheUrl === undefined) {
      throw new Error(
        `Infura Avalanche URL isn't provided by environment variable WEB3_RPC_${ChainId.AVALANCHE.toString()}`
      )
    }
    GlobalRpcProviders.SINGLE_RPC_PROVIDERS = new Map([
      [
        ChainId.AVALANCHE,
        [new SingleJsonRpcProvider({ name: 'avalanche', chainId: ChainId.AVALANCHE }, infuraAvalancheUrl, log, config)],
      ],
    ])
    return GlobalRpcProviders.SINGLE_RPC_PROVIDERS
  }

  private static initGlobalUniRpcProviders(
    log: Logger,
    uniConfig: UniJsonRpcProviderConfig,
    singleConfig: SingleJsonRpcProviderConfig
  ) {
    if (GlobalRpcProviders.SINGLE_RPC_PROVIDERS === null) {
      GlobalRpcProviders.initGlobalSingleRpcProviders(log, singleConfig)
    }
    const rpcConfigStr = process.env['UNI_RPC_PROVIDER_CONFIG']!
    if (rpcConfigStr === undefined) {
      throw new Error('Environment variable UNI_RPC_PROVIDER_CONFIG is missing!')
    }
    const rpcConfig = JSON.parse(rpcConfigStr)

    GlobalRpcProviders.UNI_RPC_PROVIDERS = new Map()
    for (let chainId of SUPPORTED_CHAINS) {
      if (rpcConfig[chainId.toString()] === 'true') {
        if (!GlobalRpcProviders.SINGLE_RPC_PROVIDERS!.has(chainId)) {
          throw new Error(`No RPC providers configured for chain ${chainId.toString()}`)
        }
        GlobalRpcProviders.UNI_RPC_PROVIDERS.set(
          chainId,
          new UniJsonRpcProvider(
            chainId,
            GlobalRpcProviders.SINGLE_RPC_PROVIDERS!.get(chainId)!,
            log,
            GlobalRpcProviders.PROVIDER_RPC_URL_RANKING.get(chainId),
            GlobalRpcProviders.PROVIDER_RPC_URL_WEIGHTS.get(chainId),
            true,
            uniConfig
          )
        )
      }
    }
    return GlobalRpcProviders.UNI_RPC_PROVIDERS
  }

  static getGlobalSingleRpcProviders(
    log: Logger,
    config: SingleJsonRpcProviderConfig = DEFAULT_SINGLE_PROVIDER_CONFIG
  ): Map<ChainId, SingleJsonRpcProvider[]> {
    if (GlobalRpcProviders.SINGLE_RPC_PROVIDERS === null) {
      GlobalRpcProviders.initGlobalSingleRpcProviders(log, config)
    }
    return GlobalRpcProviders.SINGLE_RPC_PROVIDERS!
  }

  static getGlobalUniRpcProviders(
    log: Logger,
    uniConfig: UniJsonRpcProviderConfig = DEFAULT_UNI_PROVIDER_CONFIG,
    singleConfig: SingleJsonRpcProviderConfig = DEFAULT_SINGLE_PROVIDER_CONFIG
  ): Map<ChainId, UniJsonRpcProvider> {
    if (GlobalRpcProviders.UNI_RPC_PROVIDERS === null) {
      GlobalRpcProviders.initGlobalUniRpcProviders(log, uniConfig, singleConfig)
    }
    return GlobalRpcProviders.UNI_RPC_PROVIDERS!
  }
}
