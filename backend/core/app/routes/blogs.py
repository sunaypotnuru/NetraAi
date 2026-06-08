from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from app.services.supabase import supabase
from app.models.schemas import BlogResponse, BlogCreate, TokenPayload
from app.core.security import get_current_admin
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/blogs", tags=["Blogs"])

@router.get("/", response_model=List[BlogResponse])
async def get_blogs(
    limit: int = Query(10, ge=1, le=100),
    offset: int = Query(0, ge=0),
    category: Optional[str] = None
):
    """Fetch all blog posts with optional category filtering."""
    try:
        query = supabase.table("blogs").select("*")
        if category:
            query = query.eq("category", category)
        
        res = query.order("created_at", desc=True).range(offset, offset + limit - 1).execute()
        return res.data or []
    except Exception as e:
        logger.error(f"Error fetching blogs: {e}")
        return []

@router.get("/{id}", response_model=BlogResponse)
async def get_blog(id: str):
    """Fetch a single blog post by ID."""
    try:
        res = supabase.table("blogs").select("*").eq("id", id).single().execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Blog not found")
        return res.data
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching blog {id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/", response_model=BlogResponse)
async def create_blog(
    blog: BlogCreate, 
    current_user: TokenPayload = Depends(get_current_admin)
):
    """Create a new blog post (Admin only)."""
    try:
        res = supabase.table("blogs").insert(blog.model_dump()).execute()
        if not res.data:
            raise HTTPException(status_code=400, detail="Failed to create blog")
        return res.data[0]
    except Exception as e:
        logger.error(f"Error creating blog: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{id}", response_model=BlogResponse)
async def update_blog(
    id: str, 
    blog: BlogCreate, 
    current_user: TokenPayload = Depends(get_current_admin)
):
    """Update an existing blog post (Admin only)."""
    try:
        res = supabase.table("blogs").update(blog.model_dump()).eq("id", id).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Blog not found")
        return res.data[0]
    except Exception as e:
        logger.error(f"Error updating blog {id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{id}")
async def delete_blog(
    id: str, 
    current_user: TokenPayload = Depends(get_current_admin)
):
    """Delete a blog post (Admin only)."""
    try:
        res = supabase.table("blogs").delete().eq("id", id).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Blog not found")
        return {"success": True, "message": "Blog deleted successfully"}
    except Exception as e:
        logger.error(f"Error deleting blog {id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))
