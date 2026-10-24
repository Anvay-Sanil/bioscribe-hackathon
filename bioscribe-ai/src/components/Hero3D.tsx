import React, { useEffect, useRef } from 'react';
import * as NGL from 'ngl';

export function Hero3D() {
    const containerRef = useRef<HTMLDivElement>(null);
    const stageRef = useRef<any>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        // Initialize stage with transparent background
        const stage = new NGL.Stage(containerRef.current, {
            backgroundColor: 'white', // Will be made transparent via CSS if needed, but white blends with hero
            quality: 'high',
            impostor: true,
            cameraType: 'perspective'
        });
        stageRef.current = stage;

        // Handle resizing
        const handleResize = () => stage.handleResize();
        window.addEventListener('resize', handleResize);

        // Load a sample structure (e.g., Hemoglobin or a nice looking protein)
        // Using a simple placeholder structure for the hero
        stage.loadFile("rcsb://4hhb").then((component: any) => {
            // Clear default representations
            component.removeAllRepresentations();

            // Add a beautiful, artistic representation
            component.addRepresentation("cartoon", {
                color: "sstruc",
                quality: "high",
                aspectRatio: 6.0,
                opacity: 0.8,
                roughness: 0.2,
                metalness: 0.5
            });

            component.addRepresentation("ball+stick", {
                sele: "ligand",
                color: "element",
                scale: 2.0
            });

            component.addRepresentation("surface", {
                sele: "protein",
                opacity: 0.1,
                color: "white",
                surfaceType: "av"
            });

            // Auto-rotate
            stage.setSpin(true);
            stage.autoView();

            // Custom camera position for dramatic effect
            stage.viewerControls.zoom(-0.5);
        });

        return () => {
            window.removeEventListener('resize', handleResize);
            // Clean up NGL stage if possible (NGL doesn't have a perfect destroy method, but we can clear)
            stage.removeAllComponents();
        };
    }, []);

    return (
        <div
            ref={containerRef}
            className="absolute inset-0 w-full h-full opacity-40 pointer-events-none mix-blend-multiply"
            style={{ zIndex: 0 }}
        />
    );
}
