import { PROGRAM_ID, SOLANA_NATIVE_ADDRESS } from '@/constants/contract';
import { IDL_JSON } from '@/constants/idl';
import { AnchorProvider, Program, setProvider, Wallet } from '@coral-xyz/anchor';
import {
  Connection,
  PublicKey
} from '@solana/web3.js';

import { Idl } from '@/types/contract';
import BigNumber from 'bignumber.js';
import { getSonicSVMTestnetConnection } from './connection';

export async function getOwnerSplTokenAmount(
  connection: Connection,
  owner: string,
  tokenAddress: string
): Promise<string> {
  try {
    const { value: tokenAccounts } = await connection.getTokenAccountsByOwner(
      new PublicKey(owner),
      {
        mint: new PublicKey(tokenAddress),
      }
    );

    const isNative = tokenAddress === SOLANA_NATIVE_ADDRESS;
    if (!tokenAccounts.length) {
      return isNative
        ? BigNumber(await connection.getBalance(new PublicKey(owner)))
            .dividedBy(10 ** 9)
            .toFixed()
        : '0';
    }

    const {
      value: { amount, decimals },
    } = await connection.getTokenAccountBalance(tokenAccounts[0].pubkey);

    return Number(amount)
      ? BigNumber(amount)
          .dividedBy(10 ** decimals)
          .toFixed()
      : isNative
      ? BigNumber(await connection.getBalance(new PublicKey(owner)))
          .dividedBy(10 ** 9)
          .toFixed()
      : '0';
  } catch (err) {
    return 'NaN';
  }
}

export const getProgram = (wallet: Wallet) => {
  const connection = getSonicSVMTestnetConnection();

  const provider = new AnchorProvider(connection, wallet);

  setProvider(provider);
  const programId = new PublicKey(PROGRAM_ID);
  const program = new Program(IDL_JSON as Idl, provider);
  return { program, programId };
};


