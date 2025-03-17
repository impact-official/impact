import { addressToBytes, padBytesToLength } from '@hyperlane-xyz/utils';
import {
  AccountMeta,
  Keypair,
  PublicKey,
  SystemProgram,
  TransactionInstruction,
} from '@solana/web3.js';
import { Schema, serialize } from 'borsh';
import { Buffer } from 'buffer';

export const SEALEVEL_SPL_NOOP_ADDRESS =
  'noopb9bkMVfRPU8AsbpTUg8AQkHtKwMYZiFUjNRtMmV';

const warpProgramPubKey = 'J2gbyytzDqQozPh1xgm38NchdDPNnvGKrSff47rnVsFh';
const mailBox = '75HBBLae3ddeneJVrZeyrDfv6vb7SMC3aCpBucSXS5aR';
const mailBoxPublicKey = new PublicKey(mailBox);

// Should match Instruction in https://github.com/hyperlane-xyz/hyperlane-monorepo/blob/af7146e655f2632926241af8db57b6d43558b09c/rust/sealevel/programs/mailbox/src/instruction.rs#L18
export enum SealevelHypMailboxInstruction {
  Init,
  InboxProcess,
  InboxSetDefaultIsm,
  InboxGetRecipientIsm,
  OutboxDispatch,
  OutboxGetCount,
  OutboxGetLatestCheckpoint,
  OutboxGetRoot,
  GetOwner,
  TransferOwnership,
  ClaimProtocolFees,
  SetProtocolFeeConfig
}

const derivePda = (
  seeds: Array<string | Buffer>,
  programId: string | PublicKey
): PublicKey => {
  const [pda] = PublicKey.findProgramAddressSync(
    seeds.map((s) => Buffer.from(s)),
    new PublicKey(programId)
  );
  return pda;
};

const deriveOutboxPda = () => {
  return derivePda(['hyperlane', '-', 'outbox'], mailBox);
};

const deriveDispatchAuthority = () => {
  return derivePda(
    ['hyperlane_dispatcher', '-', 'dispatch_authority'],
    mailBox
  );
};

function deriveMsgStorageAccount(uniqueMessageKey: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from('hyperlane'),
      Buffer.from('-'),
      Buffer.from('dispatched_message'),
      Buffer.from('-'),
      uniqueMessageKey.toBuffer(),
    ],
    new PublicKey(mailBox)
  )[0];
}

function getKeys(
  sender: PublicKey,
  randomWallet: PublicKey
): Array<AccountMeta> {
  return [
    /// 0. `[executable]` The Mailbox program.
    { pubkey: mailBoxPublicKey, isSigner: false, isWritable: false },
    // https://github.com/hyperlane-xyz/hyperlane-monorepo/blob/af7146e655f2632926241af8db57b6d43558b09c/rust/sealevel/programs/mailbox/src/pda_seeds.rs#L15
    // 2. `[writeable]` Outbox PDA.
    { pubkey: deriveOutboxPda(), isSigner: false, isWritable: true }, // 2. Outbox PDA
    // https://github.com/hyperlane-xyz/hyperlane-monorepo/blob/af7146e655f2632926241af8db57b6d43558b09c/rust/sealevel/programs/mailbox/src/pda_seeds.rs#L54
    // 3. `[]` This program's dispatch authority.
    {
      pubkey: deriveDispatchAuthority(),
      isSigner: false,
      isWritable: false,
    },
    /// 4. `[executable]` System program.
    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    /// 5. `[executable]` SPL Noop program.
    {
      pubkey: new PublicKey(SEALEVEL_SPL_NOOP_ADDRESS),
      isSigner: false,
      isWritable: false,
    },
    // 6. `[signer]` Payer.
    { pubkey: sender, isSigner: true, isWritable: false },
    // 7. `[signer]` Unique message account.
    { pubkey: randomWallet, isSigner: true, isWritable: false },
    // https://github.com/hyperlane-xyz/hyperlane-monorepo/blob/af7146e655f2632926241af8db57b6d43558b09c/rust/sealevel/programs/mailbox/src/pda_seeds.rs#L30
    // 8. `[writeable]` Dispatched message PDA. An empty message PDA relating to the seeds
    {
      pubkey: deriveMsgStorageAccount(randomWallet),
      isSigner: false,
      isWritable: true,
    },
  ];
}

class OutboxDispatch {
  sender: Uint8Array; // sender PublicKey (32 bytes)
  destination_domain: number; // domain ID (u32)
  recipient: Uint8Array; // recipient (32 bytes)
  message_body: Uint8Array; 

  constructor(props: {
    sender: Uint8Array;
    destination_domain: number;
    recipient: Uint8Array;
    message_body: Uint8Array;
  }) {
    this.sender = props.sender;
    this.destination_domain = props.destination_domain;
    this.recipient = props.recipient;
    this.message_body = props.message_body;
  }
}

export class SealevelInstructionWrapper<Instr> {
  instruction!: number;
  data!: Instr;
  constructor(public readonly fields: any) {
    Object.assign(this, fields);
  }
}

const OutboxDispatchSchema: Schema = new Map<any, any>([
  [
    SealevelInstructionWrapper,
    {
      kind: 'struct',
      fields: [
        ['instruction', 'u8'],
        ['data', OutboxDispatch],
      ],
    },
  ],
  [
    OutboxDispatch,
    {
      kind: 'struct',
      fields: [
        ['sender', [32]],
        ['destination_domain', 'u32'],
        ['recipient', [32]], 
        ['message_body', ['u8']],
      ],
    },
  ],
]);

export function createOutboxDispatchInstruction(
  sender: PublicKey,
  destinationDomain: number,
  recipient: Address,
  messageBody: string
) {
  const randomWallet = Keypair.generate();

  const value = new SealevelInstructionWrapper({
    instruction: SealevelHypMailboxInstruction.OutboxDispatch,
    data: new OutboxDispatch({
      sender: sender.toBytes(),
      destination_domain: destinationDomain,
      recipient: padBytesToLength(addressToBytes(recipient), 32),
      message_body: Buffer.from(messageBody)
    }),
  });

  const serializedData = Buffer.from(serialize(OutboxDispatchSchema, value))

  return new TransactionInstruction({
    keys: getKeys(sender, randomWallet.publicKey),
    programId: new PublicKey(mailBox),
    data: serializedData, 
  });
}
