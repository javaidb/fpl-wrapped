import { Box, Container, Stack, Text, Link, Icon } from '@chakra-ui/react';
import { FaGithub } from 'react-icons/fa';
import { SiPremierleague } from 'react-icons/si';

const BACKGROUND_COLOR = 'rgb(38, 38, 38)';

const Footer = () => {
  return (
    <Box
      as="footer"
      bg={BACKGROUND_COLOR}
      borderTop="1px"
      borderColor="whiteAlpha.200"
      py={4}
      position="relative"
      mt={8}
    >
      <Container maxW="container.xl" bg={BACKGROUND_COLOR}>
        <Stack
          direction={{ base: 'column', md: 'row' }}
          spacing={4}
          justify="center"
          align="center"
          bg={BACKGROUND_COLOR}
        >
          <Link
            href="https://github.com/javaidb"
            isExternal
            display="flex"
            alignItems="center"
            color="whiteAlpha.800"
            _hover={{ color: 'white' }}
          >
            <Icon as={FaGithub} boxSize={5} mr={2} />
            <Text>@javaidb</Text>
          </Link>

          <Text color="whiteAlpha.400" display={{ base: 'none', md: 'block' }}>|</Text>

          <Stack direction="row" spacing={2} align="center">
            <Icon as={SiPremierleague} boxSize={6} color="purple.400" />
            <Text color="whiteAlpha.800">Fantasy Premier League Wrapped</Text>
          </Stack>

          <Text color="whiteAlpha.400" display={{ base: 'none', md: 'block' }}>|</Text>

          <Text fontSize="sm" color="whiteAlpha.600">
            Built with React & Chakra UI
          </Text>
        </Stack>
      </Container>
    </Box>
  );
};

export default Footer; 