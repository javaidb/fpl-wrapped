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
  extendTheme,
} from '@chakra-ui/react';
import { FaFilePdf } from 'react-icons/fa';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import LeagueForm from './components/LeagueForm';
import LeagueStats from './components/LeagueStats';
import Footer from './components/Footer';
import { fetchLeagueInfo, fetchManagerHistory } from './services/fplApi';
import type { LeagueInfo, ManagerHistory } from './services/fplApi';

const BACKGROUND_COLOR = 'rgb(38, 38, 38)';

// Define the custom theme
const theme = extendTheme({
  config: {
    initialColorMode: 'dark',
    useSystemColorMode: false,
  },
  styles: {
    global: {
      'html, body': {
        backgroundColor: BACKGROUND_COLOR,
        color: 'white',
      },
      '#root': {
        backgroundColor: BACKGROUND_COLOR,
      },
      '*::placeholder': {
        color: 'whiteAlpha.400',
      },
      '*, *::before, &::after': {
        borderColor: 'whiteAlpha.200',
      },
    },
  },
  colors: {
    gray: {
      700: '#2d3748',
      800: '#1a202c',
      900: '#171923',
    },
  },
});

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
      // Create a wrapper div for better background control
      const wrapper = document.createElement('div');
      wrapper.style.backgroundColor = BACKGROUND_COLOR;
      wrapper.style.position = 'absolute';
      wrapper.style.left = '-9999px';
      wrapper.style.top = '-9999px';
      document.body.appendChild(wrapper);

      // Get all pages
      const pages = contentRef.current.querySelectorAll('.pdf-page');
      const pdf = new jsPDF('p', 'mm', 'a4', true);
      let isFirstPage = true;

      // Process each page
      for (let i = 0; i < pages.length; i++) {
        const page = pages[i] as HTMLElement;
        
        // Add a new page for all pages except the first
        if (!isFirstPage) {
          pdf.addPage();
        }
        isFirstPage = false;

        // Clone the page and prepare it for export
        const pageClone = page.cloneNode(true) as HTMLElement;
        pageClone.style.backgroundColor = BACKGROUND_COLOR;
        wrapper.appendChild(pageClone);

        // Create canvas for the current page
        const canvas = await html2canvas(pageClone, {
          scale: 2,
          logging: false,
          useCORS: true,
          backgroundColor: BACKGROUND_COLOR,
          onclone: (clonedDoc) => {
            const elements = clonedDoc.getElementsByTagName('*');
            for (let i = 0; i < elements.length; i++) {
              const el = elements[i] as HTMLElement;
              const computedStyle = window.getComputedStyle(el);
              if (computedStyle.backgroundColor === 'rgba(0, 0, 0, 0)' || 
                  computedStyle.backgroundColor === 'transparent' ||
                  computedStyle.backgroundColor === '') {
                el.style.backgroundColor = BACKGROUND_COLOR;
              }
            }
          }
        });

        // Calculate dimensions
        const imgWidth = 210; // A4 width in mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        // Add the page content with background
        pdf.setFillColor(38, 38, 38);
        pdf.rect(0, 0, pdf.internal.pageSize.getWidth(), pdf.internal.pageSize.getHeight(), 'F');
        pdf.addImage(
          canvas.toDataURL('image/jpeg', 1.0),
          'JPEG',
          0,
          0,
          imgWidth,
          imgHeight,
          '',
          'FAST'
        );

        // Clean up
        wrapper.removeChild(pageClone);
      }

      // Add footer to each page
      const footer = document.querySelector('footer');
      if (footer) {
        const footerClone = footer.cloneNode(true) as HTMLElement;
        footerClone.style.backgroundColor = BACKGROUND_COLOR;
        wrapper.appendChild(footerClone);

        const footerCanvas = await html2canvas(footerClone, {
          scale: 2,
          logging: false,
          useCORS: true,
          backgroundColor: BACKGROUND_COLOR,
          onclone: (clonedDoc) => {
            const elements = clonedDoc.getElementsByTagName('*');
            for (let i = 0; i < elements.length; i++) {
              const el = elements[i] as HTMLElement;
              const computedStyle = window.getComputedStyle(el);
              if (computedStyle.backgroundColor === 'rgba(0, 0, 0, 0)' || 
                  computedStyle.backgroundColor === 'transparent' ||
                  computedStyle.backgroundColor === '') {
                el.style.backgroundColor = BACKGROUND_COLOR;
              }
            }
          }
        });

        const footerWidth = 210; // A4 width
        const footerHeight = (footerCanvas.height * footerWidth) / footerCanvas.width;

        // Add footer to all pages
        const pageCount = pdf.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
          pdf.setPage(i);
          pdf.addImage(
            footerCanvas.toDataURL('image/jpeg', 1.0),
            'JPEG',
            0,
            297 - footerHeight, // A4 height - footer height
            footerWidth,
            footerHeight,
            '',
            'FAST'
          );
        }

        // Clean up
        wrapper.removeChild(footerClone);
      }

      // Clean up wrapper
      document.body.removeChild(wrapper);
      
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
    <ChakraProvider theme={theme}>
      <Box minH="100vh" bg={BACKGROUND_COLOR} position="relative" pb="16">
        <Container maxW="container.xl" pt={8} bg={BACKGROUND_COLOR}>
          <VStack spacing={8} align="stretch" bg={BACKGROUND_COLOR}>
            <LeagueForm onSubmit={handleSubmit} />
            
            {isLoading && (
              <Box textAlign="center" py={10} bg={BACKGROUND_COLOR}>
                <Spinner size="xl" />
                <Text mt={4}>Loading league data...</Text>
              </Box>
            )}

            <div ref={contentRef} style={{ backgroundColor: BACKGROUND_COLOR }}>
              {leagueInfo && Object.keys(managerHistories).length > 0 && (
                <>
                  <Box mb={4} textAlign="right" bg={BACKGROUND_COLOR}>
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