import API from "./api";

export const checkOrganiserProfileStatus = () =>
  API.get("/api/organiser/profile/status");

export const getMyOrganiserProfile = () =>
  API.get("/api/organiser/profile");

export const saveOrganiserProfile = (formData) =>
  API.post("/api/organiser/profile", formData);
