"""
Collaborative Data Sharing Platform
GitHub-style collaboration for biotech research
"""

import asyncio
from typing import Dict, List, Optional, Any
from datetime import datetime
import json
import logging

logger = logging.getLogger(__name__)


class CollaborativePlatform:
    """
    Collaborative research platform features:
    - Project versioning and branching
    - Team collaboration and permissions
    - Data sharing and export
    - Experiment tracking
    - Reproducibility features
    - Citation and attribution
    """
    
    def __init__(self):
        self.projects = {}
        self.teams = {}
        self.experiments = {}
        self.shared_datasets = {}
        
    async def create_project(
        self,
        name: str,
        description: str,
        owner: str,
        visibility: str = "private"
    ) -> Dict[str, Any]:
        """Create a new research project"""
        project_id = f"proj_{len(self.projects) + 1}"
        
        project = {
            "id": project_id,
            "name": name,
            "description": description,
            "owner": owner,
            "visibility": visibility,
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat(),
            "version": "1.0.0",
            "branches": ["main"],
            "current_branch": "main",
            "collaborators": [owner],
            "experiments": [],
            "datasets": [],
            "tags": [],
            "stars": 0,
            "forks": 0
        }
        
        self.projects[project_id] = project
        logger.info(f"Created project: {name} ({project_id})")
        
        return project
    
    async def add_experiment(
        self,
        project_id: str,
        experiment_data: Dict[str, Any],
        user: str
    ) -> Dict[str, Any]:
        """Add an experiment to a project"""
        if project_id not in self.projects:
            raise ValueError("Project not found")
        
        experiment_id = f"exp_{len(self.experiments) + 1}"
        
        experiment = {
            "id": experiment_id,
            "project_id": project_id,
            "name": experiment_data.get("name", "Unnamed Experiment"),
            "type": experiment_data.get("type", "docking"),
            "parameters": experiment_data.get("parameters", {}),
            "results": experiment_data.get("results", {}),
            "status": "completed",
            "created_by": user,
            "created_at": datetime.now().isoformat(),
            "reproducibility_score": self._calculate_reproducibility(experiment_data),
            "metadata": {
                "protein": experiment_data.get("protein"),
                "ligands_tested": experiment_data.get("ligands_count", 0),
                "success_rate": experiment_data.get("success_rate", 0)
            }
        }
        
        self.experiments[experiment_id] = experiment
        self.projects[project_id]["experiments"].append(experiment_id)
        self.projects[project_id]["updated_at"] = datetime.now().isoformat()
        
        return experiment
    
    async def share_dataset(
        self,
        project_id: str,
        dataset: Dict[str, Any],
        license: str = "CC-BY-4.0"
    ) -> Dict[str, Any]:
        """Share a dataset with the community"""
        dataset_id = f"ds_{len(self.shared_datasets) + 1}"
        
        shared_dataset = {
            "id": dataset_id,
            "project_id": project_id,
            "name": dataset.get("name", "Unnamed Dataset"),
            "description": dataset.get("description", ""),
            "type": dataset.get("type", "docking_results"),
            "size": dataset.get("size", 0),
            "format": dataset.get("format", "json"),
            "license": license,
            "doi": f"10.5281/bioscribe.{dataset_id}",
            "citation": self._generate_citation(dataset, project_id),
            "downloads": 0,
            "views": 0,
            "shared_at": datetime.now().isoformat(),
            "metadata": dataset.get("metadata", {}),
            "tags": dataset.get("tags", [])
        }
        
        self.shared_datasets[dataset_id] = shared_dataset
        
        return shared_dataset
    
    async def fork_project(
        self,
        project_id: str,
        new_owner: str
    ) -> Dict[str, Any]:
        """Fork a project for independent development"""
        if project_id not in self.projects:
            raise ValueError("Project not found")
        
        original = self.projects[project_id]
        
        forked_project = await self.create_project(
            name=f"{original['name']} (Fork)",
            description=f"Forked from {original['name']}",
            owner=new_owner,
            visibility=original["visibility"]
        )
        
        forked_project["forked_from"] = project_id
        forked_project["fork_date"] = datetime.now().isoformat()
        
        # Increment fork count
        self.projects[project_id]["forks"] += 1
        
        return forked_project
    
    async def create_branch(
        self,
        project_id: str,
        branch_name: str,
        from_branch: str = "main"
    ) -> Dict[str, Any]:
        """Create a new branch for experimental work"""
        if project_id not in self.projects:
            raise ValueError("Project not found")
        
        project = self.projects[project_id]
        
        if branch_name in project["branches"]:
            raise ValueError("Branch already exists")
        
        project["branches"].append(branch_name)
        
        return {
            "project_id": project_id,
            "branch_name": branch_name,
            "created_from": from_branch,
            "created_at": datetime.now().isoformat(),
            "status": "active"
        }
    
    async def merge_branches(
        self,
        project_id: str,
        source_branch: str,
        target_branch: str,
        user: str
    ) -> Dict[str, Any]:
        """Merge experimental results from one branch to another"""
        if project_id not in self.projects:
            raise ValueError("Project not found")
        
        merge_result = {
            "project_id": project_id,
            "source": source_branch,
            "target": target_branch,
            "merged_by": user,
            "merged_at": datetime.now().isoformat(),
            "conflicts": [],
            "status": "success"
        }
        
        return merge_result
    
    async def add_collaborator(
        self,
        project_id: str,
        user: str,
        role: str = "contributor"
    ) -> Dict[str, Any]:
        """Add a collaborator to a project"""
        if project_id not in self.projects:
            raise ValueError("Project not found")
        
        project = self.projects[project_id]
        
        if user not in project["collaborators"]:
            project["collaborators"].append(user)
        
        return {
            "project_id": project_id,
            "user": user,
            "role": role,
            "added_at": datetime.now().isoformat(),
            "permissions": self._get_role_permissions(role)
        }
    
    def _get_role_permissions(self, role: str) -> List[str]:
        """Get permissions for a role"""
        permissions = {
            "owner": ["read", "write", "delete", "admin", "invite"],
            "contributor": ["read", "write", "comment"],
            "viewer": ["read", "comment"]
        }
        return permissions.get(role, ["read"])
    
    async def export_project(
        self,
        project_id: str,
        format: str = "json"
    ) -> Dict[str, Any]:
        """Export project data for sharing"""
        if project_id not in self.projects:
            raise ValueError("Project not found")
        
        project = self.projects[project_id]
        
        # Gather all related data
        experiments = [
            self.experiments[exp_id]
            for exp_id in project["experiments"]
            if exp_id in self.experiments
        ]
        
        export_data = {
            "project": project,
            "experiments": experiments,
            "export_format": format,
            "exported_at": datetime.now().isoformat(),
            "version": project["version"],
            "checksum": self._calculate_checksum(project)
        }
        
        return export_data
    
    async def search_projects(
        self,
        query: str,
        filters: Optional[Dict] = None
    ) -> List[Dict[str, Any]]:
        """Search for public projects"""
        results = []
        
        for project_id, project in self.projects.items():
            if project["visibility"] != "public":
                continue
            
            # Simple text search
            if (query.lower() in project["name"].lower() or
                query.lower() in project["description"].lower()):
                results.append(project)
        
        return results
    
    def _calculate_reproducibility(self, experiment: Dict) -> float:
        """Calculate reproducibility score"""
        score = 0.0
        
        # Check for required fields
        if experiment.get("parameters"):
            score += 0.3
        if experiment.get("results"):
            score += 0.3
        if experiment.get("protein"):
            score += 0.2
        if experiment.get("ligands_count", 0) > 0:
            score += 0.2
        
        return round(score, 2)
    
    def _generate_citation(self, dataset: Dict, project_id: str) -> str:
        """Generate citation for dataset"""
        project = self.projects.get(project_id, {})
        owner = project.get("owner", "Unknown")
        year = datetime.now().year
        
        citation = (
            f"{owner}. ({year}). {dataset.get('name', 'Unnamed Dataset')}. "
            f"BioScribe AI Platform. DOI: {dataset.get('doi', 'N/A')}"
        )
        
        return citation
    
    def _calculate_checksum(self, data: Dict) -> str:
        """Calculate checksum for data integrity"""
        import hashlib
        data_str = json.dumps(data, sort_keys=True)
        return hashlib.sha256(data_str.encode()).hexdigest()[:16]
    
    async def get_project_analytics(self, project_id: str) -> Dict[str, Any]:
        """Get analytics for a project"""
        if project_id not in self.projects:
            raise ValueError("Project not found")
        
        project = self.projects[project_id]
        
        experiments = [
            self.experiments[exp_id]
            for exp_id in project["experiments"]
            if exp_id in self.experiments
        ]
        
        return {
            "project_id": project_id,
            "total_experiments": len(experiments),
            "total_collaborators": len(project["collaborators"]),
            "stars": project["stars"],
            "forks": project["forks"],
            "activity": {
                "last_updated": project["updated_at"],
                "experiments_this_month": len([
                    e for e in experiments
                    if e["created_at"][:7] == datetime.now().isoformat()[:7]
                ])
            },
            "impact": {
                "citations": 0,  # Would track actual citations
                "downloads": sum(
                    ds.get("downloads", 0)
                    for ds in self.shared_datasets.values()
                    if ds["project_id"] == project_id
                )
            }
        }
