import { Box, HStack, Tooltip, Text, Center, VStack } from '@chakra-ui/react';
import { LeagueInfo, ManagerHistory } from '../services/fplApi';

interface PercentileBarProps {
  leagueInfo: LeagueInfo;
  managerHistories: Record<number, ManagerHistory>;
}

const PercentileBar: React.FC<PercentileBarProps> = ({ leagueInfo, managerHistories }) => {
  // Get the latest overall rank for each manager
  const managersWithRanks = leagueInfo.standings.results.map(manager => {
    const history = managerHistories[manager.entry];
    const latestGw = history?.current[history.current.length - 1];
    return {
      ...manager,
      globalRank: latestGw?.overall_rank || 10000000 // Fallback to worst rank if no data
    };
  });

  // Sort managers by global rank
  const sortedManagers = [...managersWithRanks].sort((a, b) => a.globalRank - b.globalRank);

  // Calculate percentiles based on global rank
  // FPL typically has around 9-10 million players
  const TOTAL_FPL_PLAYERS = 10000000;

  const getPercentile = (rank: number) => {
    return ((TOTAL_FPL_PLAYERS - rank) / TOTAL_FPL_PLAYERS) * 100;
  };

  // Define color stops and their ranges
  const colorRanges = [
    { threshold: 1, color: 'purple.500', label: 'Top 1%' },
    { threshold: 5, color: 'blue.400', label: 'Top 5%' },
    { threshold: 10, color: 'blue.600', label: 'Top 10%' },
    { threshold: 20, color: 'blue.800', label: 'Top 20%' },
    { threshold: 100, color: 'blackAlpha.800', label: 'Rest' }
  ];

  const getColorAndLabel = (percentile: number) => {
    for (const range of colorRanges) {
      if (percentile >= (100 - range.threshold)) {
        return range;
      }
    }
    return colorRanges[colorRanges.length - 1];
  };

  return (
    <VStack w="full" spacing={1} align="stretch">
      <HStack w="full" spacing={1} align="stretch" h="50px">
        {sortedManagers.map((manager, index) => {
          const percentile = getPercentile(manager.globalRank);
          const { color, label } = getColorAndLabel(percentile);
          const displayRank = index + 1;
          
          return (
            <Tooltip
              key={manager.entry_name}
              label={`${displayRank}. ${manager.entry_name}
Points: ${manager.total}
Global Rank: ${manager.globalRank.toLocaleString()}
Percentile: ${percentile.toFixed(2)}%`}
              hasArrow
            >
              <Box
                flex={1}
                bg={color}
                borderRadius="md"
                transition="all 0.2s"
                position="relative"
                _hover={{
                  transform: 'scaleY(1.1)',
                  filter: 'brightness(1.2)',
                  zIndex: 1
                }}
                cursor="pointer"
              >
                <Center 
                  position="absolute"
                  top="0"
                  left="0"
                  right="0"
                  bottom="0"
                >
                  <Text
                    color="white"
                    fontSize="sm"
                    fontWeight="bold"
                    textShadow="1px 1px 2px rgba(0,0,0,0.5)"
                  >
                    {displayRank}
                  </Text>
                </Center>
              </Box>
            </Tooltip>
          );
        })}
      </HStack>

      {/* Percentile range indicators */}
      <HStack 
        w="full" 
        justify="space-between" 
        px={1} 
        pt={2}
        borderTop="1px solid"
        borderColor="whiteAlpha.200"
      >
        {colorRanges.map((range, index) => (
          <Box 
            key={range.threshold} 
            textAlign={index === 0 ? 'left' : index === colorRanges.length - 1 ? 'right' : 'center'}
            flex={1}
          >
            <Text 
              fontSize="xs" 
              color="whiteAlpha.800"
              fontWeight="medium"
            >
              {range.label}
            </Text>
          </Box>
        ))}
      </HStack>
    </VStack>
  );
};

export default PercentileBar; 