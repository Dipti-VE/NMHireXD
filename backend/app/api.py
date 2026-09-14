"""All FastAPI routes in one file.

Authentication is represented by X-User-Id/X-User-Role for this compact build.
For development, job creation and screening can fall back to an active
non-admin user when X-User-Id is not provided.

In production, replace that development fallback with JWT/session
authentication without changing the ownership queries.
"""

from pathlib import Path
from uuid import UUID

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    Header,
    HTTPException,
    UploadFile,
)
from sqlalchemy.orm import Session

from .database import get_db
from .models import User, Job
from .tool_functions import (
    ingest_resume_folder,
    create_job,
    screen_job,
    get_user_jobs,
    get_user_job_candidates,
    get_admin_jobs,
    get_admin_job_candidates,
    read_file,
)
from .config import settings


router = APIRouter(prefix="/api")


# ============================================================
# AUTHENTICATION
# ============================================================

def current_user(
    x_user_id: str = Header(..., alias="X-User-Id"),
    db: Session = Depends(get_db),
) -> User:
    """Return the authenticated active user."""

    try:
        user = db.get(User, UUID(x_user_id))
    except ValueError:
        user = None

    if not user or not user.is_active:
        raise HTTPException(
            status_code=401,
            detail="Invalid user",
        )

    return user


def require_admin(
    user: User = Depends(current_user),
) -> User:
    """Return admin user or raise HTTP 403."""

    if user.role != "ADMIN":
        raise HTTPException(
            status_code=403,
            detail="Admin access required",
        )

    return user


# ============================================================
# RESUME INGESTION
# ============================================================

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


# ============================================================
# CREATE JOB
# ============================================================

@router.post("/jobs")
async def api_create_job(
    x_user_id: str | None = Header(None, alias="X-User-Id"),
    file: UploadFile | None = File(None),
    jd_text: str | None = Form(None),
    db: Session = Depends(get_db),
):
    """
    Create a Job from either:
    - written JD text
    - uploaded JD file

    Exactly one input is required.

    During development, if X-User-Id is not provided,
    the first active non-admin user is used automatically.

    Output:
        Job information + AI extracted requirements.
    """

    # --------------------------------------------------------
    # Resolve user
    # --------------------------------------------------------

    if x_user_id:
        try:
            user_id = UUID(x_user_id)
        except ValueError:
            raise HTTPException(
                status_code=401,
                detail="Invalid user ID",
            )

        user = (
            db.query(User)
            .filter(User.id == user_id)
            .first()
        )

        if not user:
            raise HTTPException(
                status_code=401,
                detail="User not found",
            )

    else:
        # Development-only fallback.
        # Uses an existing active non-admin user.
        user = (
            db.query(User)
            .filter(
                User.is_active == True,
                User.role != "ADMIN",
            )
            .first()
        )

        if not user:
            raise HTTPException(
                status_code=401,
                detail="No active non-admin user found for development.",
            )

        user_id = user.id

    # --------------------------------------------------------
    # Admin cannot create jobs
    # --------------------------------------------------------

    if user.role == "ADMIN":
        raise HTTPException(
            status_code=403,
            detail="Admin cannot create job descriptions",
        )

    # --------------------------------------------------------
    # Validate input
    # --------------------------------------------------------

    if file and jd_text:
        raise HTTPException(
            status_code=400,
            detail="Provide either a JD file or JD text, not both",
        )

    if not file and not jd_text:
        raise HTTPException(
            status_code=400,
            detail="Provide either a JD file or JD text",
        )

    try:

        # ====================================================
        # OPTION 1 — PASTED JOB DESCRIPTION
        # ====================================================

        if jd_text:

            if not jd_text.strip():
                raise HTTPException(
                    status_code=400,
                    detail="Job description text cannot be empty",
                )

            job = create_job(
                db=db,
                user_id=user_id,
                raw_text=jd_text.strip(),
            )

        # ====================================================
        # OPTION 2 — UPLOADED JOB DESCRIPTION
        # ====================================================

        else:

            # ------------------------------------------------
            # Protect against unsafe filenames
            # ------------------------------------------------

            safe_filename = Path(
                file.filename or "job_description"
            ).name

            # ------------------------------------------------
            # Make sure JD directory exists
            # ------------------------------------------------

            jd_directory = Path(settings.JD_DIR)

            jd_directory.mkdir(
                parents=True,
                exist_ok=True,
            )

            # ------------------------------------------------
            # Save uploaded file
            # ------------------------------------------------

            file_path = (
                jd_directory
                / safe_filename
            )

            contents = await file.read()

            with open(
                file_path,
                "wb",
            ) as f:
                f.write(contents)

            # ------------------------------------------------
            # Extract text from PDF/DOC/DOCX/TXT
            # ------------------------------------------------

            raw_text = read_file(
                str(file_path)
            )

            if not raw_text.strip():
                raise HTTPException(
                    status_code=400,
                    detail="Could not extract text from the uploaded JD",
                )

            # ------------------------------------------------
            # Create job + AI extraction
            # ------------------------------------------------

            job = create_job(
                db=db,
                user_id=user_id,
                raw_text=raw_text,
                file_name=safe_filename,
                file_path=str(file_path),
            )

        # ====================================================
        # GET EXTRACTED REQUIREMENTS
        # ====================================================

        requirements = job.requirements

        # ====================================================
        # BUILD RESPONSE
        # ====================================================

        response = {
            "job_id": str(job.id),

            "title": job.title,

            "description": job.description,

            "location": job.location,

            "work_mode": job.work_mode,

            "status": job.status,

            "requirements": {
                "job_title": (
                    requirements.job_title
                    if requirements
                    else job.title
                ),

                "minimum_experience": (
                    float(
                        requirements.minimum_experience
                    )
                    if (
                        requirements
                        and requirements.minimum_experience
                        is not None
                    )
                    else None
                ),

                "maximum_experience": (
                    float(
                        requirements.maximum_experience
                    )
                    if (
                        requirements
                        and requirements.maximum_experience
                        is not None
                    )
                    else None
                ),

                "mandatory_skills": (
                    requirements.mandatory_skills
                    if requirements
                    else []
                ),

                "preferred_skills": (
                    requirements.preferred_skills
                    if requirements
                    else []
                ),

                "education": (
                    requirements.education
                    if requirements
                    else []
                ),

                "certifications": (
                    requirements.certifications
                    if requirements
                    else []
                ),

                "domains": (
                    requirements.domains
                    if requirements
                    else []
                ),

                "responsibilities": (
                    requirements.responsibilities
                    if requirements
                    else []
                ),

                "location": (
                    requirements.location
                    if requirements
                    else job.location
                ),

                "work_mode": (
                    requirements.work_mode
                    if requirements
                    else job.work_mode
                ),

                "notice_period_days": (
                    requirements.notice_period_days
                    if requirements
                    else None
                ),

                "other_requirements": (
                    requirements.other_requirements
                    if requirements
                    else []
                ),

                "confidence_score": (
                    float(
                        requirements.confidence_score
                    )
                    if (
                        requirements
                        and requirements.confidence_score
                        is not None
                    )
                    else None
                ),
            },
        }

        return response

    except HTTPException:
        raise

    except Exception as exc:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=f"Job creation failed: {str(exc)}",
        )


# ============================================================
# SCREEN JOB
# ============================================================

@router.post("/jobs/{job_id}/screen")
def api_screen_job(
    job_id: UUID,
    x_user_id: str | None = Header(None, alias="X-User-Id"),
    db: Session = Depends(get_db),
):
    """
    Screen candidates for a specific job.

    If X-User-Id is provided:
        use that authenticated user.

    If X-User-Id is not provided:
        use the first active non-admin user for development.

    Users can screen only their own jobs.
    Admins can screen any job.
    """

    # --------------------------------------------------------
    # Resolve user
    # --------------------------------------------------------

    if x_user_id:

        try:
            user_id = UUID(x_user_id)

        except ValueError:
            raise HTTPException(
                status_code=401,
                detail="Invalid user ID",
            )

        user = (
            db.query(User)
            .filter(User.id == user_id)
            .first()
        )

        if not user:
            raise HTTPException(
                status_code=401,
                detail="User not found",
            )

    else:

        # Development-only fallback.
        user = (
            db.query(User)
            .filter(
                User.is_active == True,
                User.role != "ADMIN",
            )
            .first()
        )

        if not user:
            raise HTTPException(
                status_code=401,
                detail="No active non-admin user found for development.",
            )

    # --------------------------------------------------------
    # Find job
    # --------------------------------------------------------

    job = db.get(
        Job,
        job_id,
    )

    if not job:
        raise HTTPException(
            status_code=404,
            detail="Job not found",
        )

    # --------------------------------------------------------
    # Ownership check
    # --------------------------------------------------------

    if (
        user.role != "ADMIN"
        and job.created_by != user.id
    ):
        raise HTTPException(
            status_code=403,
            detail="Not your job",
        )

    # --------------------------------------------------------
    # Run AI screening
    # --------------------------------------------------------

    try:

        return screen_job(
            db,
            job_id,
        )

    except Exception as exc:

        raise HTTPException(
            status_code=500,
            detail=str(exc),
        )


# ============================================================
# USER JOBS
# ============================================================

@router.get("/user/jobs")
def api_user_jobs(
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    """
    Return only jobs belonging to the authenticated user.
    """

    return get_user_jobs(
        db,
        user.id,
    )


# ============================================================
# USER CANDIDATES
# ============================================================

@router.get("/user/jobs/{job_id}/candidates")
def api_user_candidates(
    job_id: UUID,
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    """
    Return Top 10 candidates for the authenticated user's job.
    """

    try:

        return get_user_job_candidates(
            db,
            user.id,
            job_id,
        )

    except PermissionError:

        raise HTTPException(
            status_code=403,
            detail="Not your job",
        )


# ============================================================
# ADMIN JOBS
# ============================================================

@router.get("/admin/jobs")
def api_admin_jobs(
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """
    Return all jobs for administrators.
    """

    return get_admin_jobs(
        db
    )


# ============================================================
# ADMIN CANDIDATES
# ============================================================

@router.get("/admin/jobs/{job_id}/candidates")
def api_admin_candidates(
    job_id: UUID,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """
    Return Top 10 candidates for an admin-selected job.
    """

    try:

        return get_admin_job_candidates(
            db,
            job_id,
        )

    except ValueError:

        raise HTTPException(
            status_code=404,
            detail="Job not found",
        )