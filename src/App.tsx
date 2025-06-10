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
import CoverPage from './components/CoverPage';
import { createRoot } from 'react-dom/client';

const BACKGROUND_COLOR = 'rgb(38, 38, 38)';

// Define the custom theme
export const theme = extendTheme({
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

      // Add footer to each page (except cover page)
      const footer = document.querySelector('footer');
      if (footer) {
        const footerClone = footer.cloneNode(true) as HTMLElement;
        footerClone.style.backgroundColor = BACKGROUND_COLOR;
        
        // Create a new Footer component instance for PDF
        const pdfFooter = document.createElement('div');
        const pdfFooterRoot = createRoot(pdfFooter);
        pdfFooterRoot.render(<Footer isPdf={true} />);
        wrapper.appendChild(pdfFooter);

        const footerCanvas = await html2canvas(pdfFooter, {
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

        // Add footer to all pages except the cover page
        const pageCount = pdf.getNumberOfPages();
        for (let i = 2; i <= pageCount; i++) { // Start from page 2
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
        wrapper.removeChild(pdfFooter);
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
      
      // Sort managers by rank and take top 50
      const topManagers = [...league.standings.results]
        .sort((a, b) => a.rank - b.rank)
        .slice(0, 50);
      
      // Update league info with only top 50 managers
      setLeagueInfo({
        ...league,
        standings: {
          ...league.standings,
          results: topManagers
        }
      });

      // Initialize histories with empty object
      const histories: Record<number, ManagerHistory> = {};
      setManagerHistories(histories);

      // Function to fetch a single manager's history with retries
      const fetchManagerHistoryWithRetry = async (manager: { entry: number; player_name: string }, retries = 3): Promise<void> => {
        for (let attempt = 1; attempt <= retries; attempt++) {
          try {
            const history = await fetchManagerHistory(manager.entry);
            // Update histories incrementally
            setManagerHistories(prev => ({
              ...prev,
              [manager.entry]: history
            }));
            return;
          } catch (error) {
            console.error(`Attempt ${attempt} failed for manager ${manager.entry}:`, error);
            if (attempt === retries) {
              toast({
                title: 'Warning',
                description: `Failed to fetch data for ${manager.player_name}. Try generating again.`,
                status: 'warning',
                duration: 5000,
                isClosable: true
              });
            } else {
              // Wait before retrying, with exponential backoff
              await new Promise(resolve => setTimeout(resolve, attempt * 1000));
            }
          }
        }
      };

      // Fetch histories with some concurrency control
      const BATCH_SIZE = 5; // Process 5 managers at a time
      for (let i = 0; i < topManagers.length; i += BATCH_SIZE) {
        const batch = topManagers.slice(i, i + BATCH_SIZE);
        await Promise.all(batch.map(manager => fetchManagerHistoryWithRetry(manager)));
      }

    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to fetch league data',
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ChakraProvider theme={theme}>
      <Box minH="100vh" bg={BACKGROUND_COLOR} position="relative" pb="16" overflow="hidden">
        <Box w="100%" bg={BACKGROUND_COLOR}>
          <VStack spacing={8} align="stretch" bg={BACKGROUND_COLOR}>
            <LeagueForm 
              onSubmit={handleSubmit} 
              hasData={!!leagueInfo && Object.keys(managerHistories).length > 0}
            />
            
            {isLoading && (
              <Box textAlign="center" py={10} bg={BACKGROUND_COLOR}>
                <Spinner size="xl" />
                <Text mt={4}>Loading league data...</Text>
              </Box>
            )}

            <div 
              id="league-content"
              ref={contentRef} 
              style={{ backgroundColor: BACKGROUND_COLOR }}
            >
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
                  <CoverPage leagueInfo={leagueInfo} managerHistories={managerHistories} />
                  <LeagueStats
                    leagueInfo={leagueInfo}
                    managerHistories={managerHistories}
                  />
                </>
              )}
            </div>
          </VStack>
        </Box>
        <Footer isPdf={false} />
      </Box>
    </ChakraProvider>
  );
}

export default App; 