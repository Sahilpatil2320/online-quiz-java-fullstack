import { afterEach, describe, expect, it, vi } from 'vitest';
import { api, ApiError, tokenStore } from '../services/api';

afterEach(() => { vi.restoreAllMocks(); localStorage.clear(); });

describe('api helper', () => {
  it('turns a failed network request into a friendly error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    await expect(api.listQuizzes()).rejects.toMatchObject({ code: 'NETWORK' });
  });

  it('exposes server error code, message and field errors', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(
      JSON.stringify({ status: 400, code: 'VALIDATION_ERROR', message: 'Please correct the highlighted fields.', fieldErrors: { title: 'Title is required' } }),
      { status: 400 })));
    const err = await api.adminCreateQuiz({}).catch((e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err.fieldErrors.title).toBe('Title is required');
  });

  it('sends the bearer token and a JSON body', async () => {
    tokenStore.set('abc');
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal('fetch', fetchMock);
    await api.saveAnswer(5, 1, 2);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toMatch(/\/attempts\/5\/answers$/);
    expect(init.headers.Authorization).toBe('Bearer abc');
    expect(JSON.parse(init.body)).toEqual({ questionId: 1, optionId: 2 });
  });
});
