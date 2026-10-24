import os
import logging
from typing import Dict, Any, Optional, List
from datetime import datetime
import json
import uuid
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import ConnectionFailure
import asyncio

logger = logging.getLogger(__name__)

class DatabaseManager:
    """MongoDB database manager for BioScribe AI"""
    
    def __init__(self):
        # MongoDB connection settings
        self.mongodb_url = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
        self.database_name = os.getenv("DATABASE_NAME", "bioscribe_ai")
        
        # Collections
        self.proteins_collection = "proteins"
        self.sessions_collection = "sessions"
        self.results_collection = "results"
        self.candidates_collection = "candidates"
        
        # Connection
        self.client = None
        self.database = None
        self.connected = False
        
        # In-memory storage for development (fallback)
        self.memory_storage = {
            "proteins": {},
            "sessions": {},
            "results": {},
            "candidates": {}
        }
        self.use_memory = True  # Set to False when MongoDB is available
    
    async def connect(self):
        """Connect to MongoDB"""
        try:
            self.client = AsyncIOMotorClient(self.mongodb_url)
            self.database = self.client[self.database_name]
            
            # Test connection
            await self.client.admin.command('ping')
            self.connected = True
            self.use_memory = False
            logger.info("Connected to MongoDB successfully")
            
        except ConnectionFailure as e:
            logger.warning(f"MongoDB connection failed: {str(e)}. Using in-memory storage.")
            self.connected = False
            self.use_memory = True
        except Exception as e:
            logger.error(f"Database connection error: {str(e)}. Using in-memory storage.")
            self.connected = False
            self.use_memory = True
    
    async def disconnect(self):
        """Disconnect from MongoDB"""
        if self.client:
            self.client.close()
            self.connected = False
            logger.info("Disconnected from MongoDB")
    
    async def health_check(self) -> str:
        """Check database health"""
        if self.use_memory:
            return "memory_storage"
        
        try:
            if not self.connected:
                await self.connect()
            
            if self.connected:
                await self.client.admin.command('ping')
                return "connected"
            else:
                return "disconnected"
        except Exception as e:
            logger.error(f"Health check failed: {str(e)}")
            return "error"
    
    def generate_id(self) -> str:
        """Generate unique ID"""
        return str(uuid.uuid4())
    
    async def store_protein(self, protein_data: Dict[str, Any]) -> str:
        """Store protein analysis data"""
        protein_id = self.generate_id()
        
        protein_record = {
            "protein_id": protein_id,
            "timestamp": datetime.now().isoformat(),
            **protein_data
        }
        
        if self.use_memory:
            self.memory_storage["proteins"][protein_id] = protein_record
        else:
            try:
                collection = self.database[self.proteins_collection]
                await collection.insert_one(protein_record)
            except Exception as e:
                logger.error(f"Error storing protein: {str(e)}")
                # Fallback to memory
                self.memory_storage["proteins"][protein_id] = protein_record
        
        logger.info(f"Stored protein with ID: {protein_id}")
        return protein_id
    
    async def get_protein(self, protein_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve protein data"""
        if self.use_memory:
            return self.memory_storage["proteins"].get(protein_id)
        
        try:
            collection = self.database[self.proteins_collection]
            protein = await collection.find_one({"protein_id": protein_id})
            return protein
        except Exception as e:
            logger.error(f"Error retrieving protein: {str(e)}")
            # Fallback to memory
            return self.memory_storage["proteins"].get(protein_id)
    
    async def store_candidates(self, protein_id: str, candidates: List[Dict[str, Any]]) -> str:
        """Store drug candidates"""
        session_id = self.generate_id()
        
        session_record = {
            "session_id": session_id,
            "protein_id": protein_id,
            "candidates": candidates,
            "status": "candidates_generated",
            "timestamp": datetime.now().isoformat(),
            "docking_status": "pending",
            "docking_progress": 0
        }
        
        if self.use_memory:
            self.memory_storage["sessions"][session_id] = session_record
        else:
            try:
                collection = self.database[self.sessions_collection]
                await collection.insert_one(session_record)
            except Exception as e:
                logger.error(f"Error storing candidates: {str(e)}")
                # Fallback to memory
                self.memory_storage["sessions"][session_id] = session_record
        
        logger.info(f"Stored candidates for session: {session_id}")
        return session_id
    
    async def get_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve session data"""
        if self.use_memory:
            return self.memory_storage["sessions"].get(session_id)
        
        try:
            collection = self.database[self.sessions_collection]
            session = await collection.find_one({"session_id": session_id})
            return session
        except Exception as e:
            logger.error(f"Error retrieving session: {str(e)}")
            # Fallback to memory
            return self.memory_storage["sessions"].get(session_id)
    
    async def update_docking_status(
        self, 
        session_id: str, 
        status: str, 
        progress: int,
        error_message: Optional[str] = None
    ):
        """Update docking simulation status"""
        update_data = {
            "docking_status": status,
            "docking_progress": progress,
            "last_updated": datetime.now().isoformat()
        }
        
        if error_message:
            update_data["error_message"] = error_message
        
        if self.use_memory:
            if session_id in self.memory_storage["sessions"]:
                self.memory_storage["sessions"][session_id].update(update_data)
        else:
            try:
                collection = self.database[self.sessions_collection]
                await collection.update_one(
                    {"session_id": session_id},
                    {"$set": update_data}
                )
            except Exception as e:
                logger.error(f"Error updating docking status: {str(e)}")
                # Fallback to memory
                if session_id in self.memory_storage["sessions"]:
                    self.memory_storage["sessions"][session_id].update(update_data)
        
        logger.info(f"Updated docking status for session {session_id}: {status} ({progress}%)")
    
    async def get_docking_status(self, session_id: str) -> Dict[str, Any]:
        """Get docking simulation status"""
        session = await self.get_session(session_id)
        
        if not session:
            return {"error": "Session not found"}
        
        return {
            "session_id": session_id,
            "status": session.get("docking_status", "unknown"),
            "progress": session.get("docking_progress", 0),
            "last_updated": session.get("last_updated", ""),
            "error_message": session.get("error_message")
        }
    
    async def store_results(self, session_id: str, results: Dict[str, Any]):
        """Store final docking results"""
        results_record = {
            "session_id": session_id,
            "timestamp": datetime.now().isoformat(),
            **results
        }
        
        if self.use_memory:
            self.memory_storage["results"][session_id] = results_record
        else:
            try:
                collection = self.database[self.results_collection]
                await collection.insert_one(results_record)
            except Exception as e:
                logger.error(f"Error storing results: {str(e)}")
                # Fallback to memory
                self.memory_storage["results"][session_id] = results_record
        
        logger.info(f"Stored results for session: {session_id}")
    
    async def get_results(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve docking results"""
        if self.use_memory:
            return self.memory_storage["results"].get(session_id)
        
        try:
            collection = self.database[self.results_collection]
            results = await collection.find_one({"session_id": session_id})
            return results
        except Exception as e:
            logger.error(f"Error retrieving results: {str(e)}")
            # Fallback to memory
            return self.memory_storage["results"].get(session_id)
    
    async def list_sessions(self, limit: int = 50) -> List[Dict[str, Any]]:
        """List recent sessions"""
        if self.use_memory:
            sessions = list(self.memory_storage["sessions"].values())
            # Sort by timestamp (newest first)
            sessions.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
            return sessions[:limit]
        
        try:
            collection = self.database[self.sessions_collection]
            cursor = collection.find().sort("timestamp", -1).limit(limit)
            sessions = await cursor.to_list(length=limit)
            return sessions
        except Exception as e:
            logger.error(f"Error listing sessions: {str(e)}")
            # Fallback to memory
            sessions = list(self.memory_storage["sessions"].values())
            sessions.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
            return sessions[:limit]
    
    async def delete_session(self, session_id: str) -> bool:
        """Delete a session and its results"""
        try:
            if self.use_memory:
                # Remove from memory storage
                self.memory_storage["sessions"].pop(session_id, None)
                self.memory_storage["results"].pop(session_id, None)
                return True
            
            # Remove from MongoDB
            sessions_collection = self.database[self.sessions_collection]
            results_collection = self.database[self.results_collection]
            
            await sessions_collection.delete_one({"session_id": session_id})
            await results_collection.delete_one({"session_id": session_id})
            
            logger.info(f"Deleted session: {session_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error deleting session: {str(e)}")
            return False
    
    async def get_statistics(self) -> Dict[str, Any]:
        """Get database statistics"""
        try:
            if self.use_memory:
                return {
                    "storage_type": "memory",
                    "proteins_count": len(self.memory_storage["proteins"]),
                    "sessions_count": len(self.memory_storage["sessions"]),
                    "results_count": len(self.memory_storage["results"]),
                    "total_candidates": sum(
                        len(session.get("candidates", [])) 
                        for session in self.memory_storage["sessions"].values()
                    )
                }
            
            # MongoDB statistics
            proteins_count = await self.database[self.proteins_collection].count_documents({})
            sessions_count = await self.database[self.sessions_collection].count_documents({})
            results_count = await self.database[self.results_collection].count_documents({})
            
            return {
                "storage_type": "mongodb",
                "proteins_count": proteins_count,
                "sessions_count": sessions_count,
                "results_count": results_count,
                "database_name": self.database_name
            }
            
        except Exception as e:
            logger.error(f"Error getting statistics: {str(e)}")
            return {"error": str(e)}
    
    async def cleanup_old_sessions(self, days_old: int = 30) -> int:
        """Clean up old sessions (older than specified days)"""
        try:
            from datetime import timedelta
            cutoff_date = datetime.now() - timedelta(days=days_old)
            cutoff_str = cutoff_date.isoformat()
            
            deleted_count = 0
            
            if self.use_memory:
                # Clean memory storage
                sessions_to_delete = [
                    sid for sid, session in self.memory_storage["sessions"].items()
                    if session.get("timestamp", "") < cutoff_str
                ]
                
                for session_id in sessions_to_delete:
                    self.memory_storage["sessions"].pop(session_id, None)
                    self.memory_storage["results"].pop(session_id, None)
                    deleted_count += 1
            else:
                # Clean MongoDB
                sessions_result = await self.database[self.sessions_collection].delete_many(
                    {"timestamp": {"$lt": cutoff_str}}
                )
                results_result = await self.database[self.results_collection].delete_many(
                    {"timestamp": {"$lt": cutoff_str}}
                )
                deleted_count = sessions_result.deleted_count
            
            logger.info(f"Cleaned up {deleted_count} old sessions")
            return deleted_count
            
        except Exception as e:
            logger.error(f"Error cleaning up sessions: {str(e)}")
            return 0

# Initialize database manager
db_manager = DatabaseManager()

# Startup event
async def startup_database():
    """Initialize database connection on startup"""
    await db_manager.connect()

# Shutdown event  
async def shutdown_database():
    """Close database connection on shutdown"""
    await db_manager.disconnect()

# Example usage
if __name__ == "__main__":
    async def test_database():
        db = DatabaseManager()
        await db.connect()
        
        # Test protein storage
        protein_data = {
            "name": "Test Protein",
            "sequence": "MKFLVNVALVFMVVYISYIYA",
            "length": 20
        }
        
        protein_id = await db.store_protein(protein_data)
        print(f"Stored protein: {protein_id}")
        
        # Retrieve protein
        retrieved = await db.get_protein(protein_id)
        print(f"Retrieved: {retrieved}")
        
        await db.disconnect()
    
    # Run test
    # asyncio.run(test_database())
