export const API_BASE_URL = '/api';

export const ENDPOINTS = {
  // Auth
  LOGIN: '/auth/login',
  REFRESH_TOKEN: '/auth/refresh',
  LOGOUT: '/auth/logout',

  // Criminals (profiles)
  CRIMINALS: '/profiles',
  CRIMINAL: '/profile',
  CRIMINAL_BY_ID: (id) => `/profile/${id}`,
  CRIMINAL_IMAGE_BY_ID: (id) => `/profile/${id}/image`,
  CRIMINAL_SEARCH: '/search/profiles',
  CRIMINAL_IMAGE_SEARCH: '/search/profile',

  // Officers
  OFFICERS: '/officers',
  OFFICER: '/officer',
  OFFICER_BY_ID: (id) => `/officer/${id}`,
  OFFICER_IMAGE_BY_ID: (id) => `/officer/${id}/image`,
  OFFICER_SEARCH: '/search/officers',           // ← added

  // Vehicles
  VEHICLES: '/vehicles',
  VEHICLE: '/vehicle',
  VEHICLE_BY_ID: (id) => `/vehicle/${id}`,
  VEHICLE_IMAGE_BY_ID: (id) => `/vehicle/${id}/image`,
  VEHICLE_SEARCH: '/search/vehicles',
  VEHICLE_IMAGE_SEARCH: '/search/vehicles/vector',

  // Vehicle-Profile Mappings
  VEHICLE_MAPPINGS: '/vehicle-profile-mappings',
  VEHICLE_MAPPING: '/vehicle-profile-mapping',
  VEHICLE_MAPPING_BY_ID: (id) => `/vehicle-profile-mapping/${id}`,

  // States & Districts
  STATES: '/states',
  STATE_BY_CODE: (code) => `/states/${code}`,
  DISTRICTS: '/districts',
  DISTRICT_BY_CODE: (code) => `/districts/${code}`,
  DISTRICTS_BY_STATE: (stateCode) => `/districts/state/${stateCode}`,
};

export function getAuthHeaders() {
  const token = localStorage.getItem('accessToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
}