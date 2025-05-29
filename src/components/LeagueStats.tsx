import { Box, Grid, Heading, Text, VStack, HStack, Select, FormControl, FormLabel, Icon, SimpleGrid } from '@chakra-ui/react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useState, useEffect } from 'react';
import { LeagueInfo, ManagerHistory } from '../services/fplApi';
import { FaTrophy, FaArrowUp, FaCouch, FaBolt, FaMedal, FaExchangeAlt, FaPiggyBank, FaRocket, FaChartLine } from 'react-icons/fa';

interface LeagueStatsProps {
  leagueInfo: LeagueInfo;
  managerHistories: Record<number, ManagerHistory>;
}

interface Award {
  icon: typeof FaTrophy;
  title: string;
  description: string;
  value: string | number;
  manager: string;
  color: string;
}

const getOrdinalSuffix = (n: number): string => {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

const LeagueStats: React.FC<LeagueStatsProps> = ({ leagueInfo, managerHistories }) => {
  // Find the latest gameweek with data
  const latestGameweek = Math.max(
    ...Object.values(managerHistories).map(
      history => history.current.length
    )
  );

  const [startGw, setStartGw] = useState(1);
  const [endGw, setEndGw] = useState(latestGameweek);

  // Update endGw when latestGameweek changes
  useEffect(() => {
    setEndGw(latestGameweek);
  }, [latestGameweek]);

  const getPointsData = () => {
    const data: any[] = [];
    const managers = leagueInfo.standings.results;

    // Process selected gameweeks
    for (let gw = startGw; gw <= endGw; gw++) {
      const gameweekData: any = { gameweek: gw };
      
      managers.forEach(manager => {
        const history = managerHistories[manager.entry];
        if (history && history.current[gw - 1]) {
          gameweekData[manager.entry_name] = history.current[gw - 1].total_points;
        }
      });

      data.push(gameweekData);
    }

    return data;
  };

  const getPositionData = () => {
    const data: any[] = [];
    const managers = leagueInfo.standings.results;
    const managerPoints: { [key: string]: number }[] = [];

    // Initialize manager points array for selected gameweeks
    for (let gw = startGw; gw <= endGw; gw++) {
      const gameweekPoints: { [key: string]: number } = {};
      managers.forEach(manager => {
        const history = managerHistories[manager.entry];
        if (history && history.current[gw - 1]) {
          gameweekPoints[manager.entry_name] = history.current[gw - 1].total_points;
        }
      });
      managerPoints.push(gameweekPoints);
    }

    // Calculate positions for selected gameweeks
    for (let gw = startGw; gw <= endGw; gw++) {
      const gameweekData: any = { gameweek: gw };
      const currentWeekPoints = managerPoints[gw - startGw];
      
      if (Object.keys(currentWeekPoints).length > 0) {
        // Sort managers by points for this gameweek
        const sortedManagers = Object.entries(currentWeekPoints)
          .sort(([, a], [, b]) => b - a)
          .map(([name], index) => ({ name, position: index + 1 }));

        // Add positions to gameweek data
        sortedManagers.forEach(({ name, position }) => {
          gameweekData[name] = position;
        });

        data.push(gameweekData);
      }
    }

    return data;
  };

  const getRandomColor = () => {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  };

  // Generate and store colors for each manager
  const managerColors = leagueInfo.standings.results.reduce((acc, manager) => {
    acc[manager.entry_name] = getRandomColor();
    return acc;
  }, {} as { [key: string]: string });

  // Calculate dimensions
  const graphHeight = Math.max(600, leagueInfo.standings.results.length * 50);
  const legendWidth = Math.max(150, Math.max(...leagueInfo.standings.results.map(m => m.entry_name.length * 8)));

  // Get min and max points for the selected range
  const pointsData = getPointsData();
  const allPoints = pointsData.flatMap(gw => 
    Object.entries(gw)
      .filter(([key]) => key !== 'gameweek')
      .map(([, value]) => value as number)
  );
  const minPoints = Math.min(...allPoints);
  const maxPoints = Math.max(...allPoints);
  const pointsBuffer = Math.round((maxPoints - minPoints) * 0.05); // 5% buffer

  const calculateAwards = (): Award[] => {
    const awards: Award[] = [];
    const managers = leagueInfo.standings.results;

    let maxGameweekPoints = 0;
    let maxGameweekManager = '';
    let maxGameweekNumber = 0;
    let maxGameweekTeam = '';

    let maxBenchPoints = 0;
    let maxBenchManager = '';
    let maxBenchGameweek = 0;
    let maxBenchTeam = '';

    let biggestRankImprovement = 0;
    let rankImprovementManager = '';
    let rankImprovementTeam = '';
    let startRank = 0;
    let endRank = 0;

    let bestOverallRank = Number.MAX_SAFE_INTEGER;
    let bestOverallRankManager = '';
    let bestOverallRankGameweek = 0;
    let bestOverallRankTeam = '';

    let maxTransfers = 0;
    let maxTransfersManager = '';
    let maxTransfersGameweek = 0;
    let maxTransfersTeam = '';

    let maxTeamValue = 0;
    let maxTeamValueManager = '';
    let maxTeamValueGameweek = 0;
    let maxTeamValueTeam = '';

    let bestGameweekRank = Number.MAX_SAFE_INTEGER;
    let bestGameweekRankManager = '';
    let bestGameweekRankGW = 0;
    let bestGameweekRankTeam = '';

    let biggestLeagueRankChange = 0;
    let leagueRankChangeManager = '';
    let leagueRankChangeTeam = '';
    let leagueRankStart = 0;
    let leagueRankEnd = 0;
    let leagueRankStartGW = 0;
    let leagueRankEndGW = 0;

    // Create a map to store each manager's league positions over time
    const managerLeaguePositions: Map<number, { gw: number, position: number }[]> = new Map();

    // First pass: collect league positions for each manager
    managers.forEach(manager => {
      const history = managerHistories[manager.entry];
      if (!history) return;

      const positions: { gw: number, position: number }[] = [];
      history.current.forEach((gw, index) => {
        // Get the league position for this gameweek
        const gwPoints = gw.total_points;
        let position = 1;
        
        // Compare against all other managers for this gameweek
        managers.forEach(otherManager => {
          if (otherManager.entry !== manager.entry) {
            const otherHistory = managerHistories[otherManager.entry];
            if (otherHistory && otherHistory.current[index]) {
              if (otherHistory.current[index].total_points > gwPoints) {
                position++;
              }
            }
          }
        });

        positions.push({ gw: index + 1, position });

        // Track other awards in the same loop
        // Highest scoring gameweek
        if (gw.points > maxGameweekPoints) {
          maxGameweekPoints = gw.points;
          maxGameweekManager = manager.player_name;
          maxGameweekTeam = manager.entry_name;
          maxGameweekNumber = index + 1;
        }

        // Most points on bench
        if (gw.points_on_bench > maxBenchPoints) {
          maxBenchPoints = gw.points_on_bench;
          maxBenchManager = manager.player_name;
          maxBenchTeam = manager.entry_name;
          maxBenchGameweek = index + 1;
        }

        // Best overall rank
        if (gw.overall_rank < bestOverallRank) {
          bestOverallRank = gw.overall_rank;
          bestOverallRankManager = manager.player_name;
          bestOverallRankTeam = manager.entry_name;
          bestOverallRankGameweek = index + 1;
        }

        // Most transfers in a gameweek
        if (gw.event_transfers > maxTransfers) {
          maxTransfers = gw.event_transfers;
          maxTransfersManager = manager.player_name;
          maxTransfersTeam = manager.entry_name;
          maxTransfersGameweek = index + 1;
        }

        // Highest team value
        const totalValue = gw.value + gw.bank;
        if (totalValue > maxTeamValue) {
          maxTeamValue = totalValue;
          maxTeamValueManager = manager.player_name;
          maxTeamValueTeam = manager.entry_name;
          maxTeamValueGameweek = index + 1;
        }

        // Best gameweek rank
        if (gw.rank < bestGameweekRank) {
          bestGameweekRank = gw.rank;
          bestGameweekRankManager = manager.player_name;
          bestGameweekRankTeam = manager.entry_name;
          bestGameweekRankGW = index + 1;
        }
      });

      managerLeaguePositions.set(manager.entry, positions);

      // Calculate overall rank improvement
      const firstGw = history.current[0];
      const lastGw = history.current[history.current.length - 1];
      const rankImprovement = firstGw.overall_rank - lastGw.overall_rank;
      if (rankImprovement > biggestRankImprovement) {
        biggestRankImprovement = rankImprovement;
        rankImprovementManager = manager.player_name;
        rankImprovementTeam = manager.entry_name;
        startRank = firstGw.overall_rank;
        endRank = lastGw.overall_rank;
      }
    });

    // Second pass: find biggest league rank improvement
    managers.forEach(manager => {
      const positions = managerLeaguePositions.get(manager.entry);
      if (!positions) return;

      // Look at each position as a potential start point
      for (let i = 0; i < positions.length - 1; i++) {
        const startPos = positions[i];
        
        // Compare with all future positions
        for (let j = i + 1; j < positions.length; j++) {
          const endPos = positions[j];
          
          // Calculate improvement (note: going from position 10 to 2 is an improvement of 8)
          const improvement = startPos.position - endPos.position;
          
          // Only consider improvements (positive changes)
          if (improvement > biggestLeagueRankChange) {
            biggestLeagueRankChange = improvement;
            leagueRankChangeManager = manager.player_name;
            leagueRankChangeTeam = manager.entry_name;
            leagueRankStart = startPos.position;
            leagueRankEnd = endPos.position;
            leagueRankStartGW = startPos.gw;
            leagueRankEndGW = endPos.gw;
          }
        }
      }
    });

    awards.push({
      icon: FaBolt,
      title: 'Highest Scoring Gameweek',
      description: `GW${maxGameweekNumber}`,
      value: maxGameweekPoints,
      manager: `${maxGameweekManager} (${maxGameweekTeam})`,
      color: 'yellow.400',
    });

    awards.push({
      icon: FaCouch,
      title: 'Bench Hero',
      description: `GW${maxBenchGameweek}`,
      value: maxBenchPoints,
      manager: `${maxBenchManager} (${maxBenchTeam})`,
      color: 'purple.400',
    });

    awards.push({
      icon: FaArrowUp,
      title: 'Biggest Overall Rank Climber',
      description: `${startRank.toLocaleString()} → ${endRank.toLocaleString()}`,
      value: biggestRankImprovement.toLocaleString(),
      manager: `${rankImprovementManager} (${rankImprovementTeam})`,
      color: 'green.400',
    });

    awards.push({
      icon: FaMedal,
      title: 'Best Overall Rank',
      description: `GW${bestOverallRankGameweek}`,
      value: bestOverallRank.toLocaleString(),
      manager: `${bestOverallRankManager} (${bestOverallRankTeam})`,
      color: 'blue.400',
    });

    awards.push({
      icon: FaExchangeAlt,
      title: 'Transfer King',
      description: `GW${maxTransfersGameweek}`,
      value: maxTransfers,
      manager: `${maxTransfersManager} (${maxTransfersTeam})`,
      color: 'orange.400',
    });

    awards.push({
      icon: FaPiggyBank,
      title: 'Richest Squad',
      description: `GW${maxTeamValueGameweek}`,
      value: (maxTeamValue / 10).toFixed(1),
      manager: `${maxTeamValueManager} (${maxTeamValueTeam})`,
      color: 'green.500',
    });

    awards.push({
      icon: FaChartLine,
      title: 'Biggest League Rank Improvement',
      description: `${getOrdinalSuffix(leagueRankStart)} (GW${leagueRankStartGW}) → ${getOrdinalSuffix(leagueRankEnd)} (GW${leagueRankEndGW})`,
      value: biggestLeagueRankChange,
      manager: `${leagueRankChangeManager} (${leagueRankChangeTeam})`,
      color: 'pink.400',
    });

    awards.push({
      icon: FaRocket,
      title: 'Best Gameweek Rank',
      description: `GW${bestGameweekRankGW}`,
      value: bestGameweekRank.toLocaleString(),
      manager: `${bestGameweekRankManager} (${bestGameweekRankTeam})`,
      color: 'red.400',
    });

    return awards;
  };

  return (
    <Grid
      templateColumns={{ base: "1fr", xl: "1fr 300px" }}
      gap={8}
      w="full"
      p={4}
    >
      {/* Main Content */}
      <VStack spacing={8} w="full">
        <Heading size="xl">League Statistics</Heading>

        {/* Gameweek Range Selector */}
        <HStack spacing={4} w="full" justify="center">
          <FormControl w="auto">
            <FormLabel>Start Gameweek</FormLabel>
            <Select
              value={startGw}
              onChange={(e) => setStartGw(Number(e.target.value))}
              width="120px"
            >
              {Array.from({ length: endGw }, (_, i) => i + 1).map((gw) => (
                <option key={gw} value={gw}>
                  GW {gw}
                </option>
              ))}
            </Select>
          </FormControl>
          <FormControl w="auto">
            <FormLabel>End Gameweek</FormLabel>
            <Select
              value={endGw}
              onChange={(e) => setEndGw(Number(e.target.value))}
              width="120px"
            >
              {Array.from({ length: latestGameweek - startGw + 1 }, (_, i) => i + startGw).map((gw) => (
                <option key={gw} value={gw}>
                  GW {gw}
                </option>
              ))}
            </Select>
          </FormControl>
        </HStack>

        <VStack spacing={12} w="full">
          {/* Points Over Time Graph */}
          <Box bg="white" p={6} borderRadius="xl" boxShadow="md" w="full" h={`${graphHeight}px`} position="relative">
            <Heading size="md" mb={4}>Points Over Time</Heading>
            <Box position="absolute" top={0} right={0} bottom={0} width={`${legendWidth}px`} p={4} overflowY="auto">
              {leagueInfo.standings.results.map((manager) => (
                <HStack key={manager.entry} mb={2}>
                  <Box w="3" h="3" bg={managerColors[manager.entry_name]} borderRadius="sm" />
                  <Text fontSize="sm" noOfLines={1}>{manager.entry_name}</Text>
                </HStack>
              ))}
            </Box>
            <Box pr={`${legendWidth + 16}px`} h="90%">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={getPointsData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="gameweek" 
                    label={{ value: 'Gameweek', position: 'bottom', offset: 0 }}
                  />
                  <YAxis 
                    label={{ value: 'Total Points', angle: -90, position: 'insideLeft' }}
                    domain={[minPoints - pointsBuffer, maxPoints + pointsBuffer]}
                    tickCount={10}
                  />
                  <Tooltip />
                  {leagueInfo.standings.results.map((manager) => (
                    <Line
                      key={manager.entry}
                      type="monotone"
                      dataKey={manager.entry_name}
                      stroke={managerColors[manager.entry_name]}
                      dot={false}
                      strokeWidth={2}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </Box>

          {/* Position Over Time Graph */}
          <Box bg="white" p={6} borderRadius="xl" boxShadow="md" w="full" h={`${graphHeight}px`} position="relative">
            <Heading size="md" mb={4}>League Position Over Time</Heading>
            <Box position="absolute" top={0} right={0} bottom={0} width={`${legendWidth}px`} p={4} overflowY="auto">
              {leagueInfo.standings.results.map((manager) => (
                <HStack key={manager.entry} mb={2}>
                  <Box w="3" h="3" bg={managerColors[manager.entry_name]} borderRadius="sm" />
                  <Text fontSize="sm" noOfLines={1}>{manager.entry_name}</Text>
                </HStack>
              ))}
            </Box>
            <Box pr={`${legendWidth + 16}px`} h="90%">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={getPositionData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="gameweek" 
                    label={{ value: 'Gameweek', position: 'bottom', offset: 0 }}
                  />
                  <YAxis 
                    reversed 
                    label={{ value: 'Position', angle: -90, position: 'insideLeft' }}
                    domain={[1, leagueInfo.standings.results.length]}
                    ticks={Array.from({ length: leagueInfo.standings.results.length }, (_, i) => i + 1)}
                  />
                  <Tooltip />
                  {leagueInfo.standings.results.map((manager) => (
                    <Line
                      key={manager.entry}
                      type="monotone"
                      dataKey={manager.entry_name}
                      stroke={managerColors[manager.entry_name]}
                      dot={false}
                      strokeWidth={2}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </Box>

          {/* League Summary Box */}
          <Box bg="white" p={6} borderRadius="xl" boxShadow="md" w="full">
            <Heading size="md" mb={4}>League Summary</Heading>
            <VStack align="start" spacing={3}>
              <Text>
                <strong>League Name:</strong> {leagueInfo.league.name}
              </Text>
              <Text>
                <strong>Total Managers:</strong> {leagueInfo.standings.results.length}
              </Text>
              <Text>
                <strong>Points Range:</strong>{' '}
                {Math.min(...leagueInfo.standings.results.map(m => m.total))} -{' '}
                {Math.max(...leagueInfo.standings.results.map(m => m.total))}
              </Text>
            </VStack>
          </Box>
        </VStack>
      </VStack>

      {/* Awards Section */}
      <Box>
        <VStack 
          spacing={6}
          position="sticky"
          top={4}
          bg="white"
          p={6}
          borderRadius="xl"
          boxShadow="md"
        >
          <Heading size="lg">Awards</Heading>
          <VStack spacing={6} w="full" align="stretch">
            {calculateAwards().map((award, index) => (
              <Box 
                key={index}
                p={4}
                borderRadius="lg"
                border="1px"
                borderColor="gray.200"
                _hover={{ shadow: "md" }}
                transition="all 0.2s"
              >
                <HStack spacing={4}>
                  <Icon 
                    as={award.icon} 
                    boxSize={8} 
                    color={award.color}
                  />
                  <VStack align="start" spacing={1}>
                    <Text fontWeight="bold">{award.title}</Text>
                    <Text fontSize="sm" color="gray.600">
                      {award.manager}
                    </Text>
                    <HStack spacing={2}>
                      <Text fontSize="sm" color="gray.500">
                        {award.description}
                      </Text>
                      <Text fontSize="sm" fontWeight="bold">
                        {award.value}
                      </Text>
                    </HStack>
                  </VStack>
                </HStack>
              </Box>
            ))}
          </VStack>
        </VStack>
      </Box>
    </Grid>
  );
};

export default LeagueStats; 