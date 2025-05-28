import { Box, Grid, Heading, Text, VStack } from '@chakra-ui/react';
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
import { LeagueInfo, ManagerHistory } from '../services/fplApi';

interface LeagueStatsProps {
  leagueInfo: LeagueInfo;
  managerHistories: Record<number, ManagerHistory>;
}

const LeagueStats: React.FC<LeagueStatsProps> = ({ leagueInfo, managerHistories }) => {
  const getPointsData = () => {
    const data: any[] = [];
    const managers = leagueInfo.standings.results;

    // Process each gameweek
    for (let gw = 1; gw <= 38; gw++) {
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

  const getRandomColor = () => {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  };

  return (
    <VStack spacing={8} w="full" p={4}>
      <Heading size="xl">League Statistics</Heading>

      <Grid templateColumns="repeat(auto-fit, minmax(300px, 1fr))" gap={6} w="full">
        <Box bg="white" p={6} borderRadius="xl" boxShadow="md">
          <Heading size="md" mb={4}>Points Over Time</Heading>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={getPointsData()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="gameweek" />
              <YAxis />
              <Tooltip />
              <Legend />
              {leagueInfo.standings.results.map((manager) => (
                <Line
                  key={manager.entry}
                  type="monotone"
                  dataKey={manager.entry_name}
                  stroke={getRandomColor()}
                  dot={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </Box>

        <Box bg="white" p={6} borderRadius="xl" boxShadow="md">
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
      </Grid>
    </VStack>
  );
};

export default LeagueStats; 