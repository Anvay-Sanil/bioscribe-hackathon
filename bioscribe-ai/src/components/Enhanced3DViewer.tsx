"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Maximize2, 
  Download, 
  Settings, 
  RotateCcw,
  Eye,
  Palette,
  Layers
} from "lucide-react";

interface Enhanced3DViewerProps {
  moleculeData?: any;
  proteinData?: any;
  viewMode?: 'protein' | 'ligand' | 'complex';
}

export function Enhanced3DViewer({ 
  moleculeData, 
  proteinData,
  viewMode = 'complex'
}: Enhanced3DViewerProps) {
  const viewerRef = useRef<HTMLDivElement>(null);
  const [viewer, setViewer] = useState<any>(null);
  const [renderStyle, setRenderStyle] = useState('cartoon');
  const [colorScheme, setColorScheme] = useState('spectrum');
  const [showSurface, setShowSurface] = useState(false);
  const [showLabels, setShowLabels] = useState(false);

  useEffect(() => {
    if (!viewerRef.current) return;

    // Initialize 3DMol viewer
    const initViewer = () => {
      try {
        if (typeof window !== 'undefined' && (window as any).$3Dmol) {
          const config = { 
            backgroundColor: 'white',
            antialias: true,
            cartoonQuality: 10
          };
          
          const newViewer = (window as any).$3Dmol.createViewer(
            viewerRef.current,
            config
          );
          
          setViewer(newViewer);
          
          // Add sample molecule if data provided
          if (proteinData || moleculeData) {
            renderMolecule(newViewer);
          }
        }
      } catch (error) {
        console.error("3D Viewer initialization error:", error);
      }
    };

    // Wait for 3DMol to load
    const checkAndInit = setInterval(() => {
      if ((window as any).$3Dmol) {
        clearInterval(checkAndInit);
        initViewer();
      }
    }, 100);

    return () => {
      clearInterval(checkAndInit);
      if (viewer) {
        viewer.clear();
      }
    };
  }, []);

  const renderMolecule = (viewerInstance: any) => {
    if (!viewerInstance) return;

    try {
      viewerInstance.clear();

      // Sample PDB data for demonstration
      const samplePDB = `
ATOM      1  N   ALA A   1      -8.901   4.127  -0.555  1.00  0.00           N
ATOM      2  CA  ALA A   1      -8.608   3.135  -1.618  1.00  0.00           C
ATOM      3  C   ALA A   1      -7.117   2.964  -1.897  1.00  0.00           C
ATOM      4  O   ALA A   1      -6.634   1.849  -1.758  1.00  0.00           O
ATOM      5  CB  ALA A   1      -9.437   3.396  -2.889  1.00  0.00           C
`;

      viewerInstance.addModel(samplePDB, "pdb");
      
      // Apply rendering style
      applyRenderStyle(viewerInstance, renderStyle);
      
      // Apply color scheme
      applyColorScheme(viewerInstance, colorScheme);
      
      // Add surface if enabled
      if (showSurface) {
        viewerInstance.addSurface(
          (window as any).$3Dmol.SurfaceType.VDW,
          { opacity: 0.7, color: 'lightblue' }
        );
      }
      
      viewerInstance.zoomTo();
      viewerInstance.render();
    } catch (error) {
      console.error("Rendering error:", error);
    }
  };

  const applyRenderStyle = (viewerInstance: any, style: string) => {
    const styles: any = {
      cartoon: { cartoon: { color: 'spectrum' } },
      stick: { stick: { radius: 0.15 } },
      sphere: { sphere: { scale: 0.3 } },
      line: { line: {} },
      cross: { cross: { radius: 0.1 } }
    };

    viewerInstance.setStyle({}, styles[style] || styles.cartoon);
  };

  const applyColorScheme = (viewerInstance: any, scheme: string) => {
    const schemes: any = {
      spectrum: { cartoon: { color: 'spectrum' } },
      chain: { cartoon: { color: 'chain' } },
      secondary: { cartoon: { color: 'ss' } },
      residue: { cartoon: { color: 'residue' } },
      atom: { cartoon: { color: 'atom' } }
    };

    if (schemes[scheme]) {
      viewerInstance.setStyle({}, schemes[scheme]);
      viewerInstance.render();
    }
  };

  const handleStyleChange = (style: string) => {
    setRenderStyle(style);
    if (viewer) {
      applyRenderStyle(viewer, style);
      viewer.render();
    }
  };

  const handleColorChange = (color: string) => {
    setColorScheme(color);
    if (viewer) {
      applyColorScheme(viewer, color);
    }
  };

  const handleReset = () => {
    if (viewer) {
      viewer.zoomTo();
      viewer.render();
    }
  };

  const handleDownload = () => {
    if (viewer) {
      const png = viewer.pngURI();
      const link = document.createElement('a');
      link.href = png;
      link.download = 'molecule_view.png';
      link.click();
    }
  };

  const toggleSurface = () => {
    setShowSurface(!showSurface);
    if (viewer) {
      if (!showSurface) {
        viewer.addSurface(
          (window as any).$3Dmol.SurfaceType.VDW,
          { opacity: 0.7, color: 'lightblue' }
        );
      } else {
        viewer.removeAllSurfaces();
      }
      viewer.render();
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Enhanced 3D Molecular Viewer
          </CardTitle>
          <div className="flex gap-2">
            <Badge variant="outline">{renderStyle}</Badge>
            <Badge variant="outline">{colorScheme}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Control Panel */}
        <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium">Style:</span>
            <select
              value={renderStyle}
              onChange={(e) => handleStyleChange(e.target.value)}
              className="text-sm border rounded px-2 py-1"
            >
              <option value="cartoon">Cartoon</option>
              <option value="stick">Stick</option>
              <option value="sphere">Sphere</option>
              <option value="line">Line</option>
              <option value="cross">Cross</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium">Color:</span>
            <select
              value={colorScheme}
              onChange={(e) => handleColorChange(e.target.value)}
              className="text-sm border rounded px-2 py-1"
            >
              <option value="spectrum">Spectrum</option>
              <option value="chain">Chain</option>
              <option value="secondary">Secondary Structure</option>
              <option value="residue">Residue</option>
              <option value="atom">Atom Type</option>
            </select>
          </div>

          <Button
            size="sm"
            variant={showSurface ? "default" : "outline"}
            onClick={toggleSurface}
          >
            Surface
          </Button>

          <Button size="sm" variant="outline" onClick={handleReset}>
            <RotateCcw className="w-4 h-4 mr-1" />
            Reset
          </Button>

          <Button size="sm" variant="outline" onClick={handleDownload}>
            <Download className="w-4 h-4 mr-1" />
            Export
          </Button>
        </div>

        {/* Viewer Container */}
        <div className="relative">
          <div
            ref={viewerRef}
            className="w-full h-[500px] border-2 border-gray-200 rounded-lg bg-white"
            style={{ position: 'relative' }}
          />
          
          {/* Info Overlay */}
          <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm rounded-lg p-2 text-xs space-y-1">
            <div className="font-semibold">Controls:</div>
            <div>🖱️ Left: Rotate</div>
            <div>🖱️ Right: Zoom</div>
            <div>🖱️ Middle: Pan</div>
          </div>
        </div>

        {/* Molecule Info */}
        {(proteinData || moleculeData) && (
          <div className="grid grid-cols-2 gap-4 p-3 bg-blue-50 rounded-lg">
            <div>
              <div className="text-sm font-medium text-gray-600">Molecule</div>
              <div className="text-lg font-semibold">
                {proteinData?.name || moleculeData?.name || "Sample Structure"}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-600">Atoms</div>
              <div className="text-lg font-semibold">
                {proteinData?.length || "N/A"}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
