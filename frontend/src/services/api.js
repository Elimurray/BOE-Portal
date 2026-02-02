import axios from "axios";

const API_BASE_URL =
  // import.meta.env.VITE_API_URL || "http://localhost:3001/api";
  import.meta.env.VITE_API_URL || "http://100.115.180.68:3001/api";


const api = axios.create({
  baseURL: API_BASE_URL,
});

export const uploadCSV = (file) => {
  const formData = new FormData();
  formData.append("csv", file);
  return api.post("/grades/upload", formData);
};

export const getPapers = () => api.get("/papers");
export const getPaper = (id) => api.get(`/papers/${id}`);
export const getOccurrences = () => api.get("/papers/occurrences");
export const getOccurrencesIncomplete = () =>
  api.get("/papers/occurrences/incomplete");
export const getOccurrence = (id) => api.get(`/papers/occurrences/${id}`);

export const submitForm = (formData) => api.post("/forms", formData);
export const getForms = () => api.get("/forms");

export const scrapeOutline = (data) => api.post("/scraper/outline", data);
export const saveOutline = (occurrenceId, scrapedData) => {
  return api.post(`/papers/occurrences/${occurrenceId}/outline`, {
    scrapedData,
  });
};

export const getOccurrenceReview = (id) => api.get(`/review/occurrences/${id}`);

export const getGradeDistribution = (occurrenceId) =>
  api.get(`/graphs/${occurrenceId}/distribution`);

export const getHistoricalComparison = async (
  paperCode,
  location,
  trimester
) => {
  return await api.get(
    `/graphs/historical/${paperCode}?location=${location}&trimester=${trimester}`
  );
};

export const getHistoricalDistribution = (occurrenceId) => {
  return api.get(`/graphs/historical-distribution/${occurrenceId}`);
};

export const updateGradeDistribution = (occurrenceId, gradeData) => {
  return api.put(`/grades/update/${occurrenceId}`, gradeData);
};

export default api;
