import { Box, Heading, Text, SimpleGrid, VStack, HStack, Circle, Divider, Badge } from '@chakra-ui/react';
import { LeagueInfo, ManagerHistory } from '../services/fplApi';
import { SiPremierleague } from 'react-icons/si';
import { Icon } from '@chakra-ui/react';
import { FaTrophy, FaChartLine, FaUsers, FaMedal } from 'react-icons/fa';
import PercentileBar from './PercentileBar';

const BACKGROUND_COLOR = 'rgb(38, 38, 38)';

interface CoverPageProps {
  leagueInfo: LeagueInfo;
  managerHistories: Record<number, ManagerHistory>;
}

const getPositionIcon = (position: number) => {
  switch (position) {
    case 1:
      return { icon: FaMedal, color: 'yellow.400', label: '1st' };
    case 2:
      return { icon: FaMedal, color: 'gray.400', label: '2nd' };
    case 3:
      return { icon: FaMedal, color: 'orange.400', label: '3rd' };
    default:
      return null;
  }
};

const CoverPage: React.FC<CoverPageProps> = ({ leagueInfo, managerHistories }) => {
  // Split managers into columns (10 per column)
  const managers = leagueInfo.standings.results;
  const managerColumns = [];
  for (let i = 0; i < managers.length; i += 10) {
    managerColumns.push(managers.slice(i, i + 10));
  }

  return (
    <Box 
      w="full" 
      className="pdf-page cover-page" 
      bg={BACKGROUND_COLOR}
      minH="100vh"
      py={16}
      px={8}
      position="relative"
      overflow="hidden"
    >
      {/* Background decorative elements */}
      <Circle 
        size="400px" 
        position="absolute" 
        top="-100px" 
        left="-100px" 
        bg="whiteAlpha.50"
        filter="blur(70px)"
      />
      <Circle 
        size="400px" 
        position="absolute" 
        bottom="-100px" 
        right="-100px" 
        bg="purple.900"
        opacity={0.3}
        filter="blur(70px)"
      />

      <VStack spacing={12} align="center" position="relative">
        {/* Header */}
        <VStack spacing={6}>
          <Box position="relative">
            <Circle 
              size="160px" 
              bg="whiteAlpha.100" 
              position="absolute"
              top="50%"
              left="50%"
              transform="translate(-50%, -50%)"
            />
            <Icon as={SiPremierleague} boxSize={24} color="purple.400" />
          </Box>
          <VStack spacing={2}>
            <Box 
              position="relative"
              _before={{
                content: '""',
                position: 'absolute',
                top: 0,
                left: '-10px',
                right: '-10px',
                bottom: 0,
                background: 'linear-gradient(135deg, purple.500, blue.500)',
                filter: 'blur(20px)',
                opacity: 0.3,
                zIndex: -1
              }}
            >
              <Text 
                fontSize="7xl" 
                fontWeight="black" 
                color="transparent"
                textAlign="center"
                letterSpacing="wider"
                bgClip="text"
                bgGradient="linear(to-r, purple.400, blue.400, purple.400)"
                style={{
                  WebkitTextStroke: '1px rgba(255,255,255,0.1)',
                  fontFamily: "'Playfair Display', serif"
                }}
              >
                <Text as="span" textTransform="uppercase">FPL</Text> Wrapped
              </Text>
            </Box>
            <Text 
              fontSize="xl" 
              color="purple.400" 
              textTransform="uppercase" 
              letterSpacing="widest"
              fontWeight="semibold"
              textShadow="0 0 10px rgba(147, 112, 219, 0.3)"
            >
              Season 2024/25
            </Text>
          </VStack>
        </VStack>

        {/* League Info */}
        <VStack spacing={4} pt={8}>
          <HStack spacing={4}>
            <Icon as={FaTrophy} boxSize={6} color="yellow.400" />
            <Heading size="xl" color="white">
              {leagueInfo.league.name}
            </Heading>
          </HStack>
          <Box 
            py={2} 
            px={6} 
            bg="whiteAlpha.100" 
            borderRadius="full"
          >
            <Text color="whiteAlpha.900" fontSize="md">
              League ID: {leagueInfo.league.id}
            </Text>
          </Box>
        </VStack>

        {/* Decorative line */}
        <Box w="60%" position="relative" py={8}>
          <Divider borderColor="whiteAlpha.200" />
          <Circle 
            size="40px" 
            bg={BACKGROUND_COLOR}
            border="2px solid"
            borderColor="whiteAlpha.200"
            position="absolute"
            top="50%"
            left="50%"
            transform="translate(-50%, -50%)"
          >
            <Icon as={FaChartLine} color="purple.400" />
          </Circle>
        </Box>

        {/* Manager List */}
        <Box w="full">
          <HStack justify="center" mb={8} spacing={3}>
            <Icon as={FaUsers} boxSize={5} color="purple.400" />
            <Heading size="md" color="white" textAlign="center">
              League Managers
            </Heading>
          </HStack>
          <Box 
            bg="whiteAlpha.50" 
            borderRadius="xl" 
            p={8}
            backdropFilter="blur(10px)"
          >
            <SimpleGrid 
              columns={Math.min(Math.ceil(managers.length / 10), 10)} 
              spacing={8}
              px={4}
              mb={8}
            >
              {managerColumns.map((column, colIndex) => (
                <VStack key={colIndex} align="start" spacing={3}>
                  {column.map((manager, index) => {
                    const position = (colIndex * 10) + index + 1;
                    const positionInfo = getPositionIcon(position);
                    
                    return (
                      <HStack key={manager.entry} spacing={3} align="center">
                        <Box w="24px">
                          {positionInfo ? (
                            <Icon 
                              as={positionInfo.icon} 
                              color={positionInfo.color}
                              boxSize={5}
                            />
                          ) : (
                            <Text 
                              color="purple.400" 
                              fontSize="sm"
                              fontWeight="bold"
                            >
                              {position}.
                            </Text>
                          )}
                        </Box>
                        <VStack spacing={0} align="start">
                          <HStack spacing={2}>
                            <Text 
                              color="white"
                              fontSize="sm"
                              fontWeight="semibold"
                            >
                              {manager.entry_name}
                            </Text>
                            {positionInfo && (
                              <Badge 
                                colorScheme={position === 1 ? "yellow" : position === 2 ? "gray" : "orange"}
                                fontSize="xs"
                              >
                                {positionInfo.label}
                              </Badge>
                            )}
                          </HStack>
                          <Text 
                            color="whiteAlpha.700"
                            fontSize="xs"
                          >
                            {manager.player_name}
                          </Text>
                        </VStack>
                      </HStack>
                    );
                  })}
                </VStack>
              ))}
            </SimpleGrid>

            {/* Percentile Distribution */}
            <VStack spacing={4} w="full">
              <Text color="whiteAlpha.800" fontSize="sm" fontWeight="semibold">
                Points Distribution
              </Text>
              <PercentileBar leagueInfo={leagueInfo} managerHistories={managerHistories} />
            </VStack>
          </Box>
        </Box>
      </VStack>
    </Box>
  );
};

export default CoverPage; 