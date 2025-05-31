import { Box, HStack, Tooltip, Text, VStack } from '@chakra-ui/react';
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

  // Define color stops and their ranges with extended percentiles
  const colorRanges = [
    { threshold: 1, color: 'purple.500', label: 'Top 1%' },
    { threshold: 5, color: 'blue.400', label: 'Top 5%' },
    { threshold: 10, color: 'blue.600', label: 'Top 10%' },
    { threshold: 20, color: 'teal.500', label: 'Top 20%' },
    { threshold: 30, color: 'cyan.500', label: 'Top 30%' },
    { threshold: 40, color: 'green.500', label: 'Top 40%' },
    { threshold: 50, color: 'yellow.500', label: 'Top 50%' },
    { threshold: 100, color: 'gray.600', label: 'Rest' }
  ];

  const getColorAndLabel = (percentile: number) => {
    for (const range of colorRanges) {
      if (percentile >= (100 - range.threshold)) {
        return range;
      }
    }
    return colorRanges[colorRanges.length - 1];
  };

  // Group managers by their percentile range
  const managerGroups = sortedManagers.reduce((groups, manager, index) => {
    const percentile = getPercentile(manager.globalRank);
    const range = getColorAndLabel(percentile);
    if (!groups[range.threshold]) {
      groups[range.threshold] = {
        range,
        managers: [],
        startIndex: index
      };
    }
    groups[range.threshold].managers.push({
      ...manager,
      displayRank: index + 1,
      percentile
    });
    return groups;
  }, {} as Record<number, { range: typeof colorRanges[0], managers: any[], startIndex: number }>);

  return (
    <VStack w="full" spacing={4} align="stretch">
      {/* Bars */}
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
                <Text
                  position="absolute"
                  top="50%"
                  left="50%"
                  transform="translate(-50%, -50%)"
                  color="white"
                  fontSize="sm"
                  fontWeight="bold"
                  textShadow="1px 1px 2px rgba(0,0,0,0.5)"
                >
                  {displayRank}
                </Text>
              </Box>
            </Tooltip>
          );
        })}
      </HStack>

      {/* Percentile Group Markers */}
      <Box position="relative" h="24px" mt={2}>
        {Object.values(managerGroups).map(({ range, managers, startIndex }) => {
          if (range.threshold === 100) return null; // Don't show marker for "Rest"
          
          const groupWidth = (managers.length / sortedManagers.length) * 100;
          const startPosition = (startIndex / sortedManagers.length) * 100;
          
          return (
            <Box
              key={range.threshold}
              position="absolute"
              left={`${startPosition}%`}
              width={`${groupWidth}%`}
              top={0}
              h="full"
            >
              {/* Vertical lines at start and end of group */}
              <Box
                position="absolute"
                left={0}
                top={0}
                w="1px"
                h="8px"
                bg={range.color}
              />
              <Box
                position="absolute"
                right={0}
                top={0}
                w="1px"
                h="8px"
                bg={range.color}
              />
              {/* Horizontal line connecting vertical lines */}
              <Box
                position="absolute"
                left={0}
                top="8px"
                w="full"
                h="1px"
                bg={range.color}
              />
              {/* Label */}
              <Text
                position="absolute"
                left="50%"
                top="12px"
                transform="translateX(-50%)"
                fontSize="xs"
                color="whiteAlpha.900"
                whiteSpace="nowrap"
                textAlign="center"
              >
                {range.label}
              </Text>
            </Box>
          );
        })}
      </Box>
    </VStack>
  );
};

export default PercentileBar; 