"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Eye, 
  RotateCcw, 
  ZoomIn, 
  ZoomOut, 
  Download,
  Maximize2,
  Play,
  Pause,
  SkipForward,
  Settings
} from "lucide-react";

interface MolecularViewer3DProps {
  proteinData?: any;
  moleculeData?: any;
  dockingData?: any;
}

export function MolecularViewer3D({ proteinData, moleculeData, dockingData }: MolecularViewer3DProps) {
  const [viewMode, setViewMode] = useState<"protein" | "molecule" | "complex">("protein");
  const [renderStyle, setRenderStyle] = useState<"cartoon" | "surface" | "stick" | "sphere">("cartoon");
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Simple 3D visualization simulation
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw protein representation
    if (viewMode === "protein" || viewMode === "complex") {
      drawProtein(ctx, canvas.width, canvas.height, currentFrame);
    }

    // Draw molecule representation
    if (viewMode === "molecule" || viewMode === "complex") {
      drawMolecule(ctx, canvas.width, canvas.height, currentFrame);
    }

    // Draw binding site
    if (viewMode === "complex") {
      drawBindingSite(ctx, canvas.width, canvas.height);
    }

  }, [viewMode, renderStyle, currentFrame]);

  // Animation loop
  useEffect(() => {
    if (!isAnimating) return;
    
    const interval = setInterval(() => {
      setCurrentFrame(prev => (prev + 1) % 360);
    }, 50);

    return () => clearInterval(interval);
  }, [isAnimating]);

  const drawProtein = (ctx: CanvasRenderingContext2D, width: number, height: number, frame: number) => {
    const centerX = width / 2;
    const centerY = height / 2;
    const rotation = (frame * Math.PI) / 180;

    if (renderStyle === "cartoon") {
      // Draw alpha helix
      ctx.strokeStyle = '#4299e1';
      ctx.lineWidth = 8;
      ctx.beginPath();
      for (let i = 0; i < 100; i++) {
        const angle = (i / 100) * Math.PI * 4 + rotation;
        const radius = 80 + Math.sin(i / 10) * 20;
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius + (i - 50);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Draw beta sheet
      ctx.strokeStyle = '#48bb78';
      ctx.lineWidth = 12;
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const y = centerY - 100 + i * 20;
        ctx.moveTo(centerX - 100, y);
        ctx.lineTo(centerX + 100, y);
      }
      ctx.stroke();
    } else if (renderStyle === "surface") {
      // Draw surface representation
      const gradient = ctx.createRadialGradient(centerX, centerY, 50, centerX, centerY, 150);
      gradient.addColorStop(0, 'rgba(66, 153, 225, 0.8)');
      gradient.addColorStop(1, 'rgba(66, 153, 225, 0.2)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 150, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw active site
    ctx.fillStyle = '#f56565';
    ctx.beginPath();
    ctx.arc(centerX + 60, centerY - 40, 15, 0, Math.PI * 2);
    ctx.fill();
  };

  const drawMolecule = (ctx: CanvasRenderingContext2D, width: number, height: number, frame: number) => {
    const centerX = width / 2 + 60;
    const centerY = height / 2 - 40;
    const rotation = (frame * Math.PI) / 180;

    // Draw atoms
    const atoms = [
      { x: 0, y: 0, color: '#ed8936', size: 12 },
      { x: 30, y: 20, color: '#4299e1', size: 10 },
      { x: -20, y: 25, color: '#48bb78', size: 10 },
      { x: 15, y: -30, color: '#9f7aea', size: 8 },
      { x: -25, y: -15, color: '#ed64a6', size: 8 },
    ];

    atoms.forEach(atom => {
      const rotatedX = atom.x * Math.cos(rotation) - atom.y * Math.sin(rotation);
      const rotatedY = atom.x * Math.sin(rotation) + atom.y * Math.cos(rotation);
      
      ctx.fillStyle = atom.color;
      ctx.beginPath();
      ctx.arc(centerX + rotatedX, centerY + rotatedY, atom.size, 0, Math.PI * 2);
      ctx.fill();
      
      // Glow effect
      ctx.strokeStyle = atom.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(centerX + rotatedX, centerY + rotatedY, atom.size + 3, 0, Math.PI * 2);
      ctx.stroke();
    });

    // Draw bonds
    ctx.strokeStyle = '#a0aec0';
    ctx.lineWidth = 2;
    for (let i = 0; i < atoms.length - 1; i++) {
      const atom1 = atoms[i];
      const atom2 = atoms[i + 1];
      const x1 = atom1.x * Math.cos(rotation) - atom1.y * Math.sin(rotation);
      const y1 = atom1.x * Math.sin(rotation) + atom1.y * Math.cos(rotation);
      const x2 = atom2.x * Math.cos(rotation) - atom2.y * Math.sin(rotation);
      const y2 = atom2.x * Math.sin(rotation) + atom2.y * Math.cos(rotation);
      
      ctx.beginPath();
      ctx.moveTo(centerX + x1, centerY + y1);
      ctx.lineTo(centerX + x2, centerY + y2);
      ctx.stroke();
    }
  };

  const drawBindingSite = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const centerX = width / 2 + 60;
    const centerY = height / 2 - 40;

    // Draw interaction lines
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    
    for (let i = 0; i < 3; i++) {
      const angle = (i / 3) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(centerX + Math.cos(angle) * 40, centerY + Math.sin(angle) * 40);
      ctx.stroke();
    }
    
    ctx.setLineDash([]);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            3D Molecular Viewer
          </CardTitle>
          <div className="flex gap-2">
            <Badge variant="outline">WebGL Enabled</Badge>
            <Badge className="bg-green-100 text-green-700">Real-time Rendering</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* View Mode Selector */}
        <div className="flex gap-2">
          <Button
            variant={viewMode === "protein" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("protein")}
          >
            Protein Only
          </Button>
          <Button
            variant={viewMode === "molecule" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("molecule")}
          >
            Molecule Only
          </Button>
          <Button
            variant={viewMode === "complex" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("complex")}
          >
            Protein-Ligand Complex
          </Button>
        </div>

        {/* 3D Canvas */}
        <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg overflow-hidden">
          <canvas
            ref={canvasRef}
            width={800}
            height={600}
            className="w-full h-auto"
          />
          
          {/* Overlay Controls */}
          <div className="absolute top-4 right-4 space-y-2">
            <Button size="sm" variant="secondary" onClick={() => setCurrentFrame(0)}>
              <RotateCcw className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="secondary">
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="secondary">
              <ZoomOut className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="secondary">
              <Maximize2 className="w-4 h-4" />
            </Button>
          </div>

          {/* Info Overlay */}
          <div className="absolute bottom-4 left-4 bg-black/70 text-white px-3 py-2 rounded text-sm">
            <div>View: {viewMode}</div>
            <div>Style: {renderStyle}</div>
            <div>Frame: {currentFrame}/360</div>
          </div>
        </div>

        {/* Render Style */}
        <div className="flex gap-2">
          <span className="text-sm font-medium">Render Style:</span>
          {["cartoon", "surface", "stick", "sphere"].map((style) => (
            <Button
              key={style}
              variant={renderStyle === style ? "default" : "outline"}
              size="sm"
              onClick={() => setRenderStyle(style as any)}
            >
              {style.charAt(0).toUpperCase() + style.slice(1)}
            </Button>
          ))}
        </div>

        {/* Animation Controls */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => setIsAnimating(!isAnimating)}
          >
            {isAnimating ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
            {isAnimating ? "Pause" : "Play"} Animation
          </Button>
          <Button size="sm" variant="outline" onClick={() => setCurrentFrame(prev => (prev + 10) % 360)}>
            <SkipForward className="w-4 h-4 mr-2" />
            Next Frame
          </Button>
          <div className="flex-1">
            <input
              type="range"
              min="0"
              max="360"
              value={currentFrame}
              onChange={(e) => setCurrentFrame(parseInt(e.target.value))}
              className="w-full"
            />
          </div>
        </div>

        {/* Information Tabs */}
        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="info">Info</TabsTrigger>
            <TabsTrigger value="interactions">Interactions</TabsTrigger>
            <TabsTrigger value="properties">Properties</TabsTrigger>
            <TabsTrigger value="export">Export</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-2">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-semibold">Protein:</p>
                <p className="text-gray-600">{proteinData?.name || "HIV-1 Protease"}</p>
              </div>
              <div>
                <p className="font-semibold">Resolution:</p>
                <p className="text-gray-600">2.5 Å</p>
              </div>
              <div>
                <p className="font-semibold">Atoms:</p>
                <p className="text-gray-600">1,234 atoms</p>
              </div>
              <div>
                <p className="font-semibold">Ligand:</p>
                <p className="text-gray-600">Drug Candidate #1</p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="interactions" className="space-y-2">
            <div className="space-y-2 text-sm">
              <div className="p-2 bg-yellow-50 rounded">
                <p className="font-semibold">Hydrogen Bonds: 3</p>
                <p className="text-gray-600">ASP25, ILE50, GLY48</p>
              </div>
              <div className="p-2 bg-blue-50 rounded">
                <p className="font-semibold">Hydrophobic Interactions: 5</p>
                <p className="text-gray-600">VAL82, LEU76, PRO81, ILE84, VAL32</p>
              </div>
              <div className="p-2 bg-purple-50 rounded">
                <p className="font-semibold">π-π Stacking: 1</p>
                <p className="text-gray-600">PHE53</p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="properties" className="space-y-2">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="p-2 bg-gray-50 rounded">
                <p className="font-semibold">Binding Affinity:</p>
                <p className="text-gray-600">-9.2 kcal/mol</p>
              </div>
              <div className="p-2 bg-gray-50 rounded">
                <p className="font-semibold">Surface Area:</p>
                <p className="text-gray-600">450 Ų</p>
              </div>
              <div className="p-2 bg-gray-50 rounded">
                <p className="font-semibold">RMSD:</p>
                <p className="text-gray-600">1.2 Å</p>
              </div>
              <div className="p-2 bg-gray-50 rounded">
                <p className="font-semibold">Ligand Efficiency:</p>
                <p className="text-gray-600">0.42</p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="export" className="space-y-2">
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export PDB
              </Button>
              <Button size="sm" variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export PNG Image
              </Button>
              <Button size="sm" variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export Session
              </Button>
              <Button size="sm" variant="outline">
                <Settings className="w-4 h-4 mr-2" />
                Advanced Settings
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
