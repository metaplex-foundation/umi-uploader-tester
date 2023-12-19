import { useWallet } from '@solana/wallet-adapter-react';
import { WalletDisconnectButton, WalletMultiButton } from '@solana/wallet-adapter-react-ui';

export function WalletButton() {
  const wallet = useWallet();
  return <>
    {wallet.publicKey ? <WalletDisconnectButton /> : <WalletMultiButton />}
         </>;
}
