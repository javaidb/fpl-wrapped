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
import { FaTrophy, FaArrowUp, FaCouch, FaBolt, FaMedal, FaExchangeAlt, FaPiggyBank, FaRocket, FaChartLine, FaBalanceScale } from 'react-icons/fa';
import HistoricalStats from './HistoricalStats';
import ChipsTable from './ChipsTable';

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

const DISTINCT_COLORS = [
  '#FF6B6B', // Coral Red
  '#4ECDC4', // Turquoise
  '#45B7D1', // Sky Blue
  '#96CEB4', // Sage Green
  '#FFEEAD', // Cream Yellow
  '#D4A5A5', // Dusty Rose
  '#9370DB', // Medium Purple
  '#20B2AA', // Light Sea Green
  '#FFB6C1', // Light Pink
  '#DDA0DD', // Plum
  '#F0E68C', // Khaki
  '#98FB98', // Pale Green
  '#DEB887', // Burlywood
  '#87CEEB', // Sky Blue
  '#FFA07A', // Light Salmon
  '#E6E6FA', // Lavender
  '#F08080', // Light Coral
  '#90EE90', // Light Green
  '#FFD700', // Gold
  '#BA55D3'  // Medium Orchid
];

const BACKGROUND_COLOR = 'rgb(38, 38, 38)';
const CHART_BG_COLOR = BACKGROUND_COLOR; // Use the same color for consistency

const AWARDS_BG_COLOR = "rgb(0, 255, 133)";
const AWARDS_TEXT_COLOR = "rgb(56, 0, 60)";

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

  const getDistinctColor = (index: number) => {
    return DISTINCT_COLORS[index % DISTINCT_COLORS.length];
  };

  // Update the manager colors assignment
  const managerColors = leagueInfo.standings.results.reduce((acc, manager, index) => {
    acc[manager.entry_name] = getDistinctColor(index);
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
    let maxGameweekRank = 0;

    let maxBenchPoints = 0;
    let maxBenchManager = '';
    let maxBenchGameweek = 0;
    let maxBenchTeam = '';

    let maxTripleCaptainPoints = 0;
    let maxTripleCaptainManager = '';
    let maxTripleCaptainTeam = '';
    let maxTripleCaptainGW = 0;
    let maxTripleCaptainPlayer = '';

    let maxBenchBoostPoints = 0;
    let maxBenchBoostManager = '';
    let maxBenchBoostTeam = '';
    let maxBenchBoostGW = 0;

    let totalTransfersByManager: { [key: string]: { 
      transfers: number, 
      manager: string, 
      team: string 
    } } = {};

    let maxCaptainPoints = 0;
    let maxCaptainManager = '';
    let maxCaptainTeam = '';
    let maxCaptainGW = 0;

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
    let bestGameweekRankPoints = 0;

    let biggestLeagueRankChange = 0;
    let leagueRankChangeManager = '';
    let leagueRankChangeTeam = '';
    let leagueRankStart = 0;
    let leagueRankEnd = 0;
    let leagueRankStartGW = 0;
    let leagueRankEndGW = 0;

    let maxTransferCost = 0;
    let maxTransferCostManager = '';
    let maxTransferCostTeam = '';
    let maxTransferCostGW = 0;
    let maxTransferCostTransfers = 0;

    // Create a map to store each manager's league positions over time
    const managerLeaguePositions: Map<number, { gw: number, position: number }[]> = new Map();

    // First pass: collect league positions for each manager
    managers.forEach(manager => {
      const history = managerHistories[manager.entry];
      if (!history) return;

      // Initialize total transfers for this manager before the gameweek loop
      totalTransfersByManager[manager.entry] = {
        transfers: 0,
        manager: manager.player_name,
        team: manager.entry_name
      };

      const positions: { gw: number, position: number }[] = [];
      history.current.forEach((gw, index) => {
        // Add to total transfers for this gameweek
        totalTransfersByManager[manager.entry].transfers += gw.event_transfers;

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
          maxGameweekRank = gw.rank;
        }

        // Track highest transfer cost
        if (gw.event_transfers_cost > maxTransferCost) {
          maxTransferCost = gw.event_transfers_cost;
          maxTransferCostManager = manager.player_name;
          maxTransferCostTeam = manager.entry_name;
          maxTransferCostGW = index + 1;
          maxTransferCostTransfers = gw.event_transfers;
        }

        // Track captain points (assuming it's available in the API response)
        if (gw.points_on_bench > maxBenchPoints) {
          maxBenchPoints = gw.points_on_bench;
          maxBenchManager = manager.player_name;
          maxBenchTeam = manager.entry_name;
          maxBenchGameweek = index + 1;
        }

        // Track captain points
        const captainPoints = gw.points - gw.points_on_bench;  // This is a rough approximation
        if (captainPoints > maxCaptainPoints) {
          maxCaptainPoints = captainPoints;
          maxCaptainManager = manager.player_name;
          maxCaptainTeam = manager.entry_name;
          maxCaptainGW = index + 1;
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
          bestGameweekRankPoints = gw.points;
        }

        // Check for chip usage and points
        history.chips?.forEach(chip => {
          const gwIndex = chip.event - 1;
          const gw = history.current[gwIndex];
          if (!gw) return;

          if (chip.name === '3xc') {
            // For triple captain, we want just the captain's points (before tripling)
            const captainPoints = Math.round(gw.points / 3);  // Estimate captain points
            if (captainPoints > maxTripleCaptainPoints) {
              maxTripleCaptainPoints = captainPoints;
              maxTripleCaptainManager = manager.player_name;
              maxTripleCaptainTeam = manager.entry_name;
              maxTripleCaptainGW = chip.event;
              // Note: In a real implementation, you'd get the actual captain's name from the API
              maxTripleCaptainPlayer = "Player Name";  // This would come from the API
            }
          }

          if (chip.name === 'bboost' && gw.points > maxBenchBoostPoints) {
            maxBenchBoostPoints = gw.points;
            maxBenchBoostManager = manager.player_name;
            maxBenchBoostTeam = manager.entry_name;
            maxBenchBoostGW = chip.event;
          }
        });
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

    // Calculate Most Consistent Manager (lowest standard deviation in points)
    let mostConsistentManager = '';
    let mostConsistentTeam = '';
    let lowestStdDev = Infinity;
    let consistentAvg = 0;

    managers.forEach(manager => {
      const history = managerHistories[manager.entry];
      if (!history) return;

      const points = history.current.map(gw => gw.points);
      const avg = points.reduce((a, b) => a + b, 0) / points.length;
      const variance = points.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / points.length;
      const stdDev = Math.sqrt(variance);

      if (stdDev < lowestStdDev) {
        lowestStdDev = stdDev;
        mostConsistentManager = manager.player_name;
        mostConsistentTeam = manager.entry_name;
        consistentAvg = avg;
      }
    });

    // Find manager with most total transfers
    let maxTotalTransfers = 0;
    let maxTotalTransfersManager = '';
    let maxTotalTransfersTeam = '';

    Object.values(totalTransfersByManager).forEach(({ transfers, manager, team }) => {
      if (transfers > maxTotalTransfers) {
        maxTotalTransfers = transfers;
        maxTotalTransfersManager = manager;
        maxTotalTransfersTeam = team;
      }
    });

    awards.push({
      icon: FaBolt,
      title: 'Highest Scoring Gameweek',
      description: `GW${maxGameweekNumber}`,
      value: `${maxGameweekPoints} (${maxGameweekRank.toLocaleString()})`,
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
      value: `${maxTransfers} transfers`,
      manager: `${maxTransfersManager} (${maxTransfersTeam})`,
      color: 'orange.400',
    });

    awards.push({
      icon: FaPiggyBank,
      title: 'Richest Squad',
      description: `GW${maxTeamValueGameweek}`,
      value: `$${(maxTeamValue / 10).toFixed(1)}`,
      manager: `${maxTeamValueManager} (${maxTeamValueTeam})`,
      color: 'green.500',
    });

    awards.push({
      icon: FaChartLine,
      title: 'Biggest League Rank Improvement',
      description: `${getOrdinalSuffix(leagueRankStart)} (GW${leagueRankStartGW}) → ${getOrdinalSuffix(leagueRankEnd)} (GW${leagueRankEndGW})`,
      value: getOrdinalSuffix(biggestLeagueRankChange),
      manager: `${leagueRankChangeManager} (${leagueRankChangeTeam})`,
      color: 'pink.400',
    });

    awards.push({
      icon: FaRocket,
      title: 'Best Gameweek Rank',
      description: `GW${bestGameweekRankGW}`,
      value: `${bestGameweekRank.toLocaleString()} (${bestGameweekRankPoints} pts)`,
      manager: `${bestGameweekRankManager} (${bestGameweekRankTeam})`,
      color: 'red.400',
    });

    awards.push({
      icon: FaExchangeAlt,
      title: 'Most Total Transfers',
      description: 'All Season',
      value: maxTotalTransfers,
      manager: `${maxTotalTransfersManager} (${maxTotalTransfersTeam})`,
      color: 'blue.500',
    });

    awards.push({
      icon: FaTrophy,
      title: 'Best Triple Captain',
      description: maxTripleCaptainGW ? `GW${maxTripleCaptainGW} (${maxTripleCaptainPlayer})` : 'Not Used',
      value: maxTripleCaptainPoints ? `${maxTripleCaptainPoints * 3}` : 'N/A',
      manager: maxTripleCaptainManager ? `${maxTripleCaptainManager} (${maxTripleCaptainTeam})` : 'No one yet',
      color: 'yellow.500',
    });

    awards.push({
      icon: FaCouch,
      title: 'Best Bench Boost',
      description: maxBenchBoostGW ? `GW${maxBenchBoostGW}` : 'Not Used',
      value: maxBenchBoostPoints || 'N/A',
      manager: maxBenchBoostManager ? `${maxBenchBoostManager} (${maxBenchBoostTeam})` : 'No one yet',
      color: 'green.500',
    });

    return awards;
  };

  return (
    <VStack spacing={12} w="full" bg={BACKGROUND_COLOR}>
      {/* Awards Section */}
      <Box 
        w="full" 
        className="pdf-page awards-page" 
        bg={AWARDS_BG_COLOR}
        py={12}
        position="relative"
        borderRadius="xl"
        overflow="hidden"
      >
        <Heading 
          size="xl" 
          mb={8} 
          textAlign="center" 
          color={AWARDS_TEXT_COLOR}
          fontWeight="black"
        >
          Awards & Achievements
        </Heading>
        <SimpleGrid 
          columns={{ base: 1, md: 2, lg: 3 }} 
          spacing={6}
          mx="auto"
          maxW="1200px"
          px={4}
        >
          {calculateAwards().map((award, index) => (
            <Box 
              key={index}
              p={6}
              borderRadius="lg"
              border="1px"
              borderColor={`${AWARDS_TEXT_COLOR}33`}
              bg={`${AWARDS_TEXT_COLOR}0a`}
              _hover={{ 
                transform: "translateY(-2px)",
                boxShadow: "xl",
                borderColor: `${AWARDS_TEXT_COLOR}66`
              }}
              transition="all 0.2s"
              position="relative"
              overflow="hidden"
            >
              <Box
                position="absolute"
                top={0}
                left={0}
                right={0}
                bottom={0}
                bg="white"
                opacity={0.05}
                borderRadius="lg"
              />
              <HStack spacing={4} position="relative">
                <Icon 
                  as={award.icon} 
                  boxSize={8} 
                  color={AWARDS_TEXT_COLOR}
                  opacity={0.9}
                />
                <VStack align="start" spacing={1}>
                  <Text 
                    fontWeight="bold" 
                    color={AWARDS_TEXT_COLOR}
                    fontSize="lg"
                  >
                    {award.title}
                  </Text>
                  <Text 
                    fontSize="sm" 
                    color={AWARDS_TEXT_COLOR}
                    opacity={0.8}
                  >
                    {award.manager}
                  </Text>
                  <HStack spacing={2}>
                    <Text 
                      fontSize="sm" 
                      color={AWARDS_TEXT_COLOR}
                      opacity={0.7}
                    >
                      {award.description}
                    </Text>
                    <Text 
                      fontSize="sm" 
                      fontWeight="bold" 
                      color={AWARDS_TEXT_COLOR}
                    >
                      {award.value}
                    </Text>
                  </HStack>
                </VStack>
              </HStack>
            </Box>
          ))}
        </SimpleGrid>
      </Box>

      {/* Points Over Time Graph */}
      <Box w="full" className="pdf-page points-page" bg={BACKGROUND_COLOR}>
        <Box bg={BACKGROUND_COLOR} p={6} borderRadius="xl" boxShadow="dark-lg" w="full" h={`${graphHeight}px`}>
          <Heading size="md" mb={4} color="white">Points Over Time</Heading>
          <Box h="90%" bg={BACKGROUND_COLOR}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart 
                data={getPointsData()}
                style={{ backgroundColor: BACKGROUND_COLOR }}
                margin={{ top: 20, right: 30, left: 20, bottom: 65 }}
              >
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth={0.5}
                />
                <XAxis 
                  dataKey="gameweek" 
                  label={{ 
                    value: 'Gameweek', 
                    position: 'bottom', 
                    offset: 0, 
                    fill: 'white',
                    fontSize: 16,
                    fontWeight: 'bold'
                  }}
                  stroke="white"
                  tick={{ fill: 'white', fontSize: 14 }}
                />
                <YAxis 
                  label={{ 
                    value: 'Total Points', 
                    angle: -90, 
                    position: 'insideLeft', 
                    fill: 'white',
                    fontSize: 16,
                    fontWeight: 'bold'
                  }}
                  domain={[minPoints - pointsBuffer, maxPoints + pointsBuffer]}
                  tickCount={10}
                  stroke="white"
                  tick={{ fill: 'white', fontSize: 14 }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: BACKGROUND_COLOR, 
                    border: '1px solid rgba(255,255,255,0.2)', 
                    color: 'white',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                    padding: '8px 12px'
                  }}
                  labelStyle={{ color: 'white', fontWeight: 'bold', marginBottom: '4px' }}
                  itemStyle={{ padding: '2px 0' }}
                  cursor={{ strokeWidth: 1 }}
                />
                <Legend 
                  wrapperStyle={{ 
                    color: 'white',
                    paddingTop: '20px',
                  }}
                  layout="horizontal"
                  align="center"
                  verticalAlign="bottom"
                  formatter={(value, entry) => (
                    <Text 
                      color={managerColors[value]}
                      fontSize="md"
                      fontWeight="medium"
                      px={2}
                      transition="all 0.2s"
                      _hover={{
                        filter: 'brightness(1.2)',
                      }}
                    >
                      {value}
                    </Text>
                  )}
                  iconSize={10}
                  iconType="plainline"
                />
                {leagueInfo.standings.results.map((manager, index) => (
                  <Line
                    key={manager.entry}
                    type="monotone"
                    dataKey={manager.entry_name}
                    stroke={managerColors[manager.entry_name]}
                    dot={false}
                    strokeWidth={2}
                    activeDot={{ 
                      r: 6, 
                      strokeWidth: 0,
                      fill: managerColors[manager.entry_name],
                      filter: 'brightness(1.2)'
                    }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </Box>
        </Box>
      </Box>

      {/* League Position Over Time Graph */}
      <Box w="full" className="pdf-page position-page" bg={BACKGROUND_COLOR}>
        <Box bg={BACKGROUND_COLOR} p={6} borderRadius="xl" boxShadow="dark-lg" w="full" h={`${graphHeight}px`}>
          <Heading size="md" mb={4} color="white">League Position Over Time</Heading>
          <Box h="90%" bg={BACKGROUND_COLOR}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart 
                data={getPositionData()}
                style={{ backgroundColor: BACKGROUND_COLOR }}
                margin={{ top: 20, right: 30, left: 20, bottom: 65 }}
              >
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth={0.5}
                />
                <XAxis 
                  dataKey="gameweek" 
                  label={{ 
                    value: 'Gameweek', 
                    position: 'bottom', 
                    offset: 0, 
                    fill: 'white',
                    fontSize: 16,
                    fontWeight: 'bold'
                  }}
                  stroke="white"
                  tick={{ fill: 'white', fontSize: 14 }}
                />
                <YAxis 
                  reversed 
                  label={{ 
                    value: 'Position', 
                    angle: -90, 
                    position: 'insideLeft', 
                    fill: 'white',
                    fontSize: 16,
                    fontWeight: 'bold'
                  }}
                  domain={[1, leagueInfo.standings.results.length]}
                  ticks={Array.from({ length: leagueInfo.standings.results.length }, (_, i) => i + 1)}
                  stroke="white"
                  tick={{ fill: 'white', fontSize: 14 }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: BACKGROUND_COLOR, 
                    border: '1px solid rgba(255,255,255,0.2)', 
                    color: 'white',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                    padding: '8px 12px'
                  }}
                  labelStyle={{ color: 'white', fontWeight: 'bold', marginBottom: '4px' }}
                  itemStyle={{ padding: '2px 0' }}
                  cursor={{ strokeWidth: 1 }}
                />
                <Legend 
                  wrapperStyle={{ 
                    color: 'white',
                    paddingTop: '20px',
                  }}
                  layout="horizontal"
                  align="center"
                  verticalAlign="bottom"
                  formatter={(value, entry) => (
                    <Text 
                      color={managerColors[value]}
                      fontSize="md"
                      fontWeight="medium"
                      px={2}
                      transition="all 0.2s"
                      _hover={{
                        filter: 'brightness(1.2)',
                      }}
                    >
                      {value}
                    </Text>
                  )}
                  iconSize={10}
                  iconType="plainline"
                />
                {leagueInfo.standings.results.map((manager, index) => (
                  <Line
                    key={manager.entry}
                    type="monotone"
                    dataKey={manager.entry_name}
                    stroke={managerColors[manager.entry_name]}
                    dot={false}
                    strokeWidth={2}
                    activeDot={{ 
                      r: 6, 
                      strokeWidth: 0,
                      fill: managerColors[manager.entry_name],
                      filter: 'brightness(1.2)'
                    }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </Box>
        </Box>
      </Box>

      {/* Chips Strategy Section */}
      <Box w="full" className="pdf-page chips-page" bg={BACKGROUND_COLOR}>
        <ChipsTable 
          leagueInfo={leagueInfo}
          managerHistories={managerHistories}
        />
      </Box>

      {/* Historical Stats Section - Temporarily disabled */}
      {/* <Box w="full" className="pdf-page historical-page" bg={BACKGROUND_COLOR}>
        <HistoricalStats 
          leagueInfo={leagueInfo}
          managerHistories={managerHistories}
        />
      </Box> */}
    </VStack>
  );
};

export default LeagueStats; 