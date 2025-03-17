/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/solana_spl_minting.json`.
 */
export type Idl = {
  address: '3aje6KQv1rhNmJHaByARDyNLiSeJCb1xgcFoQGwisQ9v';
  metadata: {
    name: 'solanaSplMinting';
    version: '0.1.0';
    spec: '0.1.0';
    description: 'Created with Anchor';
  };
  instructions: [
    {
      name: 'createSpl';
      discriminator: [30, 138, 42, 203, 245, 163, 1, 194];
      accounts: [
        {
          name: 'user';
          writable: true;
          signer: true;
        },
        {
          name: 'mint';
          writable: true;
          signer: true;
        },
        {
          name: 'userTokenAccount';
          writable: true;
        },
        {
          name: 'payer';
          writable: true;
          signer: true;
        },
        {
          name: 'systemProgram';
          address: '11111111111111111111111111111111';
        },
        {
          name: 'tokenProgram';
          address: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
        },
        {
          name: 'associatedTokenProgram';
          address: 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL';
        }
      ];
      args: [
        {
          name: 'requiredSol';
          type: 'u64';
        }
      ];
    },
    {
      name: 'handle';
      discriminator: [10, 22, 192, 83, 90, 28, 55, 77];
      accounts: [
        {
          name: 'signer';
          signer: true;
        }
      ];
      args: [
        {
          name: 'handlerData';
          type: 'bytes';
        }
      ];
    }
  ];
};
