import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../services/api', () => ({
  api: {
    getAttemptQuestions: vi.fn(),
    saveAnswer: vi.fn(),
    submitAttempt: vi.fn(),
    getResult: vi.fn(),
  },
  tokenStore: { get: () => null, set: () => {}, clear: () => {} },
  setUnauthorizedHandler: () => {},
}));

import { api } from '../services/api';
import QuizAttemptPage from '../pages/QuizAttemptPage';
import ResultPage from '../pages/ResultPage';

const future = () => new Date(Date.now() + 10 * 60 * 1000).toISOString();

const attemptData = (overrides = {}) => ({
  attemptId: 7, quizId: 1, quizTitle: 'Java Fundamentals',
  startedAt: new Date().toISOString(), deadlineAt: future(), serverTime: new Date().toISOString(),
  answers: [],
  questions: [1, 2, 3].map((n) => ({
    id: n, number: n, text: `Question text ${n}`, topic: 'T',
    options: [1, 2, 3, 4].map((o) => ({ id: n * 10 + o, text: `Option ${n}-${o}` })),
  })),
  ...overrides,
});

function renderAttempt() {
  return render(
    <MemoryRouter initialEntries={['/attempt/7']}>
      <Routes>
        <Route path="/attempt/:attemptId" element={<QuizAttemptPage />} />
        <Route path="/results/:attemptId" element={<div>RESULT PAGE</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  api.saveAnswer.mockResolvedValue(null);
  api.submitAttempt.mockResolvedValue({});
  api.getAttemptQuestions.mockResolvedValue(attemptData());
});

describe('quiz attempt page', () => {
  it('keeps answers while navigating, updates progress, supports clear and mark for review', async () => {
    const user = userEvent.setup();
    renderAttempt();

    expect(await screen.findByText('Question text 1')).toBeInTheDocument();
    expect(screen.getByText('Question 1 of 3')).toBeInTheDocument();
    expect(screen.getByTestId('answered-count')).toHaveTextContent('0 / 3');

    await user.click(screen.getByLabelText(/Option 1-2/));
    expect(api.saveAnswer).toHaveBeenCalledWith('7', 1, 12);
    expect(screen.getByTestId('answered-count')).toHaveTextContent('1 / 3');

    await user.click(screen.getByRole('button', { name: /^Next/ }));
    expect(screen.getByText('Question text 2')).toBeInTheDocument();
    await user.click(screen.getByLabelText(/Option 2-4/));
    await user.click(screen.getByRole('button', { name: /Mark for review/ }));
    expect(screen.getByRole('button', { name: /Unmark review/ })).toHaveAttribute('aria-pressed', 'true');

    // go back: first answer is still selected
    await user.click(screen.getByRole('button', { name: /Previous/ }));
    expect(screen.getByLabelText(/Option 1-2/)).toBeChecked();

    // clear it
    await user.click(screen.getByRole('button', { name: /Clear answer/ }));
    expect(screen.getByLabelText(/Option 1-2/)).not.toBeChecked();
    expect(api.saveAnswer).toHaveBeenLastCalledWith('7', 1, null);
    expect(screen.getByTestId('answered-count')).toHaveTextContent('1 / 3');

    // palette shows state of question 2 (answered + marked)
    expect(screen.getByRole('button', { name: /Question 2, answered, marked for review/ })).toBeInTheDocument();
  });

  it('asks for confirmation, submits the answers once and opens the result page', async () => {
    const user = userEvent.setup();
    renderAttempt();
    await screen.findByText('Question text 1');
    await user.click(screen.getByLabelText(/Option 1-1/));

    await user.click(screen.getByRole('button', { name: /Submit Quiz/ }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText(/2 unanswered question/)).toBeInTheDocument();
    expect(api.submitAttempt).not.toHaveBeenCalled();

    const confirm = within(dialog).getByRole('button', { name: /Yes, submit/ });
    await user.dblClick(confirm);                      // double click must not submit twice
    await waitFor(() => expect(screen.getByText('RESULT PAGE')).toBeInTheDocument());
    expect(api.submitAttempt).toHaveBeenCalledTimes(1);
    expect(api.submitAttempt).toHaveBeenCalledWith('7', [{ questionId: 1, optionId: 11 }]);
  });

  it('submits automatically when the server deadline has passed', async () => {
    api.getAttemptQuestions.mockResolvedValue(attemptData({
      deadlineAt: new Date(Date.now() - 1000).toISOString(),
    }));
    renderAttempt();
    await waitFor(() => expect(screen.getByText('RESULT PAGE')).toBeInTheDocument());
    expect(api.submitAttempt).toHaveBeenCalledTimes(1);
  });

  it('opens the result page when the server says the attempt already ended', async () => {
    api.getAttemptQuestions.mockRejectedValue(Object.assign(new Error('expired'), { code: 'ATTEMPT_EXPIRED' }));
    renderAttempt();
    await waitFor(() => expect(screen.getByText('RESULT PAGE')).toBeInTheDocument());
  });

  it('shows a friendly error when the backend cannot be reached', async () => {
    api.getAttemptQuestions.mockRejectedValue(Object.assign(new Error('Cannot reach the server.'), { code: 'NETWORK' }));
    renderAttempt();
    expect(await screen.findByText(/Cannot reach the server/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Try again/ })).toBeInTheDocument();
  });

  it('restores answers that were already saved on the server', async () => {
    api.getAttemptQuestions.mockResolvedValue(attemptData({ answers: [{ questionId: 1, optionId: 13 }] }));
    renderAttempt();
    await screen.findByText('Question text 1');
    expect(screen.getByLabelText(/Option 1-3/)).toBeChecked();
    expect(screen.getByTestId('answered-count')).toHaveTextContent('1 / 3');
  });
});

describe('result page', () => {
  it('shows exactly what the server returned', async () => {
    api.getResult.mockResolvedValue({
      attemptId: 7, quizId: 1, quizTitle: 'Java Fundamentals', status: 'SUBMITTED', score: 6, maxScore: 8,
      percentage: 75, correct: 6, incorrect: 1, unanswered: 1, timeTakenSeconds: 125,
      submittedAt: new Date().toISOString(), performanceMessage: 'Excellent work!',
      topics: [{ topic: 'OOP', correct: 2, total: 3, percentage: 66.67 }],
    });
    render(
      <MemoryRouter initialEntries={['/results/7']}>
        <Routes><Route path="/results/:attemptId" element={<ResultPage />} /></Routes>
      </MemoryRouter>,
    );
    expect(await screen.findByText('Quiz completed')).toBeInTheDocument();
    expect(screen.getByText('Excellent work!')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /Score: 75%/ })).toBeInTheDocument();
    expect(screen.getByText('2 min 5s')).toBeInTheDocument();
    expect(screen.getByText('OOP')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Review Answers/ })).toHaveAttribute('href', '/results/7/review');
  });
});
