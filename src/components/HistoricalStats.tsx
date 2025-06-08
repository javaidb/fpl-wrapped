import { Box, VStack, Heading, Text, HStack, Divider, Icon } from '@chakra-ui/react';
import { FaTrophy, FaMedal, FaCircle } from 'react-icons/fa';
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
          teamName: manager.entry_name,
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
          textAlign="center"
          bgGradient="linear(to-r, yellow.400, purple.400)"
          bgClip="text"
          mb={4}
        >
          Historical Champions
        </Heading>
        
        <Divider borderColor="whiteAlpha.200" />
        
        <Box position="relative" minH="600px">
          {/* Central timeline line */}
          <Box
            position="absolute"
            left="50%"
            top="0"
            bottom="0"
            width="2px"
            bg="whiteAlpha.200"
            transform="translateX(-50%)"
            zIndex={0}
          />
          
          {seasons.map((season, index) => {
            const seasonTeams = getSeasonTopTeams(season);
            const isRight = index % 2 !== 0; // Start from left side
            
            if (seasonTeams.length === 0) return null;
            
            return (
              <Box 
                key={season} 
                position="relative" 
                mb={12}
                pl={isRight ? "50%" : "0"}
                pr={isRight ? "0" : "50%"}
              >
                {/* Timeline dot */}
                <Box
                  position="absolute"
                  left="50%"
                  top="24px"
                  transform="translate(-50%, 0)"
                  zIndex={1}
                >
                  <Icon 
                    as={FaCircle} 
                    color="purple.400" 
                    boxSize={4}
                  />
                </Box>
                
                {/* Season content */}
                <Box 
                  pl={isRight ? 8 : 0} 
                  pr={isRight ? 0 : 8}
                  position="relative"
                >
                  {/* Season connector line */}
                  <Box
                    position="absolute"
                    top="34px"
                    left={isRight ? "-30px" : "auto"}
                    right={isRight ? "auto" : "-30px"}
                    width="30px"
                    height="2px"
                    bg="whiteAlpha.200"
                  />
                  
                  <Box 
                    borderRadius="xl"
                    border="1px solid"
                    borderColor="whiteAlpha.200"
                    bg="whiteAlpha.50"
                    p={6}
                    _hover={{ 
                      transform: isRight ? 'translateX(8px)' : 'translateX(-8px)',
                      boxShadow: 'lg'
                    }}
                    transition="all 0.2s"
                  >
                    <VStack 
                      spacing={4} 
                      align={isRight ? "start" : "end"}
                    >
                      <Text 
                        color="purple.400" 
                        fontSize="xl" 
                        fontWeight="bold"
                        textAlign={isRight ? "left" : "right"}
                        w="full"
                        pb={2}
                        borderBottom="1px solid"
                        borderColor="whiteAlpha.200"
                      >
                        Season {season}
                      </Text>
                      
                      {seasonTeams.map((team, idx) => (
                        <HStack 
                          key={`${season}-${idx}`}
                          spacing={4} 
                          justify={isRight ? "start" : "end"}
                          w="full"
                          p={3}
                          borderRadius="lg"
                          bg={idx === 0 ? "whiteAlpha.100" : "transparent"}
                        >
                          {!isRight && (
                            <VStack align="end" spacing={1} flex={1}>
                              <HStack spacing={2}>
                                <Text 
                                  color="whiteAlpha.700"
                                  fontSize="xs"
                                >
                                  {idx === 0 ? "CHAMPION" : "RUNNER-UP"}
                                </Text>
                                <Text 
                                  color="white" 
                                  fontWeight="bold"
                                  fontSize="lg"
                                >
                                  {team.teamName}
                                </Text>
                              </HStack>
                              <Text 
                                color="whiteAlpha.700"
                                fontSize="sm"
                              >
                                {team.managerName}
                              </Text>
                              <Text 
                                color="whiteAlpha.900"
                                fontSize="sm"
                                fontWeight="medium"
                              >
                                {team.points.toLocaleString()} points
                              </Text>
                            </VStack>
                          )}
                          <Icon 
                            as={idx === 0 ? FaTrophy : FaMedal}
                            color={idx === 0 ? "yellow.400" : "gray.400"}
                            boxSize={6}
                          />
                          {isRight && (
                            <VStack align="start" spacing={1} flex={1}>
                              <HStack spacing={2}>
                                <Text 
                                  color="white" 
                                  fontWeight="bold"
                                  fontSize="lg"
                                >
                                  {team.teamName}
                                </Text>
                                <Text 
                                  color="whiteAlpha.700"
                                  fontSize="xs"
                                >
                                  {idx === 0 ? "CHAMPION" : "RUNNER-UP"}
                                </Text>
                              </HStack>
                              <Text 
                                color="whiteAlpha.700"
                                fontSize="sm"
                              >
                                {team.managerName}
                              </Text>
                              <Text 
                                color="whiteAlpha.900"
                                fontSize="sm"
                                fontWeight="medium"
                              >
                                {team.points.toLocaleString()} points
                              </Text>
                            </VStack>
                          )}
                        </HStack>
                      ))}
                    </VStack>
                  </Box>
                </Box>
              </Box>
            );
          })}
        </Box>
      </VStack>
    </Box>
  );
};

export default HistoricalStats; 