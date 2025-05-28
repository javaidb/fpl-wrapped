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
      setLeagueInfo(league);

      // Fetch manager histories
      const totalManagers = league.standings.results.length;
      const histories: Record<number, ManagerHistory> = {};
      
      for (let i = 0; i < totalManagers; i++) {
        const manager = league.standings.results[i];
        try {
          const history = await fetchManagerHistory(manager.entry);
          histories[manager.entry] = history;
          setLoadingProgress(((i + 1) / totalManagers) * 100);
        } catch (error) {
          console.error(`Failed to fetch history for manager ${manager.entry_name}`);
        }
      }

      setManagerHistories(histories);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch league data',
        status: 'error',
        duration: 3000,
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
              <VStack spacing={4}>
                <Input
                  placeholder="Enter your league ID"
                  value={leagueId}
                  onChange={(e) => setLeagueId(e.target.value)}
                  size="lg"
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
                  <Progress
                    value={loadingProgress}
                    w="full"
                    colorScheme="purple"
                    hasStripe
                    isAnimated
                  />
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