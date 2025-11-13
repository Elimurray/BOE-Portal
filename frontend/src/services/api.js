import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3001/api";

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

export const submitForm = (formData) => api.post("/forms", formData);
export const getForms = () => api.get("/forms");

export const scrapeOutline = (data) => api.post("/scraper/outline", data);
export const saveOutline = (paperId, scrapedData) => {
  return api.post(`/papers/${paperId}/outline`, { scrapedData });
};

export const getGradeDistribution = (paperId) =>
  api.get(`/graphs/${paperId}/distribution`);

export const getHistoricalComparison = (paperId) =>
  api.get(`/graphs/${paperId}/historical`);

export default api;
