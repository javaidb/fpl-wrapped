import { useState } from 'react';
import {
  ChakraProvider,
  Box,
  VStack,
  Heading,
  Input,
  Button,
  Text,
  useToast,
  Container,
  Progress,
  Link,
  OrderedList,
  ListItem,
} from '@chakra-ui/react';
import { fetchLeagueInfo, fetchManagerHistory, LeagueInfo, ManagerHistory } from './services/fplApi';
import LeagueStats from './components/LeagueStats';

function App() {
  const [leagueId, setLeagueId] = useState('');
  const [loading, setLoading] = useState(false);
  const [leagueInfo, setLeagueInfo] = useState<LeagueInfo | null>(null);
  const [managerHistories, setManagerHistories] = useState<Record<number, ManagerHistory>>({});
  const [loadingProgress, setLoadingProgress] = useState(0);
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leagueId) {
      toast({
        title: 'Error',
        description: 'Please enter a league ID',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setLoading(true);
    setLoadingProgress(0);
    setLeagueInfo(null);
    setManagerHistories({});

    try {
      // Fetch league information
      const league = await fetchLeagueInfo(leagueId);
      
      if (!league.standings.results.length) {
        throw new Error('No managers found in this league. Please check if the league ID is correct.');
      }
      
      setLeagueInfo(league);

      // Fetch manager histories
      const totalManagers = league.standings.results.length;
      const histories: Record<number, ManagerHistory> = {};
      let failedManagers = 0;
      
      for (let i = 0; i < totalManagers; i++) {
        const manager = league.standings.results[i];
        try {
          const history = await fetchManagerHistory(manager.entry);
          histories[manager.entry] = history;
          setLoadingProgress(((i + 1) / totalManagers) * 100);
        } catch (error) {
          console.error(`Failed to fetch history for manager ${manager.entry_name}`);
          failedManagers++;
        }
      }

      if (failedManagers === totalManagers) {
        throw new Error('Could not fetch data for any managers. The FPL API might be temporarily unavailable.');
      }

      setManagerHistories(histories);
      
      if (failedManagers > 0) {
        toast({
          title: 'Partial Data Loaded',
          description: `Loaded data for ${totalManagers - failedManagers} out of ${totalManagers} managers.`,
          status: 'warning',
          duration: 5000,
          isClosable: true,
        });
      } else {
        toast({
          title: 'Success',
          description: 'League data loaded successfully!',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch league data. Please try again later.';
      toast({
        title: 'Error',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ChakraProvider>
      <Box minH="100vh" bg="gray.100" py={10}>
        <Container maxW="container.xl">
          <VStack spacing={8}>
            <Heading
              as="h1"
              size="2xl"
              bgGradient="linear(to-r, purple.500, pink.500)"
              bgClip="text"
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
                  isLoading={loading}
                >
                  Generate Wrapped
                </Button>
                {loading && (
                  <Box w="full">
                    <Text mb={2} fontSize="sm" color="gray.600" textAlign="center">
                      Fetching data for all managers...
                    </Text>
                    <Progress
                      value={loadingProgress}
                      w="full"
                      colorScheme="purple"
                      hasStripe
                      isAnimated
                    />
                  </Box>
                )}
              </VStack>
            </Box>

            {leagueInfo && Object.keys(managerHistories).length > 0 && (
              <LeagueStats
                leagueInfo={leagueInfo}
                managerHistories={managerHistories}
              />
            )}
          </VStack>
        </Container>
      </Box>
    </ChakraProvider>
  );
}

export default App; 