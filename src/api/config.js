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
  CRIMINALS_BY_OFFICER: (
    officerId,
    { page = 1, limit = 10, sortBy = 'created_at', order = 'desc' } = {}
  ) =>
    `/profiles/officer/${encodeURIComponent(officerId)}?page=${page}&limit=${limit}&sortBy=${sortBy}&order=${order}`,

  // Officers
  OFFICERS: '/officers',
  OFFICER: '/officer',
  OFFICER_BY_ID: (id) => `/officer/${id}`,
  OFFICER_IMAGE_BY_ID: (id) => `/officer/${id}/image`,
  OFFICER_SEARCH: '/search/officers',

  // Vehicles
  VEHICLES: '/vehicles',
  VEHICLE: '/vehicle',
  VEHICLE_BY_ID: (id) => `/vehicle/${id}`,
  VEHICLE_IMAGE_BY_ID: (id) => `/vehicle/${id}/image`,
  VEHICLE_SEARCH: '/search/vehicles',
  VEHICLE_IMAGE_SEARCH: '/search/vehicles/vector',
  VEHICLES_BY_OFFICER: (
    officerId,
    { page = 1, limit = 10, sortBy = 'created_at', order = 'desc' } = {}
  ) =>
    `/vehicles/officer/${encodeURIComponent(officerId)}?page=${page}&limit=${limit}&sortBy=${sortBy}&order=${order}`,

  // Vehicle-Profile Mappings
  // NOTE: backend does not currently accept page/limit/sortBy/order on these
  // routes (confirmed against Postman collection). No pagination available
  // until the backend adds it.
  VEHICLE_MAPPINGS: '/vehicle-profile-mappings',
  VEHICLE_MAPPING: '/vehicle-profile-mapping',
  VEHICLE_MAPPING_BY_ID: (id) => `/vehicle-profile-mapping/${id}`,

  // Missing Persons
  MISSING_PERSONS: '/missingpersons',
  MISSING_PERSON: '/missingperson',
  MISSING_PERSON_BY_ID: (id) => `/missingperson/${id}`,
  MISSING_PERSON_IMAGE_BY_ID: (id) => `/missingperson/${id}/image`,
  MISSING_PERSON_SEARCH: '/search/missingpersons',
  MISSING_PERSON_IMAGE_SEARCH: '/search/missingperson',
  MISSING_PERSONS_BY_OFFICER: (
    officerId,
    { page = 1, limit = 10, sortBy = 'created_at', order = 'desc' } = {}
  ) =>
    `/missingpersons/officer/${encodeURIComponent(officerId)}?page=${page}&limit=${limit}&sortBy=${sortBy}&order=${order}`,

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