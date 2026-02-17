import API from "./api";

// Create match
export const createMatch = (payload) =>
  API.post("/api/match/create", payload);

// Respond to match (accept / reject)
export const respondToMatch = (payload) =>
  API.post("/api/match/respond", payload);

// Cancel match
export const cancelMatch = (payload) =>
  API.post("/api/match/cancel", payload);

// Get my matches
export const getMyMatches = () =>
  API.get("/api/match/myMatch");

export const addMatchEvent = (matchId, payload) => {
  return API.post(`/api/match/${matchId}/event`, payload);
};

export const submitMatchLineup = (matchId, payload) =>
  API.post(`/api/matchlineup/${matchId}/lineup`, payload);

export const getMatchLineups = (matchId) =>
  API.get(`/api/matchlineup/${matchId}/lineups`);



// Get match by id
export const getMatchById = (matchId) =>
  API.get(`/api/match/${matchId}`);
