import { useState } from 'react';
import {
  Box,
  VStack,
  Heading,
  Input,
  Button,
  Text,
  Link,
  OrderedList,
  ListItem,
} from '@chakra-ui/react';

const BACKGROUND_COLOR = 'rgb(38, 38, 38)';

interface LeagueFormProps {
  onSubmit: (leagueId: string) => void;
}

const LeagueForm = ({ onSubmit }: LeagueFormProps) => {
  const [leagueId, setLeagueId] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (leagueId) {
      onSubmit(leagueId);
    }
  };

  return (
    <Box bg={BACKGROUND_COLOR}>
      <Heading
        as="h1"
        size="2xl"
        bgGradient="linear(to-r, purple.400, pink.400)"
        bgClip="text"
        textAlign="center"
      >
        FPL Wrapped
      </Heading>
      
      <Text fontSize="xl" textAlign="center" color="whiteAlpha.900">
        Get insights about your Fantasy Premier League performance
      </Text>

      <Box
        as="form"
        onSubmit={handleSubmit}
        w="full"
        maxW="md"
        p={8}
        bg="gray.800"
        borderRadius="xl"
        boxShadow="dark-lg"
        mx="auto"
        borderColor="whiteAlpha.200"
        borderWidth="1px"
      >
        <VStack spacing={6}>
          <Box w="full">
            <Text mb={2} fontWeight="medium" color="white">How to find your league ID:</Text>
            <OrderedList spacing={2} pl={4} color="whiteAlpha.800" fontSize="sm">
              <ListItem>Go to the <Link href="https://fantasy.premierleague.com/" isExternal color="purple.400" _hover={{ color: 'purple.300' }}>FPL website</Link></ListItem>
              <ListItem>Click on your league name</ListItem>
              <ListItem>Copy the number from the URL</ListItem>
            </OrderedList>
          </Box>

          <Input
            placeholder="Enter your league ID (e.g., 123456)"
            value={leagueId}
            onChange={(e) => setLeagueId(e.target.value)}
            size="lg"
            type="number"
            bg="whiteAlpha.100"
            color="white"
            _placeholder={{ color: 'whiteAlpha.500' }}
            _hover={{ bg: 'whiteAlpha.200' }}
            _focus={{ bg: 'whiteAlpha.200', borderColor: 'purple.400' }}
          />

          <Button
            type="submit"
            colorScheme="purple"
            size="lg"
            w="full"
            isDisabled={!leagueId}
          >
            Generate Wrapped
          </Button>
        </VStack>
      </Box>
    </Box>
  );
};

export default LeagueForm; 