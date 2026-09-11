"""All FastAPI routes in one file.

Authentication is represented by X-User-Id/X-User-Role for this compact build.
In production, replace that dependency with JWT/session authentication without
changing the ownership queries.
"""
from pathlib import Path
from pathlib import Path
from uuid import UUID
from fastapi import APIRouter, Depends, File, Header, HTTPException, UploadFile
from sqlalchemy.orm import Session
from .database import get_db
from .models import User
from fastapi import File, Form, UploadFile, Header, Depends, HTTPException
from uuid import UUID
from .tool_functions import (ingest_resume_folder, create_job, screen_job,
    get_user_jobs, get_user_job_candidates, get_admin_jobs, get_admin_job_candidates)
from .config import settings

router = APIRouter(prefix="/api")

def current_user(x_user_id: str = Header(...), db: Session = Depends(get_db)) -> User:
    """Input: X-User-Id header. Output: authenticated active user from PostgreSQL."""
    try:
        user = db.get(User, UUID(x_user_id))
    except ValueError:
        user = None
    if not user or not user.is_active:
        raise HTTPException(401, "Invalid user")
    return user

def require_admin(user: User = Depends(current_user)) -> User:
    """Input: authenticated user. Output: admin user or HTTP 403."""
    if user.role != "ADMIN":
        raise HTTPException(403, "Admin access required")
    return user

@router.post("/resumes/ingest")
def api_ingest_resumes(
    db: Session = Depends(get_db),
):
    """
    Scan data/resumes and ingest all resumes.

    Input:
        None

    Output:
        Number of resumes processed.
    """
    return ingest_resume_folder(db)

from fastapi import Form, File, UploadFile

@router.post("/jobs")
def api_create_job(
    x_user_id: str = Header(..., alias="X-User-Id"),
    file: UploadFile | None = File(None),
    jd_text: str | None = Form(None),
    db: Session = Depends(get_db),
):
    """
    Create a Job from either:
    - written JD text
    - uploaded JD file

    Input:
        X-User-Id: authenticated user UUID
        file: optional JD file
        jd_text: optional written JD

    Output:
        Created Job
    """

    user_id = UUID(x_user_id)

    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    # Admin cannot create JDs
    if user.role == "ADMIN":
        raise HTTPException(
            status_code=403,
            detail="Admin cannot create job descriptions"
        )

    # Exactly one input is required
    if file and jd_text:
        raise HTTPException(
            status_code=400,
            detail="Provide either a JD file or JD text, not both"
        )

    if not file and not jd_text:
        raise HTTPException(
            status_code=400,
            detail="Provide either a JD file or JD text"
        )

    # Written JD
    if jd_text:
        job = create_job(
            db=db,
            user_id=user_id,
            raw_text=jd_text
        )

    # Uploaded JD
    else:
        # Save/read uploaded file using your existing file logic
        # Save uploaded JD inside data/job_descriptions
        file_path = Path(settings.JD_DIR) / file.filename

        with open(file_path, "wb") as f:
            f.write(file.file.read())

        # Extract text from the saved JD
        raw_text = read_file(str(file_path))

        job = create_job(
            db=db,
            user_id=user_id,
            raw_text=raw_text,
            file_name=file.filename,
            file_path=file_path
        )

    return job

@router.post("/jobs/{job_id}/screen")
def api_screen_job(job_id: UUID, user: User = Depends(current_user), db: Session = Depends(get_db)):
    """Input: JD UUID + authenticated user. Output: screening result with Top 10.
    Users may screen only their own jobs; admins may screen any job.
    """
    from .models import Job
    job = db.get(Job, job_id)
    if not job: raise HTTPException(404, "Job not found")
    if user.role != "ADMIN" and job.created_by != user.id: raise HTTPException(403, "Not your job")
    try: return screen_job(db, job_id)
    except Exception as exc: raise HTTPException(500, str(exc))

@router.get("/user/jobs")
def api_user_jobs(user: User = Depends(current_user), db: Session = Depends(get_db)):
    """Input: authenticated user. Output: only that user's JDs."""
    return get_user_jobs(db, user.id)

@router.get("/user/jobs/{job_id}/candidates")
def api_user_candidates(job_id: UUID, user: User = Depends(current_user), db: Session = Depends(get_db)):
    """Input: authenticated user + owned job UUID. Output: Top 10 candidates."""
    try: return get_user_job_candidates(db, user.id, job_id)
    except PermissionError: raise HTTPException(403, "Not your job")

@router.get("/admin/jobs")
def api_admin_jobs(admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    """Input: authenticated admin. Output: every JD, uploader and Top 10 summary."""
    return get_admin_jobs(db)

@router.get("/admin/jobs/{job_id}/candidates")
def api_admin_candidates(job_id: UUID, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    """Input: authenticated admin + job UUID. Output: persisted Top 10 candidates."""
    try: return get_admin_job_candidates(db, job_id)
    except ValueError: raise HTTPException(404, "Job not found")
