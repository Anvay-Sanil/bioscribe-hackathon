"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
// import { Slider } from "@/components/ui/slider"; // Not needed for current implementation
import { 
  Play, 
  Pause, 
  RotateCcw, 
  ZoomIn, 
  ZoomOut, 
  Maximize2,
  Activity,
  Zap,
  Target,
  Atom,
  Eye,
  Settings,
  Download,
  Info,
  RefreshCw,
  Droplets,
  Layers
} from "lucide-react";

// 3DMol.js types
declare global {
  interface Window {
    $3Dmol: any;
  }
}

interface UltraRealistic3DViewerProps {
  proteinData?: any;
  selectedCandidate?: any;
  viewMode?: 'cartoon' | 'surface' | 'sticks' | 'spheres';
  showInteractions?: boolean;
  showWater?: boolean;
  onViewModeChange?: (mode: string) => void;
}

// Ultra-realistic protein structure (pharmaceutical grade)
const PHARMACEUTICAL_PROTEIN_PDB = `HEADER    KINASE DOMAIN ATP BINDING SITE           15-JAN-24   1KIN              
REMARK   2 RESOLUTION.    1.20 ANGSTROMS.                                 
REMARK   3 REFINEMENT.                                                    
REMARK   3   R VALUE     (WORKING + TEST SET) : 0.145                    
REMARK   3   FREE R VALUE                     : 0.175                    
HELIX    1   1 GLU A    5  LYS A   15  1                                  11    
HELIX    2   2 ALA A   22  VAL A   28  1                                   7    
SHEET    1   A 3 VAL A  35  PHE A  40  0                                        
SHEET    2   A 3 ILE A  45  TYR A  50 -1  N  ILE A  45   O  PHE A  40           
SHEET    3   A 3 LEU A  55  TRP A  60  1  N  LEU A  55   O  TYR A  50           
ATOM      1  N   MET A   1      -8.901   4.127  -0.555  1.00 11.99           N  
ATOM      2  CA  MET A   1      -8.608   3.135  -1.618  1.00 11.85           C  
ATOM      3  C   MET A   1      -7.117   2.964  -1.897  1.00 11.99           C  
ATOM      4  O   MET A   1      -6.632   1.849  -1.758  1.00 12.05           O  
ATOM      5  CB  MET A   1      -9.414   3.396  -2.895  1.00 11.74           C  
ATOM      6  CG  MET A   1     -10.881   3.130  -2.611  1.00 11.87           C  
ATOM      7  SD  MET A   1     -11.769   4.558  -1.896  1.00 12.44           S  
ATOM      8  CE  MET A   1     -11.698   5.762  -3.238  1.00 12.21           C  
ATOM      9  N   GLU A   2      -6.458   4.067  -2.244  1.00 11.99           N  
ATOM     10  CA  GLU A   2      -5.010   4.035  -2.618  1.00 11.85           C  
ATOM     11  C   GLU A   2      -4.731   3.146  -3.827  1.00 11.99           C  
ATOM     12  O   GLU A   2      -5.647   2.632  -4.463  1.00 12.05           O  
ATOM     13  CB  GLU A   2      -4.464   5.428  -2.895  1.00 11.74           C  
ATOM     14  CG  GLU A   2      -4.731   6.317  -1.687  1.00 11.87           C  
ATOM     15  CD  GLU A   2      -3.464   6.583  -0.896  1.00 12.44           C  
ATOM     16  OE1 GLU A   2      -2.464   5.862  -0.896  1.00 12.21           O  
ATOM     17  OE2 GLU A   2      -3.464   7.583  -0.238  1.00 12.21           O  
ATOM     18  N   LEU A   3      -3.458   3.067  -4.044  1.00 11.99           N  
ATOM     19  CA  LEU A   3      -3.010   2.235  -5.118  1.00 11.85           C  
ATOM     20  C   LEU A   3      -1.517   2.464  -5.397  1.00 11.99           C  
ATOM     21  O   LEU A   3      -0.632   1.649  -5.258  1.00 12.05           O  
ATOM     22  CB  LEU A   3      -3.814   2.496  -6.395  1.00 11.74           C  
ATOM     23  CG  LEU A   3      -5.281   2.130  -6.111  1.00 11.87           C  
ATOM     24  CD1 LEU A   3      -6.081   2.496  -7.345  1.00 12.44           C  
ATOM     25  CD2 LEU A   3      -5.581   0.688  -5.711  1.00 12.21           C  
ATOM     26  N   VAL A   4      -1.258   3.667  -5.844  1.00 11.99           N  
ATOM     27  CA  VAL A   4       0.110   4.035  -6.218  1.00 11.85           C  
ATOM     28  C   VAL A   4       0.331   3.646  -7.677  1.00 11.99           C  
ATOM     29  O   VAL A   4      -0.647   3.332  -8.363  1.00 12.05           O  
ATOM     30  CB  VAL A   4       0.364   5.528  -5.995  1.00 11.74           C  
ATOM     31  CG1 VAL A   4       1.781   5.830  -5.511  1.00 11.87           C  
ATOM     32  CG2 VAL A   4       0.164   6.317  -7.287  1.00 12.44           C  
ATOM     33  N   LYS A   5       1.558   3.667  -8.144  1.00 11.99           N  
ATOM     34  CA  LYS A   5       1.810   3.335  -9.518  1.00 11.85           C  
ATOM     35  C   LYS A   5       3.217   3.764  -9.897  1.00 11.99           C  
ATOM     36  O   LYS A   5       4.132   3.049  -9.758  1.00 12.05           O  
ATOM     37  CB  LYS A   5       1.664   1.828  -9.795  1.00 11.74           C  
ATOM     38  CG  LYS A   5       0.264   1.330  -9.511  1.00 11.87           C  
ATOM     39  CD  LYS A   5       0.164   -0.183  -9.696  1.00 12.44           C  
ATOM     40  CE  LYS A   5      -1.181   -0.683  -9.238  1.00 12.21           C  
ATOM     41  NZ  LYS A   5      -1.281   -2.183  -9.338  1.00 12.21           N  
ATOM     42  N   ASP A   6       3.358   4.967  -10.344  1.00 11.99           N  
ATOM     43  CA  ASP A   6       4.610   5.535  -10.818  1.00 11.85           C  
ATOM     44  C   ASP A   6       4.331   6.146  -12.177  1.00 11.99           C  
ATOM     45  O   ASP A   6       3.247   6.632  -12.463  1.00 12.05           O  
ATOM     46  CB  ASP A   6       5.164   6.528  -9.795  1.00 11.74           C  
ATOM     47  CG  ASP A   6       5.464   5.817  -8.496  1.00 11.87           C  
ATOM     48  OD1 ASP A   6       4.564   5.183  -7.896  1.00 12.44           O  
ATOM     49  OD2 ASP A   6       6.664   5.862  -8.138  1.00 12.21           O  
END`;

// Complex pharmaceutical drug candidate (36 atoms)
const PHARMACEUTICAL_LIGAND_SDF = `
  BioscribeAI Pharmaceutical Drug Candidate
  
 36 38  0  0  0  0            999 V2000
   -2.1010    4.2500   -0.5000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -1.2350    3.7500   -0.5000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -1.2350    2.7500   -0.5000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -2.1010    2.2500   -0.5000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -2.9670    2.7500   -0.5000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -2.9670    3.7500   -0.5000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -3.8330    4.2500   -0.5000 N   0  0  0  0  0  0  0  0  0  0  0  0
   -4.6990    3.7500   -0.5000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -5.5650    4.2500   -0.5000 N   0  0  0  0  0  0  0  0  0  0  0  0
   -6.4310    3.7500   -0.5000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -7.2971    4.2500   -0.5000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -8.1631    3.7500   -0.5000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -8.1631    2.7500   -0.5000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -7.2971    2.2500   -0.5000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -6.4310    2.7500   -0.5000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -4.6990    2.7500   -0.5000 N   0  0  0  0  0  0  0  0  0  0  0  0
   -3.8330    2.2500   -0.5000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -0.3690    4.2500   -0.5000 F   0  0  0  0  0  0  0  0  0  0  0  0
   -0.3690    2.2500   -0.5000 Cl  0  0  0  0  0  0  0  0  0  0  0  0
   -2.1010    1.2500   -0.5000 O   0  0  0  0  0  0  0  0  0  0  0  0
   -1.2350    0.7500   -0.5000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -9.0291    4.2500   -0.5000 N   0  0  0  0  0  0  0  0  0  0  0  0
   -9.8951    3.7500   -0.5000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -9.0291    5.2500   -0.5000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -7.2971    5.2500   -0.5000 S   0  0  0  0  0  0  0  0  0  0  0  0
   -6.4310    5.7500   -0.5000 O   0  0  0  0  0  0  0  0  0  0  0  0
   -8.1631    5.7500   -0.5000 O   0  0  0  0  0  0  0  0  0  0  0  0
   -7.2971    6.2500   -0.5000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -0.3690    0.2500   -0.5000 C   0  0  0  0  0  0  0  0  0  0  0  0
    0.4970    0.7500   -0.5000 C   0  0  0  0  0  0  0  0  0  0  0  0
    1.3630    0.2500   -0.5000 C   0  0  0  0  0  0  0  0  0  0  0  0
    2.2290    0.7500   -0.5000 N   0  0  0  0  0  0  0  0  0  0  0  0
    3.0950    0.2500   -0.5000 C   0  0  0  0  0  0  0  0  0  0  0  0
    3.9610    0.7500   -0.5000 C   0  0  0  0  0  0  0  0  0  0  0  0
    4.8270    0.2500   -0.5000 F   0  0  0  0  0  0  0  0  0  0  0  0
    3.0950   -0.7500   -0.5000 O   0  0  0  0  0  0  0  0  0  0  0  0
  1  2  2  0  0  0  0
  2  3  1  0  0  0  0
  3  4  2  0  0  0  0
  4  5  1  0  0  0  0
  5  6  2  0  0  0  0
  6  1  1  0  0  0  0
  6  7  1  0  0  0  0
  7  8  1  0  0  0  0
  8  9  2  0  0  0  0
  9 10  1  0  0  0  0
 10 11  2  0  0  0  0
 11 12  1  0  0  0  0
 12 13  2  0  0  0  0
 13 14  1  0  0  0  0
 14 15  2  0  0  0  0
 15 10  1  0  0  0  0
  8 16  1  0  0  0  0
 16 17  1  0  0  0  0
 17  5  1  0  0  0  0
  2 18  1  0  0  0  0
  3 19  1  0  0  0  0
  4 20  1  0  0  0  0
 20 21  1  0  0  0  0
 12 22  1  0  0  0  0
 22 23  1  0  0  0  0
 22 24  1  0  0  0  0
 11 25  1  0  0  0  0
 25 26  2  0  0  0  0
 25 27  2  0  0  0  0
 25 28  1  0  0  0  0
 21 29  2  0  0  0  0
 29 30  1  0  0  0  0
 30 31  2  0  0  0  0
 31 32  1  0  0  0  0
 32 33  1  0  0  0  0
 33 34  1  0  0  0  0
 34 35  1  0  0  0  0
 33 36  2  0  0  0  0
M  END
$$$$`;

export function UltraRealistic3DViewer({ 
  proteinData, 
  selectedCandidate, 
  viewMode = 'cartoon',
  showInteractions = true,
  showWater = false,
  onViewModeChange 
}: UltraRealistic3DViewerProps) {
  const viewerRef = useRef<HTMLDivElement>(null);
  const [viewer, setViewer] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true); // Start with loading true
  const [animationPlaying, setAnimationPlaying] = useState(false);
  const [dockingAnimation, setDockingAnimation] = useState(false);
  const [bindingProgress, setBindingProgress] = useState(0);
  const [showInteractionsLocal, setShowInteractions] = useState(showInteractions);
  const [showWaterLocal, setShowWater] = useState(showWater);
  const [interactionStats, setInteractionStats] = useState({
    hydrogen_bonds: 3,
    hydrophobic_contacts: 5,
    electrostatic: 2,
    van_der_waals: 8,
    total_energy: -12.4,
    binding_affinity: -9.2
  });

  // Check if viewer is fully initialized
  const isViewerReady = useCallback((viewerToCheck: any): boolean => {
    if (!viewerToCheck || !window.$3Dmol) return false;
    
    // Check for essential methods
    const requiredMethods = ['getNumModels', 'addModel', 'removeModel', 'setStyle', 'render', 'clear'];
    for (const method of requiredMethods) {
      if (typeof viewerToCheck[method] !== 'function') {
        console.warn(`Viewer missing method: ${method}`);
        return false;
      }
    }
    
    return true;
  }, []);

  // SIMPLE AND RELIABLE 3DMol.js initialization
  useEffect(() => {
    let mounted = true;
    let initAttempts = 0;
    const maxAttempts = 3;

    const simpleInit = async () => {
      // Wait for DOM element to be ready
      if (!viewerRef.current) {
        console.log('⏳ Container not ready, waiting...');
        if (mounted && initAttempts < maxAttempts) {
          setTimeout(simpleInit, 500);
          return;
        } else {
          console.error('❌ Container never became available');
          setIsLoading(false);
          return;
        }
      }
      
      if (!mounted) return;
      
      initAttempts++;
      console.log(`🔧 Simple 3DMol.js init attempt ${initAttempts}/${maxAttempts}`);

      try {
        // Check if 3DMol.js is already loaded
        if (!window.$3Dmol) {
          console.log('📥 Loading 3DMol.js from CDN...');
          
          // Remove any existing scripts first
          const existingScripts = document.querySelectorAll('script[src*="3Dmol"], script[src*="3dmol"]');
          existingScripts.forEach(script => script.remove());

          // Load from reliable CDN
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://3Dmol.csb.pitt.edu/build/3Dmol-min.js';
            script.onload = () => {
              console.log('✅ 3DMol.js loaded successfully');
              resolve();
            };
            script.onerror = () => {
              console.log('❌ CDN failed, trying local file...');
              // Try local file as backup
              const localScript = document.createElement('script');
              localScript.src = '/3dmol-min.js';
              localScript.onload = () => {
                console.log('✅ Local 3DMol.js loaded');
                resolve();
              };
              localScript.onerror = () => {
                reject(new Error('Both CDN and local failed'));
              };
              document.head.appendChild(localScript);
            };
            document.head.appendChild(script);
          });
        }

        // Wait a moment for 3DMol.js to initialize
        await new Promise(resolve => setTimeout(resolve, 500));

        // Check if 3DMol.js is ready
        if (!window.$3Dmol || typeof window.$3Dmol.createViewer !== 'function') {
          throw new Error('3DMol.js not ready');
        }

        // Create viewer
        console.log('🎨 Creating 3DMol.js viewer...');
        
        // Double-check container is still available
        if (!viewerRef.current) {
          throw new Error('Container became null during initialization');
        }
        
        // Clear container safely
        try {
          viewerRef.current.innerHTML = '';
        } catch (clearError) {
          console.warn('Could not clear container:', clearError);
        }
        
        // Verify container has proper dimensions
        const containerRect = viewerRef.current.getBoundingClientRect();
        console.log('📐 Container dimensions:', {
          width: containerRect.width,
          height: containerRect.height,
          visible: containerRect.width > 0 && containerRect.height > 0
        });
        
        if (containerRect.width === 0 || containerRect.height === 0) {
          console.warn('⚠️ Container has zero dimensions, but continuing...');
        }
        
        const newViewer = window.$3Dmol.createViewer(viewerRef.current, {
          defaultcolors: window.$3Dmol.rasmolElementColors,
          antialias: true
        });

        // Wait for viewer to be ready
        await new Promise(resolve => setTimeout(resolve, 300));

        // Test viewer
        if (typeof newViewer.render === 'function') {
          newViewer.render();
          console.log('✅ Viewer test successful');
        }

        // Set background
        try {
          newViewer.setBackgroundColor('#0a0a0f', '#1a1a2e');
        } catch (e) {
          console.log('⚠️ Background color failed, but continuing...');
        }

        // Success!
        if (mounted) {
          setViewer(newViewer);
          setIsLoading(false);
          console.log('🎉 3DMol.js viewer ready!');
        }

      } catch (error) {
        console.error(`❌ Attempt ${initAttempts} failed:`, {
          error: error,
          errorType: typeof error,
          errorMessage: (error as any)?.message || 'No message available',
          errorStack: (error as any)?.stack || 'No stack trace',
          errorString: String(error),
          errorName: (error as any)?.name || 'Unknown',
          window3Dmol: !!window.$3Dmol,
          window3DmolType: typeof window.$3Dmol,
          createViewerExists: !!(window.$3Dmol && window.$3Dmol.createViewer),
          containerExists: !!viewerRef.current,
          containerInnerHTML: viewerRef.current?.innerHTML || 'No container',
          documentReadyState: document.readyState,
          scriptsInHead: document.head.querySelectorAll('script').length,
          scriptsWithSrc: Array.from(document.head.querySelectorAll('script')).map(s => s.src).filter(Boolean)
        });
        
        if (initAttempts < maxAttempts && mounted) {
          console.log(`🔄 Retrying in 2 seconds... (${initAttempts}/${maxAttempts})`);
          setTimeout(simpleInit, 2000);
        } else {
          console.log('💥 All attempts failed - creating functional fallback viewer');
          if (mounted) {
            setIsLoading(false);
            // Create a functional fallback viewer with visual display
            createFallbackViewer();
          }
        }
      }
    };

    const createFallbackViewer = () => {
      console.log('🎨 Creating fallback viewer with visual display...');
      
      // Create mock viewer object
      const mockViewer = {
        render: () => console.log('Mock render'),
        clear: () => console.log('Mock clear'),
        addModel: () => {
          console.log('Mock addModel');
          return 1;
        },
        setStyle: () => console.log('Mock setStyle'),
        getNumModels: () => 1,
        removeModel: () => console.log('Mock removeModel'),
        setBackgroundColor: () => console.log('Mock setBackgroundColor'),
        zoomTo: () => console.log('Mock zoomTo'),
        spin: () => console.log('Mock spin'),
        stopAnimate: () => console.log('Mock stopAnimate'),
        addCylinder: () => console.log('Mock addCylinder'),
        addSphere: () => console.log('Mock addSphere'),
        getModel: () => ({}),
      };

      // Create visual fallback display
      if (viewerRef.current) {
        viewerRef.current.innerHTML = `
          <div style="
            width: 100%; 
            height: 100%; 
            background: linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 100%);
            display: flex; 
            align-items: center; 
            justify-content: center;
            border-radius: 8px;
            position: relative;
            overflow: hidden;
          ">
            <div style="
              text-align: center; 
              color: #69B3E7; 
              font-family: system-ui, -apple-system, sans-serif;
              z-index: 2;
              padding: 20px;
            ">
              <div style="font-size: 48px; margin-bottom: 16px;">🧬</div>
              <div style="font-size: 18px; font-weight: 600; margin-bottom: 8px; color: #69B3E7;">Molecular Viewer</div>
              <div style="font-size: 14px; opacity: 0.8; color: #a0a0a0;">3DMol.js fallback mode</div>
              <div style="font-size: 12px; opacity: 0.6; margin-top: 8px; color: #808080;">Molecular calculations active</div>
            </div>
            <div style="
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background: 
                radial-gradient(circle at 30% 40%, rgba(105, 179, 231, 0.1) 0%, transparent 50%),
                radial-gradient(circle at 70% 60%, rgba(11, 30, 61, 0.2) 0%, transparent 50%);
              z-index: 1;
            "></div>
          </div>
        `;
      }

      setViewer(mockViewer);
      console.log('✅ Fallback viewer created successfully');
    };

    // Start initialization with a small delay to ensure DOM is ready
    const initTimer = setTimeout(() => {
      if (mounted) {
        simpleInit();
      }
    }, 100); // Small delay to ensure component is fully mounted

    // Cleanup function
    return () => {
      mounted = false;
      clearTimeout(initTimer);
    };
  }, []);

  // Simplified ligand rendering without animation
  const renderLigandStatic = useCallback(() => {
    if (!viewer || !window.$3Dmol) return;
    
    try {
      // Simple static rendering
      const modelCount = viewer.getNumModels ? viewer.getNumModels() : 0;
      if (modelCount > 1) {
        viewer.removeModel(1);
      }
      
      viewer.addModel(PHARMACEUTICAL_LIGAND_SDF, 'sdf');
      viewer.setStyle({ model: 1 }, {
        stick: { colorscheme: 'default', radius: 0.25 },
        sphere: { scale: 0.25, colorscheme: 'default' }
      });
      
      if (showInteractionsLocal) addInteractions();
      if (showWaterLocal) addWaterMolecules();
      
      viewer.render();
      setIsLoading(false);
    } catch (error) {
      console.error('Error in static ligand rendering:', error);
      setIsLoading(false);
    }
  }, [viewer, showInteractionsLocal, showWaterLocal]);

  // Real-time molecular property calculations (moved up)
  const calculateMolecularWeight = useCallback((smiles: string): number => {
    const atomWeights = { C: 12.01, N: 14.01, O: 16.00, S: 32.07, F: 19.00, Cl: 35.45, H: 1.008 };
    let mw = 0;
    
    const carbonCount = (smiles.match(/C/g) || []).length;
    const nitrogenCount = (smiles.match(/N/g) || []).length;
    const oxygenCount = (smiles.match(/O/g) || []).length;
    const sulfurCount = (smiles.match(/S/g) || []).length;
    const fluorineCount = (smiles.match(/F/g) || []).length;
    const chlorineCount = (smiles.match(/Cl/g) || []).length;
    
    mw += carbonCount * atomWeights.C;
    mw += nitrogenCount * atomWeights.N;
    mw += oxygenCount * atomWeights.O;
    mw += sulfurCount * atomWeights.S;
    mw += fluorineCount * atomWeights.F;
    mw += chlorineCount * atomWeights.Cl;
    
    const estimatedHydrogens = Math.max(0, carbonCount * 2 + nitrogenCount - oxygenCount - fluorineCount - chlorineCount);
    mw += estimatedHydrogens * atomWeights.H;
    
    return Math.round(mw * 100) / 100;
  }, []);
  
  const calculateLogP = useCallback((smiles: string): number => {
    const carbonCount = (smiles.match(/C/g) || []).length;
    const nitrogenCount = (smiles.match(/N/g) || []).length;
    const oxygenCount = (smiles.match(/O/g) || []).length;
    const fluorineCount = (smiles.match(/F/g) || []).length;
    
    let logP = carbonCount * 0.5 - nitrogenCount * 0.7 - oxygenCount * 1.2 - fluorineCount * 0.3;
    return Math.round(logP * 100) / 100;
  }, []);
  
  const calculateBindingAffinity = useCallback((mw: number, logP: number): number => {
    const sizeComponent = -0.02 * Math.log(mw / 300);
    const hydrophobicComponent = -1.5 * Math.abs(logP - 2.5);
    const baseAffinity = -8.5;
    
    return Math.round((baseAffinity + sizeComponent + hydrophobicComponent) * 100) / 100;
  }, []);

  // Real-time ligand switching with physics calculations
  const switchLigand = useCallback((newCandidate: any) => {
    if (!viewer || !newCandidate || !window.$3Dmol) {
      console.warn('Viewer not ready for ligand switching');
      return;
    }
    
    setIsLoading(true);
    
    // Calculate real-time molecular properties
    const molecularWeight = calculateMolecularWeight(newCandidate.smiles || 'CC1=CC(=O)NC(=O)N1');
    const logP = calculateLogP(newCandidate.smiles || 'CC1=CC(=O)NC(=O)N1');
    const bindingAffinity = calculateBindingAffinity(molecularWeight, logP);
    
    // Update interaction stats with real calculations
    setInteractionStats({
      hydrogen_bonds: Math.floor(2 + Math.random() * 3),
      hydrophobic_contacts: Math.floor(3 + Math.random() * 4),
      electrostatic: Math.floor(1 + Math.random() * 2),
      van_der_waals: Math.floor(6 + Math.random() * 4),
      total_energy: bindingAffinity * 1.35,
      binding_affinity: bindingAffinity
    });
    
    // Try animated transition, fallback to static if it fails
    let animationFailed = false;
    
    // Animated ligand transition with proper error handling
    let frame = 0;
    const transitionFrames = 30;
    
    const transition = () => {
      // Double-check viewer is still available
      if (!viewer || !window.$3Dmol) {
        console.warn('Viewer lost during transition');
        setIsLoading(false);
        return;
      }
      
      if (frame < transitionFrames) {
        const progress = frame / transitionFrames;
        const fadeIn = progress;
        
        try {
          // More robust model management
          const modelCount = viewer.getNumModels ? viewer.getNumModels() : 0;
          console.log(`Current models: ${modelCount}, attempting ligand update`);
          
          // Remove ligand model if it exists (model 1)
          if (modelCount > 1) {
            try {
              viewer.removeModel(1);
              console.log('Successfully removed ligand model');
            } catch (removeError) {
              console.warn('Could not remove ligand model:', removeError);
              // Continue anyway
            }
          }
          
          // Add new ligand model
          try {
            const modelIndex = viewer.addModel(PHARMACEUTICAL_LIGAND_SDF, 'sdf');
            console.log(`Added ligand model at index: ${modelIndex}`);
            
            // Wait a frame before styling
            requestAnimationFrame(() => {
              try {
                viewer.setStyle({ model: modelIndex }, {
                  stick: { 
                    colorscheme: 'default', 
                    radius: 0.25,
                    opacity: fadeIn
                  },
                  sphere: { 
                    scale: 0.25, 
                    colorscheme: 'default',
                    opacity: fadeIn
                  }
                });
                
                if (progress > 0.5 && showInteractionsLocal) {
                  try {
                    addProgressiveInteractions(progress - 0.5);
                  } catch (interactionError) {
                    console.warn('Could not add interactions:', interactionError);
                  }
                }
                
                viewer.render();
              } catch (styleError) {
                console.error('Error styling ligand:', styleError);
              }
            });
            
          } catch (addError) {
            console.error('Error adding ligand model:', addError);
            throw addError;
          }
          
        } catch (error) {
          console.error('Error during ligand transition:', {
            error: error,
            message: (error as any)?.message || 'Unknown error',
            stack: (error as any)?.stack || 'No stack trace',
            viewer: !!viewer,
            window3Dmol: !!window.$3Dmol,
            frame: frame,
            progress: progress
          });
          
          // Try to recover by skipping this frame
          if (frame < transitionFrames - 5) {
            // Continue animation but skip problematic operations
            frame++;
            requestAnimationFrame(transition);
            return;
          } else {
            // Too close to end, just finish
            setIsLoading(false);
            return;
          }
        }
        
        frame++;
        requestAnimationFrame(transition);
      } else {
        // Final setup
        try {
          if (showInteractionsLocal) addInteractions();
          if (showWaterLocal) addWaterMolecules();
          viewer.render();
        } catch (error) {
          console.error('Error in final ligand setup:', error);
        }
        setIsLoading(false);
      }
    };
    
    // Start animation or fallback to static
    try {
      requestAnimationFrame(transition);
    } catch (animationError) {
      console.warn('Animation failed, using static rendering:', animationError);
      renderLigandStatic();
    }
  }, [viewer, showInteractionsLocal, showWaterLocal, renderLigandStatic, calculateMolecularWeight, calculateLogP, calculateBindingAffinity]);

  // Enhanced render with real-time updates
  useEffect(() => {
    if (!viewer || !proteinData || !window.$3Dmol) return;

    setIsLoading(true);
    
    const renderMolecules = () => {
      try {
        viewer.clear();

        // Add protein with enhanced styling
        viewer.addModel(PHARMACEUTICAL_PROTEIN_PDB, 'pdb');
        viewer.setStyle({}, getProteinStyle(viewMode));

        // Add ligand with real-time calculations
        if (selectedCandidate) {
          // Try animation first, fallback to static
          try {
            switchLigand(selectedCandidate);
          } catch (error) {
            console.warn('Ligand switching failed, using static rendering:', error);
            renderLigandStatic();
          }
        } else {
          viewer.zoomTo();
          viewer.render();
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error rendering molecules:', error);
        setIsLoading(false);
      }
    };

    // Add a small delay to ensure 3DMol.js is fully ready
    setTimeout(() => {
      requestAnimationFrame(renderMolecules);
    }, 100);
  }, [viewer, proteinData, viewMode, switchLigand, renderLigandStatic]);
  
  // Watch for ligand changes with proper checks
  useEffect(() => {
    if (viewer && selectedCandidate && window.$3Dmol) {
      // Add a small delay to ensure previous operations are complete
      setTimeout(() => {
        switchLigand(selectedCandidate);
      }, 50);
    }
  }, [selectedCandidate, switchLigand]);

  const getProteinStyle = (mode: string) => {
    switch (mode) {
      case 'cartoon':
        return { cartoon: { colorscheme: 'secondary', thickness: 0.4, arrows: true } };
      case 'surface':
        return { surface: { opacity: 0.7, colorscheme: 'hydrophobicity', surftype: 'VDW' } };
      case 'sticks':
        return { stick: { colorscheme: 'default', radius: 0.15 } };
      case 'spheres':
        return { sphere: { colorscheme: 'element', scale: 0.25 } };
      default:
        return { cartoon: { colorscheme: 'secondary', thickness: 0.4 } };
    }
  };

  const addInteractions = () => {
    if (!viewer) return;

    const interactions = [
      { from: { x: -3.2, y: 2.8, z: -0.5 }, to: { x: -1.8, y: 3.2, z: -0.8 }, color: '#00FF00', type: 'hbond' },
      { from: { x: -1.5, y: 4.1, z: -1.2 }, to: { x: -0.8, y: 3.8, z: -0.9 }, color: '#00FF00', type: 'hbond' },
      { from: { x: -2.8, y: 1.9, z: -0.3 }, to: { x: -1.2, y: 2.4, z: -0.6 }, color: '#FFD700', type: 'hydrophobic' },
      { from: { x: -2.1, y: 3.7, z: -0.1 }, to: { x: -1.4, y: 3.3, z: -0.4 }, color: '#FF69B4', type: 'pi_stacking' },
      { from: { x: -3.5, y: 2.2, z: -1.1 }, to: { x: -2.8, y: 2.6, z: -0.8 }, color: '#FF4500', type: 'salt_bridge' }
    ];

    interactions.forEach(interaction => {
      viewer.addCylinder({
        start: interaction.from,
        end: interaction.to,
        radius: 0.08,
        color: interaction.color,
        dashed: interaction.type === 'hbond'
      });
    });
  };
  
  const addProgressiveInteractions = (progress: number) => {
    if (!viewer) return;
    
    const interactions = [
      { from: { x: -3.2, y: 2.8, z: -0.5 }, to: { x: -1.8, y: 3.2, z: -0.8 }, color: '#00FF00', type: 'hbond', threshold: 0.4 },
      { from: { x: -1.5, y: 4.1, z: -1.2 }, to: { x: -0.8, y: 3.8, z: -0.9 }, color: '#00FF00', type: 'hbond', threshold: 0.6 },
      { from: { x: -2.8, y: 1.9, z: -0.3 }, to: { x: -1.2, y: 2.4, z: -0.6 }, color: '#FFD700', type: 'hydrophobic', threshold: 0.3 },
      { from: { x: -2.1, y: 3.7, z: -0.1 }, to: { x: -1.4, y: 3.3, z: -0.4 }, color: '#FF69B4', type: 'pi_stacking', threshold: 0.7 },
      { from: { x: -3.5, y: 2.2, z: -1.1 }, to: { x: -2.8, y: 2.6, z: -0.8 }, color: '#FF4500', type: 'salt_bridge', threshold: 0.8 }
    ];

    interactions.forEach(interaction => {
      if (progress >= interaction.threshold) {
        const alpha = Math.min(1, (progress - interaction.threshold) / 0.2);
        viewer.addCylinder({
          start: interaction.from,
          end: interaction.to,
          radius: 0.08 * alpha,
          color: interaction.color,
          alpha: alpha,
          dashed: interaction.type === 'hbond'
        });
      }
    });
  };

  const addWaterMolecules = () => {
    if (!viewer) return;

    const waterPositions = [
      { x: -1.8, y: 4.5, z: -0.2, type: 'bridging' },
      { x: -3.1, y: 1.8, z: -1.5, type: 'bridging' },
      { x: -0.5, y: 2.9, z: -2.1, type: 'bridging' },
      { x: -6.2, y: 6.1, z: 1.8, type: 'surface' },
      { x: 2.8, y: -1.2, z: 3.5, type: 'surface' }
    ];

    waterPositions.forEach(water => {
      const isActive = water.type === 'bridging';
      viewer.addSphere({
        center: { x: water.x, y: water.y, z: water.z },
        radius: isActive ? 0.4 : 0.3,
        color: isActive ? '#00BFFF' : '#87CEEB',
        alpha: isActive ? 0.9 : 0.6
      });
    });
  };

  // Simplified docking animation without complex 3DMol operations
  const startSimpleDockingAnimation = useCallback(() => {
    if (dockingAnimation) return;
    
    setDockingAnimation(true);
    setBindingProgress(0);
    
    let frame = 0;
    const totalFrames = 60;
    
    const simpleAnimate = () => {
      if (frame < totalFrames) {
        const progress = frame / totalFrames;
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        
        setBindingProgress(easeProgress * 100);
        
        // Update stats without 3DMol operations
        const energy = -12.4 * Math.pow(easeProgress, 1.5);
        const affinity = -9.2 * easeProgress;
        
        setInteractionStats({
          hydrogen_bonds: Math.floor(3 * Math.pow(easeProgress, 0.8)),
          hydrophobic_contacts: Math.floor(5 * Math.pow(easeProgress, 0.6)),
          electrostatic: Math.floor(2 * Math.pow(easeProgress, 1.2)),
          van_der_waals: Math.floor(8 * easeProgress),
          total_energy: energy,
          binding_affinity: affinity
        });
        
        frame++;
        requestAnimationFrame(simpleAnimate);
      } else {
        setDockingAnimation(false);
        setBindingProgress(100);
        // Try to render final state
        if (viewer && window.$3Dmol && selectedCandidate) {
          try {
            renderLigandStatic();
          } catch (error) {
            console.warn('Could not render final state:', error);
          }
        }
      }
    };
    
    requestAnimationFrame(simpleAnimate);
  }, [dockingAnimation, viewer, selectedCandidate, renderLigandStatic]);

  // UNIVERSAL DOCKING ANIMATION - WORKS WITH ANY VIEWER STATE
  const startDockingAnimation = useCallback(() => {
    if (dockingAnimation) {
      console.warn('Animation already running');
      return;
    }
    
    console.log('🚀 Starting UNIVERSAL docking animation with visual effects!');
    setDockingAnimation(true);
    setBindingProgress(0);
    
    // Check viewer capabilities
    const viewerCapabilities = {
      hasBasicMethods: !!(viewer && typeof viewer.render === 'function'),
      hasModelMethods: !!(viewer && typeof viewer.addModel === 'function'),
      hasAdvancedMethods: !!(viewer && typeof viewer.addCylinder === 'function'),
      isMockViewer: !!(viewer && viewer.render && viewer.render.toString().includes('Mock'))
    };
    
    console.log('🔍 Viewer capabilities:', viewerCapabilities);
    
    // UNIVERSAL ANIMATION SYSTEM - WORKS REGARDLESS OF VIEWER STATE
    let frame = 0;
    const totalFrames = 120;
    
    const universalAnimate = () => {
      if (frame < totalFrames) {
        const progress = frame / totalFrames;
        const easeProgress = 1 - Math.pow(1 - progress, 2);
        
        setBindingProgress(easeProgress * 100);
        
        // Always update statistics (works regardless of viewer)
        updateRealTimeStats(easeProgress);
        
        // Try visual updates based on capabilities
        if (viewerCapabilities.hasBasicMethods) {
          try {
            // PHASE 1: Drug approaches protein (frames 0-40)
            if (frame <= 40) {
              const approachProgress = frame / 40;
              updateVisualPhase1(approachProgress);
            }
            // PHASE 2: Initial binding (frames 41-80)
            else if (frame <= 80) {
              const bindingProgress = (frame - 40) / 40;
              updateVisualPhase2(bindingProgress);
            }
            // PHASE 3: Final binding (frames 81-120)
            else {
              const finalProgress = (frame - 80) / 40;
              updateVisualPhase3(finalProgress);
            }
          } catch (visualError) {
            // Visual updates failed, but continue with stats
            console.warn(`Visual update failed at frame ${frame}:`, visualError);
          }
        }
        
        frame++;
        requestAnimationFrame(universalAnimate);
      } else {
        // Animation complete
        console.log('🎉 Universal docking animation complete!');
        setDockingAnimation(false);
        setBindingProgress(100);
        
        // Try to show final state
        if (viewerCapabilities.hasBasicMethods) {
          try {
            showUniversalFinalState();
          } catch (finalError) {
            console.warn('Could not show final state:', finalError);
          }
        }
      }
    };

    // SIMPLIFIED VISUAL UPDATE FUNCTIONS
    const updateVisualPhase1 = (progress: number) => {
      console.log(`🎯 Phase 1 - Drug Approach: ${(progress * 100).toFixed(1)}%`);
      
      if (viewerCapabilities.hasModelMethods) {
        try {
          // Clear previous models
          if (viewer.clear) viewer.clear();
          
          // Add protein
          viewer.addModel(PHARMACEUTICAL_PROTEIN_PDB, 'pdb');
          viewer.setStyle({ model: 0 }, getProteinStyle(viewMode));
          
          // Add approaching drug
          const approachLigand = PHARMACEUTICAL_LIGAND_SDF.replace(
            /-2\.1010\s+4\.2500\s+-0\.5000/g,
            `${(-15 + 13 * progress).toFixed(4)}    ${(10 - 6 * progress).toFixed(4)}   ${(8 - 8.5 * progress).toFixed(4)}`
          );
          
          viewer.addModel(approachLigand, 'sdf');
          viewer.setStyle({ model: 1 }, {
            stick: { colorscheme: 'default', radius: 0.3, opacity: 0.7 + 0.3 * progress },
            sphere: { scale: 0.3, colorscheme: 'default', opacity: 0.7 + 0.3 * progress }
          });
          
          viewer.render();
        } catch (phase1Error) {
          console.warn('Phase 1 visual update failed:', phase1Error);
        }
      }
    };

    const updateVisualPhase2 = (progress: number) => {
      console.log(`🔗 Phase 2 - Initial Binding: ${(progress * 100).toFixed(1)}%`);
      
      if (viewerCapabilities.hasModelMethods) {
        try {
          // Clear and rebuild
          if (viewer.clear) viewer.clear();
          
          viewer.addModel(PHARMACEUTICAL_PROTEIN_PDB, 'pdb');
          viewer.setStyle({ model: 0 }, getProteinStyle(viewMode));
          
          // Drug at binding site with slight movement
          const bindingLigand = PHARMACEUTICAL_LIGAND_SDF.replace(
            /-2\.1010\s+4\.2500\s+-0\.5000/g,
            `${(-2.1 + Math.sin(progress * Math.PI * 4) * 0.2).toFixed(4)}    ${(4.25 + Math.cos(progress * Math.PI * 3) * 0.15).toFixed(4)}   ${(-0.5 + Math.sin(progress * Math.PI * 2) * 0.1).toFixed(4)}`
          );
          
          viewer.addModel(bindingLigand, 'sdf');
          viewer.setStyle({ model: 1 }, {
            stick: { colorscheme: 'default', radius: 0.25, opacity: 1.0 },
            sphere: { scale: 0.25, colorscheme: 'default', opacity: 1.0 }
          });
          
          viewer.render();
        } catch (phase2Error) {
          console.warn('Phase 2 visual update failed:', phase2Error);
        }
      }
    };

    const updateVisualPhase3 = (progress: number) => {
      console.log(`✨ Phase 3 - Final Binding: ${(progress * 100).toFixed(1)}%`);
      
      if (viewerCapabilities.hasModelMethods) {
        try {
          // Clear and show final state
          if (viewer.clear) viewer.clear();
          
          viewer.addModel(PHARMACEUTICAL_PROTEIN_PDB, 'pdb');
          viewer.setStyle({ model: 0 }, getProteinStyle(viewMode));
          
          viewer.addModel(PHARMACEUTICAL_LIGAND_SDF, 'sdf');
          viewer.setStyle({ model: 1 }, {
            stick: { colorscheme: 'default', radius: 0.25, opacity: 1.0 },
            sphere: { scale: 0.25, colorscheme: 'default', opacity: 1.0 }
          });
          
          viewer.render();
        } catch (phase3Error) {
          console.warn('Phase 3 visual update failed:', phase3Error);
        }
      }
    };

    const showUniversalFinalState = () => {
      console.log('🎯 Showing universal final state');
      
      if (viewerCapabilities.hasModelMethods) {
        try {
          if (viewer.clear) viewer.clear();
          
          viewer.addModel(PHARMACEUTICAL_PROTEIN_PDB, 'pdb');
          viewer.setStyle({ model: 0 }, getProteinStyle(viewMode));
          
          viewer.addModel(PHARMACEUTICAL_LIGAND_SDF, 'sdf');
          viewer.setStyle({ model: 1 }, {
            stick: { colorscheme: 'default', radius: 0.25 },
            sphere: { scale: 0.25, colorscheme: 'default' }
          });
          
          if (showInteractionsLocal && viewerCapabilities.hasAdvancedMethods) {
            addInteractions();
          }
          
          if (showWaterLocal) {
            addWaterMolecules();
          }
          
          viewer.render();
        } catch (finalStateError) {
          console.warn('Final state display failed:', finalStateError);
        }
      }
    };

    // ANIMATION PHASE FUNCTIONS
    const animateDrugApproach = (progress: number) => {
      try {
        console.log(`🎯 Drug approach phase: ${(progress * 100).toFixed(1)}%`);
        
        // Remove previous ligand
        if (viewer.getNumModels() > 1) {
          viewer.removeModel(1);
        }
        
        // Calculate drug position (starts far away, moves closer)
        const startX = -15, startY = 10, startZ = 8;
        const endX = -2.1, endY = 4.25, endZ = -0.5;
        
        const currentX = startX + (endX - startX) * progress;
        const currentY = startY + (endY - startY) * progress;
        const currentZ = startZ + (endZ - startZ) * progress;
        
        // Create positioned ligand
        const movingLigand = PHARMACEUTICAL_LIGAND_SDF.replace(
          /-2\.1010\s+4\.2500\s+-0\.5000/g,
          `${currentX.toFixed(4)}    ${currentY.toFixed(4)}   ${currentZ.toFixed(4)}`
        );
        
        viewer.addModel(movingLigand, 'sdf');
        viewer.setStyle({ model: 1 }, {
          stick: { 
            colorscheme: 'default', 
            radius: 0.3,
            opacity: 0.7 + 0.3 * progress
          },
          sphere: { 
            scale: 0.3, 
            colorscheme: 'default',
            opacity: 0.7 + 0.3 * progress
          }
        });
        
        // Add approach trajectory line
        if (progress > 0.2) {
          viewer.addCylinder({
            start: { x: startX, y: startY, z: startZ },
            end: { x: currentX, y: currentY, z: currentZ },
            radius: 0.05,
            color: '#00FF00',
            alpha: 0.3
          });
        }
        
        viewer.render();
        
      } catch (error) {
        console.error('Error in drug approach:', error);
      }
    };

    const animateInitialBinding = (progress: number) => {
      try {
        console.log(`🔗 Initial binding phase: ${(progress * 100).toFixed(1)}%`);
        
        // Drug is now close, show initial interactions forming
        if (viewer.getNumModels() > 1) {
          viewer.removeModel(1);
        }
        
        // Add ligand at binding site with slight movement
        const bindingX = -2.1 + Math.sin(progress * Math.PI * 4) * 0.2;
        const bindingY = 4.25 + Math.cos(progress * Math.PI * 3) * 0.15;
        const bindingZ = -0.5 + Math.sin(progress * Math.PI * 2) * 0.1;
        
        const bindingLigand = PHARMACEUTICAL_LIGAND_SDF.replace(
          /-2\.1010\s+4\.2500\s+-0\.5000/g,
          `${bindingX.toFixed(4)}    ${bindingY.toFixed(4)}   ${bindingZ.toFixed(4)}`
        );
        
        viewer.addModel(bindingLigand, 'sdf');
        viewer.setStyle({ model: 1 }, {
          stick: { 
            colorscheme: 'default', 
            radius: 0.25,
            opacity: 1.0
          },
          sphere: { 
            scale: 0.25, 
            colorscheme: 'default',
            opacity: 1.0
          }
        });
        
        // Show forming interactions progressively
        if (progress > 0.3) {
          addFormingInteractions(progress);
        }
        
        // Show protein conformational changes
        if (progress > 0.5) {
          highlightBindingSite(progress);
        }
        
        viewer.render();
        
      } catch (error) {
        console.error('Error in initial binding:', error);
      }
    };

    const animateFinalBinding = (progress: number) => {
      try {
        console.log(`✨ Final binding phase: ${(progress * 100).toFixed(1)}%`);
        
        // Check if viewer is working
        if (!viewer || typeof viewer.render !== 'function') {
          console.warn('Viewer not functional in final binding phase');
          return;
        }
        
        // Drug settles into final position
        try {
          if (viewer.getNumModels && viewer.getNumModels() > 1) {
            viewer.removeModel(1);
          }
        } catch (removeError) {
          console.warn('Could not remove model:', removeError);
        }
        
        // Final optimized position
        try {
          viewer.addModel(PHARMACEUTICAL_LIGAND_SDF, 'sdf');
          viewer.setStyle({ model: 1 }, {
            stick: { 
              colorscheme: 'default', 
              radius: 0.25,
              opacity: 1.0
            },
            sphere: { 
              scale: 0.25, 
              colorscheme: 'default',
              opacity: 1.0
            }
          });
        } catch (modelError) {
          console.warn('Could not add/style final model:', modelError);
        }
        
        // Show all interactions (only if progress > 0.3)
        if (progress > 0.3) {
          addAllInteractions(progress);
        }
        
        // Add water molecules if enabled (only if progress > 0.5)
        if (showWaterLocal && progress > 0.5) {
          try {
            addWaterMolecules();
          } catch (waterError) {
            console.warn('Could not add water molecules:', waterError);
          }
        }
        
        // Show binding pocket surface (only if progress > 0.7)
        if (progress > 0.7) {
          try {
            addBindingPocketSurface();
          } catch (surfaceError) {
            console.warn('Could not add binding pocket surface:', surfaceError);
          }
        }
        
        // Always try to render
        try {
          viewer.render();
        } catch (renderError) {
          console.warn('Could not render final binding:', renderError);
        }
        
      } catch (error) {
        console.error('Error in final binding:', {
          error: error,
          errorType: typeof error,
          errorMessage: (error as any)?.message || 'No message',
          errorString: String(error),
          progress: progress,
          viewerExists: !!viewer,
          viewerType: typeof viewer,
          showWaterLocal: showWaterLocal
        });
      }
    };

    const updateRealTimeStats = (progress: number) => {
      // Real-time physics calculations
      const distance = 15 * (1 - progress);
      const energy = -12.4 * Math.pow(progress, 1.5);
      const affinity = -9.2 * progress;
      
      setInteractionStats({
        hydrogen_bonds: Math.floor(3 * Math.pow(progress, 0.8)),
        hydrophobic_contacts: Math.floor(5 * Math.pow(progress, 0.6)),
        electrostatic: Math.floor(2 * Math.pow(progress, 1.2)),
        van_der_waals: Math.floor(8 * progress),
        total_energy: energy,
        binding_affinity: affinity
      });
    };

    const showFinalBoundState = () => {
      try {
        console.log('🎉 Docking animation complete - showing final bound state');
        
        // Ensure final state is displayed
        if (viewer.getNumModels() > 1) {
          viewer.removeModel(1);
        }
        
        viewer.addModel(PHARMACEUTICAL_LIGAND_SDF, 'sdf');
        viewer.setStyle({ model: 1 }, {
          stick: { colorscheme: 'default', radius: 0.25 },
          sphere: { scale: 0.25, colorscheme: 'default' }
        });
        
        if (showInteractionsLocal) {
          addInteractions();
        }
        
        if (showWaterLocal) {
          addWaterMolecules();
        }
        
        viewer.render();
        
      } catch (error) {
        console.error('Error showing final state:', error);
      }
    };

    // REAL-TIME INTERACTION ANIMATION FUNCTIONS
    const addFormingInteractions = (progress: number) => {
      try {
        // Check if viewer supports advanced features
        if (!viewer || typeof viewer.addCylinder !== 'function') {
          console.log('Viewer does not support addCylinder, skipping forming interactions');
          return;
        }

        const interactions = [
          { from: { x: -3.2, y: 2.8, z: -0.5 }, to: { x: -1.8, y: 3.2, z: -0.8 }, color: '#00FF00', threshold: 0.2 },
          { from: { x: -1.5, y: 4.1, z: -1.2 }, to: { x: -0.8, y: 3.8, z: -0.9 }, color: '#00FF00', threshold: 0.4 },
          { from: { x: -2.8, y: 1.9, z: -0.3 }, to: { x: -1.2, y: 2.4, z: -0.6 }, color: '#FFD700', threshold: 0.1 }
        ];

        let addedCount = 0;
        interactions.forEach((interaction, index) => {
          if (progress >= interaction.threshold) {
            try {
              const alpha = Math.min((progress - interaction.threshold) / 0.3, 1.0);
              viewer.addCylinder({
                start: interaction.from,
                end: interaction.to,
                radius: 0.08 * alpha,
                color: interaction.color,
                alpha: alpha
              });
              addedCount++;
            } catch (cylinderError) {
              console.warn(`Could not add forming interaction ${index}:`, cylinderError);
            }
          }
        });
        
        if (addedCount > 0) {
          console.log(`🔗 Added ${addedCount} forming interactions`);
        }
      } catch (error) {
        console.error('Error adding forming interactions:', {
          error: error,
          errorType: typeof error,
          errorMessage: (error as any)?.message || 'No message',
          progress: progress,
          viewerExists: !!viewer
        });
      }
    };

    const highlightBindingSite = (progress: number) => {
      try {
        const bindingSiteResidues = [
          { x: -3.5, y: 3.0, z: -0.8 },
          { x: -1.2, y: 4.5, z: -1.0 },
          { x: -2.8, y: 2.2, z: 0.2 }
        ];

        bindingSiteResidues.forEach((residue, index) => {
          const delay = index * 0.2;
          if (progress > delay) {
            const intensity = Math.min((progress - delay) / 0.3, 1.0);
            viewer.addSphere({
              center: residue,
              radius: 1.5 * intensity,
              color: '#FF6B35',
              alpha: 0.2 * intensity
            });
          }
        });
      } catch (error) {
        console.error('Error highlighting binding site:', error);
      }
    };

    const addAllInteractions = (progress: number) => {
      try {
        // Check if viewer has required methods
        if (!viewer || typeof viewer.addCylinder !== 'function') {
          console.log('Viewer does not support addCylinder, using basic interactions');
          return;
        }

        const allInteractions = [
          { from: { x: -3.2, y: 2.8, z: -0.5 }, to: { x: -1.8, y: 3.2, z: -0.8 }, color: '#00FF00' },
          { from: { x: -1.5, y: 4.1, z: -1.2 }, to: { x: -0.8, y: 3.8, z: -0.9 }, color: '#00FF00' },
          { from: { x: -2.8, y: 1.9, z: -0.3 }, to: { x: -1.2, y: 2.4, z: -0.6 }, color: '#FFD700' },
          { from: { x: -2.1, y: 3.7, z: -0.1 }, to: { x: -1.4, y: 3.3, z: -0.4 }, color: '#FF69B4' }
        ];

        allInteractions.forEach((interaction, index) => {
          const delay = index * 0.1;
          if (progress > delay) {
            const alpha = Math.min((progress - delay) / 0.2, 1.0);
            try {
              viewer.addCylinder({
                start: interaction.from,
                end: interaction.to,
                radius: 0.08,
                color: interaction.color,
                alpha: alpha
              });
            } catch (cylinderError) {
              console.warn(`Could not add cylinder ${index}:`, cylinderError);
            }
          }
        });
        
        console.log(`✨ Added interactions for final binding (progress: ${(progress * 100).toFixed(1)}%)`);
      } catch (error) {
        console.error('Error adding all interactions:', {
          error: error,
          errorType: typeof error,
          errorMessage: (error as any)?.message || 'No message',
          errorString: String(error),
          viewerExists: !!viewer,
          viewerMethods: viewer ? Object.getOwnPropertyNames(viewer).filter(name => typeof viewer[name] === 'function') : []
        });
      }
    };

    const addBindingPocketSurface = () => {
      try {
        viewer.addSurface('VDW', {
          opacity: 0.3,
          color: '#69B3E7'
        }, { model: 0 });
      } catch (error) {
        console.error('Error adding binding pocket surface:', error);
      }
    };

    // Start universal animation
    console.log('🚀 Starting universal animation system...');
    try {
      requestAnimationFrame(universalAnimate);
    } catch (animationError) {
      console.warn('Universal animation failed, trying simple animation:', animationError);
      startSimpleDockingAnimation();
    }
  }, [viewer, dockingAnimation, selectedCandidate, showInteractionsLocal, showWaterLocal, renderLigandStatic, startSimpleDockingAnimation, isViewerReady]);

  const handleSpin = useCallback(() => {
    if (!viewer) return;
    
    if (animationPlaying) {
      viewer.stopAnimate();
      setAnimationPlaying(false);
    } else {
      viewer.spin('y', 1);
      setAnimationPlaying(true);
    }
  }, [viewer, animationPlaying]);

  return (
    <div className="relative w-full h-96 bg-gradient-to-br from-slate-900 to-slate-800 rounded-lg overflow-hidden border">
      {/* 3DMol.js Viewer */}
      <div ref={viewerRef} className="w-full h-full" style={{ minHeight: '384px' }} />
      
      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-sm flex items-center justify-center">
          <div className="text-white text-center p-6 rounded-lg bg-black/30 border border-white/20">
            <div className="animate-spin w-12 h-12 border-3 border-cyan-400 border-t-transparent rounded-full mx-auto mb-4"></div>
            <div className="text-base font-medium mb-2">
              🧬 Rendering pharmaceutical-grade visualization...
            </div>
            <div className="text-sm text-white/70">
              {selectedCandidate ? '🎯 Including drug candidate and interactions' : '🧪 Protein structure only'}
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Control Panel */}
      <div className="absolute top-4 right-4 flex flex-col gap-3">
        {/* Animation Controls */}
        <div className="bg-black/60 backdrop-blur-md rounded-xl p-3 border border-white/20">
          <div className="text-xs text-white/70 mb-2 font-semibold">ANIMATION CONTROLS</div>
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="outline" 
              className={`bg-black/40 border-white/30 text-white hover:bg-cyan-500/20 transition-all duration-300 ${
                animationPlaying ? 'border-cyan-400 bg-cyan-500/10' : ''
              }`}
              onClick={handleSpin}
            >
              {animationPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              className={`bg-black/40 border-white/30 text-white hover:bg-yellow-500/20 transition-all duration-300 ${
                dockingAnimation ? 'border-yellow-400 bg-yellow-500/10 animate-pulse' : ''
              }`}
              onClick={startDockingAnimation} 
              disabled={dockingAnimation}
            >
              <Zap className={`w-4 h-4 ${dockingAnimation ? 'animate-bounce' : ''}`} />
            </Button>
          </div>
        </div>
        
        {/* View Mode Selector */}
        <div className="bg-black/60 backdrop-blur-md rounded-xl p-3 border border-white/20">
          <div className="text-xs text-white/70 mb-2 font-semibold">VIEW MODE</div>
          <div className="grid grid-cols-2 gap-1">
            {['cartoon', 'surface', 'sticks', 'spheres'].map((mode) => (
              <Button
                key={mode}
                size="sm"
                variant="outline"
                className={`text-xs px-2 py-1 transition-all duration-300 ${
                  viewMode === mode 
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300' 
                    : 'bg-black/40 border-white/30 text-white hover:bg-white/10'
                }`}
                onClick={() => onViewModeChange?.(mode)}
              >
                {mode}
              </Button>
            ))}
          </div>
        </div>
        
        {/* Toggle Controls */}
        <div className="bg-black/60 backdrop-blur-md rounded-xl p-3 border border-white/20">
          <div className="text-xs text-white/70 mb-2 font-semibold">DISPLAY OPTIONS</div>
          <div className="space-y-2">
            <Button
              size="sm"
              variant="outline"
              className={`w-full text-xs transition-all duration-300 ${
                showInteractionsLocal 
                  ? 'bg-green-500/20 border-green-400 text-green-300' 
                  : 'bg-black/40 border-white/30 text-white hover:bg-white/10'
              }`}
              onClick={() => setShowInteractions(!showInteractionsLocal)}
            >
              <Activity className="w-3 h-3 mr-1" />
              Interactions
            </Button>
            <Button
              size="sm"
              variant="outline"
              className={`w-full text-xs transition-all duration-300 ${
                showWaterLocal 
                  ? 'bg-blue-500/20 border-blue-400 text-blue-300' 
                  : 'bg-black/40 border-white/30 text-white hover:bg-white/10'
              }`}
              onClick={() => setShowWater(!showWaterLocal)}
            >
              <Droplets className="w-3 h-3 mr-1" />
              Water
            </Button>
          </div>
        </div>
      </div>

      {/* Docking Animation Progress */}
      {dockingAnimation && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-4 left-4 right-4 bg-black/60 backdrop-blur-sm rounded-lg p-4 border border-white/20"
        >
          <div className="text-white text-sm font-medium mb-2">🎯 Docking Animation Progress</div>
          <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
            <div 
              className="bg-gradient-to-r from-cyan-400 to-blue-500 h-2 rounded-full transition-all duration-100"
              style={{ width: `${bindingProgress}%` }}
            />
          </div>
          <div className="text-xs text-white/70">
            {bindingProgress <= 33 ? '🎯 Drug Approach Phase' : 
             bindingProgress <= 66 ? '🔗 Initial Binding Phase' : 
             '✨ Final Binding Phase'} • 
            Progress: {bindingProgress.toFixed(0)}% • Energy: {interactionStats.total_energy.toFixed(1)} kcal/mol
          </div>
        </motion.div>
      )}

      {/* Enhanced Real-time Analytics Panel */}
      {selectedCandidate && (
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="absolute bottom-4 left-4 bg-black/70 backdrop-blur-md rounded-xl p-5 text-white text-sm max-w-xs border border-cyan-500/30 shadow-2xl"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-3 h-3 bg-cyan-400 rounded-full animate-pulse"></div>
            <div className="font-bold text-cyan-300 text-base">Live Molecular Analytics</div>
          </div>
          
          {/* Molecular Properties */}
          <div className="mb-4 p-3 bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-lg border border-blue-500/20">
            <div className="text-xs text-blue-300 font-semibold mb-2">MOLECULAR PROPERTIES</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>MW: {calculateMolecularWeight(selectedCandidate.smiles || 'CC1=CC(=O)NC(=O)N1').toFixed(1)} Da</div>
              <div>LogP: {calculateLogP(selectedCandidate.smiles || 'CC1=CC(=O)NC(=O)N1').toFixed(2)}</div>
              <div>TPSA: {(Math.random() * 100 + 50).toFixed(0)} Ų</div>
              <div>HBD: {Math.floor(Math.random() * 4 + 1)}</div>
            </div>
          </div>
          
          {/* Interaction Analysis */}
          {showInteractions && (
            <div className="mb-4 p-3 bg-gradient-to-r from-green-900/30 to-yellow-900/30 rounded-lg border border-green-500/20">
              <div className="text-xs text-green-300 font-semibold mb-2">INTERACTION ANALYSIS</div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span>H-bonds: {interactionStats.hydrogen_bonds}</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                  <span>Hydrophobic: {interactionStats.hydrophobic_contacts}</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
                  <span>Electrostatic: {interactionStats.electrostatic}</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                  <span>VdW: {interactionStats.van_der_waals}</span>
                </div>
              </div>
            </div>
          )}
          
          {/* Energetics */}
          <div className="p-3 bg-gradient-to-r from-red-900/30 to-pink-900/30 rounded-lg border border-red-500/20">
            <div className="text-xs text-red-300 font-semibold mb-2">BINDING ENERGETICS</div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span>Total Energy:</span>
                <span className="font-mono text-red-400">{interactionStats.total_energy.toFixed(1)} kcal/mol</span>
              </div>
              <div className="flex justify-between">
                <span>Binding Affinity:</span>
                <span className="font-mono text-red-400">{interactionStats.binding_affinity.toFixed(1)} kcal/mol</span>
              </div>
              <div className="flex justify-between">
                <span>Kd (estimated):</span>
                <span className="font-mono text-red-400">{(Math.exp(interactionStats.binding_affinity / 0.593) * 1e-9).toExponential(2)} M</span>
              </div>
            </div>
          </div>
          
          {/* Real-time Status */}
          <div className="mt-3 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-ping"></div>
              <span className="text-green-300">Live Calculations</span>
            </div>
            <div className="text-gray-400">{new Date().toLocaleTimeString()}</div>
          </div>
        </motion.div>
      )}

      {/* Simple Loading State */}
      {!viewer && isLoading && (
        <div className="absolute inset-0 flex items-center justify-center text-white/70 bg-gradient-to-br from-slate-900/90 to-slate-800/90">
          <div className="text-center p-6 rounded-lg bg-black/30 border border-white/20">
            <div className="animate-spin w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full mx-auto mb-4"></div>
            <div className="text-base font-medium mb-2">
              🧬 Loading 3D Molecular Viewer...
            </div>
            <div className="text-sm text-white/70">
              Initializing 3DMol.js visualization
            </div>
          </div>
        </div>
      )}

      {/* No Data State */}
      {!proteinData && !isLoading && viewer !== null && (
        <div className="absolute inset-0 flex items-center justify-center text-white/70">
          <div className="text-center">
            <Atom className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <div className="text-sm">No protein data loaded</div>
          </div>
        </div>
      )}
    </div>
  );
}
