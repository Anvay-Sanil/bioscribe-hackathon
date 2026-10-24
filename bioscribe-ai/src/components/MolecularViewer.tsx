"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Play, 
  Pause, 
  RotateCcw, 
  ZoomIn, 
  ZoomOut,
  Maximize,
  Download,
  Settings
} from "lucide-react";

// 3DMol.js types
declare global {
  interface Window {
    $3Dmol: any;
  }
}

interface MolecularViewerProps {
  proteinData?: any;
  selectedCandidate?: any;
  viewMode: 'cartoon' | 'surface' | 'sticks' | 'spheres';
  showInteractions: boolean;
  showWater: boolean;
  onViewModeChange?: (mode: string) => void;
}

// Enhanced realistic protein PDB data (kinase domain structure)
const MOCK_PROTEIN_PDB = `HEADER    TRANSFERASE/TRANSFERASE INHIBITOR       15-JAN-23   1KIN              
REMARK   2 RESOLUTION.    1.80 ANGSTROMS.                                 
REMARK   3 REFINEMENT.                                                    
REMARK   3   R VALUE     (WORKING + TEST SET) : 0.195                    
REMARK   3   FREE R VALUE                     : 0.235                    
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

// Enhanced realistic kinase inhibitor SDF data (positioned in binding pocket)
const MOCK_LIGAND_SDF = `
  BioscribeAI 01082025

 24 26  0  0  0  0            999 V2000
   -1.7010    3.7500   -1.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -0.8350    3.2500   -1.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -0.8350    2.2500   -1.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -1.7010    1.7500   -1.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -2.5670    2.2500   -1.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -2.5670    3.2500   -1.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -3.4330    3.7500   -1.0000 N   0  0  0  0  0  0  0  0  0  0  0  0
   -4.2990    3.2500   -1.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -5.1650    3.7500   -1.0000 N   0  0  0  0  0  0  0  0  0  0  0  0
   -6.0310    3.2500   -1.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -6.8971    3.7500   -1.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -7.7631    3.2500   -1.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -7.7631    2.2500   -1.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -6.8971    1.7500   -1.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -6.0310    2.2500   -1.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -4.2990    2.2500   -1.0000 N   0  0  0  0  0  0  0  0  0  0  0  0
   -3.4330    1.7500   -1.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    0.0310    3.7500   -1.0000 F   0  0  0  0  0  0  0  0  0  0  0  0
    0.0310    1.7500   -1.0000 Cl  0  0  0  0  0  0  0  0  0  0  0  0
   -1.7010    0.7500   -1.0000 O   0  0  0  0  0  0  0  0  0  0  0  0
   -0.8350    0.2500   -1.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -8.6291    3.7500   -1.0000 N   0  0  0  0  0  0  0  0  0  0  0  0
   -9.4951    3.2500   -1.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -8.6291    4.7500   -1.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
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
M  END
$$$$`;

export function MolecularViewer({ 
  proteinData, 
  selectedCandidate, 
  viewMode, 
  showInteractions, 
  showWater,
  onViewModeChange 
}: MolecularViewerProps) {
  const viewerRef = useRef<HTMLDivElement>(null);
  const [viewer, setViewer] = useState<any>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [zoom, setZoom] = useState(1);
  
  // Cache for performance optimization
  const [lastRenderKey, setLastRenderKey] = useState<string>('');

  // Initialize 3DMol.js viewer
  useEffect(() => {
    const initViewer = async () => {
      if (!viewerRef.current) return;

      // Load 3DMol.js script if not already loaded
      if (!window.$3Dmol) {
        const script = document.createElement('script');
        script.src = 'https://3Dmol.csb.pitt.edu/build/3Dmol-min.js';
        script.onload = () => {
          createViewer();
        };
        document.head.appendChild(script);
      } else {
        createViewer();
      }
    };

    const createViewer = () => {
      if (!viewerRef.current || !window.$3Dmol) return;

      // Clear existing viewer
      viewerRef.current.innerHTML = '';

      // Create optimized viewer with performance settings
      const newViewer = window.$3Dmol.createViewer(viewerRef.current, {
        defaultcolors: window.$3Dmol.rasmolElementColors,
        antialias: false, // Disable for better performance
        preserveDrawingBuffer: false // Reduce memory usage
      });

      // Set realistic background with gradient effect
      newViewer.setBackgroundColor('#1a1a2e', '#16213e');

      setViewer(newViewer);
      setIsLoading(false);
    };

    initViewer();

    return () => {
      if (viewer) {
        viewer.clear();
      }
    };
  }, []);

  // Memoize render key for performance optimization
  const renderKey = useMemo(() => {
    return `${proteinData?.name || 'none'}-${selectedCandidate?.name || 'none'}-${viewMode}-${showInteractions}-${showWater}`;
  }, [proteinData?.name, selectedCandidate?.name, viewMode, showInteractions, showWater]);

  // Update protein visualization when data changes
  useEffect(() => {
    if (!viewer || !proteinData) return;
    
    // Skip re-render if nothing changed
    if (renderKey === lastRenderKey) return;

    setIsLoading(true);
    
    // Immediate rendering for better performance
    const renderMolecules = () => {
      viewer.clear();

      // Add protein structure
      viewer.addModel(MOCK_PROTEIN_PDB, 'pdb');

      // Apply protein styling based on view mode
      const proteinStyle = getProteinStyle(viewMode);
      viewer.setStyle({}, proteinStyle);

      // Add ligand if selected
      if (selectedCandidate) {
        viewer.addModel(MOCK_LIGAND_SDF, 'sdf');
        
        // Enhanced ligand styling with realistic colors
        viewer.setStyle({ model: 1 }, {
          stick: { 
            colorscheme: 'default',
            radius: 0.25
          },
          sphere: { 
            scale: 0.25,
            colorscheme: 'default'
          }
        });

        // Ligand is already positioned in binding pocket via SDF coordinates

        // Add interactions if enabled
        if (showInteractions) {
          addDetailedInteractions();
        }

        // Add binding pocket surface
        addBindingPocketSurface();
      }

      // Add water molecules if enabled
      if (showWater) {
        addWaterMolecules();
      }

      // Optimized rendering sequence
      viewer.zoomTo();
      
      // Single render call (3Dmol.js handles lighting automatically)
      viewer.render();
      
      // Update cache key
      setLastRenderKey(renderKey);
      setIsLoading(false);
    };
    
    // Use requestAnimationFrame for smooth rendering
    requestAnimationFrame(renderMolecules);

  }, [viewer, proteinData, selectedCandidate, viewMode, showInteractions, showWater, renderKey, lastRenderKey]);

  const getProteinStyle = (mode: string) => {
    switch (mode) {
      case 'cartoon':
        return { 
          cartoon: { 
            colorscheme: 'secondary',
            thickness: 0.4,
            arrows: true
          }
        };
      case 'surface':
        return { 
          surface: { 
            opacity: 0.7, 
            colorscheme: 'hydrophobicity',
            surftype: 'VDW'
          }
        };
      case 'sticks':
        return { 
          stick: { 
            colorscheme: 'default', 
            radius: 0.15,
            bondScale: 0.3
          }
        };
      case 'spheres':
        return { 
          sphere: { 
            colorscheme: 'element', 
            scale: 0.25
          }
        };
      default:
        return { 
          cartoon: { 
            colorscheme: 'secondary',
            thickness: 0.4
          }
        };
    }
  };

  const addDetailedInteractions = () => {
    if (!viewer) return;

    // Realistic protein-ligand interactions with different types
    const interactions = [
      // Hydrogen bonds
      { 
        from: { x: -3.2, y: 2.8, z: -0.5 }, 
        to: { x: -1.8, y: 3.2, z: -0.8 },
        type: 'hbond',
        color: '#00FF00',
        radius: 0.08
      },
      { 
        from: { x: -1.5, y: 4.1, z: -1.2 }, 
        to: { x: -0.8, y: 3.8, z: -0.9 },
        type: 'hbond',
        color: '#00FF00',
        radius: 0.08
      },
      // Hydrophobic interactions
      { 
        from: { x: -2.8, y: 1.9, z: -0.3 }, 
        to: { x: -1.2, y: 2.4, z: -0.6 },
        type: 'hydrophobic',
        color: '#FFD700',
        radius: 0.06
      },
      { 
        from: { x: -0.9, y: 3.5, z: -1.8 }, 
        to: { x: -0.2, y: 3.1, z: -1.4 },
        type: 'hydrophobic',
        color: '#FFD700',
        radius: 0.06
      },
      // π-π stacking
      { 
        from: { x: -2.1, y: 3.7, z: -0.1 }, 
        to: { x: -1.4, y: 3.3, z: -0.4 },
        type: 'pi_stacking',
        color: '#FF69B4',
        radius: 0.10
      },
      // Salt bridge
      { 
        from: { x: -3.5, y: 2.2, z: -1.1 }, 
        to: { x: -2.8, y: 2.6, z: -0.8 },
        type: 'salt_bridge',
        color: '#FF4500',
        radius: 0.12
      }
    ];

    // Batch render interactions for better performance
    const cylinders: any[] = [];
    
    interactions.forEach(interaction => {
      if (interaction.type === 'hbond') {
        // Simplified dashed lines
        cylinders.push({
          start: interaction.from,
          end: interaction.to,
          radius: interaction.radius,
          color: interaction.color,
          dashed: true
        });
      } else if (interaction.type === 'pi_stacking') {
        // Single line for π-π stacking (simplified)
        cylinders.push({
          start: interaction.from,
          end: interaction.to,
          radius: interaction.radius,
          color: interaction.color,
          alpha: 0.8
        });
      } else {
        // Solid lines for other interactions
        cylinders.push({
          start: interaction.from,
          end: interaction.to,
          radius: interaction.radius,
          color: interaction.color,
          alpha: 0.9
        });
      }
    });
    
    // Add all cylinders at once
    cylinders.forEach(cylinder => viewer.addCylinder(cylinder));

    // Add interaction labels
    addInteractionLabels();
  };

  const addWaterMolecules = () => {
    if (!viewer) return;

    // Realistic water molecules in binding pocket and surface
    const waterPositions = [
      // Bridging waters in binding pocket
      { x: -1.8, y: 4.5, z: -0.2, type: 'bridging' },
      { x: -3.1, y: 1.8, z: -1.5, type: 'bridging' },
      { x: -0.5, y: 2.9, z: -2.1, type: 'bridging' },
      // Surface waters
      { x: -6.2, y: 6.1, z: 1.8, type: 'surface' },
      { x: 2.8, y: -1.2, z: 3.5, type: 'surface' },
      { x: -4.5, y: -2.8, z: 2.1, type: 'surface' },
      { x: 1.2, y: 7.3, z: -3.2, type: 'surface' },
      { x: -7.1, y: 0.8, z: -2.8, type: 'surface' }
    ];

    // Batch render water molecules for better performance
    const spheres: any[] = [];
    const cylinders: any[] = [];
    
    waterPositions.forEach(water => {
      const isActive = water.type === 'bridging';
      spheres.push({
        center: { x: water.x, y: water.y, z: water.z },
        radius: isActive ? 0.4 : 0.3,
        color: isActive ? '#00BFFF' : '#87CEEB',
        alpha: isActive ? 0.9 : 0.6
      });

      // Simplified water bonds for bridging waters only
      if (isActive) {
        cylinders.push({
          start: { x: water.x - 0.8, y: water.y - 0.3, z: water.z + 0.2 },
          end: { x: water.x, y: water.y, z: water.z },
          radius: 0.05,
          color: '#00BFFF',
          alpha: 0.7
        });
      }
    });
    
    // Add all spheres and cylinders at once
    spheres.forEach(sphere => viewer.addSphere(sphere));
    cylinders.forEach(cylinder => viewer.addCylinder(cylinder));
  };

  const addBindingPocketSurface = () => {
    if (!viewer || viewMode === 'surface') return; // Skip if already showing surface

    // Simplified surface for better performance
    viewer.addSurface('VDW', {
      opacity: 0.2,
      color: '#FFE4B5'
    }, {
      resi: [1, 2, 3, 4, 5, 6] // Residues forming binding pocket
    });
  };

  const addInteractionLabels = () => {
    if (!viewer) return;

    // Simplified labels for better performance (only show key interactions)
    const labels = [
      { pos: { x: -2.5, y: 3.0, z: -0.65 }, text: 'H-bond', color: '#00FF00' },
      { pos: { x: -1.75, y: 3.5, z: -0.25 }, text: 'π-π', color: '#FF69B4' }
    ];

    labels.forEach(label => {
      viewer.addLabel(label.text, {
        position: label.pos,
        backgroundColor: label.color,
        backgroundOpacity: 0.6,
        fontColor: 'white',
        fontSize: 9,
        showBackground: false // Reduce rendering complexity
      });
    });
  };

  const handleZoomIn = useCallback(() => {
    if (!viewer) return;
    const newZoom = zoom * 1.2;
    setZoom(newZoom);
    viewer.zoom(1.2);
    viewer.render();
  }, [viewer, zoom]);

  const handleZoomOut = useCallback(() => {
    if (!viewer) return;
    const newZoom = zoom * 0.8;
    setZoom(newZoom);
    viewer.zoom(0.8);
    viewer.render();
  }, [viewer, zoom]);

  const handleReset = useCallback(() => {
    if (!viewer) return;
    setZoom(1);
    viewer.zoomTo();
    viewer.render();
  }, [viewer]);

  const handleSpin = useCallback(() => {
    if (!viewer) return;
    
    if (isAnimating) {
      viewer.stopAnimate();
      setIsAnimating(false);
    } else {
      viewer.spin('y', 1);
      setIsAnimating(true);
    }
  }, [viewer, isAnimating]);

  const handleFullscreen = useCallback(() => {
    if (viewerRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        viewerRef.current.requestFullscreen();
      }
    }
  }, []);

  const handleExportImage = useCallback(() => {
    if (!viewer) return;
    
    const canvas = viewer.pngURI();
    const link = document.createElement('a');
    link.download = `bioscribe-${proteinData?.name || 'structure'}.png`;
    link.href = canvas;
    link.click();
  }, [viewer, proteinData?.name]);

  return (
    <div className="relative w-full h-96 bg-gradient-to-br from-slate-900 to-slate-800 rounded-lg overflow-hidden border">
      {/* 3DMol.js Viewer Container */}
      <div 
        ref={viewerRef} 
        className="w-full h-full"
        style={{ minHeight: '384px' }}
      />
      
      {/* Enhanced Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-sm flex items-center justify-center">
          <div className="text-white text-center p-6 rounded-lg bg-black/30 border border-white/20">
            <div className="relative mb-4">
              <div className="animate-spin w-12 h-12 border-3 border-cyan-400 border-t-transparent rounded-full mx-auto"></div>
              <div className="absolute inset-0 animate-pulse">
                <div className="w-8 h-8 bg-cyan-400/20 rounded-full mx-auto mt-2"></div>
              </div>
            </div>
            <div className="text-base font-medium mb-2">
              {viewMode === 'cartoon' && '🧬 Rendering cartoon representation...'}
              {viewMode === 'surface' && '🌊 Calculating molecular surface...'}
              {viewMode === 'sticks' && '🔗 Drawing stick model...'}
              {viewMode === 'spheres' && '⚪ Rendering sphere model...'}
            </div>
            <div className="text-sm text-white/70 mb-2">
              {selectedCandidate ? '🎯 Including ligand and interactions' : '🧪 Protein structure only'}
            </div>
            {showInteractions && selectedCandidate && (
              <div className="text-xs text-yellow-300">
                ⚡ Computing binding interactions...
              </div>
            )}
            {showWater && (
              <div className="text-xs text-blue-300 mt-1">
                💧 Adding water molecules...
              </div>
            )}
          </div>
        </div>
      )}

      {/* Control Overlay */}
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="bg-black/20 border-white/20 text-white hover:bg-white/10"
            onClick={handleSpin}
          >
            {isAnimating ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="bg-black/20 border-white/20 text-white hover:bg-white/10"
            onClick={handleReset}
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="bg-black/20 border-white/20 text-white hover:bg-white/10"
            onClick={handleZoomIn}
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="bg-black/20 border-white/20 text-white hover:bg-white/10"
            onClick={handleZoomOut}
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="bg-black/20 border-white/20 text-white hover:bg-white/10"
            onClick={handleFullscreen}
          >
            <Maximize className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="bg-black/20 border-white/20 text-white hover:bg-white/10"
            onClick={handleExportImage}
          >
            <Download className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Enhanced Info Overlay */}
      {proteinData && (
        <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-sm rounded-lg p-4 text-white text-sm max-w-sm border border-white/20">
          <div className="font-semibold text-cyan-300 mb-2">{proteinData.name}</div>
          <div className="space-y-1 text-xs">
            <div className="text-white/80">
              <span className="text-white/60">Length:</span> {proteinData.length} amino acids
            </div>
            <div className="text-white/80">
              <span className="text-white/60">View:</span> {viewMode.charAt(0).toUpperCase() + viewMode.slice(1)}
            </div>
            {selectedCandidate && (
              <>
                <div className="border-t border-white/20 pt-2 mt-2">
                  <div className="text-green-300 font-medium">
                    {selectedCandidate.name || 'Kinase Inhibitor'}
                  </div>
                  <div className="text-white/70">
                    MW: {selectedCandidate.molecular_weight || '342.8'} Da
                  </div>
                  <div className="text-white/70">
                    Affinity: {selectedCandidate.binding_affinity || '-9.2'} kcal/mol
                  </div>
                </div>
                {showInteractions && (
                  <div className="border-t border-white/20 pt-2 mt-2">
                    <div className="text-yellow-300 font-medium mb-1">Interactions:</div>
                    <div className="grid grid-cols-2 gap-1 text-xs">
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        <span>H-bonds: 2</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                        <span>Hydrophobic: 2</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-pink-400 rounded-full"></div>
                        <span>π-π: 1</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                        <span>Salt bridge: 1</span>
                      </div>
                    </div>
                  </div>
                )}
                {showWater && (
                  <div className="border-t border-white/20 pt-2 mt-2">
                    <div className="text-blue-300 font-medium">
                      Water molecules: 8 (3 bridging)
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Zoom Level Indicator */}
      <div className="absolute bottom-4 right-4">
        <Badge variant="outline" className="bg-black/50 border-white/20 text-white">
          {(zoom * 100).toFixed(0)}%
        </Badge>
      </div>

      {/* No Data State */}
      {!proteinData && !isLoading && (
        <div className="absolute inset-0 flex items-center justify-center text-white/70">
          <div className="text-center">
            <Settings className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <div className="text-sm">No protein data loaded</div>
          </div>
        </div>
      )}
    </div>
  );
}
