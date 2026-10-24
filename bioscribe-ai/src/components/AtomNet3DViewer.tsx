"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    RotateCcw,
    Maximize2,
    Eye,
    EyeOff,
    Layers,
    Play,
    Pause,
    ZoomIn,
    ZoomOut,
    Move3d,
    Target,
    Atom,
    Loader2
} from "lucide-react";

// ============================================================================
// TYPES
// ============================================================================

interface LigandData {
    ligand_id: string;
    smiles: string;
    score: number;
    rank: number;
}

interface AtomNet3DViewerProps {
    pdbId?: string;
    ligands: LigandData[];
    selectedLigandId?: string;
    onLigandSelect?: (ligand: LigandData) => void;
    maxLigands?: number;
}

// ============================================================================
// LIGAND SCORE COLORS
// ============================================================================

function getScoreColor(score: number, minScore: number, maxScore: number): string {
    // Normalize score to 0-1 range
    const range = maxScore - minScore || 1;
    const normalized = (score - minScore) / range;

    // Color gradient: green (high) -> yellow -> red (low)
    // Higher scores = better = green
    if (normalized >= 0.8) return "#22c55e"; // green-500
    if (normalized >= 0.6) return "#84cc16"; // lime-500
    if (normalized >= 0.4) return "#eab308"; // yellow-500
    if (normalized >= 0.2) return "#f97316"; // orange-500
    return "#ef4444"; // red-500
}

function getScoreGradient(rank: number, total: number): string {
    const colors = [
        "#22c55e", // Rank 1: green
        "#84cc16", // Rank 2: lime
        "#a3e635", // Rank 3: lime-400
        "#facc15", // Rank 4: yellow-400
        "#fb923c"  // Rank 5: orange-400
    ];
    return colors[Math.min(rank - 1, colors.length - 1)] || "#94a3b8";
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function AtomNet3DViewer({
    pdbId,
    ligands,
    selectedLigandId,
    onLigandSelect,
    maxLigands = 5
}: AtomNet3DViewerProps) {
    const viewerRef = useRef<HTMLDivElement>(null);
    const stageRef = useRef<any>(null);
    const componentRef = useRef<any>(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isSpinning, setIsSpinning] = useState(false);
    const [showSurface, setShowSurface] = useState(false);
    const [showLabels, setShowLabels] = useState(true);
    const [viewMode, setViewMode] = useState<"cartoon" | "surface" | "ribbon">("cartoon");

    // Top ligands for display
    const topLigands = ligands
        .sort((a, b) => a.rank - b.rank)
        .slice(0, maxLigands);

    // Score range for coloring
    const scoreRange = {
        min: Math.min(...topLigands.map(l => l.score)),
        max: Math.max(...topLigands.map(l => l.score))
    };

    // =========================================================================
    // INITIALIZE NGL VIEWER
    // =========================================================================

    useEffect(() => {
        if (!viewerRef.current) return;

        setLoading(true);
        setError(null);

        // Load NGL Viewer script
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/ngl@2.0.0-dev.37/dist/ngl.js';
        script.async = true;
        script.onload = () => {
            initializeViewer();
        };
        script.onerror = () => {
            setError("Failed to load 3D viewer library");
            setLoading(false);
        };
        document.body.appendChild(script);

        return () => {
            if (script.parentNode) script.parentNode.removeChild(script);
            if (stageRef.current) {
                stageRef.current.dispose();
                stageRef.current = null;
            }
        };
    }, []);

    // =========================================================================
    // RELOAD WHEN PDB ID CHANGES
    // =========================================================================

    useEffect(() => {
        if (stageRef.current && pdbId) {
            loadStructure();
        }
    }, [pdbId]);

    // =========================================================================
    // VIEWER INITIALIZATION
    // =========================================================================

    const initializeViewer = useCallback(() => {
        if (!viewerRef.current || !(window as any).NGL) return;

        const NGL = (window as any).NGL;

        const stage = new NGL.Stage(viewerRef.current, {
            backgroundColor: "#0f0f1a",
            quality: "high",
            sampleLevel: 1,
            workerDefault: true,
            impostor: true,
            antialias: true,
            clipNear: 0,
            clipFar: 100,
            fogNear: 50,
            fogFar: 100,
            cameraFov: 40,
            cameraType: "perspective",
            lightColor: 0xffffff,
            lightIntensity: 1.0,
            ambientColor: 0xdddddd,
            ambientIntensity: 0.3,
            hoverTimeout: 100
        });

        stageRef.current = stage;

        // Handle window resize
        const handleResize = () => stage.handleResize();
        window.addEventListener('resize', handleResize);

        // Load structure
        if (pdbId) {
            loadStructure();
        } else {
            setLoading(false);
        }

        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, [pdbId]);

    // =========================================================================
    // LOAD PDB STRUCTURE
    // =========================================================================

    const loadStructure = async () => {
        if (!stageRef.current || !pdbId) return;

        setLoading(true);
        setError(null);

        const stage = stageRef.current;

        try {
            // Clear existing components
            stage.removeAllComponents();

            // Load from RCSB PDB
            const pdbUrl = `https://files.rcsb.org/download/${pdbId.toUpperCase()}.pdb`;

            const component = await stage.loadFile(pdbUrl, {
                defaultRepresentation: false
            });

            componentRef.current = component;

            // Apply rendering
            applyRendering(component);

            // Setup interactivity
            setupInteractivity(stage, component);

            // Center view
            stage.autoView();

            setLoading(false);

        } catch (err) {
            console.error('Error loading PDB structure:', err);
            setError(`Failed to load structure ${pdbId}`);
            setLoading(false);
        }
    };

    // =========================================================================
    // APPLY RENDERING
    // =========================================================================

    const applyRendering = (component: any) => {
        if (!component) return;

        // Clear existing representations
        while (component.reprList.length > 0) {
            component.removeRepresentation(component.reprList[0]);
        }

        // Protein cartoon representation
        component.addRepresentation('cartoon', {
            sele: 'protein',
            color: 'residueindex',
            quality: 'high',
            aspectRatio: 5.0,
            subdiv: 10,
            smoothSheet: true,
            opacity: showSurface ? 0.5 : 0.9
        });

        // Surface if enabled
        if (showSurface) {
            component.addRepresentation('surface', {
                sele: 'protein',
                color: 'electrostatic',
                quality: 'medium',
                opacity: 0.4,
                surfaceType: 'av'
            });
        }

        // Ligand - ball and stick
        component.addRepresentation('ball+stick', {
            sele: 'hetero and not water',
            color: 'element',
            quality: 'high',
            multipleBond: 'symmetric',
            bondScale: 0.3,
            sphereDetail: 3
        });

        // Binding site residues
        component.addRepresentation('licorice', {
            sele: 'protein and ( 25-30 or 48-50 or 80-84 )',
            color: 'element',
            quality: 'high'
        });

        // Labels if enabled
        if (showLabels) {
            component.addRepresentation('label', {
                sele: 'hetero and not water',
                color: '#22c55e',
                labelType: 'residue',
                labelFormat: 'Top Ligand',
                showBackground: true,
                backgroundColor: 'rgba(0,0,0,0.8)',
                fontSize: 12
            });
        }

        // Force render
        if (stageRef.current) {
            stageRef.current.viewer.requestRender();
        }
    };

    // =========================================================================
    // INTERACTIVITY
    // =========================================================================

    const setupInteractivity = (stage: any, component: any) => {
        // Click on atoms
        stage.signals.clicked.add((pickingProxy: any) => {
            if (pickingProxy && pickingProxy.atom) {
                const atom = pickingProxy.atom;

                // If clicking on a ligand/hetero atom, trigger selection
                if (atom.residue && !atom.residue.isProtein()) {
                    console.log('Clicked ligand:', atom.resname, atom.resno);

                    // Find matching ligand if available
                    const matchedLigand = topLigands.find(l =>
                        l.ligand_id.includes(atom.resname) ||
                        l.ligand_id.includes(String(atom.resno))
                    );

                    if (matchedLigand && onLigandSelect) {
                        onLigandSelect(matchedLigand);
                    }

                    // Zoom to clicked residue
                    stage.autoView(`${atom.resno}:${atom.chainname}`, 1000);
                }
            }
        });

        // Hover effect
        stage.mouseControls.add('hoverPick', (pickingProxy: any) => {
            if (pickingProxy && pickingProxy.atom) {
                const atom = pickingProxy.atom;
                console.log('Hovering:', atom.resname, atom.resno);
            }
        });
    };

    // =========================================================================
    // CONTROLS
    // =========================================================================

    const resetView = () => {
        if (stageRef.current) {
            stageRef.current.autoView();
        }
    };

    const toggleSpin = () => {
        if (!stageRef.current) return;

        if (isSpinning) {
            stageRef.current.setSpin(null);
        } else {
            stageRef.current.setSpin([0, 1, 0], 0.01);
        }
        setIsSpinning(!isSpinning);
    };

    const toggleSurface = () => {
        setShowSurface(!showSurface);
        if (componentRef.current) {
            applyRendering(componentRef.current);
        }
    };

    const toggleLabels = () => {
        setShowLabels(!showLabels);
        if (componentRef.current) {
            applyRendering(componentRef.current);
        }
    };

    const zoomIn = () => {
        if (stageRef.current) {
            stageRef.current.viewerControls.zoom(0.8);
        }
    };

    const zoomOut = () => {
        if (stageRef.current) {
            stageRef.current.viewerControls.zoom(1.25);
        }
    };

    const centerOnLigand = () => {
        if (stageRef.current) {
            stageRef.current.autoView('hetero and not water', 1000);
        }
    };

    // =========================================================================
    // RENDER
    // =========================================================================

    if (!pdbId) {
        return (
            <div className="aspect-square bg-slate-800/50 rounded-lg flex items-center justify-center border border-slate-700">
                <div className="text-center text-slate-500">
                    <Atom className="w-16 h-16 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No PDB structure available</p>
                </div>
            </div>
        );
    }

    return (
        <div className="relative">
            {/* Viewer Container */}
            <div
                className="aspect-square bg-black rounded-lg overflow-hidden border border-purple-500/30 relative"
            >
                <div
                    ref={viewerRef}
                    className="w-full h-full"
                />

                {/* Loading Overlay */}
                {loading && (
                    <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-10">
                        <div className="text-center">
                            <Loader2 className="w-8 h-8 animate-spin text-purple-500 mx-auto mb-2" />
                            <p className="text-sm text-slate-400">Loading {pdbId}...</p>
                        </div>
                    </div>
                )}

                {/* Error Overlay */}
                {error && (
                    <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-10">
                        <div className="text-center text-red-400">
                            <Atom className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">{error}</p>
                            <Button
                                variant="outline"
                                size="sm"
                                className="mt-2"
                                onClick={loadStructure}
                            >
                                Retry
                            </Button>
                        </div>
                    </div>
                )}

                {/* Controls Overlay */}
                {!loading && !error && (
                    <>
                        {/* Top Right Controls */}
                        <div className="absolute top-2 right-2 flex gap-1 z-20">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 bg-black/50 hover:bg-black/70 text-white"
                                onClick={toggleSpin}
                                title={isSpinning ? "Stop rotation" : "Auto rotate"}
                            >
                                {isSpinning ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 bg-black/50 hover:bg-black/70 text-white"
                                onClick={toggleSurface}
                                title={showSurface ? "Hide surface" : "Show surface"}
                            >
                                <Layers className={`h-3.5 w-3.5 ${showSurface ? 'text-purple-400' : ''}`} />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 bg-black/50 hover:bg-black/70 text-white"
                                onClick={resetView}
                                title="Reset view"
                            >
                                <RotateCcw className="h-3.5 w-3.5" />
                            </Button>
                        </div>

                        {/* Bottom Left Controls */}
                        <div className="absolute bottom-2 left-2 flex gap-1 z-20">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 bg-black/50 hover:bg-black/70 text-white"
                                onClick={zoomIn}
                                title="Zoom in"
                            >
                                <ZoomIn className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 bg-black/50 hover:bg-black/70 text-white"
                                onClick={zoomOut}
                                title="Zoom out"
                            >
                                <ZoomOut className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 bg-black/50 hover:bg-black/70 text-white"
                                onClick={centerOnLigand}
                                title="Center on ligand"
                            >
                                <Target className="h-3.5 w-3.5" />
                            </Button>
                        </div>

                        {/* Bottom Right - PDB Badge */}
                        <div className="absolute bottom-2 right-2 z-20">
                            <Badge className="bg-purple-600/80 text-white text-xs">
                                {pdbId.toUpperCase()}
                            </Badge>
                        </div>
                    </>
                )}
            </div>

            {/* Top Ligands List */}
            {topLigands.length > 0 && (
                <div className="mt-3 space-y-1.5">
                    <p className="text-xs text-slate-400 font-medium">Top {topLigands.length} Ligands</p>
                    <div className="grid gap-1">
                        {topLigands.map((ligand, index) => (
                            <button
                                key={ligand.ligand_id}
                                onClick={() => onLigandSelect?.(ligand)}
                                className={`
                                    w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs
                                    transition-all duration-200 text-left
                                    ${selectedLigandId === ligand.ligand_id
                                        ? 'bg-purple-600/30 border border-purple-500/50'
                                        : 'bg-slate-800/50 border border-transparent hover:bg-slate-700/50'
                                    }
                                `}
                            >
                                <div className="flex items-center gap-2">
                                    <div
                                        className="w-2.5 h-2.5 rounded-full"
                                        style={{ backgroundColor: getScoreGradient(ligand.rank, topLigands.length) }}
                                    />
                                    <span className="font-mono text-slate-300 truncate max-w-[120px]">
                                        {ligand.ligand_id}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-slate-400">#{ligand.rank}</span>
                                    <Badge
                                        variant="outline"
                                        className="text-[10px] px-1.5 py-0"
                                        style={{
                                            borderColor: getScoreGradient(ligand.rank, topLigands.length),
                                            color: getScoreGradient(ligand.rank, topLigands.length)
                                        }}
                                    >
                                        {ligand.score.toFixed(2)}
                                    </Badge>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default AtomNet3DViewer;
