import { Box, VStack, Heading, Text, HStack, Divider, Icon } from '@chakra-ui/react';
import { FaTrophy, FaMedal } from 'react-icons/fa';
import { LeagueInfo, ManagerHistory } from '../services/fplApi';

interface HistoricalStatsProps {
  leagueInfo: LeagueInfo;
  managerHistories: Record<number, ManagerHistory>;
}

const BACKGROUND_COLOR = 'rgb(38, 38, 38)';

const HistoricalStats: React.FC<HistoricalStatsProps> = ({ leagueInfo, managerHistories }) => {
  // Seasons in reverse chronological order
  const seasons = ['2023/24', '2022/23', '2021/22', '2020/21', '2019/20'];
  
  const getSeasonTopTeams = (season: string) => {
    const seasonTeams: {
      position: number;
      managerName: string;
      teamName: string;
      points: number;
      season: string;
    }[] = [];

    // For each manager in the current league
    leagueInfo.standings.results.forEach(manager => {
      const history = managerHistories[manager.entry];
      if (!history || !history.past) return;

      // Find the season in manager's history
      const seasonHistory = history.past.find(past => 
        past.season_name === season
      );

      if (seasonHistory) {
        seasonTeams.push({
          position: 0, // Will be calculated after sorting
          managerName: manager.player_name,
          teamName: manager.entry_name, // Use current team name since past seasons don't store team names
          points: seasonHistory.total_points,
          season: season
        });
      }
    });

    // Sort by points and assign positions
    return seasonTeams
      .sort((a, b) => b.points - a.points)
      .map((team, index) => ({
        ...team,
        position: index + 1
      }))
      .slice(0, 2); // Get top 2
  };
  
  return (
    <Box w="full" bg={BACKGROUND_COLOR} p={8} className="historical-stats">
      <VStack spacing={8} align="stretch">
        <Heading 
          size="xl" 
          color="white" 
          textAlign="center"
          bgGradient="linear(to-r, yellow.400, purple.400)"
          bgClip="text"
          mb={4}
        >
          Historical Champions
        </Heading>
        
        <Divider borderColor="whiteAlpha.200" />
        
        {seasons.map((season, index) => {
          const seasonTeams = getSeasonTopTeams(season);
          
          if (seasonTeams.length === 0) return null;
          
          return (
            <VStack key={season} spacing={4} align="stretch">
              <Text 
                color="purple.400" 
                fontSize="xl" 
                fontWeight="bold"
                textAlign="center"
              >
                Season {season}
              </Text>
              
              {seasonTeams.map((team, idx) => (
                <Box 
                  key={`${season}-${idx}`}
                  p={4}
                  borderRadius="lg"
                  border="1px solid"
                  borderColor={idx === 0 ? "yellow.400" : "gray.400"}
                  _hover={{ 
                    transform: 'translateY(-2px)',
                    boxShadow: 'lg'
                  }}
                  transition="all 0.2s"
                  bg="whiteAlpha.50"
                >
                  <HStack spacing={4}>
                    <Icon 
                      as={idx === 0 ? FaTrophy : FaMedal}
                      color={idx === 0 ? "yellow.400" : "gray.400"}
                      boxSize={6}
                    />
                    <VStack align="start" spacing={1}>
                      <HStack>
                        <Text 
                          color="white" 
                          fontWeight="bold"
                          fontSize="lg"
                        >
                          {team.teamName}
                        </Text>
                        <Text 
                          color="whiteAlpha.700"
                          fontSize="sm"
                        >
                          ({team.managerName})
                        </Text>
                      </HStack>
                      <Text color="whiteAlpha.900">
                        {team.points.toLocaleString()} points
                      </Text>
                    </VStack>
                  </HStack>
                </Box>
              ))}
              
              {index < seasons.length - 1 && seasonTeams.length > 0 && (
                <Divider borderColor="whiteAlpha.100" />
              )}
            </VStack>
          );
        })}
      </VStack>
    </Box>
  );
};

export default HistoricalStats; 