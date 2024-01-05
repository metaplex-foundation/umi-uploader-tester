import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { walletAdapterIdentity } from '@metaplex-foundation/umi-signer-wallet-adapters';
// import { awsUploader } from '@metaplex-foundation/umi-uploader-aws';
import { bundlrUploader } from '@metaplex-foundation/umi-uploader-bundlr';
import { irysUploader } from '@metaplex-foundation/umi-uploader-irys';
import { nftStorageUploader } from '@metaplex-foundation/umi-uploader-nft-storage';
import { inscriptionUploader } from '@metaplex-foundation/umi-uploader-inscriptions';
import { useWallet } from '@solana/wallet-adapter-react';
import { ReactNode } from 'react';
import { UmiContext } from './useUmi';

export const UmiProvider = ({
  endpoint,
  children,
}: {
  endpoint: string;
  children: ReactNode;
}) => {
  const wallet = useWallet();
  let nftStorageToken = process.env.NFTSTORAGE_TOKEN;
  if (!nftStorageToken || nftStorageToken === 'AddYourTokenHere') {
    console.error('Add your nft.storage Token to .env!');
    nftStorageToken = 'AddYourTokenHere';
  }
  const umi = createUmi(endpoint)
    .use(walletAdapterIdentity(wallet))
    // .use(awsUploader())
    .use(bundlrUploader())
    .use(irysUploader())
    .use(nftStorageUploader({ token: nftStorageToken }));
    umi.use(inscriptionUploader({
        umi,
    }));

  return <UmiContext.Provider value={{ umi }}>{children}</UmiContext.Provider>;
};
