import { useState, useRef } from 'react';
import {
  ChakraProvider,
  Box,
  VStack,
  Container,
  Button,
  useToast,
  Spinner,
  Text,
} from '@chakra-ui/react';
import { FaFilePdf } from 'react-icons/fa';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import LeagueForm from './components/LeagueForm';
import LeagueStats from './components/LeagueStats';
import Footer from './components/Footer';
import { fetchLeagueInfo, fetchManagerHistory } from './services/fplApi';
import type { LeagueInfo, ManagerHistory } from './services/fplApi';

function App() {
  const [leagueInfo, setLeagueInfo] = useState<LeagueInfo | null>(null);
  const [managerHistories, setManagerHistories] = useState<Record<number, ManagerHistory>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const toast = useToast();

  const handleExportPDF = async () => {
    if (!contentRef.current) return;
    
    setIsExporting(true);
    try {
      const canvas = await html2canvas(contentRef.current, {
        scale: 2,
        logging: false,
        useCORS: true,
      });
      
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      let firstPage = true;
      
      while (heightLeft >= 0) {
        if (!firstPage) {
          pdf.addPage();
        }
        pdf.addImage(
          canvas.toDataURL('image/jpeg', 1.0),
          'JPEG',
          0,
          position,
          imgWidth,
          imgHeight,
          '',
          'FAST'
        );
        heightLeft -= pageHeight;
        position -= pageHeight;
        firstPage = false;
      }
      
      pdf.save('fpl-wrapped-report.pdf');
      toast({
        title: 'Success',
        description: 'PDF exported successfully!',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast({
        title: 'Error',
        description: 'Failed to export PDF. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleSubmit = async (leagueId: string) => {
    setIsLoading(true);
    try {
      const league = await fetchLeagueInfo(leagueId);
      setLeagueInfo(league);

      // Fetch history for all managers
      const histories: Record<number, ManagerHistory> = {};
      for (const manager of league.standings.results) {
        try {
          const history = await fetchManagerHistory(manager.entry);
          histories[manager.entry] = history;
        } catch (error) {
          console.error(`Failed to fetch history for manager ${manager.entry}:`, error);
        }
      }
      setManagerHistories(histories);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to fetch league data',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ChakraProvider>
      <Box minH="100vh" bg="gray.100" position="relative" pb="16">
        <Container maxW="container.xl" pt={8}>
          <VStack spacing={8} align="stretch">
            <LeagueForm onSubmit={handleSubmit} />
            
            {isLoading && (
              <Box textAlign="center" py={10}>
                <Spinner size="xl" />
                <Text mt={4}>Loading league data...</Text>
              </Box>
            )}

            <div ref={contentRef}>
              {leagueInfo && Object.keys(managerHistories).length > 0 && (
                <>
                  <Box mb={4} textAlign="right">
                    <Button
                      leftIcon={<FaFilePdf />}
                      colorScheme="red"
                      onClick={handleExportPDF}
                      isLoading={isExporting}
                      loadingText="Exporting..."
                    >
                      Export as PDF
                    </Button>
                  </Box>
                  <LeagueStats
                    leagueInfo={leagueInfo}
                    managerHistories={managerHistories}
                  />
                </>
              )}
            </div>
          </VStack>
        </Container>
        <Footer />
      </Box>
    </ChakraProvider>
  );
}

export default App; 