
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
/*
  Your backend requires X-User-Id for:
  - creating a job
  - screening a job
  - fetching candidates

  For now we read it from localStorage.
  Later we can connect this to your login properly.
*/
const getUserId = () => {
  return localStorage.getItem("userId");
};

const getHeaders = () => {
  const userId = getUserId();

  return userId
    ? {
        "X-User-Id": userId,
      }
    : {};
};

const getErrorMessage = async (response, fallback) => {
  try {
    const data = await response.json();

    if (typeof data === "string") {
      return data;
    }

    return (
      data?.detail ||
      data?.message ||
      data?.error ||
      fallback
    );
  } catch {
    return fallback;
  }
};


// --------------------------------------------------
// CREATE JOB FROM FILE
// --------------------------------------------------

export const createJob = async (file) => {
  const formData = new FormData();

  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/api/jobs`, {
    method: "POST",
    headers: getHeaders(),
    body: formData,
  });

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(
        response,
        "Failed to create job from file."
      )
    );
  }

  return response.json();
};


// --------------------------------------------------
// CREATE JOB FROM PASTED TEXT
// --------------------------------------------------

export const createJobFromText = async (jdText) => {
  const formData = new FormData();

  formData.append("jd_text", jdText);

  const response = await fetch(`${API_BASE_URL}/api/jobs`, {
    method: "POST",
    headers: getHeaders(),
    body: formData,
  });

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(
        response,
        "Failed to create job from text."
      )
    );
  }

  return response.json();
};


// --------------------------------------------------
// SCREEN JOB
// --------------------------------------------------

export const screenJob = async (jobId) => {
  const response = await fetch(
    `${API_BASE_URL}/api/jobs/${jobId}/screen`,
    {
      method: "POST",
      headers: getHeaders(),
    }
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(
        response,
        "Failed to screen candidates."
      )
    );
  }

  return response.json();
};


// --------------------------------------------------
// GET USER JOBS
// --------------------------------------------------

export const getUserJobs = async () => {
  const response = await fetch(
    `${API_BASE_URL}/api/user/jobs`,
    {
      method: "GET",
      headers: getHeaders(),
    }
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(
        response,
        "Failed to fetch jobs."
      )
    );
  }

  return response.json();
};


// --------------------------------------------------
// GET CANDIDATES FOR JOB
// --------------------------------------------------

export const getJobCandidates = async (jobId) => {
  const response = await fetch(
    `${API_BASE_URL}/api/user/jobs/${jobId}/candidates`,
    {
      method: "GET",
      headers: getHeaders(),
    }
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(
        response,
        "Failed to fetch candidates."
      )
    );
  }

  return response.json();
};