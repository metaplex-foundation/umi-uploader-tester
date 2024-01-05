import { Center, Container, Flex, Group, Menu, Title } from '@mantine/core';
import { IconChevronDown } from '@tabler/icons-react';
import { WalletButton } from '../WalletButton/WalletButton';

import classes from './Header.module.css';
import { MetaplexLogo, MetaplexLogoVariant } from '../MetaplexLogo';

export function Header({ env, setEnv }: { env: string; setEnv: (env: string) => void }) {
  return (
    <Container
      size="lg"
      h={80}
      pt={12}
    >
      <div className={classes.inner}>
        <Flex justify="center" align="center" gap="md">
          <MetaplexLogo variant={MetaplexLogoVariant.Small} />
          <Title order={2}>Umi Upload Tester</Title>
        </Flex>
        <Group>
          <WalletButton />
          <Menu trigger="hover" transitionProps={{ exitDuration: 0 }} withinPortal>
            <Menu.Target>
              <a
                href={undefined}
                className={classes.link}
                onClick={(event) => event.preventDefault()}
              >
                <Center>
                  <span className={classes.linkLabel}>{env}</span>
                  <IconChevronDown size="0.9rem" stroke={1.5} />
                </Center>
              </a>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item disabled onClick={() => setEnv('mainnet-beta')}>Mainnet Beta</Menu.Item>
              <Menu.Item onClick={() => setEnv('devnet')}>Devnet</Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </div>
    </Container>
  );
}
