import { Box, Grid, Heading, Text, VStack, HStack, Select, FormControl, FormLabel } from '@chakra-ui/react';
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

interface LeagueStatsProps {
  leagueInfo: LeagueInfo;
  managerHistories: Record<number, ManagerHistory>;
}

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

  return (
    <VStack spacing={8} w="full" p={4}>
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
  );
};

export default LeagueStats; 