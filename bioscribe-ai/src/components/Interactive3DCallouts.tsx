"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, TrendingUp, Zap, Info } from "lucide-react";

interface Hotspot {
  id: string;
  position: { x: number; y: number };
  title: string;
  type: "hbond" | "hydrophobic" | "pi-stacking" | "salt-bridge";
  residue: string;
  impact: string;
  details: string;
  confidence: number;
}

interface Interactive3DCalloutsProps {
  viewerRef: React.RefObject<HTMLDivElement>;
}

export function Interactive3DCallouts({ viewerRef }: Interactive3DCalloutsProps) {
  const [activeHotspot, setActiveHotspot] = useState<Hotspot | null>(null);
  const [showAllHotspots, setShowAllHotspots] = useState(true);

  // Predefined hotspots for key interactions
  const hotspots: Hotspot[] = [
    {
      id: "hb1",
      position: { x: 45, y: 35 },
      title: "H-Bond with ASP25",
      type: "hbond",
      residue: "ASP25",
      impact: "Increases specificity by 30%",
      details: "Critical hydrogen bond (2.8Å) between ligand NH and ASP25 carbonyl oxygen. This interaction anchors the ligand in the binding pocket and contributes -2.1 kcal/mol to binding energy.",
      confidence: 0.95
    },
    {
      id: "hb2",
      position: { x: 55, y: 45 },
      title: "H-Bond with ILE50",
      type: "hbond",
      residue: "ILE50",
      impact: "Stabilizes binding pose",
      details: "Secondary hydrogen bond (3.2Å) provides additional stability. Mutation studies show 5-fold loss in affinity when this residue is altered.",
      confidence: 0.88
    },
    {
      id: "hydro1",
      position: { x: 65, y: 40 },
      title: "Hydrophobic Pocket",
      type: "hydrophobic",
      residue: "ILE80, VAL82",
      impact: "Contributes -3.5 kcal/mol",
      details: "Ligand aromatic ring fits perfectly into hydrophobic pocket formed by ILE80 and VAL82. This interaction is crucial for selectivity over related targets.",
      confidence: 0.92
    },
    {
      id: "pi1",
      position: { x: 50, y: 55 },
      title: "π-Stacking with PHE81",
      type: "pi-stacking",
      residue: "PHE81",
      impact: "Enhances potency 10-fold",
      details: "Parallel π-π stacking interaction (3.8Å) between ligand phenyl ring and PHE81. This is a key selectivity determinant - only 2 of 50 related proteins have PHE at this position.",
      confidence: 0.90
    },
    {
      id: "salt1",
      position: { x: 40, y: 50 },
      title: "Salt Bridge",
      type: "salt-bridge",
      residue: "LYS27",
      impact: "pH-dependent binding",
      details: "Ionic interaction between ligand carboxylate and LYS27 amine. This interaction is pH-sensitive and may explain the compound's improved activity at physiological pH.",
      confidence: 0.85
    }
  ];

  const getHotspotColor = (type: Hotspot["type"]) => {
    switch (type) {
      case "hbond": return "bg-yellow-500";
      case "hydrophobic": return "bg-orange-500";
      case "pi-stacking": return "bg-purple-500";
      case "salt-bridge": return "bg-cyan-500";
    }
  };

  const getHotspotIcon = (type: Hotspot["type"]) => {
    switch (type) {
      case "hbond": return "⚡";
      case "hydrophobic": return "🔥";
      case "pi-stacking": return "🔮";
      case "salt-bridge": return "⚛️";
    }
  };

  const handleHotspotClick = (hotspot: Hotspot) => {
    setActiveHotspot(hotspot);
    
    // Trigger camera zoom in molecular viewer
    console.log(`Zooming to ${hotspot.residue}`);
    // In real implementation, this would call:
    // stageRef.current?.autoView(`${hotspot.residue}`, 1000);
  };

  return (
    <div className="relative w-full h-full">
      {/* Hotspot Markers */}
      {showAllHotspots && hotspots.map((hotspot) => (
        <button
          key={hotspot.id}
          className={`absolute w-8 h-8 ${getHotspotColor(hotspot.type)} rounded-full border-2 border-white shadow-lg hover:scale-125 transition-transform z-10 flex items-center justify-center text-white font-bold animate-pulse`}
          style={{
            left: `${hotspot.position.x}%`,
            top: `${hotspot.position.y}%`,
            transform: 'translate(-50%, -50%)'
          }}
          onClick={() => handleHotspotClick(hotspot)}
        >
          <span className="text-xs">{getHotspotIcon(hotspot.type)}</span>
        </button>
      ))}

      {/* Active Hotspot Callout Panel */}
      {activeHotspot && (
        <div className="absolute right-0 top-0 w-96 h-full bg-white/95 backdrop-blur-sm shadow-2xl border-l-4 border-blue-500 z-20 overflow-y-auto">
          <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 flex items-center justify-between">
            <h3 className="font-bold flex items-center gap-2">
              <span className="text-2xl">{getHotspotIcon(activeHotspot.type)}</span>
              {activeHotspot.title}
            </h3>
            <button onClick={() => setActiveHotspot(null)}>
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-4 space-y-4">
            {/* Residue Info */}
            <Card className="bg-gradient-to-r from-blue-50 to-purple-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Residue</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge className="text-lg px-3 py-1">{activeHotspot.residue}</Badge>
              </CardContent>
            </Card>

            {/* Impact */}
            <Card className="bg-gradient-to-r from-green-50 to-blue-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Impact on Binding
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm font-semibold text-green-700">{activeHotspot.impact}</p>
              </CardContent>
            </Card>

            {/* Confidence Score */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Confidence Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-500"
                      style={{ width: `${activeHotspot.confidence * 100}%` }}
                    />
                  </div>
                  <span className="font-bold">{(activeHotspot.confidence * 100).toFixed(0)}%</span>
                </div>
              </CardContent>
            </Card>

            {/* Detailed Explanation */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  Detailed Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700">{activeHotspot.details}</p>
              </CardContent>
            </Card>

            {/* Interaction Type Info */}
            <Card className="bg-gradient-to-r from-yellow-50 to-orange-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Interaction Type</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge className={`${getHotspotColor(activeHotspot.type)} text-white`}>
                  {activeHotspot.type.toUpperCase().replace('-', ' ')}
                </Badge>
                <p className="text-xs text-gray-600 mt-2">
                  {activeHotspot.type === 'hbond' && "Hydrogen bonds are electrostatic attractions between a hydrogen atom and an electronegative atom."}
                  {activeHotspot.type === 'hydrophobic' && "Hydrophobic interactions occur between nonpolar molecules in aqueous solution."}
                  {activeHotspot.type === 'pi-stacking' && "π-π stacking involves aromatic ring interactions through overlapping π orbitals."}
                  {activeHotspot.type === 'salt-bridge' && "Salt bridges are ionic interactions between oppositely charged residues."}
                </p>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="space-y-2">
              <Button className="w-full bg-blue-600 hover:bg-blue-700">
                <Zap className="w-4 h-4 mr-2" />
                Zoom to This Interaction
              </Button>
              <Button variant="outline" className="w-full">
                View in Context
              </Button>
              <Button variant="outline" className="w-full">
                Compare with Similar Compounds
              </Button>
            </div>

            {/* Related Hotspots */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Related Interactions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {hotspots
                    .filter(h => h.id !== activeHotspot.id)
                    .slice(0, 3)
                    .map(h => (
                      <button
                        key={h.id}
                        className="w-full p-2 text-left bg-gray-50 hover:bg-gray-100 rounded flex items-center gap-2"
                        onClick={() => handleHotspotClick(h)}
                      >
                        <span className="text-lg">{getHotspotIcon(h.type)}</span>
                        <span className="text-xs font-semibold">{h.title}</span>
                      </button>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Toggle Hotspots Button */}
      <button
        className="absolute bottom-4 left-4 z-10 px-4 py-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border-2 border-blue-500 hover:bg-blue-50 transition-colors"
        onClick={() => setShowAllHotspots(!showAllHotspots)}
      >
        {showAllHotspots ? "Hide" : "Show"} Hotspots ({hotspots.length})
      </button>

      {/* Hotspot Legend */}
      {showAllHotspots && (
        <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-3 border-2 border-gray-300">
          <h4 className="font-semibold text-xs mb-2">Interaction Types</h4>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs">
              <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
              <span>H-Bonds</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-4 h-4 bg-orange-500 rounded-full"></div>
              <span>Hydrophobic</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-4 h-4 bg-purple-500 rounded-full"></div>
              <span>π-Stacking</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-4 h-4 bg-cyan-500 rounded-full"></div>
              <span>Salt Bridge</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
