import { Box, Container, Stack, Text, Link, Icon } from '@chakra-ui/react';
import { FaGithub } from 'react-icons/fa';
import { SiPremierleague } from 'react-icons/si';

const Footer = () => {
  return (
    <Box
      as="footer"
      bg="gray.50"
      borderTop="1px"
      borderColor="gray.200"
      py={4}
      position="relative"
      mt={8}
    >
      <Container maxW="container.xl">
        <Stack
          direction={{ base: 'column', md: 'row' }}
          spacing={4}
          justify="center"
          align="center"
        >
          <Link
            href="https://github.com/javaidb"
            isExternal
            display="flex"
            alignItems="center"
            color="gray.600"
            _hover={{ color: 'gray.800' }}
          >
            <Icon as={FaGithub} boxSize={5} mr={2} />
            <Text>@javaidb</Text>
          </Link>

          <Text color="gray.400" display={{ base: 'none', md: 'block' }}>|</Text>

          <Stack direction="row" spacing={2} align="center">
            <Icon as={SiPremierleague} boxSize={6} color="purple.600" />
            <Text color="gray.600">Fantasy Premier League Wrapped</Text>
          </Stack>

          <Text color="gray.400" display={{ base: 'none', md: 'block' }}>|</Text>

          <Text fontSize="sm" color="gray.500">
            Built with React & Chakra UI
          </Text>
        </Stack>
      </Container>
    </Box>
  );
};

export default Footer; 