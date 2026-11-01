// One place that talks to the Spring Boot backend.
const BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api').replace(/\/$/, '');
const TOKEN_KEY = 'sqrock_quiz_token';

// The token is only a "key" for the server; the server decides who you are and what you may do.
export const tokenStore = {
  get: () => {
    try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
  },
  set: (token) => {
    try { localStorage.setItem(TOKEN_KEY, token); } catch { /* storage unavailable */ }
  },
  clear: () => {
    try { localStorage.removeItem(TOKEN_KEY); } catch { /* storage unavailable */ }
  },
};

export class ApiError extends Error {
  constructor(message, { status = 0, code = 'ERROR', fieldErrors = null } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.fieldErrors = fieldErrors;
  }
}

let unauthorizedHandler = null;
export function setUnauthorizedHandler(fn) {
  unauthorizedHandler = fn;
}

async function request(path, { method = 'GET', body, auth = true, signal } = {}) {
  const headers = { Accept: 'application/json' };
  const token = tokenStore.get();
  if (auth && token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch (err) {
    if (err?.name === 'AbortError') throw err;
    throw new ApiError(
      'Cannot reach the server. Check your internet connection and make sure the backend is running.',
      { code: 'NETWORK' },
    );
  }

  if (response.status === 204) return null;

  let data = null;
  const text = await response.text();
  if (text) {
    try { data = JSON.parse(text); } catch { data = null; }
  }

  if (!response.ok) {
    if (response.status === 401 && auth && token && unauthorizedHandler) unauthorizedHandler();
    const fallback = response.status >= 500
      ? 'The server ran into a problem. Please try again in a moment.'
      : `Request failed (${response.status}).`;
    throw new ApiError(data?.message || fallback, {
      status: response.status,
      code: data?.code || 'ERROR',
      fieldErrors: data?.fieldErrors || null,
    });
  }
  return data;
}

export const api = {
  health: () => request('/health', { auth: false }),

  // auth
  register: (payload) => request('/auth/register', { method: 'POST', body: payload, auth: false }),
  login: (payload) => request('/auth/login', { method: 'POST', body: payload, auth: false }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  me: () => request('/auth/me'),

  // public quizzes
  listQuizzes: () => request('/quizzes', { auth: false }),
  getInstructions: (id) => request(`/quizzes/${id}/instructions`, { auth: false }),

  // attempts
  startAttempt: (quizId) => request('/attempts', { method: 'POST', body: { quizId } }),
  getAttemptQuestions: (attemptId) => request(`/attempts/${attemptId}/questions`),
  saveAnswer: (attemptId, questionId, optionId) =>
    request(`/attempts/${attemptId}/answers`, { method: 'PUT', body: { questionId, optionId } }),
  submitAttempt: (attemptId, answers) =>
    request(`/attempts/${attemptId}/submit`, { method: 'POST', body: { answers } }),
  getResult: (attemptId) => request(`/attempts/${attemptId}/result`),
  getReview: (attemptId) => request(`/attempts/${attemptId}/review`),
  myAttempts: (page = 0, size = 8) => request(`/attempts/mine?page=${page}&size=${size}`),

  // admin
  adminListQuizzes: () => request('/admin/quizzes'),
  adminGetQuiz: (id) => request(`/admin/quizzes/${id}`),
  adminCreateQuiz: (payload) => request('/admin/quizzes', { method: 'POST', body: payload }),
  adminUpdateQuiz: (id, payload) => request(`/admin/quizzes/${id}`, { method: 'PUT', body: payload }),
  adminDeleteQuiz: (id) => request(`/admin/quizzes/${id}`, { method: 'DELETE' }),
  adminSetPublished: (id, published) =>
    request(`/admin/quizzes/${id}/publish`, { method: 'PATCH', body: { published } }),
  adminAddQuestion: (quizId, payload) =>
    request(`/admin/quizzes/${quizId}/questions`, { method: 'POST', body: payload }),
  adminUpdateQuestion: (id, payload) => request(`/admin/questions/${id}`, { method: 'PUT', body: payload }),
  adminDeleteQuestion: (id) => request(`/admin/questions/${id}`, { method: 'DELETE' }),
};
