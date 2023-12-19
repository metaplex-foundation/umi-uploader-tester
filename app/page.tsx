'use client';

import { useMemo, useState } from 'react';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { Notifications } from '@mantine/notifications';
import { AppShell, Container } from '@mantine/core';
import { Mint } from '@/components/Mint/Mint';
import { Header } from '@/components/Header/Header';

export default function HomePage() {
  const [env, setEnv] = useState('devnet');
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
    ],
    []
  );

  const endpoint = useMemo(() => {
    switch (env) {
      case 'mainnet-beta':
        return process.env.NEXT_PUBLIC_MAINNET_RPC_URL;
      case 'devnet':
      default:
        return process.env.NEXT_PUBLIC_DEVNET_RPC_URL;
    }
  }, [env]);

  return (
    <ConnectionProvider endpoint={endpoint!}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <Notifications />
          <AppShell
            header={{ height: 80 }}
            style={{
              backgroundColor: '#1a1a1a',
            }}
          >
            <AppShell.Header>
              <Header env={env} setEnv={setEnv} />
            </AppShell.Header>
            <AppShell.Main>
              <Container
                size="lg"
                mt="xl"
                pb={100}
              >
                <Mint />
              </Container>
            </AppShell.Main>
          </AppShell>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
