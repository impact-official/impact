export const IDL_JSON = {
  address: '3aje6KQv1rhNmJHaByARDyNLiSeJCb1xgcFoQGwisQ9v',
  metadata: {
    name: 'solana_spl_minting',
    version: '0.1.0',
    spec: '0.1.0',
    description: 'Created with Anchor',
  },
  instructions: [
    {
      name: 'create_spl',
      discriminator: [30, 138, 42, 203, 245, 163, 1, 194],
      accounts: [
        {
          name: 'user',
          writable: true,
          signer: true,
        },
        {
          name: 'mint',
          writable: true,
          signer: true,
        },
        {
          name: 'user_token_account',
          writable: true,
        },
        {
          name: 'payer',
          writable: true,
          signer: true,
        },
        {
          name: 'system_program',
          address: '11111111111111111111111111111111',
        },
        {
          name: 'token_program',
          address: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
        },
        {
          name: 'associated_token_program',
          address: 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL',
        },
      ],
      args: [
        {
          name: 'required_sol',
          type: 'u64',
        },
      ],
    },
    {
      name: 'handle',
      discriminator: [10, 22, 192, 83, 90, 28, 55, 77],
      accounts: [
        {
          name: 'signer',
          signer: true,
        },
      ],
      args: [
        {
          name: 'handler_data',
          type: 'bytes',
        },
      ],
    },
  ],
};
