/* eslint-disable no-await-in-loop */
import { Anchor, Box, Button, Center, Container, Fieldset, Image, Loader, Modal, Stack, Text, TextInput, Title } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { useCallback, useState } from 'react';
import { MplInscription, createShard, fetchInscriptionMetadata, findInscriptionMetadataPda, findInscriptionShardPda, findMintInscriptionPda, initializeFromMint, safeFetchInscriptionShard, writeData } from '@metaplex-foundation/mpl-inscription';

import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { walletAdapterIdentity } from '@metaplex-foundation/umi-signer-wallet-adapters';
import { Umi, generateSigner, percentAmount, publicKey } from '@metaplex-foundation/umi';
import { TokenStandard, createV1, findMetadataPda, mintV1, mplTokenMetadata } from '@metaplex-foundation/mpl-token-metadata';
import { CodeHighlightTabs } from '@mantine/code-highlight';
import { findAssociatedTokenPda } from '@metaplex-foundation/mpl-toolbox';
import { base58 } from '@metaplex-foundation/umi/serializers';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';

async function fetchIdempotentInscriptionShard(umi: Umi) {
  const shardAccount = findInscriptionShardPda(umi, { shardNumber: 0 });

  // Check if the account has already been created.
  let shardData = await safeFetchInscriptionShard(umi, shardAccount);

  if (!shardData) {
    await createShard(umi, {
      shardAccount,
      shardNumber: 0,
    }).sendAndConfirm(umi);

    // Then an account was created with the correct data.
    shardData = await safeFetchInscriptionShard(umi, shardAccount);
  }

  return shardAccount;
}

const signatureToString = (signature: Uint8Array) => base58.deserialize(signature);

const validateMetadata = (metadata: any) => {
  if (!metadata?.name?.length) return 'Name is required';
  if (!metadata?.image?.length) return 'Image is required';
  if (JSON.stringify(metadata).length > 1000) return 'Metadata is too large for demo, see docs for how to write large inscriptions';

  return null;
};

export function Mint() {
  const wallet = useWallet();
  const { connection } = useConnection();
  const form = useForm({
    initialValues: {
      metadataUri: 'https://arweave.net/35nZmuuUlK1iY9G-dn5u_raI_lwGoNoR9TrhOKUPez0',
    },
    validate: {
      metadataUri: (value) => {
        if (!value?.length) return 'Metadata URI is required';

        try {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const u = new URL(value);
          return null;
        } catch (e) {
          return 'Metadata URI is invalid';
        }
      },
    },
  });

  const [inscription, setInscription] = useState<any>(null);
  const [metadata, setMetadata] = useState<any>(null);
  const [metadataError, setMetadataError] = useState<string | null>(null);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [opened, { open, close }] = useDisclosure(false);

  const handleMint = useCallback(async () => {
    // console.log(form.values, wallet, metadata);
    if (!wallet.wallet || !metadata) return;
    try {
      open();
      setInscription(null);
      const umi = createUmi(connection);

      umi.use(walletAdapterIdentity(wallet));
      umi.use(mplTokenMetadata());
      umi.use(MplInscription());

      // create mint
      const mint = generateSigner(umi);
      const tokenMetadataAccount = findMetadataPda(umi, { mint: mint.publicKey });
      const tokenAccount = findAssociatedTokenPda(umi, { mint: mint.publicKey, owner: publicKey(wallet.publicKey?.toBase58()!) });

      const inscriptionAccount = await findMintInscriptionPda(umi, {
        mint: mint.publicKey,
      });
      const inscriptionMetadataAccount = await findInscriptionMetadataPda(umi, {
        inscriptionAccount: inscriptionAccount[0],
      });

      const mintRes = await createV1(umi, {
        mint,
        name: metadata.name,
        uri: form.values.metadataUri,
        sellerFeeBasisPoints: percentAmount(metadata.seller_fee_basis_points ? metadata.seller_fee_basis_points / 100 : 5),
        tokenStandard: TokenStandard.NonFungible,
      }).add(mintV1(umi, {
        mint: mint.publicKey,
        tokenStandard: TokenStandard.NonFungible,
      })).sendAndConfirm(umi);

      console.log('mintRes', signatureToString(mintRes.signature));

      const inscribeRes = await initializeFromMint(umi, {
          mintInscriptionAccount: inscriptionAccount,
          inscriptionMetadataAccount,
          mintAccount: mint.publicKey,
          tokenMetadataAccount,
          inscriptionShardAccount: await fetchIdempotentInscriptionShard(umi),
        }).add(writeData(umi, {
          inscriptionAccount,
          inscriptionMetadataAccount,
          value: Buffer.from(
            JSON.stringify(metadata)
          ),
          associatedTag: null,
        })).sendAndConfirm(umi);

      console.log('inscribeRes', signatureToString(inscribeRes.signature));

      // Then an account was created with the correct data.
      const inscriptionMetadata = await fetchInscriptionMetadata(
        umi,
        inscriptionMetadataAccount
      );

      // console.log(inscriptionMetadata);

      const i = {
        inscriptionAccount: inscriptionAccount[0],
        inscriptionMetadataAccount,
        mintAccount: mint.publicKey,
        tokenMetadataAccount: tokenMetadataAccount[0],
        tokenAccount,
        inscriptionMetadata,
      };

      console.log('inscription', i);

      setInscription(i);
      notifications.show({
        title: 'Success',
        message: 'Inscription minted!',
        color: 'green',
      });
    } catch (e: any) {
      console.error(e);
      notifications.show({
        title: 'Error',
        message: e.message,
        color: 'red',
      });
    } finally {
      close();
    }
  }, [form.values, wallet.wallet, setInscription, metadata, open, close]);

  const fetchMetadata = useCallback(async () => {
    const v = form.validate();
    if (v.hasErrors) return;
    if (!form.values.metadataUri) return;
    try {
      setFetchLoading(true);
      setMetadata(null);
      setMetadataError(null);
      const m = await fetch(form.values.metadataUri).then((res) => res.json());
      setMetadata(m);
      setMetadataError(validateMetadata(m));
    } catch (e) {
      console.error(e);
    } finally {
      setFetchLoading(false);
    }
  }, [setMetadata, form.values.metadataUri]);

  return (
    <Container size="md">
      <Title order={3} mb="lg">Mint a new Inscription from existing metadata</Title>
      {/* <Textarea
        withAsterisk
        label="JSON Metadata"
        {...form.getInputProps('metadata')}
        autosize
        minRows={15}
      /> */}
      <Fieldset>
        <TextInput placeholder="https://arweave.net/35nZmuuUlK1iY9G-dn5u_raI_lwGoNoR9TrhOKUPez0" label="NFT metadata URI" {...form.getInputProps('metadataUri')} />
        <Button mt="md" loading={fetchLoading} onClick={fetchMetadata}>Fetch metadata</Button>
        {metadata &&
          <Box mt="md">
            <CodeHighlightTabs
              withExpandButton
              expandCodeLabel="Show full JSON"
              collapseCodeLabel="Show less"
              defaultExpanded={false}
              mt="md"
              mb="lg"
              code={[{
                fileName: 'metadata.json',
                language: 'json',
                code: JSON.stringify(metadata, null, 2),
              }]}
            />
          </Box>}
        {metadataError && <Text color="red">{metadataError}</Text>}
      </Fieldset>

      {inscription &&
        <Container size="xs">
          <Stack gap="sm">
            <Box mt="lg">
              <Image radius="md" src={metadata.image} />
            </Box>
            <Title order={3}>{metadata.name}</Title>
            <Text>Inscription #: {inscription.inscriptionMetadata.inscriptionRank.toString()}</Text>
            <Anchor target="_blank" href={`https://solscan.io/account/${inscription.mintAccount}?cluster=devnet`}>View mint account</Anchor>
            <Anchor target="_blank" href={`https://solscan.io/account/${inscription.inscriptionAccount}?cluster=devnet`}>View inscription account</Anchor>
            <Anchor target="_blank" href={`https://solscan.io/account/${inscription.tokenMetadataAccount}?cluster=devnet`}>View metadata account</Anchor>
          </Stack>
        </Container>
      }

      <Button disabled={!wallet.connected || !metadata} size="lg" mt="lg" onClick={handleMint}>{!wallet.connected ? 'Connect your wallet to mint' : !metadata ? 'Fetch metadata first' : 'Mint Inscription!'}</Button>
      <Modal opened={opened} onClose={() => { }} centered withCloseButton={false}>
        <Center my="xl">
          <Stack gap="md">
            <Text>Minting your Inscription...</Text>
            <Center><Loader /></Center>
          </Stack>
        </Center>
      </Modal>
    </Container>);
}
