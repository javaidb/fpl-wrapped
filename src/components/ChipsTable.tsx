import { Box, Table, Thead, Tbody, Tr, Th, Td, Heading, Text, VStack, HStack, SimpleGrid } from '@chakra-ui/react';
import { LeagueInfo, ManagerHistory } from '../services/fplApi';

interface ChipsTableProps {
  leagueInfo: LeagueInfo;
  managerHistories: Record<number, ManagerHistory>;
}

interface ChipStyle {
  bg: string;
  label: string;
}

interface ChipData {
  name: string;
  points: number;
  displayPoints: number;
}

const BACKGROUND_COLOR = 'rgb(38, 38, 38)';

// Chip colors and labels
const CHIP_STYLES: Record<string, ChipStyle> = {
  '3xc': { 
    bg: 'red', 
    label: 'TC',
  },
  'bboost': { 
    bg: 'green', 
    label: 'BB',
  },
  'freehit': { 
    bg: 'blue', 
    label: 'FH',
  },
  'wildcard': { 
    bg: 'purple.500',
    label: 'WC'
  }
};

// Calculate quartiles for an array of numbers
const calculateQuartiles = (numbers: number[]) => {
  if (numbers.length === 0) return { q1: 0, q2: 0, q3: 0 };
  
  const sorted = [...numbers].sort((a, b) => a - b);
  const q1Index = Math.max(0, Math.floor((sorted.length - 1) * 0.25));
  const q2Index = Math.max(0, Math.floor((sorted.length - 1) * 0.5));
  const q3Index = Math.max(0, Math.floor((sorted.length - 1) * 0.75));
  
  return {
    q1: sorted[q1Index],
    q2: sorted[q2Index],
    q3: sorted[q3Index]
  };
};

// Function to get color shade based on points and quartiles
const getColorShade = (points: number, chipName: string, quartiles: Record<string, { q1: number; q2: number; q3: number }>) => {
  const chipStyle = CHIP_STYLES[chipName];
  
  // Wildcard has no shading
  if (chipName === 'wildcard') return 'purple.500';
  
  const baseColor = chipStyle.bg;
  const chipQuartiles = quartiles[chipName];

  if (!chipQuartiles) return `${baseColor}.500`; // Default if no quartiles available
  
  // Use darker shades for lower performing chips
  if (points >= chipQuartiles.q3) return `${baseColor}.500`; // At Q3 - normal color
  if (points >= chipQuartiles.q2) return `${baseColor}.600`; // Between Q2 and Q3 - slightly darker
  if (points >= chipQuartiles.q1) return `${baseColor}.700`; // Between Q1 and Q2 - darker
  return `${baseColor}.800`; // Below Q1 - darkest
};

const ChipsTable: React.FC<ChipsTableProps> = ({ leagueInfo, managerHistories }) => {
  // Get all gameweeks (assuming 38 GWs in a season)
  const gameweeks = Array.from({ length: 38 }, (_, i) => i + 1);

  // Create a map of chips played by each team with points and calculate quartiles
  const chipPointsMap: Record<string, number[]> = {
    '3xc': [],
    'bboost': [],
    'freehit': [],
    'wildcard': []
  };

  // First pass: collect all points for each chip type
  Object.values(managerHistories).forEach(history => {
    history?.chips?.forEach(chip => {
      const gwHistory = history?.current[chip.event - 1];
      if (gwHistory && chipPointsMap[chip.name]) {
        // For triple captain, we want the base points before tripling
        const points = chip.name === '3xc' ? Math.round(gwHistory.points / 3) : gwHistory.points;
        chipPointsMap[chip.name].push(points);
      }
    });
  });

  // Calculate quartiles for each chip type
  const chipQuartiles = Object.entries(chipPointsMap).reduce((acc, [chipName, points]) => {
    acc[chipName] = calculateQuartiles(points);
    return acc;
  }, {} as Record<string, { q1: number; q2: number; q3: number }>);

  // Second pass: create team chips data with adjusted points
  const teamChips = leagueInfo.standings.results.map(manager => {
    const history = managerHistories[manager.entry];
    const chips = history?.chips || [];
    const chipData = {} as Record<number, ChipData>;
    
    chips.forEach(chip => {
      const gwHistory = history?.current[chip.event - 1];
      if (gwHistory) {
        // For triple captain, adjust the points to base points for color calculation
        const points = chip.name === '3xc' ? Math.round(gwHistory.points / 3) : gwHistory.points;
        chipData[chip.event] = {
          name: chip.name,
          points: points,
          displayPoints: gwHistory.points
        };
      }
    });
    
    return {
      teamName: manager.entry_name,
      chips: chipData
    };
  });

  return (
    <Box w="full" bg={BACKGROUND_COLOR} p={4} className="chips-table">
      <VStack spacing={4} align="stretch">
        <Heading 
          size="lg" 
          textAlign="center"
          bgGradient="linear(to-r, yellow.400, purple.400)"
          bgClip="text"
          mb={2}
        >
          Chips Strategy
        </Heading>
        
        <Box overflowX="auto">
          <Table variant="simple" size="sm">
            <Thead>
              <Tr>
                <Th 
                  color="whiteAlpha.900" 
                  borderColor="whiteAlpha.200"
                  position="sticky"
                  left={0}
                  bg={BACKGROUND_COLOR}
                  zIndex={1}
                  fontSize="md"
                  py={2}
                >
                  Team
                </Th>
                {gameweeks.map(gw => (
                  <Th 
                    key={gw} 
                    color="whiteAlpha.900" 
                    borderColor="whiteAlpha.200"
                    textAlign="center"
                    p={1}
                    minW="40px"
                    fontSize="sm"
                  >
                    {gw}
                  </Th>
                ))}
              </Tr>
            </Thead>
            <Tbody>
              {teamChips.map(({ teamName, chips }) => (
                <Tr key={teamName}>
                  <Td 
                    color="white" 
                    borderColor="whiteAlpha.200"
                    position="sticky"
                    left={0}
                    bg={BACKGROUND_COLOR}
                    zIndex={1}
                    fontWeight="medium"
                    fontSize="md"
                    py={1}
                  >
                    {teamName}
                  </Td>
                  {gameweeks.map(gw => {
                    const chipData = chips[gw];
                    const chipStyle = chipData?.name ? CHIP_STYLES[chipData.name] : null;
                    
                    return (
                      <Td 
                        key={gw} 
                        borderColor="whiteAlpha.200"
                        p={1}
                        textAlign="center"
                      >
                        {chipStyle && (
                          <VStack 
                            spacing={0}
                            bg={getColorShade(chipData.points, chipData.name, chipQuartiles)}
                            color="white"
                            px={2}
                            py={1}
                            borderRadius="md"
                            textAlign="center"
                            transition="all 0.2s"
                            _hover={{
                              transform: "scale(1.05)",
                              boxShadow: "lg"
                            }}
                          >
                            <Text
                              fontSize="md"
                              fontWeight="bold"
                              lineHeight="shorter"
                            >
                              {chipStyle.label}
                            </Text>
                            {chipData.name !== 'wildcard' && (
                              <Text
                                fontSize="xs"
                                opacity={0.9}
                                lineHeight="shorter"
                              >
                                {chipData.displayPoints}pts
                              </Text>
                            )}
                          </VStack>
                        )}
                      </Td>
                    );
                  })}
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>

        <Box>
          <Text fontSize="sm" color="whiteAlpha.700" mb={2}>Legend:</Text>
          <SimpleGrid columns={2} spacing={3}>
            {Object.entries(CHIP_STYLES).map(([name, style]) => (
              <HStack key={name} spacing={2}>
                <Box
                  bg={name === 'wildcard' ? style.bg : `${style.bg}.500`}
                  color="white"
                  fontSize="md"
                  fontWeight="bold"
                  px={2}
                  py={1}
                  borderRadius="md"
                  minW="45px"
                  textAlign="center"
                >
                  {style.label}
                </Box>
                <VStack align="start" spacing={0}>
                  <Text fontSize="sm" color="whiteAlpha.700">
                    {name === '3xc' ? 'Triple Captain' :
                     name === 'bboost' ? 'Bench Boost' :
                     name === 'freehit' ? 'Free Hit' : 'Wildcard'}
                  </Text>
                  {name !== 'wildcard' && chipQuartiles[name] && (
                    <Text fontSize="xs" color="whiteAlpha.600">
                      Q1: {chipQuartiles[name].q1} | Q2: {chipQuartiles[name].q2} | Q3: {chipQuartiles[name].q3}
                    </Text>
                  )}
                </VStack>
              </HStack>
            ))}
          </SimpleGrid>
        </Box>
      </VStack>
    </Box>
  );
};

export default ChipsTable; 