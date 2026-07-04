import { API_BASE_URL, ENDPOINTS } from './config';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

async function parseJSON(res) {
  const ct = res.headers.get('content-type') || '';
  return ct.includes('application/json') ? res.json().catch(() => ({})) : {};
}

async function throwIfError(res) {
  if (!res.ok) {
    const data = await parseJSON(res);
    const err = new Error(data.message || `Request failed (${res.status})`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
}

function authHeaders(extra = {}) {
  const token = localStorage.getItem('accessToken');
  if (!token) {
    console.warn('[authApi] No accessToken found in localStorage.');
  }
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Auth APIs
// ─────────────────────────────────────────────────────────────────────────────

export async function loginApi(officer_id, password) {
  const res = await fetch(`${API_BASE_URL}${ENDPOINTS.LOGIN}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ officer_id, password }),
  });
  const data = await parseJSON(res);
  if (!res.ok) {
    const err = new Error(data.message || 'Login failed');
    err.status = res.status;
    err.data = data;
    throw err;
  }
  if (data.accessToken)  localStorage.setItem('accessToken', data.accessToken);
  if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);
  localStorage.setItem('officerId', officer_id);
  return data;
}

export async function refreshTokenApi() {
  const refreshToken = localStorage.getItem('refreshToken');
  const res = await fetch(`${API_BASE_URL}${ENDPOINTS.REFRESH_TOKEN}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: refreshToken }),
  });
  const data = await parseJSON(res);
  if (!res.ok) {
    const err = new Error(data.message || 'Token refresh failed');
    err.status = res.status;
    throw err;
  }
  if (data.accessToken) localStorage.setItem('accessToken', data.accessToken);
  return data;
}

export async function logoutApi() {
  const res = await fetch(`${API_BASE_URL}${ENDPOINTS.LOGOUT}`, {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
  });
  await throwIfError(res);
  return true;
}

// ─────────────────────────────────────────────────────────────────────────────
// Logged-in Officer's Own Profile
// ─────────────────────────────────────────────────────────────────────────────

export async function getMyProfileApi() {
  const officerId = localStorage.getItem('officerId');
  if (!officerId) {
    throw new Error('No officer ID found. Please login again.');
  }
  const res = await fetch(`${API_BASE_URL}${ENDPOINTS.OFFICER_BY_ID(officerId)}`, {
    headers: authHeaders(),
  });
  const data = await parseJSON(res);
  await throwIfError(res);
  return data.data ?? data;
}

/**
 * Read ANY officer by id — GET /officer/:id
 */
export async function getOfficerByIdApi(officerId) {
  if (!officerId) throw new Error('officerId is required.');
  const res = await fetch(`${API_BASE_URL}${ENDPOINTS.OFFICER_BY_ID(officerId)}`, {
    headers: authHeaders(),
  });
  const data = await parseJSON(res);
  await throwIfError(res);
  return data.data ?? data;
}

// ─────────────────────────────────────────────────────────────────────────────
// Criminal Profile APIs
// ─────────────────────────────────────────────────────────────────────────────

export async function getCriminalsApi(opts = {}) {
  const {
    page   = 1,
    limit  = 10,
    sortBy = 'created_at',
    order  = 'desc',
  } = opts;

  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    sortBy,
    order,
  });

  const res = await fetch(`${API_BASE_URL}${ENDPOINTS.CRIMINALS}?${params.toString()}`, {
    headers: authHeaders(),
  });
  const data = await parseJSON(res);
  await throwIfError(res);

  return {
    data:  Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : [],
    total: Number(data.total ?? data.count ?? (Array.isArray(data.data) ? data.data.length : 0)),
    page:  Number(data.page ?? page),
    limit: Number(data.limit ?? limit),
  };
}

/**
 * "Read Profiles by Officer" — GET /profiles/officer/:officerId?page=&limit=&sortBy=&order=
 */
export async function getCriminalsByOfficerApi(officerId, opts = {}) {
  if (!officerId) throw new Error('officerId is required.');
  const res = await fetch(`${API_BASE_URL}${ENDPOINTS.CRIMINALS_BY_OFFICER(officerId, opts)}`, {
    headers: authHeaders(),
  });
  const data = await parseJSON(res);
  await throwIfError(res);
  return {
    data:  Array.isArray(data.data) ? data.data : [],
    total: Number(data.total ?? data.count ?? 0),
    page:  Number(data.page ?? opts.page ?? 1),
    limit: Number(data.limit ?? opts.limit ?? 10),
  };
}


export async function createCriminalApi(formData) {
  const res = await fetch(`${API_BASE_URL}${ENDPOINTS.CRIMINAL}`, {
    method: 'POST',
    headers: authHeaders(),
    body: formData,
  });
  const data = await parseJSON(res);
  await throwIfError(res);
  return data;
}

export async function updateCriminalApi(id, formData) {
  const res = await fetch(`${API_BASE_URL}${ENDPOINTS.CRIMINAL_BY_ID(id)}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: formData,
  });
  const data = await parseJSON(res);
  await throwIfError(res);
  return data;
}

export async function updateCriminalImageApi(id, formData) {
  const res = await fetch(`${API_BASE_URL}${ENDPOINTS.CRIMINAL_IMAGE_BY_ID(id)}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: formData,
  });
  const data = await parseJSON(res);
  await throwIfError(res);
  return data;
}

export async function getCriminalImageApi(id) {
  const res = await fetch(`${API_BASE_URL}${ENDPOINTS.CRIMINAL_IMAGE_BY_ID(id)}`, {
    headers: authHeaders(),
  });
  const data = await parseJSON(res);
  await throwIfError(res);
  return data.profile_image_url ?? data.criminal_image_url ?? data.image_url ?? null;
}

export async function deleteCriminalApi(criminalId) {
  const officer_id = localStorage.getItem('officerId');
  if (!officer_id) throw new Error('No officer ID found. Please login again.');

  const url = `${API_BASE_URL}${ENDPOINTS.CRIMINAL_BY_ID(criminalId)}?officer_id=${encodeURIComponent(officer_id)}`;
  const res = await fetch(url, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  await throwIfError(res);
  return true;
}

export async function searchCriminalsApi({
  set_by_officer_id = '',
  criminal_id       = '',
  criminal_name     = '',
  alert_status      = '',
  state_code        = '',
  district_code     = '',
  page  = 1,
  limit = 10,
  sortBy = 'criminal_id',
  order  = 'desc',
} = {}) {
  const params = new URLSearchParams();
  if (set_by_officer_id.trim()) params.append('set_by_officer_id', set_by_officer_id.trim());
  if (criminal_id.trim())       params.append('criminal_id',       criminal_id.trim());
  if (criminal_name.trim())     params.append('criminal_name',     criminal_name.trim());
  if (alert_status !== '')      params.append('alert_status',      alert_status);
  if (state_code.trim())        params.append('state_code',        state_code.trim());
  if (district_code.trim())     params.append('district_code',     district_code.trim());
  params.append('page', String(page));
  params.append('limit', String(limit));
  params.append('sortBy', sortBy);
  params.append('order', order);

  const url = `${API_BASE_URL}${ENDPOINTS.CRIMINAL_SEARCH}?${params.toString()}`;
  const res = await fetch(url, { headers: authHeaders() });
  const data = await parseJSON(res);
  await throwIfError(res);
  return {
    data:  Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : [],
    total: Number(data.total ?? data.count ?? (Array.isArray(data.data) ? data.data.length : 0)),
    page:  Number(data.page ?? page),
    limit: Number(data.limit ?? limit),
  };
}

export async function searchCriminalsByImageApi(formData) {
  const res = await fetch(`${API_BASE_URL}${ENDPOINTS.CRIMINAL_IMAGE_SEARCH}`, {
    method: 'POST',
    headers: authHeaders(),
    body: formData,
  });
  const data = await parseJSON(res);
  await throwIfError(res);
  return Array.isArray(data.results) ? data.results
       : Array.isArray(data.data)    ? data.data
       : Array.isArray(data)         ? data
       : [];
}

// ─────────────────────────────────────────────────────────────────────────────
// Officer APIs
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Paginated — GET /officers?page=&limit=&sortBy=&order=
 */
export async function getOfficersApi(opts = {}) {
  const {
    page   = 1,
    limit  = 10,
    sortBy = 'created_at',
    order  = 'desc',
  } = opts;

  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    sortBy,
    order,
  });

  const res = await fetch(`${API_BASE_URL}${ENDPOINTS.OFFICERS}?${params.toString()}`, {
    headers: authHeaders(),
  });
  const data = await parseJSON(res);
  await throwIfError(res);

  return {
    data:  Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : [],
    total: Number(data.total ?? data.count ?? (Array.isArray(data.data) ? data.data.length : 0)),
    page:  Number(data.page ?? page),
    limit: Number(data.limit ?? limit),
  };
}

export async function createOfficerApi(formData) {
  const res = await fetch(`${API_BASE_URL}${ENDPOINTS.OFFICER}`, {
    method: 'POST',
    headers: authHeaders(),
    body: formData,
  });
  const data = await parseJSON(res);
  await throwIfError(res);
  return data;
}

export async function updateOfficerApi(id, formData) {
  const res = await fetch(`${API_BASE_URL}${ENDPOINTS.OFFICER_BY_ID(id)}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: formData,
  });
  const data = await parseJSON(res);
  await throwIfError(res);
  return data;
}

export async function updateOfficerImageApi(id, formData) {
  const res = await fetch(`${API_BASE_URL}${ENDPOINTS.OFFICER_IMAGE_BY_ID(id)}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: formData,
  });
  const data = await parseJSON(res);
  await throwIfError(res);
  return data;
}

export async function deleteOfficerApi(officerId) {
  const res = await fetch(`${API_BASE_URL}${ENDPOINTS.OFFICER_BY_ID(officerId)}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  await throwIfError(res);
  return true;
}

export async function getOfficerImageApi(id) {
  const res = await fetch(`${API_BASE_URL}${ENDPOINTS.OFFICER_IMAGE_BY_ID(id)}`, {
    headers: authHeaders(),
  });
  const data = await parseJSON(res);
  await throwIfError(res);
  return data.officer_image_url ?? null;
}

/**
 * Paginated — GET /search/officers?...&page=&limit=&sortBy=&order=
 */
export async function searchOfficersApi({
  officer_name        = '',
  officer_surname     = '',
  officer_designation = '',
  officer_dept        = '',
  officer_hqrs        = '',
  officer_location    = '',
  page  = 1,
  limit = 10,
  sortBy = 'officer_id',
  order  = 'desc',
} = {}) {
  const params = new URLSearchParams();
  if (officer_name.trim())        params.append('officer_name',        officer_name.trim());
  if (officer_surname.trim())     params.append('officer_surname',     officer_surname.trim());
  if (officer_designation.trim()) params.append('officer_designation', officer_designation.trim());
  if (officer_dept.trim())        params.append('officer_dept',        officer_dept.trim());
  if (officer_hqrs.trim())        params.append('officer_hqrs',        officer_hqrs.trim());
  if (officer_location.trim())    params.append('officer_location',    officer_location.trim());
  params.append('page',   String(page));
  params.append('limit',  String(limit));
  params.append('sortBy', sortBy);
  params.append('order',  order);

  const url = `${API_BASE_URL}${ENDPOINTS.OFFICER_SEARCH}?${params.toString()}`;
  const res = await fetch(url, { headers: authHeaders() });
  const data = await parseJSON(res);
  await throwIfError(res);

  return {
    data:  Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : [],
    total: Number(data.total ?? data.count ?? (Array.isArray(data.data) ? data.data.length : 0)),
    page:  Number(data.page ?? page),
    limit: Number(data.limit ?? limit),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Vehicle APIs
// ─────────────────────────────────────────────────────────────────────────────

export async function getVehiclesApi(opts = {}) {
  const {
    page   = 1,
    limit  = 10,
    sortBy = 'created_at',
    order  = 'desc',
  } = opts;

  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    sortBy,
    order,
  });

  const res = await fetch(`${API_BASE_URL}${ENDPOINTS.VEHICLES}?${params.toString()}`, {
    headers: authHeaders(),
  });
  const data = await parseJSON(res);
  await throwIfError(res);

  return {
    data:  Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : [],
    total: Number(data.total ?? data.count ?? (Array.isArray(data.data) ? data.data.length : 0)),
    page:  Number(data.page ?? page),
    limit: Number(data.limit ?? limit),
  };
}

export async function getVehiclesByOfficerApi(officerId, opts = {}) {
  if (!officerId) throw new Error('officerId is required.');
  const res = await fetch(`${API_BASE_URL}${ENDPOINTS.VEHICLES_BY_OFFICER(officerId, opts)}`, {
    headers: authHeaders(),
  });
  const data = await parseJSON(res);
  await throwIfError(res);
  return {
    data:  Array.isArray(data.data) ? data.data : [],
    total: Number(data.total ?? data.count ?? 0),
    page:  Number(data.page ?? opts.page ?? 1),
    limit: Number(data.limit ?? opts.limit ?? 10),
  };
}

export async function getVehicleByIdApi(vehicleNumber) {
  const res = await fetch(`${API_BASE_URL}${ENDPOINTS.VEHICLE_BY_ID(vehicleNumber)}`, {
    headers: authHeaders(),
  });
  const data = await parseJSON(res);
  await throwIfError(res);
  return data.data ?? data;
}

export async function createVehicleApi(formData) {
  const res = await fetch(`${API_BASE_URL}${ENDPOINTS.VEHICLE}`, {
    method: 'POST',
    headers: authHeaders(),
    body: formData,
  });
  const data = await parseJSON(res);
  await throwIfError(res);
  return data;
}

export async function updateVehicleApi(id, formData) {
  const res = await fetch(`${API_BASE_URL}${ENDPOINTS.VEHICLE_BY_ID(id)}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: formData,
  });
  const data = await parseJSON(res);
  await throwIfError(res);
  return data;
}

export async function updateVehicleImageApi(id, formData) {
  const res = await fetch(`${API_BASE_URL}${ENDPOINTS.VEHICLE_IMAGE_BY_ID(id)}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: formData,
  });
  const data = await parseJSON(res);
  await throwIfError(res);
  return data;
}

export async function deleteVehicleApi(vehicleNumber) {
  const res = await fetch(`${API_BASE_URL}${ENDPOINTS.VEHICLE_BY_ID(vehicleNumber)}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  await throwIfError(res);
  return true;
}

export async function getVehicleImageApi(vehicleNumber) {
  const res = await fetch(`${API_BASE_URL}${ENDPOINTS.VEHICLE_IMAGE_BY_ID(vehicleNumber)}`, {
    headers: authHeaders(),
  });
  const data = await parseJSON(res);
  await throwIfError(res);
  return data.vehicle_image_url ?? null;
}

export async function searchVehiclesApi({
  set_by_officer   = '',
  vehicle_number   = '',
  vehicle_make     = '',
  vehicle_model    = '',
  vehicle_state    = '',
  vehicle_district = '',
  vehicle_type     = '',
  alert_status     = '',
  page  = 1,
  limit = 10,
  sortBy = 'vehicle_number',
  order  = 'desc',
} = {}) {
  const params = new URLSearchParams();
  if (set_by_officer.trim())   params.append('set_by_officer',   set_by_officer.trim());
  if (vehicle_number.trim())   params.append('vehicle_number',   vehicle_number.trim());
  if (vehicle_make.trim())     params.append('vehicle_make',     vehicle_make.trim());
  if (vehicle_model.trim())    params.append('vehicle_model',    vehicle_model.trim());
  if (vehicle_state.trim())    params.append('vehicle_state',    vehicle_state.trim());
  if (vehicle_district.trim()) params.append('vehicle_district', vehicle_district.trim());
  if (vehicle_type.trim())     params.append('vehicle_type',     vehicle_type.trim());
  if (alert_status !== '')     params.append('alert_status',     alert_status);
  params.append('page', String(page));
  params.append('limit', String(limit));
  params.append('sortBy', sortBy);
  params.append('order', order);

  const url = `${API_BASE_URL}${ENDPOINTS.VEHICLE_SEARCH}?${params.toString()}`;
  const res = await fetch(url, { headers: authHeaders() });
  const data = await parseJSON(res);
  await throwIfError(res);
  return {
    data:  Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : [],
    total: Number(data.total ?? data.count ?? (Array.isArray(data.data) ? data.data.length : 0)),
    page:  Number(data.page ?? page),
    limit: Number(data.limit ?? limit),
  };
}

export async function searchVehiclesByImageApi(formData) {
  const res = await fetch(`${API_BASE_URL}${ENDPOINTS.VEHICLE_IMAGE_SEARCH}`, {
    method: 'POST',
    headers: authHeaders(),
    body: formData,
  });
  const data = await parseJSON(res);
  await throwIfError(res);
  return Array.isArray(data.results) ? data.results
       : Array.isArray(data.data)    ? data.data
       : Array.isArray(data)         ? data
       : [];
}

// ─────────────────────────────────────────────────────────────────────────────
// Vehicle-Profile Mapping APIs
// NOTE: backend does not accept page/limit/sortBy/order on any of these routes
// (confirmed against Postman collection). Not paginated — reads everything.
// ─────────────────────────────────────────────────────────────────────────────

export async function getVehicleMappingsApi() {
  const res = await fetch(`${API_BASE_URL}${ENDPOINTS.VEHICLE_MAPPINGS}`, {
    headers: authHeaders(),
  });
  const data = await parseJSON(res);
  await throwIfError(res);
  return data.data ?? data;
}

export async function getVehicleMappingByIdApi(mappingId) {
  const res = await fetch(`${API_BASE_URL}${ENDPOINTS.VEHICLE_MAPPING_BY_ID(mappingId)}`, {
    headers: authHeaders(),
  });
  const data = await parseJSON(res);
  await throwIfError(res);
  return data.data ?? data;
}

export async function createVehicleMappingApi({ profile_id, vehicle_id, officer_id }) {
  const resolvedOfficerId = officer_id || localStorage.getItem('officerId');
  if (!resolvedOfficerId) throw new Error('No officer ID found. Please login again.');

  const res = await fetch(`${API_BASE_URL}${ENDPOINTS.VEHICLE_MAPPING}`, {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ profile_id, vehicle_id, officer_id: resolvedOfficerId }),
  });
  const data = await parseJSON(res);
  await throwIfError(res);
  return data;
}

export async function updateVehicleMappingApi(id, { profile_id, vehicle_id }) {
  const res = await fetch(`${API_BASE_URL}${ENDPOINTS.VEHICLE_MAPPING_BY_ID(id)}`, {
    method: 'PUT',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ profile_id, vehicle_id }),
  });
  const data = await parseJSON(res);
  await throwIfError(res);
  return data;
}

export async function deleteVehicleMappingApi(id) {
  const res = await fetch(`${API_BASE_URL}${ENDPOINTS.VEHICLE_MAPPING_BY_ID(id)}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  await throwIfError(res);
  return true;
}

// ─────────────────────────────────────────────────────────────────────────────
// Missing Person APIs
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Paginated — GET /missingpersons?page=&limit=&sortBy=&order=
 * Returns { data, total, page, limit } — same shape as vehicles/officers.
 */
export async function getMissingPersonsApi(opts = {}) {
  const {
    page   = 1,
    limit  = 10,
    sortBy = 'created_at',
    order  = 'desc',
  } = opts;

  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    sortBy,
    order,
  });

  const res = await fetch(`${API_BASE_URL}${ENDPOINTS.MISSING_PERSONS}?${params.toString()}`, {
    headers: authHeaders(),
  });
  const data = await parseJSON(res);
  await throwIfError(res);

  return {
    data:  Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : [],
    total: Number(data.total ?? data.count ?? (Array.isArray(data.data) ? data.data.length : 0)),
    page:  Number(data.page ?? page),
    limit: Number(data.limit ?? limit),
  };
}

/**
 * "Read Persons by Officer" — GET /missingpersons/officer/:officerId?page=&limit=&sortBy=&order=
 * Returns { data, total, page, limit }.
 */
export async function getMissingPersonsByOfficerApi(officerId, opts = {}) {
  if (!officerId) throw new Error('officerId is required.');
  const res = await fetch(`${API_BASE_URL}${ENDPOINTS.MISSING_PERSONS_BY_OFFICER(officerId, opts)}`, {
    headers: authHeaders(),
  });
  const data = await parseJSON(res);
  await throwIfError(res);
  return {
    data:  Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : [],
    total: Number(data.total ?? data.count ?? (Array.isArray(data.data) ? data.data.length : 0)),
    page:  Number(data.page ?? opts.page ?? 1),
    limit: Number(data.limit ?? opts.limit ?? 10),
  };
}

export async function getMissingPersonByIdApi(id) {
  const res = await fetch(`${API_BASE_URL}${ENDPOINTS.MISSING_PERSON_BY_ID(id)}`, {
    headers: authHeaders(),
  });
  const data = await parseJSON(res);
  await throwIfError(res);
  return data.data ?? data;
}

export async function createMissingPersonApi(formData) {
  const res = await fetch(`${API_BASE_URL}${ENDPOINTS.MISSING_PERSON}`, {
    method: 'POST',
    headers: authHeaders(),
    body: formData,
  });
  const data = await parseJSON(res);
  await throwIfError(res);
  return data;
}

export async function updateMissingPersonApi(id, formData) {
  const res = await fetch(`${API_BASE_URL}${ENDPOINTS.MISSING_PERSON_BY_ID(id)}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: formData,
  });
  const data = await parseJSON(res);
  await throwIfError(res);
  return data;
}

export async function updateMissingPersonImageApi(id, formData) {
  const res = await fetch(`${API_BASE_URL}${ENDPOINTS.MISSING_PERSON_IMAGE_BY_ID(id)}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: formData,
  });
  const data = await parseJSON(res);
  await throwIfError(res);
  return data;
}

export async function getMissingPersonImageApi(id) {
  const res = await fetch(`${API_BASE_URL}${ENDPOINTS.MISSING_PERSON_IMAGE_BY_ID(id)}`, {
    headers: authHeaders(),
  });
  const data = await parseJSON(res);
  await throwIfError(res);
  return data.person_image_url ?? data.image_url ?? null;
}

export async function deleteMissingPersonApi(id) {
  const res = await fetch(`${API_BASE_URL}${ENDPOINTS.MISSING_PERSON_BY_ID(id)}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  await throwIfError(res);
  return true;
}

/**
 * Paginated — GET /search/missingpersons?...&page=&limit=&sortBy=&order=
 * Returns { data, total, page, limit }.
 */
export async function searchMissingPersonsApi({
  person_name    = '',
  person_mobile  = '',
  alert_status   = '',
  state_code     = '',
  district_code  = '',
  page  = 1,
  limit = 10,
  sortBy = 'person_name',
  order  = 'desc',
} = {}) {
  const params = new URLSearchParams();
  if (person_name.trim())    params.append('person_name',    person_name.trim());
  if (person_mobile.trim())  params.append('person_mobile',  person_mobile.trim());
  if (alert_status !== '')   params.append('alert_status',   alert_status);
  if (state_code.trim())     params.append('state_code',     state_code.trim());
  if (district_code.trim())  params.append('district_code',  district_code.trim());
  params.append('page',   String(page));
  params.append('limit',  String(limit));
  params.append('sortBy', sortBy);
  params.append('order',  order);

  const url = `${API_BASE_URL}${ENDPOINTS.MISSING_PERSON_SEARCH}?${params.toString()}`;
  const res = await fetch(url, { headers: authHeaders() });
  const data = await parseJSON(res);
  await throwIfError(res);

  return {
    data:  Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : [],
    total: Number(data.total ?? data.count ?? (Array.isArray(data.data) ? data.data.length : 0)),
    page:  Number(data.page ?? page),
    limit: Number(data.limit ?? limit),
  };
}

/**
 * Paginated — POST /search/missingperson (multipart, topK + page/limit/sortBy/order in body)
 * Returns { data, total, page, limit }.
 */
export async function searchMissingPersonsByImageApi(formData, opts = {}) {
  const {
    page  = 1,
    limit = 10,
    sortBy = 'created_at',
    order  = 'desc',
  } = opts;

  // Ensure pagination fields are present on the outgoing form data
  if (formData instanceof FormData) {
    if (!formData.has('page'))   formData.append('page', String(page));
    if (!formData.has('limit'))  formData.append('limit', String(limit));
    if (!formData.has('sortBy')) formData.append('sortBy', sortBy);
    if (!formData.has('order'))  formData.append('order', order);
  }

  const res = await fetch(`${API_BASE_URL}${ENDPOINTS.MISSING_PERSON_IMAGE_SEARCH}`, {
    method: 'POST',
    headers: authHeaders(),
    body: formData,
  });
  const data = await parseJSON(res);
  await throwIfError(res);

  const results = Array.isArray(data.results) ? data.results
                 : Array.isArray(data.data)    ? data.data
                 : Array.isArray(data)         ? data
                 : [];

  return {
    data:  results,
    total: Number(data.total ?? data.count ?? results.length),
    page:  Number(data.page ?? page),
    limit: Number(data.limit ?? limit),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// States & Districts APIs
// ─────────────────────────────────────────────────────────────────────────────

export async function getStatesApi() {
  const res = await fetch(`${API_BASE_URL}${ENDPOINTS.STATES}`, {
    headers: authHeaders(),
  });
  const data = await parseJSON(res);
  await throwIfError(res);
  return data.data ?? data;
}

export async function getDistrictsByStateApi(stateCode) {
  const res = await fetch(`${API_BASE_URL}${ENDPOINTS.DISTRICTS_BY_STATE(stateCode)}`, {
    headers: authHeaders(),
  });
  const data = await parseJSON(res);
  await throwIfError(res);
  return data.data ?? data;
}