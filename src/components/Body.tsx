/* eslint-disable @typescript-eslint/no-non-null-asserted-optional-chain */
import {
  getInitialTokenIndex,
  getTokenByIndex,
  useWarpCore,
} from '@/tokens/hooks';
import {
  getConnection,
  getSonicSVMTestnetConnection,
} from '@/utils/connection';
import { getProgram } from '@/utils/rpc';
import * as anchor from '@coral-xyz/anchor';
import { Wallet } from '@coral-xyz/anchor';
import { toWei } from '@hyperlane-xyz/utils';
import { getAssociatedTokenAddressSync } from '@solana/spl-token';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Keypair, Transaction } from '@solana/web3.js';
import { useCallback } from 'react';

export const Body = () => {
  const warpCore = useWarpCore();
  const { publicKey, sendTransaction } = useWallet();
  const wallet = useWallet();

  const handleTransfer = useCallback(
    async (amount: number) => {
      const origin = 'solanamainnet';
      const destination = 'sonicsvm';
      const tokenIndex = getInitialTokenIndex(
        warpCore,
        'BXKDfnNkgUNVT5uCfk36sv2GDtK6RwAt9SLbGiKzZkih',
        origin,
        destination
      );

      const token = getTokenByIndex(warpCore, tokenIndex);

      if (!token) return { token: 'Token is required' };
      const amountWei = toWei(amount, token.decimals);
      const originTokenAmount = token.amount(amountWei);

      const txs = await warpCore.getTransferRemoteTxs({
        originTokenAmount,
        destination,
        sender: publicKey?.toBase58()!,
        recipient: publicKey?.toBase58()!,
      });

      for (const tx of txs) {
        const signature = await sendTransaction(
          tx.transaction as Transaction,
          getConnection()
        );
      }
    },
    [publicKey, sendTransaction, warpCore]
  );

  const handleGenerateSplToken = useCallback(async () => {
    if (!publicKey) return;
    try {
      const { program } = getProgram(wallet as unknown as Wallet);

      const mint = Keypair.generate();

      const userTokenAccount = getAssociatedTokenAddressSync(
        mint.publicKey,
        publicKey!
      );

      const requiredSol = new anchor.BN(1000000); // 设置所需 SOL 数量（单位：lamports）
      const transactionInstruction = await program.methods
        .createSpl(requiredSol)
        .accounts({
          user: publicKey,
          mint: mint.publicKey,
          userTokenAccount,
          payer: publicKey,
        })
        .instruction();

      const connection = getSonicSVMTestnetConnection();
      const transaction = new Transaction();
      transaction.add(transactionInstruction);
      transaction.feePayer = publicKey!;
      const latestBlockHash = await connection.getLatestBlockhash();
      transaction.recentBlockhash = latestBlockHash.blockhash;

      // 创建 VersionedTransaction
      try {
        const simulationResult = await connection.simulateTransaction(
          transaction
        );
        console.log(`success`, simulationResult);
      } catch (error) {
        console.log(`error`, error);
      }
      const signature = await sendTransaction(transaction, connection, {
        signers: [mint],
      });
      console.log(`impact res`, signature);
    } catch (error) {
      console.log(`impact error`, error);
    }
  }, [publicKey, sendTransaction, wallet]);

  // const handleSendMessage = useCallback(async () => {
  //   const connection = getSolanaTestnetConnection();
  //   // https://github.com/hyperlane-xyz/hyperlane-monorepo/blob/af7146e655f2632926241af8db57b6d43558b09c/rust/sealevel/environments/testnet4/chain-config.json#L931
  //   const sonicTestnetChainId = 15153042;
  //   const tx = createOutboxDispatchInstruction(
  //     publicKey!,
  //     sonicTestnetChainId,
  //     'sonic',
  //     'hello'
  //   );
  //   const transaction = new Transaction();
  //   transaction.add(tx);
  //   transaction.feePayer = publicKey!;
  //   const latestBlockHash = await connection.getLatestBlockhash();

  //   transaction.recentBlockhash = latestBlockHash.blockhash;

  //   const signature = await sendTransaction(transaction, connection);

  // }, [publicKey, sendTransaction]);

  return (
    <div className="flex h-96 w-full justify-center items-center gap-4">
      <div
        className="rounded-xl px-4 py-2"
        style={{
          backgroundColor: 'red',
          cursor: 'pointer',
        }}
        onClick={() => handleTransfer(0.01)}
      >
        Transfer 0.01 To Sonic
      </div>

      <div
        className="rounded-xl px-4 py-2"
        style={{
          backgroundColor: 'red',
          cursor: 'pointer',
        }}
        onClick={handleGenerateSplToken}
      >
        generate spl token
      </div>

      <WalletMultiButton />
    </div>
  );
};
