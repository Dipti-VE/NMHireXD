import { useState } from "react";
import { Link } from "react-router-dom";
import Header from "../components/Header";

import {
  createJob,
  createJobFromText,
  screenJob,
} from "../utils/api";


export default function MatchAgent() {

  // ==========================================================
  // JOB STATE
  // ==========================================================

  const [selectedFile, setSelectedFile] = useState(null);
  const [fileName, setFileName] = useState("");

  const [jobTitle, setJobTitle] = useState("");

  const [jdText, setJdText] = useState("");

  const [job, setJob] = useState(null);

  const [requirements, setRequirements] = useState(null);

  const [jobId, setJobId] = useState(null);


  // ==========================================================
  // UI STATE
  // ==========================================================

  const [status, setStatus] = useState("Draft");

  const [isAnalyzing, setIsAnalyzing] =
    useState(false);

  const [isSearching, setIsSearching] =
    useState(false);

  const [searchComplete, setSearchComplete] =
    useState(false);

  const [error, setError] = useState("");

  const [candidates, setCandidates] =
    useState([]);


  // ==========================================================
  // DETAILS / OUTREACH
  // ==========================================================

  const [expandedDetails, setExpandedDetails] =
    useState({});

  const [contacted, setContacted] =
    useState({});

  const [queueReady, setQueueReady] =
    useState(false);


  // ==========================================================
  // FILE CHANGE
  // ==========================================================

  const handleFileChange = (e) => {

    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    setSelectedFile(file);
    setFileName(file.name);

    setError("");

    // Clear pasted JD if user selected a file
    setJdText("");
  };


  // ==========================================================
  // ANALYZE JD
  // ==========================================================

  const handleAnalyze = async () => {

    setError("");

    setSearchComplete(false);

    setCandidates([]);

    setRequirements(null);

    // --------------------------------------------------------
    // Validate input
    // --------------------------------------------------------

    if (!selectedFile && !jdText.trim()) {

      setError(
        "Please upload a job description or paste the JD text."
      );

      return;
    }


    setIsAnalyzing(true);

    setStatus("Analyzing");


    try {

      let result;


      // ------------------------------------------------------
      // FILE
      // ------------------------------------------------------

      if (selectedFile) {

        result = await createJob(
          selectedFile
        );

      }

      // ------------------------------------------------------
      // TEXT
      // ------------------------------------------------------

      else {

        result = await createJobFromText(
          jdText.trim()
        );

      }


      console.log(
        "Job created:",
        result
      );


      // ------------------------------------------------------
      // Save job
      // ------------------------------------------------------

      setJob(result);

      setJobId(
        result.job_id
      );


      // ------------------------------------------------------
      // Save extracted requirements
      // ------------------------------------------------------

      setRequirements(
        result.requirements || {}
      );


      // ------------------------------------------------------
      // Update title
      // ------------------------------------------------------

      const extractedTitle =
        result.requirements?.job_title ||
        result.title ||
        jobTitle ||
        "Job Description";

      setJobTitle(
        extractedTitle
      );


      setStatus(
        "Criteria ready"
      );

    } catch (err) {

      console.error(
        "JD analysis failed:",
        err
      );

      setStatus("Draft");

      setError(
        err.message ||
        "Failed to analyze the job description."
      );

    } finally {

      setIsAnalyzing(false);

    }
  };


  // ==========================================================
  // SCREEN CANDIDATES
  // ==========================================================

  const handleSearch = async () => {

    setError("");

    if (!jobId) {

      setError(
        "Please analyze the job description first."
      );

      return;
    }


    setIsSearching(true);

    setSearchComplete(false);

    setStatus("Screening");


    try {

      const result =
        await screenJob(jobId);


      console.log(
        "Screening result:",
        result
      );


      // ------------------------------------------------------
      // Backend returns:
      //
      // {
      //   job_id,
      //   candidates_evaluated,
      //   top_10: [...]
      // }
      // ------------------------------------------------------

      const rankedCandidates =
        Array.isArray(result?.top_10)
          ? result.top_10
          : [];


      setCandidates(
        rankedCandidates
      );


      setSearchComplete(true);

      setStatus("Screening");

    } catch (err) {

      console.error(
        "Screening failed:",
        err
      );

      setError(
        err.message ||
        "Failed to screen candidates."
      );

      setStatus(
        "Criteria ready"
      );

    } finally {

      setIsSearching(false);

    }
  };


  // ==========================================================
  // DETAILS
  // ==========================================================

  const toggleDetails = (candidateId) => {

    setExpandedDetails(
      (prev) => ({
        ...prev,
        [candidateId]:
          !prev[candidateId],
      })
    );
  };


  // ==========================================================
  // CONTACT
  // ==========================================================

  const handleContact = (candidateId) => {

    setContacted(
      (prev) => ({
        ...prev,
        [candidateId]: true,
      })
    );
  };


  // ==========================================================
  // HELPERS
  // ==========================================================

  const formatExperience = () => {

    if (!requirements) {
      return "Not specified";
    }

    const min =
      requirements.minimum_experience;

    const max =
      requirements.maximum_experience;


    if (
      min !== null &&
      min !== undefined &&
      max !== null &&
      max !== undefined
    ) {

      return `${min}–${max} years`;

    }


    if (
      min !== null &&
      min !== undefined
    ) {

      return `${min}+ years`;

    }


    if (
      max !== null &&
      max !== undefined
    ) {

      return `Up to ${max} years`;

    }


    return "Not specified";
  };


  const formatNoticePeriod = () => {

    const value =
      requirements?.notice_period_days;


    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {

      return "Not specified";
    }


    const number =
      Number(value);


    if (!Number.isNaN(number)) {

      if (number === 0) {
        return "Immediate";
      }

      return `${number} days`;
    }


    return String(value);
  };


  const getDisplayName = (skill) => {

    if (
      skill === null ||
      skill === undefined
    ) {

      return "";
    }


    if (
      typeof skill === "object"
    ) {

      return (
        skill.skill_name ||
        skill.normalized_skill_name ||
        skill.name ||
        skill.skill ||
        ""
      );
    }


    return String(skill);
  };


  const formatList = (value) => {

    if (!Array.isArray(value)) {
      return [];
    }

    return value
      .map(getDisplayName)
      .filter(Boolean);
  };


  const getClassificationLabel = (classification) => {
    if (!classification) return "Match";
    return String(classification)
      .replaceAll("_", " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  };

  const formatBreakdownLabel = (key) => {
    return String(key)
      .replaceAll("_", " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  };


  // ==========================================================
  // RENDER
  // ==========================================================

  return (

    <div className="relative min-h-screen w-full overflow-hidden antialiased pb-20">

      {/* Background */}

      <div className="glow-bg-large top-[-30%] left-[-20%] animate-pulse-slow"></div>

      <div
        className="glow-bg-large bottom-[-20%] right-[-10%] animate-pulse-slow"
        style={{
          animationDelay: "2s",
          background:
            "radial-gradient(circle, rgba(20,184,166,0.1) 0%, rgba(59,130,246,0.05) 40%, rgba(2,6,23,0) 70%)",
        }}
      ></div>


      <Header />


      <main className="relative z-10">

        <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8">


          {/* =================================================
              PAGE HEADER
          ================================================= */}

          <div className="mb-8 flex flex-wrap items-end justify-between gap-6">

            <div>

              <div className="mb-2 inline-flex items-center gap-2.5 rounded-full bg-slate-800/80 px-3 py-1.5 ring-1 ring-slate-700">

                <span className="size-2 rounded-full bg-brand"></span>

                <p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-300">
                  03 · Match agent
                </p>

              </div>


              <h1 className="mt-2 font-display text-4xl font-bold tracking-tight sm:text-5xl text-white">
                Turn a JD into a shortlist.
              </h1>


              <p className="mt-3 max-w-3xl text-base leading-relaxed text-slate-400">
                Upload a job description, let AI create search criteria, then rank candidates using the screening model.
              </p>

            </div>


            <Link
              to="/dashboard"
              className="rounded-xl bg-slate-800/80 px-5 py-3 text-sm font-bold text-white ring-1 ring-slate-700 hover:bg-slate-700 transition-all"
            >
              ← Back to Dashboard
            </Link>

          </div>



          {/* =================================================
              ERROR
          ================================================= */}

          {error && (

            <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-300">

              {error}

            </div>

          )}



          <div className="grid gap-6 xl:grid-cols-12">


            {/* =================================================
                LEFT SIDE
            ================================================= */}

            <section className="glass-dark rounded-[24px] p-6 sm:p-8 xl:col-span-5 h-fit">

              <div className="mb-6 flex items-center justify-between">

                <div>

                  <p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-400">
                    Step 1 · Job intake
                  </p>

                  <h2 className="mt-1 font-display text-2xl font-bold text-white">
                    Create a search
                  </h2>

                </div>


                <span className="rounded-full bg-accent/20 px-3 py-1.5 text-xs font-bold text-accent ring-1 ring-accent/40">

                  {status}

                </span>

              </div>



              {/* JOB TITLE */}

              <div className="mb-5">

                <label
                  htmlFor="jd-title"
                  className="mb-2 block text-xs font-bold text-slate-300"
                >
                  Job title
                </label>


                <input
                  id="jd-title"
                  value={jobTitle}
                  onChange={(e) =>
                    setJobTitle(
                      e.target.value
                    )
                  }
                  placeholder="Job title"
                  className="input-dark w-full rounded-xl px-4 py-3 text-sm font-medium"
                />

              </div>



              {/* FILE UPLOAD */}

              <div className="dropzone-dark rounded-2xl p-8 text-center cursor-pointer group relative">

                <input
                  id="jd-file"
                  type="file"
                  accept=".pdf,.doc,.docx,.txt"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={handleFileChange}
                />


                <div className="mx-auto grid size-12 place-items-center rounded-full bg-slate-800 text-brand shadow-sm ring-1 ring-slate-700">

                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                    />
                  </svg>

                </div>


                <p className="mt-4 text-base font-bold text-white">
                  Upload Job Description
                </p>


                <p className="mt-1.5 text-xs font-medium text-slate-400">
                  PDF, DOC, DOCX or TXT · up to 10 MB
                </p>


                {fileName && (

                  <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-brand/20 px-3 py-1 text-xs font-bold text-brand">

                    ✓ {fileName} selected

                  </p>

                )}

              </div>



              {/* OR */}

              <div className="my-6 flex items-center gap-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">

                <span className="h-px flex-1 bg-slate-800"></span>

                OR PASTE JD

                <span className="h-px flex-1 bg-slate-800"></span>

              </div>



              {/* JD TEXT */}

              <textarea
                rows="7"
                value={jdText}
                onChange={(e) => {
                  setJdText(
                    e.target.value
                  );

                  if (
                    e.target.value.trim()
                  ) {
                    setSelectedFile(null);
                    setFileName("");
                  }
                }}
                placeholder="Paste the job description here…"
                className="input-dark w-full resize-none rounded-xl px-4 py-3 text-sm mb-6 placeholder:text-slate-600"
              />



              {/* ANALYZE */}

              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="w-full rounded-xl px-4 py-3.5 text-sm font-bold text-white shadow-lg flex items-center justify-center gap-2 transition-colors border bg-slate-800 hover:bg-slate-700 border-slate-700"
              >

                {isAnalyzing ? (

                  <>
                    <svg
                      className="size-4 animate-spin"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        className="opacity-25"
                      />

                      <path
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        fill="currentColor"
                        className="opacity-75"
                      />
                    </svg>

                    AI is analyzing the JD…

                  </>

                ) : (

                  requirements
                    ? "Re-analyze JD"
                    : "Analyze JD & Create Search Criteria"

                )}

              </button>



              {/* =================================================
                  EXTRACTED CRITERIA
              ================================================= */}

              {requirements && (

                <div className="mt-6 rounded-2xl bg-slate-800/60 p-5 ring-1 ring-slate-700/80">

                  <div className="flex items-center justify-between mb-4">

                    <div>

                      <p className="text-sm font-bold text-white">
                        AI-generated search criteria
                      </p>

                      <p className="mt-1 text-[11px] font-medium text-slate-400">
                        Extracted from the job description.
                      </p>

                    </div>


                    <span className="rounded-full bg-accent/20 px-2.5 py-1 text-[11px] font-bold text-accent">
                      Ready
                    </span>

                  </div>



                  <div className="grid gap-3 text-xs">


                    {/* EXPERIENCE */}

                    <div className="flex items-start gap-3 bg-slate-900/50 p-3 rounded-lg">

                      <span className="font-bold text-slate-300 w-24 shrink-0">
                        Experience:
                      </span>

                      <span className="font-medium text-white">
                        {formatExperience()}
                      </span>

                    </div>



                    {/* LOCATION */}

                    <div className="flex items-start gap-3 bg-slate-900/50 p-3 rounded-lg">

                      <span className="font-bold text-slate-300 w-24 shrink-0">
                        Location:
                      </span>

                      <span className="font-medium text-white">
                        {requirements.location ||
                          job?.location ||
                          "Not specified"}
                      </span>

                    </div>



                    {/* WORK MODE */}

                    <div className="flex items-start gap-3 bg-slate-900/50 p-3 rounded-lg">

                      <span className="font-bold text-slate-300 w-24 shrink-0">
                        Work mode:
                      </span>

                      <span className="font-medium text-white">
                        {requirements.work_mode ||
                          "Not specified"}
                      </span>

                    </div>



                    {/* NOTICE */}

                    <div className="flex items-start gap-3 bg-slate-900/50 p-3 rounded-lg">

                      <span className="font-bold text-slate-300 w-24 shrink-0">
                        Notice:
                      </span>

                      <span className="font-medium text-white">
                        {formatNoticePeriod()}
                      </span>

                    </div>



                    {/* MANDATORY */}

                    <div className="flex items-start gap-3 bg-slate-900/50 p-3 rounded-lg">

                      <span className="font-bold text-slate-300 w-24 shrink-0">
                        Mandatory:
                      </span>


                      <div className="flex flex-wrap gap-1.5">

                        {formatList(
                          requirements.mandatory_skills
                        ).map(
                          (skill, index) => (

                            <span
                              key={`${skill}-${index}`}
                              className="rounded bg-brand/20 px-1.5 py-0.5 font-bold text-brand ring-1 ring-brand/30"
                            >
                              {skill}
                            </span>

                          )
                        )}

                        {!formatList(
                          requirements.mandatory_skills
                        ).length && (

                          <span className="text-slate-500">
                            None specified
                          </span>

                        )}

                      </div>

                    </div>



                    {/* PREFERRED */}

                    <div className="flex items-start gap-3 bg-slate-900/50 p-3 rounded-lg">

                      <span className="font-bold text-slate-300 w-24 shrink-0">
                        Preferred:
                      </span>


                      <div className="flex flex-wrap gap-1.5">

                        {formatList(
                          requirements.preferred_skills
                        ).map(
                          (skill, index) => (

                            <span
                              key={`${skill}-${index}`}
                              className="rounded bg-slate-700 px-1.5 py-0.5 font-bold text-slate-300"
                            >
                              {skill}
                            </span>

                          )
                        )}

                        {!formatList(
                          requirements.preferred_skills
                        ).length && (

                          <span className="text-slate-500">
                            None specified
                          </span>

                        )}

                      </div>

                    </div>



                    {/* EDUCATION */}

                    {formatList(
                      requirements.education
                    ).length > 0 && (

                      <div className="flex items-start gap-3 bg-slate-900/50 p-3 rounded-lg">

                        <span className="font-bold text-slate-300 w-24 shrink-0">
                          Education:
                        </span>

                        <span className="font-medium text-white">
                          {formatList(
                            requirements.education
                          ).join(", ")}
                        </span>

                      </div>

                    )}



                    {/* CERTIFICATIONS */}

                    {formatList(
                      requirements.certifications
                    ).length > 0 && (

                      <div className="flex items-start gap-3 bg-slate-900/50 p-3 rounded-lg">

                        <span className="font-bold text-slate-300 w-24 shrink-0">
                          Certifications:
                        </span>

                        <span className="font-medium text-white">
                          {formatList(
                            requirements.certifications
                          ).join(", ")}
                        </span>

                      </div>

                    )}

                  </div>



                  {/* SEARCH BUTTON */}

                  <button
                    onClick={handleSearch}
                    disabled={
                      isSearching ||
                      !jobId
                    }
                    className="btn-neon mt-5 w-full rounded-xl px-4 py-3 text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50"
                  >

                    {isSearching ? (

                      <>
                        <svg
                          className="size-4 animate-spin"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <circle
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                            className="opacity-25"
                          />

                          <path
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                            fill="currentColor"
                            className="opacity-75"
                          />
                        </svg>

                        Screening candidates…

                      </>

                    ) : (

                      <>
                        Search connected portals
                        <span>→</span>
                      </>

                    )}

                  </button>


                </div>

              )}

            </section>



            {/* =================================================
                RIGHT SIDE — CANDIDATES
            ================================================= */}

            <section className="glass-dark rounded-[24px] p-6 sm:p-8 xl:col-span-7">

              <div className="mb-6 flex flex-wrap items-center justify-between gap-4">

                <div>

                  <p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-400">
                    Steps 2–3 · Screening
                  </p>

                  <h2 className="mt-1 font-display text-2xl font-bold text-white">
                    Ranked candidates
                  </h2>

                </div>


                <div className="flex items-center gap-3">

                  <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-800 px-3 py-1.5 text-xs font-bold text-white ring-1 ring-slate-700">

                    <span className="text-slate-400">
                      Screened:
                    </span>

                    {searchComplete
                      ? candidates.length
                      : 0}

                  </span>


                  <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/20 px-3 py-1.5 text-xs font-bold text-accent ring-1 ring-accent/30">

                    ✓

                    {searchComplete
                      ? candidates.filter(
                          (candidate) =>
                            Number(
                              candidate.score || 0
                            ) >= 80
                        ).length
                      : 0}

                    {" "}strong

                  </span>

                </div>

              </div>



              {/* =================================================
                  EMPTY STATE
              ================================================= */}

              {!searchComplete &&
                !isSearching && (

                  <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/30 p-12 text-center">

                    <div className="mx-auto mb-4 grid size-14 place-items-center rounded-full bg-slate-800 text-slate-500">

                      <svg
                        className="w-7 h-7"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M21 21l-4.35-4.35m2.35-5.65a8 8 0 11-16 0 8 8 0 0116 0z"
                        />
                      </svg>

                    </div>

                    <p className="text-base font-bold text-white">
                      No candidates yet
                    </p>

                    <p className="mt-2 text-sm text-slate-500">
                      Analyze a job description and search for candidates to see the ranked shortlist.
                    </p>

                  </div>

                )}



              {/* =================================================
                  SEARCHING
              ================================================= */}

              {isSearching && (

                <div className="rounded-2xl border border-slate-700 bg-slate-900/40 p-12 text-center">

                  <svg
                    className="mx-auto size-10 animate-spin text-brand"
                    viewBox="0 0 24 24"
                    fill="none"
                  >

                    <circle
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="3"
                      className="opacity-25"
                    />

                    <path
                      d="M4 12a8 8 0 018-8"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />

                  </svg>


                  <p className="mt-4 text-base font-bold text-white">
                    Screening candidates…
                  </p>


                  <p className="mt-2 text-sm text-slate-500">
                    The AI screening engine is evaluating candidates against the job requirements.
                  </p>

                </div>

              )}



              {/* =================================================
                  CANDIDATES
              ================================================= */}

              {searchComplete && (

                <div className="space-y-4">

                  {candidates.length === 0 && (

                    <div className="rounded-2xl border border-slate-700 bg-slate-900/40 p-10 text-center">

                      <p className="font-bold text-white">
                        No matching candidates found.
                      </p>

                      <p className="mt-2 text-sm text-slate-500">
                        Try reviewing the extracted criteria or using a different job description.
                      </p>

                    </div>

                  )}



                  {candidates.map((candidate, index) => {
                    const candidateKey = candidate.candidate_id || candidate.id || index;
                    const score = Number(candidate.score || 0);
                    const breakdown = candidate?.score_breakdown && typeof candidate.score_breakdown === "object"
                      ? candidate.score_breakdown
                      : {};
                    const phone = candidate?.phone ? String(candidate.phone).replace(/[^0-9]/g, "") : "";

                    return (
                      <div key={candidateKey} className="candidate-card glass-dark-card bg-slate-800/40 rounded-2xl p-5 border border-slate-700/50">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2.5">
                              <p className="text-base font-bold text-white">{candidate.name || "Unnamed Candidate"}</p>
                              <span className="rounded-full bg-accent/20 px-2.5 py-1 text-[10px] font-bold text-accent ring-1 ring-accent/30">
                                {getClassificationLabel(candidate.classification)}
                              </span>
                            </div>
                            <p className="mt-1.5 text-xs font-medium text-slate-400">{candidate.email || "Email unavailable"}</p>
                          </div>
                          <div className="text-right flex flex-col items-end">
                            <p className="font-display text-4xl font-bold text-accent leading-none">{score.toFixed(1)}</p>
                            <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">Match / 100</p>
                          </div>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          <span className="rounded-full bg-brand/20 px-3 py-1 text-[11px] font-bold text-brand">Rank #{candidate.rank || index + 1}</span>
                          {candidate.status && (
                            <span className="rounded-full bg-slate-800 px-3 py-1 text-[11px] font-bold text-slate-400 ring-1 ring-slate-700">{candidate.status}</span>
                          )}
                        </div>

                        {/* SCORE BREAKDOWN — DIRECTLY FROM API RESPONSE */}
                        {Object.keys(breakdown).length > 0 && (
                          <div className="mt-5 rounded-xl bg-slate-900/60 p-4 border border-slate-800">
                            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-300">Score breakdown</p>
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                              {Object.entries(breakdown).map(([key, value]) => {
                                const item = value && typeof value === "object" ? value : { score: value };
                                return (
                                  <div key={key} className="rounded-lg bg-slate-800/70 p-3">
                                    <p className="text-[10px] font-bold text-slate-400">{formatBreakdownLabel(key)}</p>
                                    <p className="mt-1 text-sm font-bold text-white">
                                      {item.score ?? 0}
                                      {item.max_score !== undefined && item.max_score !== null ? ` / ${item.max_score}` : ""}
                                    </p>
                                    {item.percentage !== undefined && item.percentage !== null && (
                                      <p className="mt-0.5 text-[10px] font-bold text-accent">{item.percentage}%</p>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        <div className="mt-5 flex items-center justify-end gap-3 border-t border-slate-700/50 pt-4">
                          <button onClick={() => toggleDetails(candidateKey)} className="text-xs font-bold text-slate-400 hover:text-white transition-colors px-2 py-1">
                            {expandedDetails[candidateKey] ? "Hide details ↑" : "View details ↓"}
                          </button>
                          <button onClick={() => handleContact(candidateKey)} disabled={contacted[candidateKey]} className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${contacted[candidateKey] ? "bg-accent/20 text-accent border border-accent/30" : "bg-slate-800 text-white hover:bg-slate-700 border border-slate-700"}`}>
                            {contacted[candidateKey] ? "✓ Added to outreach" : "Add to outreach"}
                          </button>
                          <button type="button" disabled={!phone} onClick={() => {
                            if (!phone) return;
                            window.open(`https://wa.me/${phone}`, "_blank", "noopener,noreferrer");
                          }} className="rounded-xl bg-green-600 px-4 py-2 text-xs font-bold text-white transition-all hover:bg-green-500 disabled:cursor-not-allowed disabled:opacity-40">
                            WhatsApp
                          </button>
                        </div>

                        {expandedDetails[candidateKey] && (
                          <div className="mt-4 rounded-xl bg-slate-900/80 p-4 text-xs leading-relaxed border border-slate-800">
                            <p className="text-slate-300"><strong className="text-white">Candidate:</strong>{" "}{candidate.name || "Unnamed Candidate"}</p>
                            {candidate.email && <p className="mt-2 text-slate-300"><strong className="text-white">Email:</strong>{" "}{candidate.email}</p>}
                            <p className="mt-2 text-slate-300"><strong className="text-white">Screening score:</strong>{" "}{score.toFixed(1)}/100</p>
                            {candidate.classification && <p className="mt-2 text-slate-300"><strong className="text-white">Classification:</strong>{" "}{getClassificationLabel(candidate.classification)}</p>}
                            {candidate.phone && <p className="mt-2 text-slate-300"><strong className="text-white">Phone:</strong>{" "}{candidate.phone}</p>}
                            {candidate.reasoning && <p className="mt-3 text-slate-300"><strong className="text-white">Reasoning:</strong>{" "}{candidate.reasoning}</p>}
                          </div>
                        )}
                      </div>
                    );
                  })}

                </div>

              )}



              {/* =================================================
                  OUTREACH
              ================================================= */}

              {searchComplete &&
                candidates.length > 0 && (

                  <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-gradient-to-r from-brand/20 to-purple-500/20 p-6 border border-slate-700">

                    <div>

                      <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-brand-soft">
                        Step 4 · Outreach
                      </p>


                      <p className="mt-2 text-sm font-medium text-white">

                        Review the eligible candidates before starting outreach.

                      </p>

                    </div>


                    <button
                      onClick={() =>
                        setQueueReady(true)
                      }
                      className="btn-neon rounded-xl px-5 py-3 text-sm font-bold text-white"
                    >
                      Review outreach queue
                    </button>

                  </div>

                )}



              {queueReady && (

                <p className="mt-4 rounded-xl bg-accent/20 px-4 py-3 text-sm font-bold text-accent border border-accent/30">

                  ✓ Outreach queue is ready for review.

                </p>

              )}

            </section>

          </div>

        </div>

      </main>

    </div>
  );
}