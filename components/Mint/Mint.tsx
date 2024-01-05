/* eslint-disable no-await-in-loop */
import { Button, Container, Fieldset, FileInput, Select, Space, Title, Text } from '@mantine/core';
import { useWallet } from '@solana/wallet-adapter-react';

import { useEffect, useState } from 'react';
// import { createAwsUploader } from '@metaplex-foundation/umi-uploader-aws';
import { createBundlrUploader } from '@metaplex-foundation/umi-uploader-bundlr';
import { UploaderInterface, amountToNumber, createGenericFileFromBrowserFile } from '@metaplex-foundation/umi';
import { createIrysUploader } from '@metaplex-foundation/umi-uploader-irys';
import { createNftStorageUploader } from '@metaplex-foundation/umi-uploader-nft-storage';
import { createInscriptionUploader } from '@metaplex-foundation/umi-uploader-inscriptions';
import { useUmi } from '../useUmi';

export function Mint() {
  // const wallet = useWallet();
  const umi = useUmi();
  const [uploader, setUploader] = useState<string | null>(null);
  const [uploaderInterface, setUploaderInterface] = useState<UploaderInterface | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [cost, setCost] = useState<number | null>(null);

  const handleUpload = async () => {
    if (!file) {
      return;
    }

    if (!uploaderInterface) {
      return;
    }

    setUrl((await uploaderInterface.upload([await createGenericFileFromBrowserFile(file)])).at(0) ?? null);
  };

  useEffect(() => {
    switch (uploader) {
      case 'AWS':
        // setUploaderInterface(new createAwsUploader());
        break;
      case 'Bundlr (Arweave)':
        setUploaderInterface(createBundlrUploader(umi));
        break;
      case 'Irys (Arweave)':
        setUploaderInterface(createIrysUploader(umi));
        break;
      case 'NFT Storage (IPFS)':
        setUploaderInterface(createNftStorageUploader(umi));
        break;
      case 'Inscriptions (Solana)':
        setUploaderInterface(createInscriptionUploader(umi));
        break;
      default:
    }
  }, [uploader]);

  useEffect(() => {
    async function getCost() {
      if (uploaderInterface && file) {
        const price = await uploaderInterface.getUploadPrice([await createGenericFileFromBrowserFile(file)]);
        setCost(amountToNumber(price));
      }
    }
    getCost();
  }, [uploaderInterface, file]);

  return (
    <Container size="md">
      <Title order={3} mb="lg">Upload file to:</Title>
      <Fieldset>
        <Select
          label="Storage Provider"
          placeholder="Pick a provider"
          data={['AWS', 'Bundlr (Arweave)', 'Irys (Arweave)', 'NFT Storage (IPFS)', 'Inscriptions (Solana)']}
          onChange={setUploader}
        />

        <Space h="md" />

        <FileInput label="File to Upload" onChange={setFile} />

        <Space h="md" />

        {cost && <Text size="md">{cost} SOL</Text>}
      </Fieldset>

      <Button mt="lg" onClick={handleUpload}>Upload</Button>
      {url && <iframe src={url} width="100%" height="500px" title="Uploaded File" />}
    </Container>);
}
