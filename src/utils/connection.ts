import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { clusterApiUrl, Connection } from '@solana/web3.js';

const API = clusterApiUrl(WalletAdapterNetwork.Mainnet);
/** getRandomItemFromArray(SOLANA_RPC) as string */

export const getConnection = () =>
  new Connection(
    // API
    'https://rpc.particle.network/solana?chainId=101&projectUuid=47946105-f041-47ed-8722-970d386354ce&projectKey=cB9tbtoKP0Kb5KpMVvA8QAC7JHm8YkCZ5KCSXKzp'
    // 'https://solana-devnet.g.alchemy.com/v2/56zZxnmWT9Pn7SiSOcDs67XrWOI18ckk'
    // 'https://solana-devnet.g.alchemy.com/v2/JuMm5xmqPwD0NfGYDkBUnJ_8fXdx2ZUR'
  );

export const getSolanaTestnetConnection = () => new Connection('https://api-v2.solscan.io/v2/rpc-public/testnet');

export const getSonicConnection = () => new Connection('https://api.mainnet-alpha.sonic.game');
export const getSonicSVMTestnetConnection = () => new Connection('https://api.testnet.sonic.game');