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
import { IoFootball } from 'react-icons/io5';

const AWARDS_BG_COLOR = "rgb(0, 255, 133)";
const AWARDS_TEXT_COLOR = "rgb(56, 0, 60)";

interface LeagueFormProps {
  onSubmit: (leagueId: string) => void;
}

const LeagueForm = ({ onSubmit }: LeagueFormProps) => {
  const [leagueId, setLeagueId] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (leagueId) {
      onSubmit(leagueId);
    }
  };

  return (
    <Box bg={AWARDS_BG_COLOR} minH="100vh" display="flex" flexDirection="column">
      {/* Main title section - takes up most of the viewport */}
      <Box flex="1" display="flex" alignItems="center" justifyContent="center" pb={0}>
        <VStack spacing={2}>
          <HStack spacing={4} alignItems="center">
            <Heading
              as="h1"
              fontSize={{ base: "6xl", md: "8xl", lg: "9xl" }}
              fontWeight="black"
              color={AWARDS_TEXT_COLOR}
              textAlign="center"
              letterSpacing="tight"
              fontFamily="Roboto"
            >
              FPL Wrapped
            </Heading>
            <Box
              as={IoFootball}
              boxSize={{ base: "40px", md: "60px" }}
              color={AWARDS_TEXT_COLOR}
              transition="transform 0.3s"
              transformOrigin="center"
              animation="spin 10s linear infinite"
              sx={{
                "@keyframes spin": {
                  "0%": { transform: "rotate(0deg)" },
                  "100%": { transform: "rotate(360deg)" }
                }
              }}
            />
          </HStack>
          
          <Text 
            fontSize={{ base: "lg", md: "xl" }} 
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

          <VStack spacing={0} w="full">
            <Box w="full" px={8}>
              <Divider borderColor={AWARDS_TEXT_COLOR} opacity={0.3} />
              <VStack py={2} spacing={1}>
                <Text 
                  textAlign="center"
                  color={AWARDS_TEXT_COLOR}
                  fontSize="md"
                  fontFamily="Roboto"
                  fontWeight="medium"
                >
                  How to find your league ID:
                </Text>
                <OrderedList 
                  spacing={0.5} 
                  color={AWARDS_TEXT_COLOR} 
                  fontSize="sm"
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

            {/* Form section - directly after instructions */}
            <Box
              as="form"
              onSubmit={handleSubmit}
              w="full"
              maxW="xl"
              mx="auto"
              mt={4}
            >
              <HStack spacing={4} align="flex-start">
                <Text
                  color={AWARDS_TEXT_COLOR}
                  fontSize="sm"
                  fontFamily="Roboto"
                  fontWeight="light"
                  letterSpacing="wider"
                  pt={4}
                  whiteSpace="nowrap"
                >
                  ENTER LEAGUE ID
                </Text>
                <VStack spacing={2} flex="1">
                  <Input
                    placeholder="League ID (e.g., 123456)"
                    value={leagueId}
                    onChange={(e) => setLeagueId(e.target.value)}
                    size="lg"
                    type="number"
                    bg={AWARDS_TEXT_COLOR}
                    color="white"
                    _placeholder={{ color: "whiteAlpha.700" }}
                    _hover={{ bg: AWARDS_TEXT_COLOR }}
                    _focus={{ 
                      bg: AWARDS_TEXT_COLOR,
                      borderColor: "white",
                      boxShadow: "0 0 0 1px white"
                    }}
                    fontSize="lg"
                    height="60px"
                    borderRadius="lg"
                    borderColor="whiteAlpha.300"
                    fontFamily="Roboto"
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
                    fontSize="lg"
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
        </VStack>
      </Box>

      {/* Bottom spacing */}
      <Box h={20} />
    </Box>
  );
};

export default LeagueForm; 