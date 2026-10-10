const form = document.getElementById('riskForm');
const button = document.getElementById('predictBtn');
const errorMessage = document.getElementById('errorMessage');
const emptyState = document.getElementById('emptyState');
const resultContent = document.getElementById('resultContent');
const riskBadge = document.getElementById('riskBadge');
const scoreRing = document.getElementById('scoreRing');
const probabilityText = document.getElementById('probabilityText');
const probabilityMetric = document.getElementById('probabilityMetric');
const thresholdMetric = document.getElementById('thresholdMetric');
const thresholdMarker = document.getElementById('thresholdMarker');
const probabilityMarker = document.getElementById('probabilityMarker');
const decisionTitle = document.getElementById('decisionTitle');
const decisionText = document.getElementById('decisionText');
const track = document.querySelector('.track');

const number = (id) => Number(document.getElementById(id).value);

function formData() {
  return {
    person_age: number('person_age'),
    person_income: number('person_income'),
    person_home_ownership: document.getElementById('person_home_ownership').value,
    person_emp_length: number('person_emp_length'),
    loan_intent: document.getElementById('loan_intent').value,
    loan_grade: document.getElementById('loan_grade').value,
    loan_amnt: number('loan_amnt'),
    loan_int_rate: number('loan_int_rate'),
    loan_percent_income: number('loan_percent_income'),
    cb_person_default_on_file: document.getElementById('cb_person_default_on_file').value,
    cb_person_cred_hist_length: number('cb_person_cred_hist_length')
  };
}

function validate(data) {
  if (!Number.isFinite(data.person_age) || data.person_age < 18 || data.person_age > 100) return 'Age must be between 18 and 100.';
  if (!Number.isFinite(data.person_income) || data.person_income <= 0) return 'Enter a valid annual income.';
  if (!Number.isFinite(data.person_emp_length) || data.person_emp_length < 0) return 'Employment length cannot be negative.';
  if (!Number.isFinite(data.loan_amnt) || data.loan_amnt <= 0) return 'Enter a valid loan amount.';
  if (!Number.isFinite(data.loan_int_rate) || data.loan_int_rate < 0 || data.loan_int_rate > 100) return 'Interest rate must be between 0 and 100%.';
  if (!Number.isFinite(data.loan_percent_income) || data.loan_percent_income <= 0 || data.loan_percent_income > 1) return 'Loan/income ratio must be between 0 and 1.';
  if (!Number.isFinite(data.cb_person_cred_hist_length) || data.cb_person_cred_hist_length < 0) return 'Enter a valid credit history length.';
  return '';
}

function setLoading(isLoading) {
  button.classList.toggle('loading', isLoading);
  button.disabled = isLoading;
}

function animateNumber(from, to, duration, update) {
  const start = performance.now();
  const frame = (now) => {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    update(from + (to - from) * eased);
    if (progress < 1) requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

function showResult(result) {
  const probability = Math.max(0, Math.min(1, Number(result.default_probability)));
  const threshold = Math.max(0, Math.min(1, Number(result.threshold)));
  const isHigh = Number(result.default_prediction) === 1 || result.Result === 'High Risk';
  const percent = probability * 100;
  const thresholdPercent = threshold * 100;

  emptyState.classList.add('hidden');
  resultContent.classList.remove('hidden');
  riskBadge.textContent = isHigh ? 'HIGH RISK' : 'LOW RISK';
  riskBadge.classList.toggle('high', isHigh);
  scoreRing.classList.toggle('high', isHigh);
  decisionTitle.textContent = isHigh ? 'High Risk' : 'Low Risk';
  decisionText.textContent = isHigh
    ? 'The estimated default probability is at or above the optimized decision threshold.'
    : 'The estimated default probability is below the optimized decision threshold.';

  const root = document.documentElement;
  root.style.setProperty('--prob', `${percent}%`);
  root.style.setProperty('--threshold', `${thresholdPercent}%`);
  thresholdMarker.style.left = `${thresholdPercent}%`;
  probabilityMarker.style.left = `${percent}%`;

  animateNumber(0, percent, 900, value => {
    probabilityText.textContent = `${value.toFixed(1)}%`;
    probabilityMetric.textContent = `${value.toFixed(2)}%`;
    scoreRing.style.setProperty('--progress', `${value * 3.6}deg`);
  });
  animateNumber(0, thresholdPercent, 700, value => {
    thresholdMetric.textContent = `${value.toFixed(2)}%`;
  });

  // Keep the progress track in sync after the animation starts.
  track.style.setProperty('--prob', `${percent}%`);
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  errorMessage.textContent = '';

  let data;
  try { data = formData(); } catch { errorMessage.textContent = 'Please check the form values.'; return; }
  const validationError = validate(data);
  if (validationError) { errorMessage.textContent = validationError; return; }

  setLoading(true);
  try {
    const response = await fetch('/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    const payload = await response.json();
    if (!response.ok) {
      const detail = Array.isArray(payload.detail) ? payload.detail[0]?.msg : payload.detail;
      throw new Error(detail || 'The API could not process this application.');
    }
    showResult(payload);
    document.getElementById('resultCard').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  } catch (error) {
    errorMessage.textContent = error.message || 'Unable to reach the prediction API.';
  } finally {
    setLoading(false);
  }
});
