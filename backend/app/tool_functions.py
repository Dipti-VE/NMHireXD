# """All actual NM-HireX business functions.

# Each function is intentionally small and directly composable; LangGraph is not
# required for this deterministic pipeline.
# """
# import hashlib, json, re, time, logging
# from pathlib import Path
# from uuid import UUID
# from sqlalchemy import select, delete, text
# from sqlalchemy.orm import Session
# from openai import OpenAI
# from pypdf import PdfReader
# from docx import Document
# from .config import settings
# from .models import (User, Job, JobRequirement, Candidate, Resume, CandidateSkill,
#     CandidateExperience, CandidateEducation, CandidateCertification, CandidateProject,
#     JobCandidate, ScreeningResult, ScreeningRun, AIExtractionLog)

# openai_client = OpenAI(api_key=settings.GROQ_API_KEY, base_url=settings.GROQ_BASE_URL)

# # ------------------------------------------------------------
# # FILE HELPERS
# # ------------------------------------------------------------
# def read_file(path: str) -> str:
#     """
#     Read a supported PDF, DOCX, or TXT file.

#     Input:
#         path -> File path.

#     Output:
#         Extracted plain text.

#     Raises:
#         Exception if the file cannot be read.
#     """

#     p = Path(path)

#     if p.suffix.lower() == ".pdf":

#         # pypdf can produce noisy logger messages for malformed PDFs.
#         # Suppress those messages without hiding real application errors.
#         pypdf_logger = logging.getLogger("pypdf")
#         previous_level = pypdf_logger.level

#         try:
#             pypdf_logger.setLevel(logging.ERROR)

#             reader = PdfReader(str(p))

#             return "\n".join(
#                 (page.extract_text() or "")
#                 for page in reader.pages
#             )

#         finally:
#             pypdf_logger.setLevel(previous_level)

#     if p.suffix.lower() == ".docx":
#         return "\n".join(
#             paragraph.text
#             for paragraph in Document(str(p)).paragraphs
#         )

#     if p.suffix.lower() == ".txt":
#         return p.read_text(
#             encoding="utf-8",
#             errors="ignore"
#         )

#     raise ValueError(
#         f"Unsupported file type: {p.suffix}"
#     )
# def file_hash(path: str) -> str:
#     """Input: file path. Output: SHA-256 hex digest used for duplicate detection."""
#     h = hashlib.sha256()
#     with open(path, "rb") as f:
#         for block in iter(lambda: f.read(1024 * 1024), b""):
#             h.update(block)
#     return h.hexdigest()



# # ------------------------------------------------------------
# # AI EXTRACTION
# # ------------------------------------------------------------
# def _json_completion(prompt: str, model: str) -> dict:
#     """Input: prompt/model. Output: validated JSON object returned by the configured LLM."""
#     response = openai_client.chat.completions.create(
#         model=model,
#         temperature=0,
#         response_format={"type": "json_object"},
#         messages=[{"role": "system", "content": "Return only valid JSON."}, {"role": "user", "content": prompt}],
#     )
#     return json.loads(response.choices[0].message.content)

# def extract_jd(text: str) -> dict:
#     """Input: JD text. Output: structured JD requirements. Unknown facts must be null/empty."""
#     prompt = f"""
# Extract this job description into JSON with exactly these keys:
# job_title, min_experience_years, max_experience_years, mandatory_skills,
# preferred_skills, education, certifications, domains, responsibilities,
# location, work_mode, notice_period_days, other_requirements, confidence_score.
# Rules: preserve specific skills exactly; only classify a skill as mandatory when
# required/essential; words such as advantageous/preferred/nice-to-have belong in
# preferred_skills; never infer missing experience, location, notice period or education.
# JD:\n{text[:30000]}
# """
#     return _json_completion(prompt, settings.EXTRACTION_MODEL)

# def extract_resume(text: str) -> dict:
#     """Input: CV text. Output: structured candidate profile with explicit nulls for unsupported facts."""
#     prompt = f"""
# Extract the CV into JSON with exactly these keys:
# name, email, phone, location, total_experience_years, current_company, current_role,
# notice_period_days, profile_summary, skills, experiences, education, certifications, projects.
# Rules: never guess missing values; never turn a technology into a company or role;
# preserve specific skills such as Django as Django and use parent_skill only as a relationship.
# CV:\n{text[:30000]}
# """
#     return _json_completion(prompt, settings.EXTRACTION_MODEL)

# def normalize_skill(name: str) -> tuple[str, str | None, str | None]:
#     """
#     Normalize a candidate skill while preserving the original specific technology.

#     Input:
#         name -> Skill name.

#     Output:
#         Tuple containing:
#         - normalized skill
#         - parent skill
#         - skill category

#     Example:
#         Django -> Django, Python, Backend
#         DRF -> Django REST Framework, Django, Backend
#     """

#     if name is None:
#         return "", None, None

#     raw = str(name).strip()

#     if not raw:
#         return "", None, None

#     low = raw.lower()

#     relationships = {
#         "django": ("Django", "Python", "Backend"),
#         "django rest framework": (
#             "Django REST Framework",
#             "Django",
#             "Backend"
#         ),
#         "drf": (
#             "Django REST Framework",
#             "Django",
#             "Backend"
#         ),
#         "flask": ("Flask", "Python", "Backend"),
#         "fastapi": ("FastAPI", "Python", "Backend"),
#         "spring boot": ("Spring Boot", "Java", "Backend"),
#         "react.js": ("React", "JavaScript", "Frontend"),
#         "react": ("React", "JavaScript", "Frontend"),
#     }

#     if low in relationships:
#         return relationships[low]

#     return raw, None, None

# def safe_list(value) -> list:
#     """
#     Convert an extracted value into a safe list.

#     Input:
#         value -> GPT extracted value.

#     Output:
#         Always returns a list.

#     Examples:
#         None -> []
#         "Python" -> ["Python"]
#         ["Python", "SQL"] -> ["Python", "SQL"]
#         {"name": "Python"} -> [{"name": "Python"}]
#     """

#     if value is None:
#         return []

#     if isinstance(value, list):
#         return value

#     return [value]

# def safe_dict(value) -> dict:
#     """
#     Convert an extracted value into a safe dictionary.

#     Input:
#         value -> GPT extracted value.

#     Output:
#         Dictionary. Invalid values become {}.
#     """

#     return value if isinstance(value, dict) else {}
# def safe_float(value):
#     """
#     Convert AI-extracted experience values into a PostgreSQL-safe float.

#     Input:
#         value -> AI-extracted value such as:
#                  5
#                  "5"
#                  "5 years"
#                  "14+"
#                  "6-10"
#                  "Not provided"
#                  None

#     Output:
#         float or None
#     """
#     if value is None:
#         return None

#     if isinstance(value, (int, float)):
#         return float(value)

#     text = str(value).strip().lower()

#     if not text or text in {
#         "not provided",
#         "not specified",
#         "unknown",
#         "n/a",
#         "na",
#         "none",
#         "null",
#         "-"
#     }:
#         return None

#     # Handle ranges such as "6-10"
#     range_match = re.search(r"(\d+(?:\.\d+)?)\s*[-–]\s*(\d+(?:\.\d+)?)", text)
#     if range_match:
#         low = float(range_match.group(1))
#         high = float(range_match.group(2))
#         return (low + high) / 2

#     # Handle values such as "14+", "5 years", "3.5 years"
#     number_match = re.search(r"\d+(?:\.\d+)?", text)

#     if number_match:
#         return float(number_match.group())

#     return None
# # ------------------------------------------------------------
# # RESUME INGESTION
# # ------------------------------------------------------------
# def store_resume(db: Session, path: str) -> UUID:
#     """
#     Store one resume safely in PostgreSQL and Pinecone.

#     Input:
#         db   -> SQLAlchemy PostgreSQL session
#         path -> Resume file path

#     Output:
#         Candidate UUID.

#     Processing:
#         1. Detect duplicate resume.
#         2. Read resume text.
#         3. Extract candidate information using GPT.
#         4. If extraction fails, use safe fallback data.
#         5. Store candidate and resume in PostgreSQL.
#         6. Store structured skills/experience/education/etc.
#         7. Create Pinecone embeddings when text is available.
#         8. Pinecone failure does not prevent PostgreSQL ingestion.
#     """

#     path_obj = Path(path)

#     # ---------------------------------------------------------
#     # 1. Calculate file hash
#     # ---------------------------------------------------------

#     digest = file_hash(path)

#     existing = db.scalar(
#         select(Resume).where(
#             Resume.file_hash == digest
#         )
#     )

#     if existing:
#         return existing.candidate_id

#     # ---------------------------------------------------------
#     # 2. Read resume
#     # ---------------------------------------------------------

#     try:
#         text = read_file(path)
#     except Exception as error:
#         print(
#             f"   [WARNING] Could not extract text: {error}"
#         )

#         # We still ingest the resume.
#         text = ""
#     if text.strip() and looks_like_job_description(
#     text,
#     path_obj.name
#     ):
#         raise ValueError(
#         "File appears to be a Job Description, not a resume"
#     )
#     # ---------------------------------------------------------
#     # 3. Extract resume information
#     # ---------------------------------------------------------

#     data = {}

#     if text.strip():

#         try:
#             extracted = extract_resume(text)

#             if isinstance(extracted, dict):
#                 data = extracted
#             else:
#                 print(
#                     "   [WARNING] GPT returned invalid resume data."
#                 )

#         except Exception as error:
#             print(
#                 f"   [WARNING] Resume extraction failed: {error}"
#             )

#     # ---------------------------------------------------------
#     # 4. Safe candidate values
#     # ---------------------------------------------------------

#     candidate_name = (
#         data.get("name")
#         or path_obj.stem
#         or "Unknown Candidate"
#     )

#     candidate_name = str(candidate_name).strip()

#     if not candidate_name:
#         candidate_name = path_obj.stem or "Unknown Candidate"

#     # ---------------------------------------------------------
#     # 5. Create Candidate
#     # ---------------------------------------------------------

#     candidate = Candidate(
#     name=candidate_name,
#     email=data.get("email"),
#     phone=data.get("phone"),
#     location=data.get("location"),
#     total_experience_years=safe_float(
#         data.get("total_experience_years")
#     ),
#     current_company=data.get("current_company"),
#     current_role=data.get("current_role"),
#     notice_period_days=safe_float(
#         data.get("notice_period_days")
#     ),
#     profile_summary=data.get("profile_summary"),
#     raw_profile_text=text,
#     normalized_profile=data,
# )

#     db.add(candidate)
#     db.flush()

#     # ---------------------------------------------------------
#     # 6. Create Resume record
#     # ---------------------------------------------------------

#     resume = Resume(
#         candidate_id=candidate.id,
#         file_name=path_obj.name,
#         file_url=str(path_obj),
#         file_type=path_obj.suffix.lower().lstrip("."),
#         file_size=path_obj.stat().st_size,
#         file_hash=digest,
#         raw_text=text,
#         parsed_data=data,
#         parsing_status="COMPLETED",
#         extraction_status="COMPLETED",
#         extraction_model=settings.EXTRACTION_MODEL,
#         extraction_version="v1",
#     )

#     db.add(resume)
#     db.flush()

#     # ---------------------------------------------------------
#     # 7. Store skills safely
#     # ---------------------------------------------------------

#     skills = safe_list(
#         data.get("skills")
#     )

#     for item in skills:

#         if isinstance(item, dict):

#             name = item.get("name")

#             if not name:
#                 continue

#             normalized, parent, category = normalize_skill(
#                 name
#             )

#             if not normalized:
#                 continue

#             db.add(
#                 CandidateSkill(
#                     candidate_id=candidate.id,
#                     skill_name=str(name),
#                     normalized_skill_name=normalized,
#                     parent_skill=(
#                         item.get("parent_skill")
#                         or parent
#                     ),
#                     skill_category=(
#                         item.get("category")
#                         or category
#                     ),
#                     experience_years=item.get(
#                         "experience_years"
#                     ),
#                     proficiency=item.get(
#                         "proficiency"
#                     ),
#                     source="resume",
#                     confidence_score=item.get(
#                         "confidence_score"
#                     ),
#                 )
#             )

#         elif isinstance(item, str):

#             normalized, parent, category = normalize_skill(
#                 item
#             )

#             if not normalized:
#                 continue

#             db.add(
#                 CandidateSkill(
#                     candidate_id=candidate.id,
#                     skill_name=item.strip(),
#                     normalized_skill_name=normalized,
#                     parent_skill=parent,
#                     skill_category=category,
#                     source="resume",
#                 )
#             )

#     # ---------------------------------------------------------
#     # 8. Store experience safely
#     # ---------------------------------------------------------

#     experiences = safe_list(
#         data.get("experiences")
#         or data.get("experience")
#     )

#     for item in experiences:

#         if isinstance(item, str):
#             item = {
#                 "description": item
#             }

#         if not isinstance(item, dict):
#             continue

#         db.add(
#             CandidateExperience(
#                 candidate_id=candidate.id,
#                 company_name=item.get(
#                     "company_name"
#                 ),
#                 job_title=item.get(
#                     "job_title"
#                 ),
#                 employment_type=item.get(
#                     "employment_type"
#                 ),
#                 description=item.get(
#                     "description"
#                 ),
#                 domain=item.get(
#                     "domain"
#                 ),
#                 normalized_data=item,
#             )
#         )

#     # ---------------------------------------------------------
#     # 9. Store education safely
#     # ---------------------------------------------------------

#     education = safe_list(
#         data.get("education")
#     )

#     for item in education:

#         if isinstance(item, str):
#             item = {
#                 "degree": item
#             }

#         if not isinstance(item, dict):
#             continue

#         db.add(
#             CandidateEducation(
#                 candidate_id=candidate.id,
#                 degree=item.get(
#                     "degree"
#                 ),
#                 field_of_study=item.get(
#                     "field_of_study"
#                 ),
#                 institution=item.get(
#                     "institution"
#                 ),
#                 start_year=item.get(
#                     "start_year"
#                 ),
#                 end_year=item.get(
#                     "end_year"
#                 ),
#                 grade=item.get(
#                     "grade"
#                 ),
#             )
#         )

#     # ---------------------------------------------------------
#     # 10. Store certifications safely
#     # ---------------------------------------------------------

#     certifications = safe_list(
#         data.get("certifications")
#     )

#     for item in certifications:

#         if isinstance(item, str):
#             item = {
#                 "certification_name": item
#             }

#         if not isinstance(item, dict):
#             continue

#         certification_name = (
#             item.get("certification_name")
#             or item.get("name")
#         )

#         if not certification_name:
#             continue

#         db.add(
#             CandidateCertification(
#                 candidate_id=candidate.id,
#                 certification_name=certification_name,
#                 issuing_organization=(
#                     item.get(
#                         "issuing_organization"
#                     )
#                     or item.get("issuer")
#                 ),
#                 credential_id=item.get(
#                     "credential_id"
#                 ),
#             )
#         )

#     # ---------------------------------------------------------
#     # 11. Store projects safely
#     # ---------------------------------------------------------

#     projects = safe_list(
#         data.get("projects")
#     )

#     for item in projects:

#         if isinstance(item, str):
#             item = {
#                 "project_name": item
#             }

#         if not isinstance(item, dict):
#             continue

#         db.add(
#             CandidateProject(
#                 candidate_id=candidate.id,
#                 project_name=item.get(
#                     "project_name"
#                 ),
#                 description=item.get(
#                     "description"
#                 ),
#                 technologies=item.get(
#                     "technologies"
#                 ),
#                 domain=item.get(
#                     "domain"
#                 ),
#             )
#         )

#     # ---------------------------------------------------------
#     # 12. Commit PostgreSQL FIRST
#     # ---------------------------------------------------------

#     db.commit()

#     print("   [OK] PostgreSQL")
#     return candidate.id
# def looks_like_job_description(text: str, filename: str) -> bool:
#     """
#     Detect whether a file is more likely to be a Job Description than a resume.

#     Input:
#         text     -> extracted document text
#         filename -> original filename

#     Output:
#         True if the document appears to be a JD, otherwise False.
#     """
#     filename_lower = filename.lower()
#     text_lower = text.lower()

#     # Strong filename indicators
#     jd_filename_terms = [
#         "job description",
#         "job_description",
#         "jd_",
#         "_jd",
#         " jd",
#     ]

#     if any(term in filename_lower for term in jd_filename_terms):
#         return True

#     # Strong JD content indicators
#     jd_terms = [
#         "job description",
#         "role overview",
#         "role context",
#         "responsibilities",
#         "qualifications",
#         "requirements",
#         "key responsibilities",
#         "preferred qualifications",
#         "job requirements",
#     ]

#     matches = sum(1 for term in jd_terms if term in text_lower)

#     return matches >= 3

# # -------------------------------------------
# #     # ingest resume folder 
# # -------------------------------------------

# def ingest_resume_folder(db: Session) -> dict:
#     """
#     Scan the resume folder and ingest every supported CV.

#     Input:
#         db -> SQLAlchemy PostgreSQL database session

#     Output:
#         Dictionary containing:
#         - total
#         - successful
#         - skipped
#         - failed
#         - failed_files

#     Processing:
#         1. Scan data/resumes.
#         2. Process every PDF/DOCX.
#         3. Store every readable or partially readable CV.
#         4. Continue even when extraction fails.
#         5. Continue even when Pinecone fails.
#     """

#     resume_dir = Path(settings.RESUME_DIR)

#     if not resume_dir.exists():

#         return {
#             "status": "FAILED",
#             "message": (
#                 f"Resume directory does not exist: "
#                 f"{resume_dir}"
#             ),
#             "total": 0,
#             "successful": 0,
#             "skipped": 0,
#             "failed": 0,
#             "failed_files": [],
#         }

#     files = sorted(
#         [
#             p
#             for p in resume_dir.iterdir()
#             if p.is_file()
#             and p.suffix.lower() in {
#                 ".pdf",
#                 ".docx"
#             }
#         ],
#         key=lambda p: p.name.lower(),
#     )

#     total = len(files)

#     successful = 0
#     skipped = 0
#     failed = 0

#     failed_files = []

#     print()
#     print("=" * 70)
#     print(f"FOUND {total} RESUME FILES")
#     print("=" * 70)

#     for index, file_path in enumerate(
#         files,
#         start=1
#     ):

#         print(
#             f"\n[{index}/{total}] "
#             f"Processing: {file_path.name}"
#         )

#         try:

#             # -------------------------------------------------
#             # Duplicate check
#             # -------------------------------------------------

#             digest = file_hash(
#                 str(file_path)
#             )

#             existing = db.scalar(
#                 select(Resume).where(
#                     Resume.file_hash == digest
#                 )
#             )

#             if existing:

#                 print(
#                     "   [SKIPPED] Already ingested."
#                 )

#                 skipped += 1
#                 continue

#             # -------------------------------------------------
#             # Store resume
#             # -------------------------------------------------

#             candidate_id = store_resume(
#                 db=db,
#                 path=str(file_path)
#             )

#             successful += 1

#             print(
#                 f"   [OK] Successfully ingested "
#                 f"| Candidate: {candidate_id}"
#             )

#         except ValueError as error:
#                 db.rollback()

#                 if "Job Description" in str(error):
#                     skipped += 1
#                     print(f"   [SKIPPED] {file_path.name} - Job Description detected.")
#                 else:
#                     failed += 1
#                     failed_files.append({
#                         "file": file_path.name,
#                         "error": str(error)
#                     })
#                     print(f"   [FAILED] {file_path.name}")
#                     print(f"   Reason: {error}")

#                 continue

#         except Exception as error:
#             db.rollback()
#             failed += 1
#             failed_files.append({
#                 "file": file_path.name,
#                 "error": str(error)
#             })
#             print(f"   [FAILED] {file_path.name}")
#             print(f"   Reason: {error}")
#             continue

#     # ---------------------------------------------------------
#     # Final summary
#     # ---------------------------------------------------------

#     print()
#     print("=" * 70)
#     print("RESUME INGESTION COMPLETE")
#     print("=" * 70)

#     print(
#         f"Total files : {total}"
#     )

#     print(
#         f"Successful  : {successful}"
#     )

#     print(
#         f"Skipped     : {skipped}"
#     )

#     print(
#         f"Failed      : {failed}"
#     )

#     if failed_files:

#         print()
#         print("FAILED FILES")
#         print("-" * 70)

#         for item in failed_files:

#             print(
#                 f"- {item['file']}"
#             )

#             print(
#                 f"  {item['error']}"
#             )

#     print("=" * 70)

#     return {
#         "status": "COMPLETED",
#         "total": total,
#         "successful": successful,
#         "skipped": skipped,
#         "failed": failed,
#         "failed_files": failed_files,
#     }
# # ------------------------------------------------------------
# # JD CREATION
# # ------------------------------------------------------------
# def create_job(
#     db: Session,
#     user_id: UUID,
#     raw_text: str,
#     file_name: str | None = None,
#     file_path: str | None = None
# ) -> Job:
#     """
#     Create a Job from either written JD text or an uploaded JD file.

#     Input:
#         db        -> PostgreSQL database session
#         user_id   -> authenticated recruiter/user UUID
#         raw_text  -> JD text
#         file_name -> optional uploaded JD filename
#         file_path -> optional path of uploaded JD file

#     Output:
#         Persisted Job with JobRequirement and AIExtractionLog.
#     """

#     if not raw_text or not raw_text.strip():
#         raise ValueError("JD content cannot be empty")

#     raw_text = raw_text.strip()

#     # --------------------------------------------------------
#     # 1. Extract JD requirements using GPT
#     # --------------------------------------------------------
#     data = extract_jd(raw_text)

#     # --------------------------------------------------------
#     # 2. Create Job
#     # --------------------------------------------------------
#     job = Job(
#         created_by=user_id,
#         title=data.get("job_title") or "Untitled Job",
#         description=raw_text,
#         location=data.get("location"),
#         work_mode=data.get("work_mode"),
#         jd_file_name=file_name,
#         jd_file_url=file_path,
#         jd_raw_text=raw_text,
#         status="READY"
#     )

#     db.add(job)
#     db.flush()

#     # --------------------------------------------------------
#     # 3. Store extracted JD requirements
#     # --------------------------------------------------------
#     req = JobRequirement(
#         job_id=job.id,
#         job_title=data.get("job_title"),

#         minimum_experience=data.get("min_experience_years"),
#         maximum_experience=data.get("max_experience_years"),

#         location=data.get("location"),
#         work_mode=data.get("work_mode"),
#         notice_period_days=data.get("notice_period_days"),

#         mandatory_skills=data.get("mandatory_skills") or [],
#         preferred_skills=data.get("preferred_skills") or [],

#         education=data.get("education") or [],
#         certifications=data.get("certifications") or [],
#         domains=data.get("domains") or [],
#         responsibilities=data.get("responsibilities") or [],

#         other_requirements=data.get("other_requirements") or [],

#         extraction_model=settings.EXTRACTION_MODEL,
#         extraction_version="v1",
#         confidence_score=data.get("confidence_score")
#     )

#     db.add(req)

#     # --------------------------------------------------------
#     # 4. Store AI extraction log
#     # --------------------------------------------------------
#     db.add(
#         AIExtractionLog(
#             entity_type="JD",
#             entity_id=job.id,
#             model_name=settings.EXTRACTION_MODEL,
#             prompt_version="v1",
#             input_text_hash=hashlib.sha256(
#                 raw_text.encode()
#             ).hexdigest(),
#             output_data=data,
#             confidence_score=data.get("confidence_score"),
#             validation_status="PASSED"
#         )
#     )

#     # --------------------------------------------------------
#     # 5. Save everything
#     # --------------------------------------------------------
#     db.commit()
#     db.refresh(job)

#     return job

# # ------------------------------------------------------------
# # MATCHING + EVIDENCE
# # ------------------------------------------------------------


# # def exact_skill_match(db: Session, candidate_id: UUID, required: list) -> dict:
# #     """Input: candidate and JD required skills. Output: per-skill match evidence and percentage."""
# #     skills = db.scalars(select(CandidateSkill).where(CandidateSkill.candidate_id == candidate_id)).all()
# #     normalized = {s.normalized_skill_name.lower(): s for s in skills}
# #     parent_map = {s.parent_skill.lower(): s for s in skills if s.parent_skill}
# #     details, matched = [], 0
# #     required_names = [x.get("name") if isinstance(x, dict) else str(x) for x in required]
# #     for req in required_names:
# #         key = req.lower()
# #         if key in normalized:
# #             matched += 1; details.append({"required": req, "status": "EXACT", "candidate_skill": normalized[key].skill_name})
# #         elif key in parent_map:
# #             details.append({"required": req, "status": "PARENT_SUPPORT", "candidate_skill": parent_map[key].skill_name})
# #         else:
# #             details.append({"required": req, "status": "MISSING"})
# #     return {"matched": matched, "total": len(required_names), "details": details}


# def exact_skill_match(db: Session, candidate_id: UUID, required: list) -> dict:

#     """

#     Match JD-required skills against candidate skills.
 
#     Uses database-normalized skill names and parent skills.

#     No hardcoded skill aliases.
 
#     Match priority:

#         EXACT > PARENT_SUPPORT > MISSING
 
#     Only EXACT matches count toward the percentage.

#     """
 
#     # Get candidate skills

#     skills = db.scalars(

#         select(CandidateSkill).where(

#             CandidateSkill.candidate_id == candidate_id

#         )

#     ).all()
 
#     # Prepare candidate skills from DB

#     candidate_skills = []
 
#     for skill in skills:

#         normalized = (skill.normalized_skill_name or skill.skill_name or "").strip().lower()

#         original = (skill.skill_name or "").strip()

#         parent = (skill.parent_skill or "").strip().lower()
 
#         candidate_skills.append({

#             "normalized": normalized,

#             "original": original,

#             "parent": parent,

#         })
 
#     # Extract required skill names

#     required_names = [

#         x.get("name") if isinstance(x, dict) else str(x)

#         for x in required

#     ]
 
#     details = []

#     matched = 0
 
#     for req in required_names:
 
#         required_skill = str(req).strip().lower()
 
#         status = "MISSING"

#         matched_skill_name = None
 
#         # ---------------------------------------------------------

#         # 1. EXACT NORMALIZED MATCH

#         # ---------------------------------------------------------

#         for candidate in candidate_skills:
 
#             if required_skill == candidate["normalized"]:

#                 status = "EXACT"

#                 matched_skill_name = candidate["original"]

#                 break
 
#         # ---------------------------------------------------------

#         # 2. PARENT SKILL MATCH

#         # ---------------------------------------------------------

#         if status == "MISSING":
 
#             for candidate in candidate_skills:
 
#                 if (

#                     candidate["parent"]

#                     and required_skill == candidate["parent"]

#                 ):

#                     status = "PARENT_SUPPORT"

#                     matched_skill_name = candidate["original"]

#                     break
 
#         # Only exact matches count

#         if status == "EXACT":

#             matched += 1
 
#         details.append({

#             "required": req,

#             "status": status,

#             "candidate_skill": matched_skill_name,

#         })
 
#     # Calculate percentage

#     total = len(required_names)
 
#     percentage = (

#         round((matched / total) * 100, 2)

#         if total > 0

#         else 0

#     )
 
#     return {

#         "matched": matched,

#         "total": total,

#         "percentage": percentage,

#         "details": details,

#     }
 
# def retrieve_evidence(db: Session, candidate_id: UUID) -> list[dict]:
#     """Input: candidate UUID. Output: profile summary from PostgreSQL as evidence."""
#     candidate = db.get(Candidate, candidate_id)
#     if candidate and candidate.profile_summary:
#         return [{"score": 1.0, "text": candidate.profile_summary}]
#     return [{"score": 0.0, "text": "No evidence available."}]

# # ------------------------------------------------------------
# # GPT EVALUATION
# # ------------------------------------------------------------
# def nl_to_sql_search(req: JobRequirement) -> str:
#     """Output: PostgreSQL query to find matching candidate UUIDs loosely."""
#     req_json = {
#         "mandatory_skills": req.mandatory_skills,
#         "preferred_skills": req.preferred_skills,
#         "min_experience_years": req.minimum_experience
#     }
#     prompt = f"""
# You are a PostgreSQL expert. Generate a SQL query to find candidates who MIGHT match this Job Requirement.
# Database Schema:
# - candidates (id UUID, name VARCHAR, total_experience_years NUMERIC, location VARCHAR, notice_period_days INT)
# - candidate_skills (candidate_id UUID, skill_name VARCHAR)
# - candidate_experiences (candidate_id UUID, job_title VARCHAR)
# Rules:
# - Return distinct `candidates.id`.
# - Be loose/forgiving: we want to cast a wide net. For example, if minimum experience is 8, maybe accept >= 6.
# - If skills are listed, match candidates who have AT LEAST ONE of the mandatory or preferred skills using ILIKE on `candidate_skills.skill_name`.
# - Do NOT wrap the query in markdown formatting (like ```sql).
# - Return ONLY the raw SQL string.
# Requirements:
# {json.dumps(req_json, default=str)}
# """
#     try:
#         response = openai_client.chat.completions.create(
#             model=settings.EXTRACTION_MODEL,
#             messages=[{"role": "user", "content": prompt}]
#         )
#         sql_query = response.choices[0].message.content.strip()
#         sql_query = re.sub(r"^```sql", "", sql_query, flags=re.IGNORECASE)
#         return re.sub(r"```$", "", sql_query).strip()
#     except Exception as e:
#         print(f"NL-to-SQL failed: {e}")
#         return "SELECT id FROM candidates;"

# # ------------------------------------------------------------
# # GPT EVALUATION
# # ------------------------------------------------------------
# def ai_score_candidate(candidate: Candidate, req: JobRequirement) -> dict:
#     """Output: precisely 8 numerical scores and reasoning string."""
#     payload = {
#         "candidate": {"name": candidate.name, "experience": candidate.total_experience_years,
#                       "company": candidate.current_company, "role": candidate.current_role,
#                       "location": candidate.location, "notice_period_days": candidate.notice_period_days,
#                       "profile": candidate.profile_summary},
#         "requirements": {"min_experience": req.minimum_experience, "max_experience": req.maximum_experience,
#                           "mandatory_skills": req.mandatory_skills, "preferred_skills": req.preferred_skills,
#                           "education": req.education, "certifications": req.certifications, "domains": req.domains,
#                           "responsibilities": req.responsibilities, "location": req.location, "work_mode": req.work_mode,
#                           "notice_period_days": req.notice_period_days, "other_requirements": req.other_requirements}
#     }
#     prompt = f"""
# You are an expert AI Recruiter evaluating a candidate against a job description.
# Assign precise numerical scores for each of the following 8 criteria, adhering strictly to the maximum points allowed for each.

# Criteria & Maximum Points:
# 1. mandatory_skills_score: max 30
# 2. experience_score: max 25
# 3. domain_score: max 15
# 4. preferred_skills_score: max 10
# 5. education_score: max 5
# 6. location_score: max 5
# 7. availability_score: max 5
# 8. other_requirements_score: max 5

# Rules:
# - Be realistic and precise. Give partial points if they partially meet a requirement.
# - If the JD does not mention a requirement (e.g., no location specified), award full points for that category.
# - Output ONLY a JSON object with EXACTLY the keys listed above (as numbers), plus a string key 'reasoning' explaining the scores briefly.
# DATA:\n{json.dumps(payload, default=str)}
# """
#     return _json_completion(prompt, settings.EVALUATION_MODEL)

# # ------------------------------------------------------------
# # DETERMINISTIC SCORING
# # ------------------------------------------------------------
# def calculate_score(evaluation: dict) -> dict:
#     """Input: evaluation dict with 8 numeric scores. Output: fixed 100-point score and classification."""
#     try:
#         mandatory = float(evaluation.get("mandatory_skills_score", 0))
#         experience = float(evaluation.get("experience_score", 0))
#         domain = float(evaluation.get("domain_score", 0))
#         preferred = float(evaluation.get("preferred_skills_score", 0))
#         education = float(evaluation.get("education_score", 0))
#         location = float(evaluation.get("location_score", 0))
#         availability = float(evaluation.get("availability_score", 0))
#         other = float(evaluation.get("other_requirements_score", 0))
#     except (ValueError, TypeError):
#         mandatory, experience, domain, preferred, education, location, availability, other = 0,0,0,0,0,0,0,0
#     total = round(mandatory + experience + domain + preferred + education + location + availability + other, 2)
#     if total >= 90: classification = "EXCELLENT_MATCH"
#     elif total >= 80: classification = "STRONG_MATCH"
#     elif total >= 70: classification = "GOOD_MATCH"
#     elif total >= 60: classification = "MODERATE_MATCH"
#     else: classification = "LOW_MATCH_DO_NOT_PRIORITIZE"
#     return {"mandatory_skills_score": mandatory, "experience_score": experience, "domain_score": domain,
#             "preferred_skills_score": preferred, "education_score": education, "location_score": location,
#             "availability_score": availability, "other_requirements_score": other, "total_score": total,
#             "classification": classification}

# # ------------------------------------------------------------
# # SCREENING ORCHESTRATION
# # ------------------------------------------------------------
# def screen_job(db: Session, job_id: UUID) -> dict:
#     """Input: DB session and JD UUID. Output: persisted ranking and Top 10 summary."""
#     job = db.get(Job, job_id)
#     if not job or not job.requirements:
#         raise ValueError("Job or extracted requirements not found")
#     req = job.requirements
#     run = ScreeningRun(job_id=job.id, status="RUNNING", current_stage="SEARCHING", started_at=time_now())
#     db.add(run); job.status = "SEARCHING"; db.commit()
#     try:
#         try:
#             sql_query = nl_to_sql_search(req)
#             result = db.execute(text(sql_query))
#             candidate_ids = [UUID(str(row[0])) for row in result.fetchall()]
#         except Exception as e:
#             print(f"SQL execution failed: {e}. Falling back to all candidates.")
#             candidate_ids = []
            
#         if not candidate_ids:
#             candidates = db.scalars(select(Candidate)).all()
#             candidate_ids = [c.id for c in candidates]
            
#         candidate_ids = list(set(candidate_ids))
#         run.total_candidates = len(candidate_ids); run.current_stage = "EVALUATING"; db.commit()
#         ranked = []
#         for cid in candidate_ids:
#             candidate = db.get(Candidate, cid)
#             if not candidate:
#                 continue
#             try:
#                 evaluation = ai_score_candidate(candidate, req)
#                 score = calculate_score(evaluation)
#                 jc = db.scalar(select(JobCandidate).where(JobCandidate.job_id == job.id, JobCandidate.candidate_id == cid))
#                 if not jc:
#                     jc = JobCandidate(job_id=job.id, candidate_id=cid)
#                     db.add(jc); db.flush()
#                 jc.eligibility_status = "ELIGIBLE" if score["total_score"] >= 60 else "INELIGIBLE"
#                 jc.recruitment_status = "SCREENED"
#                 jc.overall_score = score["total_score"]; jc.classification = score["classification"]
#                 result_record = db.scalar(select(ScreeningResult).where(ScreeningResult.job_candidate_id == jc.id))
#                 if not result_record:
#                     result_record = ScreeningResult(job_candidate_id=jc.id, classification=score["classification"])
#                     db.add(result_record)
#                 for key in ["mandatory_skills_score","experience_score","domain_score","preferred_skills_score","education_score","location_score","availability_score","other_requirements_score","total_score","classification"]:
#                     setattr(result_record, key, score[key])
#                 result_record.matching_details = {"evaluation": evaluation.get("reasoning")}
#                 result_record.semantic_matches = []
#                 result_record.missing_requirements = []
#                 result_record.strengths = []
#                 result_record.concerns = []
#                 result_record.screening_model = settings.EVALUATION_MODEL; result_record.screening_version = "v2"
#                 ranked.append((jc, score))
#                 run.successful_candidates += 1
#             except Exception as e:
#                 print(f"Candidate scoring failed: {e}")
#                 run.failed_candidates += 1
#             run.processed_candidates += 1
#             db.commit()
#         ranked.sort(key=lambda x: x[1]["total_score"], reverse=True)
#         for position, (jc, score) in enumerate(ranked, 1):
#             jc.ranking_position = position
#             jc.is_shortlisted = position <= settings.TOP_N
#             db.add(jc)
#         job.status = "ACTIVE"; run.status = "COMPLETED"; run.current_stage = "COMPLETED"; run.completed_at = time_now()
#         db.commit()
#         return {"job_id": str(job.id), "candidates_evaluated": len(ranked), "top_10": get_job_candidates(db, job.id, limit=settings.TOP_N)}
#     except Exception as exc:
#         db.rollback(); run.status = "FAILED"; run.error_message = str(exc); run.completed_at = time_now(); job.status = "DRAFT"; db.commit(); raise

# def time_now():
#     from datetime import datetime, timezone
#     return datetime.now(timezone.utc)

# # ------------------------------------------------------------
# # QUERY FUNCTIONS
# # ------------------------------------------------------------
# def get_job_candidates(db: Session, job_id: UUID, limit: int = 10) -> list[dict]:
#     """Input: job UUID. Output: ranked candidate records, normally Top 10."""
#     rows = db.execute(select(JobCandidate, Candidate).join(Candidate, Candidate.id == JobCandidate.candidate_id)
#                       .where(JobCandidate.job_id == job_id, JobCandidate.is_shortlisted == True)
#                       .order_by(JobCandidate.ranking_position)).all()
#     return [{"rank": jc.ranking_position, "candidate_id": str(c.id), "name": c.name, "email": c.email,
#              "score": float(jc.overall_score or 0), "classification": jc.classification,
#              "status": jc.recruitment_status} for jc, c in rows[:limit]]

# def get_user_jobs(db: Session, user_id: UUID) -> list[dict]:
#     """Input: authenticated user UUID. Output: only that user's JDs."""
#     jobs = db.scalars(select(Job).where(Job.created_by == user_id).order_by(Job.created_at.desc())).all()
#     return [{"job_id": str(j.id), "title": j.title, "file_name": j.jd_file_name, "status": j.status,
#              "created_at": j.created_at.isoformat() if j.created_at else None} for j in jobs]

# def get_user_job_candidates(db: Session, user_id: UUID, job_id: UUID) -> list[dict]:
#     """Input: authenticated user and job UUID. Output: Top 10 only when the user owns the JD."""
#     if not db.scalar(select(Job.id).where(Job.id == job_id, Job.created_by == user_id)):
#         raise PermissionError("Job does not belong to current user")
#     return get_job_candidates(db, job_id)

# def get_admin_jobs(db: Session) -> list[dict]:
#     """Input: DB session. Output: all JDs with uploader and Top 10 summary."""
#     rows = db.execute(select(Job, User).join(User, User.id == Job.created_by).order_by(Job.created_at.desc())).all()
#     return [{"job_id": str(j.id), "title": j.title, "file_name": j.jd_file_name, "status": j.status,
#              "uploaded_by": {"id": str(u.id), "name": u.name, "email": u.email},
#              "top_10": get_job_candidates(db, j.id)} for j, u in rows]

# def get_admin_job_candidates(db: Session, job_id: UUID) -> list[dict]:
#     """Input: job UUID. Output: Top 10 persisted candidates for that JD."""
#     if not db.get(Job, job_id):
#         raise ValueError("Job not found")
#     return get_job_candidates(db, job_id)
"""All actual NM-HireX business functions.

Each function is intentionally small and directly composable; LangGraph is not
required for this deterministic pipeline.
"""
import hashlib, json, re, time, logging, os, base64
from pathlib import Path
from uuid import UUID
from sqlalchemy import select, delete, text
from sqlalchemy.orm import Session
from openai import OpenAI
from pypdf import PdfReader
from docx import Document
import fitz  # PyMuPDF: used only to render PDF pages for OCR
from .config import settings
from .models import (User, Job, JobRequirement, Candidate, Resume, CandidateSkill,
    CandidateExperience, CandidateEducation, CandidateCertification, CandidateProject,
    JobCandidate, ScreeningResult, ScreeningRun, AIExtractionLog)

openai_client = OpenAI(api_key=settings.GROQ_API_KEY, base_url=settings.GROQ_BASE_URL)

# Separate OpenAI client used ONLY for OCR/vision fallback.
# Existing Groq client and JSON extraction flow are unchanged.
OCR_MODEL = "gpt-5.6-luna"

OPENAI_API_KEY = settings.OPENAI_API_KEY

luna_client = OpenAI(api_key=OPENAI_API_KEY) if OPENAI_API_KEY else None

# ------------------------------------------------------------
# FILE HELPERS
# ------------------------------------------------------------
def _text_is_insufficient(text: str) -> bool:
    """Return True when native PDF extraction is too sparse to trust."""
    cleaned = re.sub(r"\s+", " ", text or "").strip()
    if len(cleaned) < 250:
        return True

    # A page containing mostly symbols/noise is also a good OCR candidate.
    alnum = sum(ch.isalnum() for ch in cleaned)
    return alnum < max(100, int(len(cleaned) * 0.45))


def _ocr_pdf_page(page, page_number: int, native_text: str) -> str:
    """Render one PDF page and use GPT-5.6 Luna to recover only image-based text.

    Native pypdf text is preserved. Luna is asked for additional text visible
    in the page image so partial image sections are not lost or duplicated.
    """
    if luna_client is None:
        logging.warning(
            "OPENAI_API_KEY is not configured; skipping OCR for page %s.",
            page_number,
        )
        return ""

    try:
        # ~144 DPI is normally enough for CV text while keeping image size reasonable.
        pix = page.get_pixmap(matrix=fitz.Matrix(2, 2), alpha=False)
        image_bytes = pix.tobytes("png")
        image_b64 = base64.b64encode(image_bytes).decode("utf-8")

        response = luna_client.responses.create(
            model=OCR_MODEL,
            input=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "input_text",
                            "text": (
                                "Recover text from image-based content on this CV page. "
                                "The native PDF text extracted by pypdf is provided below. "
                                "Return ONLY additional readable text that is present in the "
                                "page image but missing from the native text. This includes "
                                "image-based experience, skills, education, certifications, "
                                "projects, tables, dates, companies, job titles and other "
                                "resume information. Do not repeat text already represented "
                                "in the native text. Do not summarize. Do not invent or infer. "
                                "If the image contains no additional text, return an empty "
                                "response.\n\n"
                                f"NATIVE PDF TEXT:\n{native_text[:12000]}"
                            ),
                        },
                        {
                            "type": "input_image",
                            "image_url": f"data:image/png;base64,{image_b64}",
                        },
                    ],
                }
            ],
        )

        return (response.output_text or "").strip()

    except Exception as error:
        logging.warning(
            "OCR failed for PDF page %s: %s",
            page_number,
            error,
        )
        return ""


def _read_pdf_with_ocr(path: str) -> str:
    """Extract PDF text with pypdf and OCR only pages where native text is insufficient."""
    p = Path(path)
    pypdf_logger = logging.getLogger("pypdf")
    previous_level = pypdf_logger.level

    try:
        pypdf_logger.setLevel(logging.ERROR)
        reader = PdfReader(str(p))
        visual_doc = fitz.open(str(p))
        page_texts = []

        try:
            for index, pdf_page in enumerate(reader.pages):
                page_number = index + 1
                native_text = (pdf_page.extract_text() or "").strip()

                visual_page = visual_doc[index]

                # Detect meaningful embedded images rather than OCRing every
                # page that merely contains a logo/icon. Full-page scans and
                # image-based sections normally occupy a significant area.
                image_area = 0.0
                page_area = max(float(visual_page.rect.width * visual_page.rect.height), 1.0)
                try:
                    for image in visual_page.get_images(full=True):
                        try:
                            for rect in visual_page.get_image_rects(image[0]):
                                image_area += float(rect.width * rect.height)
                        except Exception:
                            continue
                except Exception:
                    pass

                image_ratio = min(image_area / page_area, 1.0)
                has_meaningful_image = image_ratio >= 0.15

                needs_ocr = _text_is_insufficient(native_text) or has_meaningful_image

                ocr_text = ""
                if needs_ocr:
                    ocr_text = _ocr_pdf_page(
                        visual_page,
                        page_number,
                        native_text,
                    )

                if native_text and ocr_text:
                    page_texts.append(
                        f"=== PAGE {page_number} ===\n{native_text}\n"
                        f"[OCR ADDITIONAL TEXT]\n{ocr_text}"
                    )
                elif native_text:
                    page_texts.append(
                        f"=== PAGE {page_number} ===\n{native_text}"
                    )
                elif ocr_text:
                    page_texts.append(
                        f"=== PAGE {page_number} [OCR] ===\n{ocr_text}"
                    )
                else:
                    page_texts.append(
                        f"=== PAGE {page_number} ===\n"
                    )
        finally:
            visual_doc.close()

        return "\n\n".join(page_texts).strip()

    finally:
        pypdf_logger.setLevel(previous_level)


def read_file(path: str) -> str:
    """
    Read a supported PDF, DOCX, or TXT file.

    PDFs use pypdf first and GPT-5.6 Luna only as a fallback for
    scanned/image-heavy pages. The returned text is then passed unchanged
    into the existing JSON extraction pipeline.
    """
    p = Path(path)

    if p.suffix.lower() == ".pdf":
        return _read_pdf_with_ocr(str(p))

    if p.suffix.lower() == ".docx":
        return "\n".join(
            paragraph.text
            for paragraph in Document(str(p)).paragraphs
        )

    if p.suffix.lower() == ".txt":
        return p.read_text(
            encoding="utf-8",
            errors="ignore"
        )

    raise ValueError(
        f"Unsupported file type: {p.suffix}"
    )

def file_hash(path: str) -> str:
    """Input: file path. Output: SHA-256 hex digest used for duplicate detection."""
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for block in iter(lambda: f.read(1024 * 1024), b""):
            h.update(block)
    return h.hexdigest()



# ------------------------------------------------------------
# AI EXTRACTION
# ------------------------------------------------------------
def _json_completion(prompt: str, model: str) -> dict:
    """Input: prompt/model. Output: validated JSON object returned by the configured LLM."""
    response = openai_client.chat.completions.create(
        model=model,
        temperature=0,
        response_format={"type": "json_object"},
        messages=[{"role": "system", "content": "Return only valid JSON."}, {"role": "user", "content": prompt}],
    )
    return json.loads(response.choices[0].message.content)

def extract_jd(text: str) -> dict:
    """Input: JD text. Output: structured JD requirements. Unknown facts must be null/empty."""
    prompt = f"""
Extract this job description into JSON with exactly these keys:
job_title, min_experience_years, max_experience_years, mandatory_skills,
preferred_skills, education, certifications, domains, responsibilities,
location, work_mode, notice_period_days, other_requirements, confidence_score.
Rules: preserve specific skills exactly; only classify a skill as mandatory when
required/essential; words such as advantageous/preferred/nice-to-have belong in
preferred_skills; never infer missing experience, location, notice period or education.
JD:\n{text[:30000]}
"""
    return _json_completion(prompt, settings.EXTRACTION_MODEL)

def extract_resume(text: str) -> dict:
    """Input: CV text. Output: structured candidate profile with explicit nulls for unsupported facts."""
    prompt = f"""
Extract the CV into JSON with exactly these keys:
name, email, phone, location, total_experience_years, current_company, current_role,
notice_period_days, profile_summary, skills, experiences, education, certifications, projects.
Rules: never guess missing values; never turn a technology into a company or role;
preserve specific skills such as Django as Django and use parent_skill only as a relationship.
CV:\n{text[:30000]}
"""
    return _json_completion(prompt, settings.EXTRACTION_MODEL)

def normalize_skill(name: str) -> tuple[str, str | None, str | None]:
    """
    Normalize a candidate skill while preserving the original specific technology.

    Input:
        name -> Skill name.

    Output:
        Tuple containing:
        - normalized skill
        - parent skill
        - skill category

    Example:
        Django -> Django, Python, Backend
        DRF -> Django REST Framework, Django, Backend
    """

    if name is None:
        return "", None, None

    raw = str(name).strip()

    if not raw:
        return "", None, None

    low = raw.lower()

    relationships = {
        "django": ("Django", "Python", "Backend"),
        "django rest framework": (
            "Django REST Framework",
            "Django",
            "Backend"
        ),
        "drf": (
            "Django REST Framework",
            "Django",
            "Backend"
        ),
        "flask": ("Flask", "Python", "Backend"),
        "fastapi": ("FastAPI", "Python", "Backend"),
        "spring boot": ("Spring Boot", "Java", "Backend"),
        "react.js": ("React", "JavaScript", "Frontend"),
        "react": ("React", "JavaScript", "Frontend"),
    }

    if low in relationships:
        return relationships[low]

    return raw, None, None

def safe_list(value) -> list:
    """
    Convert an extracted value into a safe list.

    Input:
        value -> GPT extracted value.

    Output:
        Always returns a list.

    Examples:
        None -> []
        "Python" -> ["Python"]
        ["Python", "SQL"] -> ["Python", "SQL"]
        {"name": "Python"} -> [{"name": "Python"}]
    """

    if value is None:
        return []

    if isinstance(value, list):
        return value

    return [value]

def safe_dict(value) -> dict:
    """
    Convert an extracted value into a safe dictionary.

    Input:
        value -> GPT extracted value.

    Output:
        Dictionary. Invalid values become {}.
    """

    return value if isinstance(value, dict) else {}
def safe_float(value):
    """
    Convert AI-extracted experience values into a PostgreSQL-safe float.

    Input:
        value -> AI-extracted value such as:
                 5
                 "5"
                 "5 years"
                 "14+"
                 "6-10"
                 "Not provided"
                 None

    Output:
        float or None
    """
    if value is None:
        return None

    if isinstance(value, (int, float)):
        return float(value)

    text = str(value).strip().lower()

    if not text or text in {
        "not provided",
        "not specified",
        "unknown",
        "n/a",
        "na",
        "none",
        "null",
        "-"
    }:
        return None

    # Handle ranges such as "6-10"
    range_match = re.search(r"(\d+(?:\.\d+)?)\s*[-–]\s*(\d+(?:\.\d+)?)", text)
    if range_match:
        low = float(range_match.group(1))
        high = float(range_match.group(2))
        return (low + high) / 2

    # Handle values such as "14+", "5 years", "3.5 years"
    number_match = re.search(r"\d+(?:\.\d+)?", text)

    if number_match:
        return float(number_match.group())

    return None
# ------------------------------------------------------------
# RESUME INGESTION
# ------------------------------------------------------------
def store_resume(db: Session, path: str) -> UUID:
    """
    Store one resume safely in PostgreSQL and Pinecone.

    Input:
        db   -> SQLAlchemy PostgreSQL session
        path -> Resume file path

    Output:
        Candidate UUID.

    Processing:
        1. Detect duplicate resume.
        2. Read resume text.
        3. Extract candidate information using GPT.
        4. If extraction fails, use safe fallback data.
        5. Store candidate and resume in PostgreSQL.
        6. Store structured skills/experience/education/etc.
        7. Create Pinecone embeddings when text is available.
        8. Pinecone failure does not prevent PostgreSQL ingestion.
    """

    path_obj = Path(path)

    # ---------------------------------------------------------
    # 1. Calculate file hash
    # ---------------------------------------------------------

    digest = file_hash(path)

    existing = db.scalar(
        select(Resume).where(
            Resume.file_hash == digest
        )
    )

    if existing:
        return existing.candidate_id

    # ---------------------------------------------------------
    # 2. Read resume
    # ---------------------------------------------------------

    try:
        text = read_file(path)
    except Exception as error:
        print(
            f"   [WARNING] Could not extract text: {error}"
        )

        # We still ingest the resume.
        text = ""
    if text.strip() and looks_like_job_description(
    text,
    path_obj.name
    ):
        raise ValueError(
        "File appears to be a Job Description, not a resume"
    )
    # ---------------------------------------------------------
    # 3. Extract resume information
    # ---------------------------------------------------------

    data = {}

    if text.strip():

        try:
            extracted = extract_resume(text)

            if isinstance(extracted, dict):
                data = extracted
            else:
                print(
                    "   [WARNING] GPT returned invalid resume data."
                )

        except Exception as error:
            print(
                f"   [WARNING] Resume extraction failed: {error}"
            )

    # ---------------------------------------------------------
    # 4. Safe candidate values
    # ---------------------------------------------------------

    candidate_name = (
        data.get("name")
        or path_obj.stem
        or "Unknown Candidate"
    )

    candidate_name = str(candidate_name).strip()

    if not candidate_name:
        candidate_name = path_obj.stem or "Unknown Candidate"

    # ---------------------------------------------------------
    # 5. Create Candidate
    # ---------------------------------------------------------

    candidate = Candidate(
    name=candidate_name,
    email=data.get("email"),
    phone=data.get("phone"),
    location=data.get("location"),
    total_experience_years=safe_float(
        data.get("total_experience_years")
    ),
    current_company=data.get("current_company"),
    current_role=data.get("current_role"),
    notice_period_days=safe_float(
        data.get("notice_period_days")
    ),
    profile_summary=data.get("profile_summary"),
    raw_profile_text=text,
    normalized_profile=data,
)

    db.add(candidate)
    db.flush()

    # ---------------------------------------------------------
    # 6. Create Resume record
    # ---------------------------------------------------------

    resume = Resume(
        candidate_id=candidate.id,
        file_name=path_obj.name,
        file_url=str(path_obj),
        file_type=path_obj.suffix.lower().lstrip("."),
        file_size=path_obj.stat().st_size,
        file_hash=digest,
        raw_text=text,
        parsed_data=data,
        parsing_status="COMPLETED",
        extraction_status="COMPLETED",
        extraction_model=settings.EXTRACTION_MODEL,
        extraction_version="v1",
    )

    db.add(resume)
    db.flush()

    # ---------------------------------------------------------
    # 7. Store skills safely
    # ---------------------------------------------------------

    skills = safe_list(
        data.get("skills")
    )

    for item in skills:

        if isinstance(item, dict):

            name = item.get("name")

            if not name:
                continue

            normalized, parent, category = normalize_skill(
                name
            )

            if not normalized:
                continue

            db.add(
                CandidateSkill(
                    candidate_id=candidate.id,
                    skill_name=str(name),
                    normalized_skill_name=normalized,
                    parent_skill=(
                        item.get("parent_skill")
                        or parent
                    ),
                    skill_category=(
                        item.get("category")
                        or category
                    ),
                    experience_years=item.get(
                        "experience_years"
                    ),
                    proficiency=item.get(
                        "proficiency"
                    ),
                    source="resume",
                    confidence_score=item.get(
                        "confidence_score"
                    ),
                )
            )

        elif isinstance(item, str):

            normalized, parent, category = normalize_skill(
                item
            )

            if not normalized:
                continue

            db.add(
                CandidateSkill(
                    candidate_id=candidate.id,
                    skill_name=item.strip(),
                    normalized_skill_name=normalized,
                    parent_skill=parent,
                    skill_category=category,
                    source="resume",
                )
            )

    # ---------------------------------------------------------
    # 8. Store experience safely
    # ---------------------------------------------------------

    experiences = safe_list(
        data.get("experiences")
        or data.get("experience")
    )

    for item in experiences:

        if isinstance(item, str):
            item = {
                "description": item
            }

        if not isinstance(item, dict):
            continue

        db.add(
            CandidateExperience(
                candidate_id=candidate.id,
                company_name=item.get(
                    "company_name"
                ),
                job_title=item.get(
                    "job_title"
                ),
                employment_type=item.get(
                    "employment_type"
                ),
                description=item.get(
                    "description"
                ),
                domain=item.get(
                    "domain"
                ),
                normalized_data=item,
            )
        )

    # ---------------------------------------------------------
    # 9. Store education safely
    # ---------------------------------------------------------

    education = safe_list(
        data.get("education")
    )

    for item in education:

        if isinstance(item, str):
            item = {
                "degree": item
            }

        if not isinstance(item, dict):
            continue

        db.add(
            CandidateEducation(
                candidate_id=candidate.id,
                degree=item.get(
                    "degree"
                ),
                field_of_study=item.get(
                    "field_of_study"
                ),
                institution=item.get(
                    "institution"
                ),
                start_year=item.get(
                    "start_year"
                ),
                end_year=item.get(
                    "end_year"
                ),
                grade=item.get(
                    "grade"
                ),
            )
        )

    # ---------------------------------------------------------
    # 10. Store certifications safely
    # ---------------------------------------------------------

    certifications = safe_list(
        data.get("certifications")
    )

    for item in certifications:

        if isinstance(item, str):
            item = {
                "certification_name": item
            }

        if not isinstance(item, dict):
            continue

        certification_name = (
            item.get("certification_name")
            or item.get("name")
        )

        if not certification_name:
            continue

        db.add(
            CandidateCertification(
                candidate_id=candidate.id,
                certification_name=certification_name,
                issuing_organization=(
                    item.get(
                        "issuing_organization"
                    )
                    or item.get("issuer")
                ),
                credential_id=item.get(
                    "credential_id"
                ),
            )
        )

    # ---------------------------------------------------------
    # 11. Store projects safely
    # ---------------------------------------------------------

    projects = safe_list(
        data.get("projects")
    )

    for item in projects:

        if isinstance(item, str):
            item = {
                "project_name": item
            }

        if not isinstance(item, dict):
            continue

        db.add(
            CandidateProject(
                candidate_id=candidate.id,
                project_name=item.get(
                    "project_name"
                ),
                description=item.get(
                    "description"
                ),
                technologies=item.get(
                    "technologies"
                ),
                domain=item.get(
                    "domain"
                ),
            )
        )

    # ---------------------------------------------------------
    # 12. Commit PostgreSQL FIRST
    # ---------------------------------------------------------

    db.commit()

    print("   [OK] PostgreSQL")
    return candidate.id
def looks_like_job_description(text: str, filename: str) -> bool:
    """
    Detect whether a file is more likely to be a Job Description than a resume.

    Input:
        text     -> extracted document text
        filename -> original filename

    Output:
        True if the document appears to be a JD, otherwise False.
    """
    filename_lower = filename.lower()
    text_lower = text.lower()

    # Strong filename indicators
    jd_filename_terms = [
        "job description",
        "job_description",
        "jd_",
        "_jd",
        " jd",
    ]

    if any(term in filename_lower for term in jd_filename_terms):
        return True

    # Strong JD content indicators
    jd_terms = [
        "job description",
        "role overview",
        "role context",
        "responsibilities",
        "qualifications",
        "requirements",
        "key responsibilities",
        "preferred qualifications",
        "job requirements",
    ]

    matches = sum(1 for term in jd_terms if term in text_lower)

    return matches >= 3

# -------------------------------------------
#     # ingest resume folder 
# -------------------------------------------

def ingest_resume_folder(db: Session) -> dict:
    """
    Scan the resume folder and ingest every supported CV.

    Input:
        db -> SQLAlchemy PostgreSQL database session

    Output:
        Dictionary containing:
        - total
        - successful
        - skipped
        - failed
        - failed_files

    Processing:
        1. Scan data/resumes.
        2. Process every PDF/DOCX.
        3. Store every readable or partially readable CV.
        4. Continue even when extraction fails.
        5. Continue even when Pinecone fails.
    """

    resume_dir = Path(settings.RESUME_DIR)

    if not resume_dir.exists():

        return {
            "status": "FAILED",
            "message": (
                f"Resume directory does not exist: "
                f"{resume_dir}"
            ),
            "total": 0,
            "successful": 0,
            "skipped": 0,
            "failed": 0,
            "failed_files": [],
        }

    files = sorted(
        [
            p
            for p in resume_dir.iterdir()
            if p.is_file()
            and p.suffix.lower() in {
                ".pdf",
                ".docx"
            }
        ],
        key=lambda p: p.name.lower(),
    )

    total = len(files)

    successful = 0
    skipped = 0
    failed = 0

    failed_files = []

    print()
    print("=" * 70)
    print(f"FOUND {total} RESUME FILES")
    print("=" * 70)

    for index, file_path in enumerate(
        files,
        start=1
    ):

        print(
            f"\n[{index}/{total}] "
            f"Processing: {file_path.name}"
        )

        try:

            # -------------------------------------------------
            # Duplicate check
            # -------------------------------------------------

            digest = file_hash(
                str(file_path)
            )

            existing = db.scalar(
                select(Resume).where(
                    Resume.file_hash == digest
                )
            )

            if existing:

                print(
                    "   [SKIPPED] Already ingested."
                )

                skipped += 1
                continue

            # -------------------------------------------------
            # Store resume
            # -------------------------------------------------

            candidate_id = store_resume(
                db=db,
                path=str(file_path)
            )

            successful += 1

            print(
                f"   [OK] Successfully ingested "
                f"| Candidate: {candidate_id}"
            )

        except ValueError as error:
                db.rollback()

                if "Job Description" in str(error):
                    skipped += 1
                    print(f"   [SKIPPED] {file_path.name} - Job Description detected.")
                else:
                    failed += 1
                    failed_files.append({
                        "file": file_path.name,
                        "error": str(error)
                    })
                    print(f"   [FAILED] {file_path.name}")
                    print(f"   Reason: {error}")

                continue

        except Exception as error:
            db.rollback()
            failed += 1
            failed_files.append({
                "file": file_path.name,
                "error": str(error)
            })
            print(f"   [FAILED] {file_path.name}")
            print(f"   Reason: {error}")
            continue

    # ---------------------------------------------------------
    # Final summary
    # ---------------------------------------------------------

    print()
    print("=" * 70)
    print("RESUME INGESTION COMPLETE")
    print("=" * 70)

    print(
        f"Total files : {total}"
    )

    print(
        f"Successful  : {successful}"
    )

    print(
        f"Skipped     : {skipped}"
    )

    print(
        f"Failed      : {failed}"
    )

    if failed_files:

        print()
        print("FAILED FILES")
        print("-" * 70)

        for item in failed_files:

            print(
                f"- {item['file']}"
            )

            print(
                f"  {item['error']}"
            )

    print("=" * 70)

    return {
        "status": "COMPLETED",
        "total": total,
        "successful": successful,
        "skipped": skipped,
        "failed": failed,
        "failed_files": failed_files,
    }
# ------------------------------------------------------------
# JD CREATION
# ------------------------------------------------------------
def create_job(
    db: Session,
    user_id: UUID,
    raw_text: str,
    file_name: str | None = None,
    file_path: str | None = None
) -> Job:
    """
    Create a Job from either written JD text or an uploaded JD file.

    Input:
        db        -> PostgreSQL database session
        user_id   -> authenticated recruiter/user UUID
        raw_text  -> JD text
        file_name -> optional uploaded JD filename
        file_path -> optional path of uploaded JD file

    Output:
        Persisted Job with JobRequirement and AIExtractionLog.
    """

    if not raw_text or not raw_text.strip():
        raise ValueError("JD content cannot be empty")

    raw_text = raw_text.strip()

    # --------------------------------------------------------
    # 1. Extract JD requirements using GPT
    # --------------------------------------------------------
    data = extract_jd(raw_text)

    # --------------------------------------------------------
    # 2. Create Job
    # --------------------------------------------------------
    job = Job(
        created_by=user_id,
        title=data.get("job_title") or "Untitled Job",
        description=raw_text,
        location=data.get("location"),
        work_mode=data.get("work_mode"),
        jd_file_name=file_name,
        jd_file_url=file_path,
        jd_raw_text=raw_text,
        status="READY"
    )

    db.add(job)
    db.flush()

    # --------------------------------------------------------
    # 3. Store extracted JD requirements
    # --------------------------------------------------------
    req = JobRequirement(
        job_id=job.id,
        job_title=data.get("job_title"),

        minimum_experience=data.get("min_experience_years"),
        maximum_experience=data.get("max_experience_years"),

        location=data.get("location"),
        work_mode=data.get("work_mode"),
        notice_period_days=data.get("notice_period_days"),

        mandatory_skills=data.get("mandatory_skills") or [],
        preferred_skills=data.get("preferred_skills") or [],

        education=data.get("education") or [],
        certifications=data.get("certifications") or [],
        domains=data.get("domains") or [],
        responsibilities=data.get("responsibilities") or [],

        other_requirements=data.get("other_requirements") or [],

        extraction_model=settings.EXTRACTION_MODEL,
        extraction_version="v1",
        confidence_score=data.get("confidence_score")
    )

    db.add(req)

    # --------------------------------------------------------
    # 4. Store AI extraction log
    # --------------------------------------------------------
    db.add(
        AIExtractionLog(
            entity_type="JD",
            entity_id=job.id,
            model_name=settings.EXTRACTION_MODEL,
            prompt_version="v1",
            input_text_hash=hashlib.sha256(
                raw_text.encode()
            ).hexdigest(),
            output_data=data,
            confidence_score=data.get("confidence_score"),
            validation_status="PASSED"
        )
    )

    # --------------------------------------------------------
    # 5. Save everything
    # --------------------------------------------------------
    db.commit()
    db.refresh(job)

    return job

# ------------------------------------------------------------
# MATCHING + EVIDENCE
# ------------------------------------------------------------


# def exact_skill_match(db: Session, candidate_id: UUID, required: list) -> dict:
#     """Input: candidate and JD required skills. Output: per-skill match evidence and percentage."""
#     skills = db.scalars(select(CandidateSkill).where(CandidateSkill.candidate_id == candidate_id)).all()
#     normalized = {s.normalized_skill_name.lower(): s for s in skills}
#     parent_map = {s.parent_skill.lower(): s for s in skills if s.parent_skill}
#     details, matched = [], 0
#     required_names = [x.get("name") if isinstance(x, dict) else str(x) for x in required]
#     for req in required_names:
#         key = req.lower()
#         if key in normalized:
#             matched += 1; details.append({"required": req, "status": "EXACT", "candidate_skill": normalized[key].skill_name})
#         elif key in parent_map:
#             details.append({"required": req, "status": "PARENT_SUPPORT", "candidate_skill": parent_map[key].skill_name})
#         else:
#             details.append({"required": req, "status": "MISSING"})
#     return {"matched": matched, "total": len(required_names), "details": details}


def exact_skill_match(db: Session, candidate_id: UUID, required: list) -> dict:

    """

    Match JD-required skills against candidate skills.
 
    Uses database-normalized skill names and parent skills.

    No hardcoded skill aliases.
 
    Match priority:

        EXACT > PARENT_SUPPORT > MISSING
 
    Only EXACT matches count toward the percentage.

    """
 
    # Get candidate skills

    skills = db.scalars(

        select(CandidateSkill).where(

            CandidateSkill.candidate_id == candidate_id

        )

    ).all()
 
    # Prepare candidate skills from DB

    candidate_skills = []
 
    for skill in skills:

        normalized = (skill.normalized_skill_name or skill.skill_name or "").strip().lower()

        original = (skill.skill_name or "").strip()

        parent = (skill.parent_skill or "").strip().lower()
 
        candidate_skills.append({

            "normalized": normalized,

            "original": original,

            "parent": parent,

        })
 
    # Extract required skill names

    required_names = [

        x.get("name") if isinstance(x, dict) else str(x)

        for x in required

    ]
 
    details = []

    matched = 0
 
    for req in required_names:
 
        required_skill = str(req).strip().lower()
 
        status = "MISSING"

        matched_skill_name = None
 
        # ---------------------------------------------------------

        # 1. EXACT NORMALIZED MATCH

        # ---------------------------------------------------------

        for candidate in candidate_skills:
 
            if required_skill == candidate["normalized"]:

                status = "EXACT"

                matched_skill_name = candidate["original"]

                break
 
        # ---------------------------------------------------------

        # 2. PARENT SKILL MATCH

        # ---------------------------------------------------------

        if status == "MISSING":
 
            for candidate in candidate_skills:
 
                if (

                    candidate["parent"]

                    and required_skill == candidate["parent"]

                ):

                    status = "PARENT_SUPPORT"

                    matched_skill_name = candidate["original"]

                    break
 
        # Only exact matches count

        if status == "EXACT":

            matched += 1
 
        details.append({

            "required": req,

            "status": status,

            "candidate_skill": matched_skill_name,

        })
 
    # Calculate percentage

    total = len(required_names)
 
    percentage = (

        round((matched / total) * 100, 2)

        if total > 0

        else 0

    )
 
    return {

        "matched": matched,

        "total": total,

        "percentage": percentage,

        "details": details,

    }
 
def retrieve_evidence(db: Session, candidate_id: UUID) -> list[dict]:
    """Input: candidate UUID. Output: profile summary from PostgreSQL as evidence."""
    candidate = db.get(Candidate, candidate_id)
    if candidate and candidate.profile_summary:
        return [{"score": 1.0, "text": candidate.profile_summary}]
    return [{"score": 0.0, "text": "No evidence available."}]

# ------------------------------------------------------------
# GPT EVALUATION
# ------------------------------------------------------------
def nl_to_sql_search(req: JobRequirement) -> str:
    """Output: PostgreSQL query to find matching candidate UUIDs loosely."""
    req_json = {
        "mandatory_skills": req.mandatory_skills,
        "preferred_skills": req.preferred_skills,
        "min_experience_years": req.minimum_experience
    }
    prompt = f"""
You are a PostgreSQL expert. Generate a SQL query to find candidates who MIGHT match this Job Requirement.
Database Schema:
- candidates (id UUID, name VARCHAR, total_experience_years NUMERIC, location VARCHAR, notice_period_days INT)
- candidate_skills (candidate_id UUID, skill_name VARCHAR)
- candidate_experiences (candidate_id UUID, job_title VARCHAR)
Rules:
- Return distinct `candidates.id`.
- Be loose/forgiving: we want to cast a wide net. For example, if minimum experience is 8, maybe accept >= 6.
- If skills are listed, match candidates who have AT LEAST ONE of the mandatory or preferred skills using ILIKE on `candidate_skills.skill_name`.
- Do NOT wrap the query in markdown formatting (like ```sql).
- Return ONLY the raw SQL string.
Requirements:
{json.dumps(req_json, default=str)}
"""
    try:
        response = openai_client.chat.completions.create(
            model=settings.EXTRACTION_MODEL,
            messages=[{"role": "user", "content": prompt}]
        )
        sql_query = response.choices[0].message.content.strip()
        sql_query = re.sub(r"^```sql", "", sql_query, flags=re.IGNORECASE)
        return re.sub(r"```$", "", sql_query).strip()
    except Exception as e:
        print(f"NL-to-SQL failed: {e}")
        return "SELECT id FROM candidates;"

# ------------------------------------------------------------
# GPT EVALUATION
# ------------------------------------------------------------
def ai_score_candidate(candidate: Candidate, req: JobRequirement) -> dict:
    """Output: precisely 8 numerical scores and reasoning string."""
    payload = {
        "candidate": {"name": candidate.name, "experience": candidate.total_experience_years,
                      "company": candidate.current_company, "role": candidate.current_role,
                      "location": candidate.location, "notice_period_days": candidate.notice_period_days,
                      "profile": candidate.profile_summary},
        "requirements": {"min_experience": req.minimum_experience, "max_experience": req.maximum_experience,
                          "mandatory_skills": req.mandatory_skills, "preferred_skills": req.preferred_skills,
                          "education": req.education, "certifications": req.certifications, "domains": req.domains,
                          "responsibilities": req.responsibilities, "location": req.location, "work_mode": req.work_mode,
                          "notice_period_days": req.notice_period_days, "other_requirements": req.other_requirements}
    }
    prompt = f"""
You are an expert AI Recruiter evaluating a candidate against a job description.
Assign precise numerical scores for each of the following 8 criteria, adhering strictly to the maximum points allowed for each.

Criteria & Maximum Points:
1. mandatory_skills_score: max 30
2. experience_score: max 25
3. domain_score: max 15
4. preferred_skills_score: max 10
5. education_score: max 5
6. location_score: max 5
7. availability_score: max 5
8. other_requirements_score: max 5

Rules:
- Be realistic and precise. Give partial points if they partially meet a requirement.
- If the JD does not mention a requirement (e.g., no location specified), award full points for that category.
- Output ONLY a JSON object with EXACTLY the keys listed above (as numbers), plus a string key 'reasoning' explaining the scores briefly.
DATA:\n{json.dumps(payload, default=str)}
"""
    return _json_completion(prompt, settings.EVALUATION_MODEL)

# ------------------------------------------------------------
# DETERMINISTIC SCORING
# ------------------------------------------------------------
def calculate_score(evaluation: dict) -> dict:
    """Input: evaluation dict with 8 numeric scores. Output: fixed 100-point score and classification."""
    try:
        mandatory = float(evaluation.get("mandatory_skills_score", 0))
        experience = float(evaluation.get("experience_score", 0))
        domain = float(evaluation.get("domain_score", 0))
        preferred = float(evaluation.get("preferred_skills_score", 0))
        education = float(evaluation.get("education_score", 0))
        location = float(evaluation.get("location_score", 0))
        availability = float(evaluation.get("availability_score", 0))
        other = float(evaluation.get("other_requirements_score", 0))
    except (ValueError, TypeError):
        mandatory, experience, domain, preferred, education, location, availability, other = 0,0,0,0,0,0,0,0
    total = round(mandatory + experience + domain + preferred + education + location + availability + other, 2)
    if total >= 90: classification = "EXCELLENT_MATCH"
    elif total >= 80: classification = "STRONG_MATCH"
    elif total >= 70: classification = "GOOD_MATCH"
    elif total >= 60: classification = "MODERATE_MATCH"
    else: classification = "LOW_MATCH_DO_NOT_PRIORITIZE"
    return {"mandatory_skills_score": mandatory, "experience_score": experience, "domain_score": domain,
            "preferred_skills_score": preferred, "education_score": education, "location_score": location,
            "availability_score": availability, "other_requirements_score": other, "total_score": total,
            "classification": classification}

# ------------------------------------------------------------
# SCREENING ORCHESTRATION
# ------------------------------------------------------------
def screen_job(db: Session, job_id: UUID) -> dict:
    """Input: DB session and JD UUID. Output: persisted ranking and Top 10 summary."""
    job = db.get(Job, job_id)
    if not job or not job.requirements:
        raise ValueError("Job or extracted requirements not found")
    req = job.requirements
    run = ScreeningRun(job_id=job.id, status="RUNNING", current_stage="SEARCHING", started_at=time_now())
    db.add(run); job.status = "SEARCHING"; db.commit()
    try:
        try:
            sql_query = nl_to_sql_search(req)
            result = db.execute(text(sql_query))
            candidate_ids = [UUID(str(row[0])) for row in result.fetchall()]
        except Exception as e:
            print(f"SQL execution failed: {e}. Falling back to all candidates.")
            candidate_ids = []
            
        if not candidate_ids:
            candidates = db.scalars(select(Candidate)).all()
            candidate_ids = [c.id for c in candidates]
            
        candidate_ids = list(set(candidate_ids))
        run.total_candidates = len(candidate_ids); run.current_stage = "EVALUATING"; db.commit()
        ranked = []
        for cid in candidate_ids:
            candidate = db.get(Candidate, cid)
            if not candidate:
                continue
            try:
                evaluation = ai_score_candidate(candidate, req)
                score = calculate_score(evaluation)
                jc = db.scalar(select(JobCandidate).where(JobCandidate.job_id == job.id, JobCandidate.candidate_id == cid))
                if not jc:
                    jc = JobCandidate(job_id=job.id, candidate_id=cid)
                    db.add(jc); db.flush()
                jc.eligibility_status = "ELIGIBLE" if score["total_score"] >= 60 else "INELIGIBLE"
                jc.recruitment_status = "SCREENED"
                jc.overall_score = score["total_score"]; jc.classification = score["classification"]
                result_record = db.scalar(select(ScreeningResult).where(ScreeningResult.job_candidate_id == jc.id))
                if not result_record:
                    result_record = ScreeningResult(job_candidate_id=jc.id, classification=score["classification"])
                    db.add(result_record)
                for key in ["mandatory_skills_score","experience_score","domain_score","preferred_skills_score","education_score","location_score","availability_score","other_requirements_score","total_score","classification"]:
                    setattr(result_record, key, score[key])
                result_record.matching_details = {"evaluation": evaluation.get("reasoning")}
                result_record.semantic_matches = []
                result_record.missing_requirements = []
                result_record.strengths = []
                result_record.concerns = []
                result_record.screening_model = settings.EVALUATION_MODEL; result_record.screening_version = "v2"
                ranked.append((jc, score))
                run.successful_candidates += 1
            except Exception as e:
                print(f"Candidate scoring failed: {e}")
                run.failed_candidates += 1
            run.processed_candidates += 1
            db.commit()
        ranked.sort(key=lambda x: x[1]["total_score"], reverse=True)
        for position, (jc, score) in enumerate(ranked, 1):
            jc.ranking_position = position
            jc.is_shortlisted = position <= settings.TOP_N
            db.add(jc)
        job.status = "ACTIVE"; run.status = "COMPLETED"; run.current_stage = "COMPLETED"; run.completed_at = time_now()
        db.commit()
        return {"job_id": str(job.id), "candidates_evaluated": len(ranked), "top_10": get_job_candidates(db, job.id, limit=settings.TOP_N)}
    except Exception as exc:
        db.rollback(); run.status = "FAILED"; run.error_message = str(exc); run.completed_at = time_now(); job.status = "DRAFT"; db.commit(); raise

def time_now():
    from datetime import datetime, timezone
    return datetime.now(timezone.utc)

# ------------------------------------------------------------
# QUERY FUNCTIONS
# ------------------------------------------------------------
def get_job_candidates(db: Session, job_id: UUID, limit: int = 10) -> list[dict]:
    """Input: job UUID. Output: ranked candidate records, normally Top 10."""
    rows = db.execute(select(JobCandidate, Candidate).join(Candidate, Candidate.id == JobCandidate.candidate_id)
                      .where(JobCandidate.job_id == job_id, JobCandidate.is_shortlisted == True)
                      .order_by(JobCandidate.ranking_position)).all()
    return [{"rank": jc.ranking_position, "candidate_id": str(c.id), "name": c.name, "email": c.email,
             "score": float(jc.overall_score or 0), "classification": jc.classification,
             "status": jc.recruitment_status} for jc, c in rows[:limit]]

def get_user_jobs(db: Session, user_id: UUID) -> list[dict]:
    """Input: authenticated user UUID. Output: only that user's JDs."""
    jobs = db.scalars(select(Job).where(Job.created_by == user_id).order_by(Job.created_at.desc())).all()
    return [{"job_id": str(j.id), "title": j.title, "file_name": j.jd_file_name, "status": j.status,
             "created_at": j.created_at.isoformat() if j.created_at else None} for j in jobs]

def get_user_job_candidates(db: Session, user_id: UUID, job_id: UUID) -> list[dict]:
    """Input: authenticated user and job UUID. Output: Top 10 only when the user owns the JD."""
    if not db.scalar(select(Job.id).where(Job.id == job_id, Job.created_by == user_id)):
        raise PermissionError("Job does not belong to current user")
    return get_job_candidates(db, job_id)

def get_admin_jobs(db: Session) -> list[dict]:
    """Input: DB session. Output: all JDs with uploader and Top 10 summary."""
    rows = db.execute(select(Job, User).join(User, User.id == Job.created_by).order_by(Job.created_at.desc())).all()
    return [{"job_id": str(j.id), "title": j.title, "file_name": j.jd_file_name, "status": j.status,
             "uploaded_by": {"id": str(u.id), "name": u.name, "email": u.email},
             "top_10": get_job_candidates(db, j.id)} for j, u in rows]

def get_admin_job_candidates(db: Session, job_id: UUID) -> list[dict]:
    """Input: job UUID. Output: Top 10 persisted candidates for that JD."""
    if not db.get(Job, job_id):
        raise ValueError("Job not found")
    return get_job_candidates(db, job_id)
