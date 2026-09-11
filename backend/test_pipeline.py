import asyncio
from app.database import SessionLocal, create_tables
from app.models import User
from app.tool_functions import ingest_resume_folder, create_job, screen_job
from app.config import settings

def test_full_pipeline():
    print("=== 1. Initializing Database ===")
    create_tables()
    
    db = SessionLocal()
    try:
        # 1. Create a dummy test user if we don't have one
        user = db.query(User).filter_by(email="test@hirex.com").first()
        if not user:
            user = User(name="Test Recruiter", email="test@hirex.com", role="RECRUITER")
            db.add(user)
            db.commit()
            db.refresh(user)
            print(f"Created/Found test user: {user.email} (ID: {user.id})")
        else:
            print(f"Using existing test user: {user.email} (ID: {user.id})")
        
        # 2. Ingest all CVs from the configured folder
        # print(f"\n=== 2. Scanning CV Folder ({settings.RESUME_DIR}) ===")
        # print("Starting CV ingestion... This might take some time depending on the number of CVs.")
        # ingest_results = ingest_resume_folder(db)
        # print("Ingestion results:")
        # print(f"  Total processed: {ingest_results.get('total')}")
        # print(f"  Successful: {ingest_results.get('successful')}")
        # print(f"  Skipped: {ingest_results.get('skipped')}")
        # print(f"  Failed: {ingest_results.get('failed')}")
        
        # 3. Create a mock Job Description
        print("\n=== 3. Uploading Job Description ===")
        # sample_jd = """
        # We are looking for a highly skilled Software Engineer with 3+ years of experience.
        # Must have strong skills in Python and Javascript.
        # Experience with web frameworks like Django or React is required.
        # Location: Remote / New York.
        # """
        sample_jd = """
        We are hiring a Senior Data Scientist with 3-6 years of experience.
 
Mandatory Skills: Python, Machine Learning, Deep Learning, NLP, SQL
Preferred Skills: LLMs, RAG, LangChain, AWS
 
Responsibilities:
- Build and deploy ML models into production
- Work with large datasets and build data pipelines
- Collaborate with cross-functional teams
 
Education: B.Tech or M.Tech in Computer Science or related field
Location: Kolkata
Work Mode: Hybrid
Notice Period: 30 days
        """
        print("Extracting Job Description requirements and creating Job...")
        job = create_job(db=db, user_id=user.id, raw_text=sample_jd, file_name="Test_Software_Engineer_JD.txt")
        print(f"Job created successfully! Job ID: {job.id}")
        
        # 4. Screen candidates for this JD
        print("\n=== 4. Screening & Matching ===")
        print("Screening candidates... finding Top 10 matches...")
        screening_results = screen_job(db=db, job_id=job.id)
        
        print("\n=== TOP C.V. MATCHES ===")
        top_candidates = screening_results.get("top_10", [])
        if not top_candidates:
            print("No matching candidates found. Make sure you have CVs in the database.")
        else:
            for candidate in top_candidates:
                print(f"Rank {candidate['rank']}: {candidate['name']} ({candidate['email']})")
                print(f"  Candidate ID: {candidate['candidate_id']}")
                print(f"  Score: {candidate['score']} | Classification: {candidate['classification']}")
                print("-" * 50)
            
    finally:
        db.close()
        print("\nPipeline test complete.")

if __name__ == "__main__":
    test_full_pipeline()
