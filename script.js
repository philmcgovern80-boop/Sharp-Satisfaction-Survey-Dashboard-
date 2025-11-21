const sheetUrl = 'https://cors-anywhere.herokuapp.com/https://docs.google.com/spreadsheets/d/e/1bxIDnHQS2VtbTcdBwjQ06MtmPzlOISRw9V1NemHXWrc/pub?output=csv';

const questionLabels = [
  'On a scale of one to ten, with ten being Excellent and one being Poor, how would you rate your overall experience with the company',
  'On a scale of 1 to 10 how satisfied are you with the installation and project management of the project?',
  'On a scale of 1 to 10 how satisfied are you with the engagement and responsiveness of our Sales Team?',
  'On a scale of 1 to 10 how satisfied are you with the quality and speed of our service and support?',
  'On a scale of 1 to 10, how effective is Sharp’s communication with you in regard to, (clarity, timeliness, transparency)?',
  'How likely are you to recommend Sharp products/experience to your colleagues?”',
  'How likely are you to purchase dvLED from Sharp in the future?',
  'On a scale of 1 to 10, how satisfied are you with Sharp’s dvLED product offerings (features, availability,)?',
  'On a scale of 1 to 10, how would you rate the overall value Sharp provides compared to other manufacturers?'
];

async function fetchData() {
  const response = await fetch(sheetUrl);
  const text = await response.text();
  return parseCSV(text);
}

function parseCSV(text) {
  const rows = text.split('\n').map(r => r.split(','));
  const headers = rows.shift();
  return rows.filter(r => r.length === headers.length).map(row =>
    Object.fromEntries(row.map((val, i) => [headers[i], val]))
  );
}

function renderRespondentTable(data) {
  const tbody = document.querySelector('#respondentTable tbody');
  tbody.innerHTML = '';
  data.forEach(row => {
    const avgScore = calcAverage(row);
    const riskIndex = calcRisk(row);
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${row['First name']} ${row['Last name']}</td>
      <td>${row['Company']}</td>
      <td>${row['Position/Title']}</td>
      <td>${avgScore}</td>
      <td>${riskIndex}%</td>
    `;
    tbody.appendChild(tr);
  });
}

function renderPositionCards(data) {
  const positions = {};
  data.forEach(row => {
    const pos = row['Position/Title'] || 'Unknown';
    if (!positions[pos]) positions[pos] = { scores: [], risks: [], count: 0 };
    positions[pos].scores.push(calcAverage(row));
    positions[pos].risks.push(parseFloat(calcRisk(row)));
    positions[pos].count++;
  });

  const container = document.getElementById('positionCards');
  container.innerHTML = '';
  for (let pos in positions) {
    const avgScore = (positions[pos].scores.reduce((a, b) => a + b, 0) / positions[pos].scores.length).toFixed(2);
    const avgRisk = (positions[pos].risks.reduce((a, b) => a + b, 0) / positions[pos].risks.length).toFixed(2);
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <h4>${pos}</h4>
      <p>Avg Score: ${avgScore}</p>
      <p>Avg Risk: ${avgRisk}%</p>
      <p>Respondents: ${positions[pos].count}</p>
    `;
    container.appendChild(card);
  }
}

function renderTrendCharts(data) {
  const grouped = {};
  data.forEach(row => {
    const date = row['Submitted At'].split(' ')[0];
    if (!grouped[date]) grouped[date] = { scores: [], risks: [] };
    grouped[date].scores.push(calcAverage(row));
    grouped[date].risks.push(parseFloat(calcRisk(row)));
  });

  const labels = Object.keys(grouped);
  const avgScores = labels.map(d => grouped[d].scores.reduce((a, b) => a + b, 0) / grouped[d].scores.length);
  const avgRisks = labels.map(d => grouped[d].risks.reduce((a, b) => a + b, 0) / grouped[d].risks.length);

  new Chart(document.getElementById('trendScoreChart'), {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{ label: 'Avg Score', data: avgScores, borderColor: '#4caf50', fill: false }]
    }
  });

  new Chart(document.getElementById('trendRiskChart'), {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{ label: 'Risk Index', data: avgRisks, borderColor: '#f44336', fill: false }]
    }
  });
}

function calcAverage(row) {
  let total = 0, count = 0;
  questionLabels.forEach(q => {
    const val = parseFloat(row[q]);
    if (!isNaN(val)) {
      total += val;
      count++;
    }
  });
  return count ? (total / count).toFixed(2) : 0;
}

function calcRisk(row) {
  let low = 0, count = 0;
  questionLabels.forEach(q => {
    const val = parseFloat(row[q]);
    if (!isNaN(val)) {
      count++;
      if (val <= 6) low++;
    }
  });
  return count ? ((low / count) * 100).toFixed(2) : 0;
}

(async function init() {
  const data = await fetchData();
  renderRespondentTable(data);
  renderPositionCards(data);
  renderTrendCharts(data);
})();
