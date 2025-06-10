import { useState } from 'react';
import {
  Box,
  VStack,
  Heading,
  Input,
  Button,
  Text,
  Link,
  OrderedList,
  ListItem,
  Container,
  HStack,
  Divider,
} from '@chakra-ui/react';
import { keyframes } from '@emotion/react';
import { GiSoccerBall } from 'react-icons/gi';
import { BsChevronDoubleDown } from 'react-icons/bs';

const AWARDS_BG_COLOR = "rgb(0, 255, 133)";
const AWARDS_TEXT_COLOR = "rgb(56, 0, 60)";

const pulseKeyframes = keyframes`
  0% { transform: translateY(0); opacity: 1; }
  50% { transform: translateY(10px); opacity: 0.5; }
  100% { transform: translateY(0); opacity: 1; }
`;

interface LeagueFormProps {
  onSubmit: (leagueId: string) => void;
  hasData?: boolean;
}

const LeagueForm = ({ onSubmit, hasData = false }: LeagueFormProps) => {
  const [leagueId, setLeagueId] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (leagueId) {
      onSubmit(leagueId);
    }
  };

  const scrollToContent = () => {
    const content = document.getElementById('league-content');
    if (content) {
      content.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <Box 
      bg={AWARDS_BG_COLOR} 
      minH="100vh" 
      display="flex" 
      flexDirection="column"
      w="100vw"
      position="relative"
      left="50%"
      right="50%"
      mx="-50vw"
    >
      {/* Main title section - takes up most of the viewport */}
      <Box flex="1" display="flex" alignItems="center" justifyContent="center" pb={0}>
        <VStack spacing={2}>
          <HStack spacing={4} alignItems="center">
            <Heading
              as="h1"
              fontSize={{ base: "5xl", md: "7xl", lg: "8xl" }}
              fontWeight="black"
              color={AWARDS_TEXT_COLOR}
              textAlign="center"
              letterSpacing="tight"
              fontFamily="Roboto"
            >
              FPL Wrapped
            </Heading>
            <Box
              as={GiSoccerBall}
              boxSize={{ base: "35px", md: "50px" }}
              color={AWARDS_TEXT_COLOR}
              sx={{
                imageRendering: "pixelated",
                transform: "scale(1.2)",
                filter: "contrast(1.1)"
              }}
            />
          </HStack>
          
          <Text 
            fontSize={{ base: "md", md: "lg" }} 
            textAlign="center" 
            color={AWARDS_TEXT_COLOR}
            maxW="2xl"
            opacity={0.8}
            fontFamily="Roboto"
            fontWeight="light"
            fontStyle="italic"
            mb={3}
          >
            Your League's Fantasy Premier League season visualized and analyzed
          </Text>

          <Box w="full" px={8}>
            <Divider borderColor={AWARDS_TEXT_COLOR} opacity={0.3} />
            <VStack py={2} spacing={1}>
              <Text 
                textAlign="center"
                color={AWARDS_TEXT_COLOR}
                fontSize="sm"
                fontFamily="Roboto"
                fontWeight="medium"
              >
                How to find your league ID:
              </Text>
              <OrderedList 
                spacing={0.5} 
                color={AWARDS_TEXT_COLOR} 
                fontSize="xs"
                opacity={0.8}
                fontFamily="Roboto"
                fontWeight="light"
                textAlign="center"
                listStylePosition="inside"
              >
                <ListItem>Visit the <Link href="https://fantasy.premierleague.com/" isExternal color={AWARDS_TEXT_COLOR} fontWeight="medium" _hover={{ opacity: 0.8 }}>FPL website</Link></ListItem>
                <ListItem>Click on your league name</ListItem>
                <ListItem>Copy the number from the URL</ListItem>
              </OrderedList>
            </VStack>
            <Divider borderColor={AWARDS_TEXT_COLOR} opacity={0.3} />
          </Box>

          {/* Form section */}
          <Box 
            as="form"
            onSubmit={handleSubmit}
            w="full" 
            maxW="md" 
            px={4}
          >
            <HStack spacing={4} align="stretch">
              <VStack flex={1} spacing={2}>
                <Input
                  type="text"
                  placeholder="ENTER LEAGUE ID"
                  value={leagueId}
                  onChange={(e) => setLeagueId(e.target.value)}
                  size="lg"
                  height="60px"
                  bg={AWARDS_TEXT_COLOR}
                  color="white"
                  border="none"
                  _placeholder={{ 
                    color: "whiteAlpha.700",
                    fontSize: "md",
                    letterSpacing: "wider"
                  }}
                  fontSize="md"
                  fontFamily="Roboto"
                  _hover={{ bg: AWARDS_TEXT_COLOR }}
                  _focus={{
                    bg: AWARDS_TEXT_COLOR,
                    boxShadow: "0 0 0 1px white"
                  }}
                />
                <Button
                  type="submit"
                  size="lg"
                  w="full"
                  height="60px"
                  isDisabled={!leagueId}
                  bg={AWARDS_TEXT_COLOR}
                  color="white"
                  _hover={{ 
                    bg: AWARDS_TEXT_COLOR,
                    opacity: 0.9 
                  }}
                  _active={{
                    bg: AWARDS_TEXT_COLOR,
                    opacity: 0.8
                  }}
                  fontSize="md"
                  fontWeight="bold"
                  borderRadius="lg"
                  fontFamily="Roboto"
                  fontStyle="italic"
                >
                  Generate Wrapped
                </Button>
              </VStack>
            </HStack>
          </Box>
        </VStack>
      </Box>

      {/* Pulsing arrow - only show when there's data */}
      {hasData && (
        <Box
          position="absolute"
          bottom="40px"
          left="50%"
          transform="translateX(-50%)"
          cursor="pointer"
          onClick={scrollToContent}
          animation={`${pulseKeyframes} 2s infinite ease-in-out`}
          _hover={{ opacity: 0.8 }}
          transition="opacity 0.2s"
        >
          <BsChevronDoubleDown 
            size={40} 
            color={AWARDS_TEXT_COLOR}
          />
        </Box>
      )}
    </Box>
  );
};

export default LeagueForm; 