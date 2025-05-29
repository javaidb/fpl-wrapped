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
    <>
      <Heading
        as="h1"
        size="2xl"
        bgGradient="linear(to-r, purple.500, pink.500)"
        bgClip="text"
        textAlign="center"
      >
        FPL Wrapped
      </Heading>
      
      <Text fontSize="xl" textAlign="center" color="gray.600">
        Get insights about your Fantasy Premier League performance
      </Text>

      <Box
        as="form"
        onSubmit={handleSubmit}
        w="full"
        maxW="md"
        p={8}
        bg="white"
        borderRadius="xl"
        boxShadow="xl"
        mx="auto"
      >
        <VStack spacing={6}>
          <Box w="full">
            <Text mb={2} fontWeight="medium">How to find your league ID:</Text>
            <OrderedList spacing={2} pl={4} color="gray.600" fontSize="sm">
              <ListItem>Go to the <Link href="https://fantasy.premierleague.com/" isExternal color="purple.500">FPL website</Link></ListItem>
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
    </>
  );
};

export default LeagueForm; 