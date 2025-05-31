import { Box, HStack, Tooltip, Text, VStack } from '@chakra-ui/react';
import { LeagueInfo, ManagerHistory } from '../services/fplApi';

interface PercentileBarProps {
  leagueInfo: LeagueInfo;
  managerHistories: Record<number, ManagerHistory>;
}

const PercentileBar: React.FC<PercentileBarProps> = ({ leagueInfo, managerHistories }) => {
  // First, get all managers with their points and known ranks
  const managersData = leagueInfo.standings.results.map(manager => {
    const history = managerHistories[manager.entry];
    if (!history?.current) return { 
      ...manager, 
      points: 0,
      globalRank: null,
      hasKnownRank: false 
    };

    const latestGw = history.current[history.current.length - 1];
    return {
      ...manager,
      points: latestGw?.total_points || 0,
      globalRank: latestGw?.overall_rank || null,
      hasKnownRank: !!latestGw?.overall_rank
    };
  });

  // Sort by points to establish relative positions
  const sortedByPoints = [...managersData].sort((a, b) => b.points - a.points);

  // Get the nearest known rank above each position
  const nearestKnownRanks = sortedByPoints.map((manager, index) => {
    if (manager.hasKnownRank) return manager.globalRank;
    
    // Look for nearest known rank above this position
    for (let i = index - 1; i >= 0; i--) {
      if (sortedByPoints[i].hasKnownRank) {
        return sortedByPoints[i].globalRank;
      }
    }
    return null;
  });

  // Calculate ranks with the new estimation logic
  const managersWithRanks = managersData.map(manager => {
    const history = managerHistories[manager.entry];
    if (!history?.current) return { ...manager, globalRank: 10000000 }; // No history at all

    const latestGw = history.current[history.current.length - 1];
    
    // 1. If we have a valid rank from the latest gameweek, use it
    if (latestGw?.overall_rank) {
      return {
        ...manager,
        globalRank: latestGw.overall_rank
      };
    }

    // 2. Try to interpolate from surrounding gameweeks
    const currentGws = history.current;
    const lastKnownRankIndex = currentGws.slice(0).reverse().findIndex(gw => gw?.overall_rank);
    
    if (lastKnownRankIndex !== -1) {
      const lastKnownRank = currentGws[currentGws.length - 1 - lastKnownRankIndex].overall_rank;
      const nextKnownRankIndex = currentGws.slice(currentGws.length - lastKnownRankIndex).findIndex(gw => gw?.overall_rank);
      
      if (nextKnownRankIndex !== -1) {
        // We can interpolate
        const nextKnownRank = currentGws[currentGws.length - lastKnownRankIndex + nextKnownRankIndex].overall_rank;
        const totalGaps = nextKnownRankIndex;
        const currentGap = lastKnownRankIndex;
        
        const interpolatedRank = Math.round(
          lastKnownRank + (nextKnownRank - lastKnownRank) * (currentGap / totalGaps)
        );

        return {
          ...manager,
          globalRank: interpolatedRank
        };
      }

      // Only have past ranks, use the last known one
      return {
        ...manager,
        globalRank: lastKnownRank
      };
    }

    // 3. Points-based estimation with upper bound
    const managerIndex = sortedByPoints.findIndex(m => m.entry === manager.entry);
    const upperBoundRank = nearestKnownRanks[managerIndex];
    
    if (upperBoundRank) {
      // Calculate estimated rank based on points and position, but ensure it's worse than upper bound
      const totalManagers = sortedByPoints.length;
      const positionRatio = (managerIndex + 1) / totalManagers;
      const TOTAL_FPL_PLAYERS = 10000000;
      
      // Estimate rank ensuring it's worse than upper bound
      const estimatedRank = Math.max(
        Math.round(TOTAL_FPL_PLAYERS * positionRatio),
        upperBoundRank + 1000 // Add buffer to ensure it's notably worse than upper bound
      );

      return {
        ...manager,
        globalRank: estimatedRank
      };
    }

    // 4. Absolute worst case: no known ranks above and no other data
    return {
      ...manager,
      globalRank: 10000000
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
    { threshold: 100, color: 'gray.600', label: 'Rest' } // Removed colors beyond 30%
  ];

  const getColorAndLabel = (percentile: number) => {
    // If not in top 30%, return muted color
    if (percentile < 70) { // 100 - 30
      return {
        color: 'gray.700',
        label: 'Rest',
        isHighlighted: false,
        threshold: 100
      };
    }

    // For top 30% and above, use the color ranges
    for (const range of colorRanges) {
      if (percentile >= (100 - range.threshold)) {
        return {
          color: range.color,
          label: range.label,
          isHighlighted: true,
          threshold: range.threshold
        };
      }
    }
    
    return {
      color: 'gray.700',
      label: 'Rest',
      isHighlighted: false,
      threshold: 100
    };
  };

  // Group managers by their percentile range
  const managerGroups = sortedManagers.reduce((groups, manager, index) => {
    const percentile = getPercentile(manager.globalRank);
    const colorInfo = getColorAndLabel(percentile);
    if (!groups[colorInfo.threshold]) {
      groups[colorInfo.threshold] = {
        range: colorRanges.find(r => r.threshold === colorInfo.threshold) || colorRanges[colorRanges.length - 1],
        managers: [],
        startIndex: index
      };
    }
    groups[colorInfo.threshold].managers.push({
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
          const { color, label, isHighlighted } = getColorAndLabel(percentile);
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
                opacity={isHighlighted ? 1 : 0.5}
                _hover={{
                  transform: isHighlighted ? 'scaleY(1.1)' : 'none',
                  filter: isHighlighted ? 'brightness(1.2)' : 'brightness(1.1)',
                  zIndex: 1
                }}
                cursor="pointer"
              >
                <Text
                  position="absolute"
                  top="50%"
                  left="50%"
                  transform="translate(-50%, -50%)"
                  color={isHighlighted ? "white" : "whiteAlpha.800"}
                  fontSize="sm"
                  fontWeight={isHighlighted ? "bold" : "medium"}
                  textShadow={isHighlighted ? "1px 1px 2px rgba(0,0,0,0.5)" : "none"}
                >
                  {displayRank}
                </Text>
              </Box>
            </Tooltip>
          );
        })}
      </HStack>

      {/* Percentile Group Markers - only show for top 30% and above */}
      <Box position="relative" h="24px" mt={2}>
        {Object.values(managerGroups).map(({ range, managers, startIndex }) => {
          // Only show markers for top 30% and above
          if (range.threshold > 30) return null;
          
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

      {/* Disclaimer */}
      <Text 
        fontSize="xs" 
        color="whiteAlpha.700" 
        textAlign="center"
        mt={2}
        fontStyle="italic"
      >
        * Percentiles are calculated based on global rankings among {TOTAL_FPL_PLAYERS.toLocaleString()} FPL managers worldwide
      </Text>
    </VStack>
  );
};

export default PercentileBar; 