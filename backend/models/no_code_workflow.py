"""
No-Code Workflow Designer
Drag-and-drop pipeline builder with visual programming
"""

import asyncio
from typing import Dict, List, Optional, Any
import logging
from datetime import datetime
import json

logger = logging.getLogger(__name__)


class NoCodeWorkflowEngine:
    """
    Visual workflow designer enabling:
    - Drag-and-drop pipeline creation
    - Pre-built component library
    - Custom node creation
    - Real-time validation
    - Workflow templates
    - Export/import workflows
    """
    
    def __init__(self):
        self.workflows = {}
        self.component_library = self._initialize_component_library()
        
    def _initialize_component_library(self) -> Dict:
        """Initialize library of pre-built components"""
        return {
            "data_input": {
                "protein_sequence": {
                    "name": "Protein Sequence Input",
                    "inputs": [],
                    "outputs": ["sequence"],
                    "parameters": ["format", "validation"]
                },
                "molecule_file": {
                    "name": "Molecule File Upload",
                    "inputs": [],
                    "outputs": ["molecules"],
                    "parameters": ["file_type", "parser"]
                },
                "database_query": {
                    "name": "Database Query",
                    "inputs": ["query"],
                    "outputs": ["results"],
                    "parameters": ["database", "filters"]
                }
            },
            "analysis": {
                "protein_prediction": {
                    "name": "Protein Structure Prediction",
                    "inputs": ["sequence"],
                    "outputs": ["structure", "confidence"],
                    "parameters": ["method", "quality_threshold"]
                },
                "drug_generation": {
                    "name": "AI Drug Generation",
                    "inputs": ["protein_data"],
                    "outputs": ["candidates"],
                    "parameters": ["num_candidates", "models", "diversity"]
                },
                "molecular_docking": {
                    "name": "Molecular Docking",
                    "inputs": ["protein", "ligands"],
                    "outputs": ["docking_results"],
                    "parameters": ["exhaustiveness", "num_poses"]
                },
                "omics_integration": {
                    "name": "Multi-Omics Integration",
                    "inputs": ["genomics", "transcriptomics", "proteomics"],
                    "outputs": ["integrated_results"],
                    "parameters": ["integration_method"]
                }
            },
            "filtering": {
                "lipinski_filter": {
                    "name": "Lipinski's Rule Filter",
                    "inputs": ["molecules"],
                    "outputs": ["filtered_molecules"],
                    "parameters": ["strict_mode"]
                },
                "admet_filter": {
                    "name": "ADMET Filter",
                    "inputs": ["molecules"],
                    "outputs": ["filtered_molecules"],
                    "parameters": ["criteria"]
                },
                "similarity_filter": {
                    "name": "Similarity Filter",
                    "inputs": ["molecules", "reference"],
                    "outputs": ["filtered_molecules"],
                    "parameters": ["threshold", "metric"]
                }
            },
            "visualization": {
                "3d_viewer": {
                    "name": "3D Molecular Viewer",
                    "inputs": ["structure"],
                    "outputs": ["visualization"],
                    "parameters": ["style", "colors"]
                },
                "plot_generator": {
                    "name": "Plot Generator",
                    "inputs": ["data"],
                    "outputs": ["plot"],
                    "parameters": ["plot_type", "axes"]
                },
                "heatmap": {
                    "name": "Heatmap Generator",
                    "inputs": ["matrix"],
                    "outputs": ["heatmap"],
                    "parameters": ["colorscale", "annotations"]
                }
            },
            "export": {
                "csv_export": {
                    "name": "CSV Export",
                    "inputs": ["data"],
                    "outputs": ["file"],
                    "parameters": ["delimiter", "headers"]
                },
                "report_generator": {
                    "name": "Report Generator",
                    "inputs": ["results"],
                    "outputs": ["report"],
                    "parameters": ["template", "format"]
                },
                "database_save": {
                    "name": "Save to Database",
                    "inputs": ["data"],
                    "outputs": ["status"],
                    "parameters": ["table", "mode"]
                }
            }
        }
    
    async def create_workflow(
        self,
        name: str,
        description: str,
        nodes: List[Dict],
        connections: List[Dict],
        user_id: str
    ) -> Dict:
        """Create a new workflow from visual design"""
        workflow_id = f"wf_{len(self.workflows) + 1}"
        
        # Validate workflow
        validation = await self._validate_workflow(nodes, connections)
        
        if not validation["valid"]:
            return {
                "success": False,
                "errors": validation["errors"]
            }
        
        workflow = {
            "id": workflow_id,
            "name": name,
            "description": description,
            "nodes": nodes,
            "connections": connections,
            "created_by": user_id,
            "created_at": datetime.now().isoformat(),
            "version": "1.0.0",
            "status": "draft",
            "execution_count": 0
        }
        
        self.workflows[workflow_id] = workflow
        
        return {
            "success": True,
            "workflow_id": workflow_id,
            "workflow": workflow
        }
    
    async def _validate_workflow(self, nodes: List[Dict], connections: List[Dict]) -> Dict:
        """Validate workflow structure and connections"""
        errors = []
        
        # Check for disconnected nodes
        node_ids = {node["id"] for node in nodes}
        connected_nodes = set()
        
        for conn in connections:
            connected_nodes.add(conn["from_node"])
            connected_nodes.add(conn["to_node"])
        
        disconnected = node_ids - connected_nodes
        if disconnected:
            errors.append(f"Disconnected nodes: {disconnected}")
        
        # Check for cycles
        if self._has_cycles(nodes, connections):
            errors.append("Workflow contains cycles")
        
        # Validate connections
        for conn in connections:
            from_node = next((n for n in nodes if n["id"] == conn["from_node"]), None)
            to_node = next((n for n in nodes if n["id"] == conn["to_node"]), None)
            
            if not from_node or not to_node:
                errors.append(f"Invalid connection: {conn}")
                continue
            
            # Check output/input compatibility
            if conn["from_output"] not in from_node.get("outputs", []):
                errors.append(f"Invalid output: {conn['from_output']}")
            
            if conn["to_input"] not in to_node.get("inputs", []):
                errors.append(f"Invalid input: {conn['to_input']}")
        
        return {
            "valid": len(errors) == 0,
            "errors": errors
        }
    
    def _has_cycles(self, nodes: List[Dict], connections: List[Dict]) -> bool:
        """Check for cycles in workflow graph"""
        # Simple cycle detection using DFS
        graph = {node["id"]: [] for node in nodes}
        for conn in connections:
            graph[conn["from_node"]].append(conn["to_node"])
        
        visited = set()
        rec_stack = set()
        
        def dfs(node):
            visited.add(node)
            rec_stack.add(node)
            
            for neighbor in graph.get(node, []):
                if neighbor not in visited:
                    if dfs(neighbor):
                        return True
                elif neighbor in rec_stack:
                    return True
            
            rec_stack.remove(node)
            return False
        
        for node_id in graph:
            if node_id not in visited:
                if dfs(node_id):
                    return True
        
        return False
    
    async def execute_workflow(
        self,
        workflow_id: str,
        input_data: Dict,
        execution_mode: str = "sequential"
    ) -> Dict:
        """Execute a workflow with given input data"""
        if workflow_id not in self.workflows:
            return {"success": False, "error": "Workflow not found"}
        
        workflow = self.workflows[workflow_id]
        
        logger.info(f"Executing workflow: {workflow['name']}")
        
        # Build execution plan
        execution_plan = self._build_execution_plan(workflow, execution_mode)
        
        # Execute nodes in order
        results = {}
        node_outputs = {}
        
        for step in execution_plan:
            node = step["node"]
            node_id = node["id"]
            
            logger.info(f"Executing node: {node['name']}")
            
            # Gather inputs for this node
            node_inputs = {}
            for conn in workflow["connections"]:
                if conn["to_node"] == node_id:
                    from_node_id = conn["from_node"]
                    output_key = conn["from_output"]
                    input_key = conn["to_input"]
                    
                    if from_node_id in node_outputs:
                        node_inputs[input_key] = node_outputs[from_node_id].get(output_key)
            
            # Add initial input data if this is a starting node
            if not node_inputs and node["type"] in ["data_input"]:
                node_inputs = input_data
            
            # Execute node
            node_result = await self._execute_node(node, node_inputs)
            node_outputs[node_id] = node_result
            results[node_id] = node_result
        
        # Update workflow execution count
        workflow["execution_count"] += 1
        workflow["last_executed"] = datetime.now().isoformat()
        
        return {
            "success": True,
            "workflow_id": workflow_id,
            "execution_plan": execution_plan,
            "results": results,
            "final_output": node_outputs.get(execution_plan[-1]["node"]["id"])
        }
    
    def _build_execution_plan(self, workflow: Dict, mode: str) -> List[Dict]:
        """Build execution plan from workflow graph"""
        nodes = workflow["nodes"]
        connections = workflow["connections"]
        
        # Topological sort for sequential execution
        in_degree = {node["id"]: 0 for node in nodes}
        
        for conn in connections:
            in_degree[conn["to_node"]] += 1
        
        queue = [node for node in nodes if in_degree[node["id"]] == 0]
        execution_plan = []
        
        while queue:
            node = queue.pop(0)
            execution_plan.append({"node": node, "mode": mode})
            
            for conn in connections:
                if conn["from_node"] == node["id"]:
                    in_degree[conn["to_node"]] -= 1
                    if in_degree[conn["to_node"]] == 0:
                        to_node = next(n for n in nodes if n["id"] == conn["to_node"])
                        queue.append(to_node)
        
        return execution_plan
    
    async def _execute_node(self, node: Dict, inputs: Dict) -> Dict:
        """Execute a single workflow node"""
        node_type = node["type"]
        component_name = node["component"]
        parameters = node.get("parameters", {})
        
        # Simulate node execution based on type
        if node_type == "analysis":
            if component_name == "protein_prediction":
                return {"structure": "predicted_structure", "confidence": 0.92}
            elif component_name == "drug_generation":
                return {"candidates": [f"candidate_{i}" for i in range(10)]}
            elif component_name == "molecular_docking":
                return {"docking_results": [{"score": -8.5}]}
        
        elif node_type == "filtering":
            return {"filtered_molecules": inputs.get("molecules", [])}
        
        elif node_type == "visualization":
            return {"visualization": "generated_viz"}
        
        elif node_type == "export":
            return {"file": "exported_file.csv", "status": "success"}
        
        return {"output": "node_executed"}
    
    async def get_workflow_templates(self) -> List[Dict]:
        """Get pre-built workflow templates"""
        return [
            {
                "id": "template_1",
                "name": "Drug Discovery Pipeline",
                "description": "Complete drug discovery from protein to candidates",
                "category": "drug_discovery",
                "nodes": 5,
                "popularity": 150
            },
            {
                "id": "template_2",
                "name": "Multi-Omics Analysis",
                "description": "Integrate genomics, transcriptomics, and proteomics",
                "category": "omics",
                "nodes": 8,
                "popularity": 95
            },
            {
                "id": "template_3",
                "name": "Virtual Screening",
                "description": "High-throughput virtual screening pipeline",
                "category": "screening",
                "nodes": 6,
                "popularity": 120
            }
        ]
    
    async def export_workflow(self, workflow_id: str, format: str = "json") -> Dict:
        """Export workflow definition"""
        if workflow_id not in self.workflows:
            return {"success": False, "error": "Workflow not found"}
        
        workflow = self.workflows[workflow_id]
        
        if format == "json":
            return {
                "success": True,
                "format": "json",
                "data": json.dumps(workflow, indent=2)
            }
        elif format == "yaml":
            return {
                "success": True,
                "format": "yaml",
                "data": "# YAML export not implemented"
            }
        
        return {"success": False, "error": "Unsupported format"}
    
    async def import_workflow(self, workflow_data: str, format: str = "json") -> Dict:
        """Import workflow from file"""
        try:
            if format == "json":
                workflow = json.loads(workflow_data)
                workflow_id = f"wf_{len(self.workflows) + 1}"
                workflow["id"] = workflow_id
                self.workflows[workflow_id] = workflow
                
                return {
                    "success": True,
                    "workflow_id": workflow_id
                }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
