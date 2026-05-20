from pydantic import BaseModel
from typing import List, Optional


class BlogPostIn(BaseModel):
    title: str
    slug: str
    content: str
    excerpt: Optional[str] = ""
    image_url: Optional[str] = ""
    published: bool = True
    tags: List[str] = []


class BlogPostUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    excerpt: Optional[str] = None
    image_url: Optional[str] = None
    published: Optional[bool] = None
    tags: Optional[List[str]] = None
