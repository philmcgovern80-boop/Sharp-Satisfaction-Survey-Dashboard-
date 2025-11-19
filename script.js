const url = "https://cors-anywhere.herokuapp.com/https://docs.google.com/spreadsheets/d/1fAVab8nrLB9Ee_Y4tAj0ynto9bqkRhJeTGmbhDvlcp8/gviz/tq?tqx=out:json";
const statusBanner = document.getElementById('status-banner');
const avgScoreCard = document.getElementById('avg-score-card');
const lowScoreCard = document.getElementById('low-score-card');
const topQuestionsCard = document.getElementById('top-questions-card');
const bottomQuestionsCard = document.getElementById('bottom-questions-card');
const questionFilter = document.getElementById('questionFilter');
const tableHeader = document.getElementById('tableHeader');
const tableBody = document.getElementById('tableBody');

let allData = [];
let lowScores = [];

async function fetchData() {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Fetch failed');
        const text = await response.text();
        const json = JSON.parse(text.substr(47).slice(0, -2));
        const cols = json.table.cols.map(c => c.label);
        const rows = json.table.rows;

        allData = rows.map(r => r.c.map(cell => cell ? cell.v : ''));
        renderTable(cols, allData);
        populateQuestionFilter(cols);
        processMetrics(cols, allData);
        renderCharts(allData);

        statusBanner.textContent = 'Live Data Loaded';
        statusBanner.classList.add('live');
    } catch (error) {
        console.warn('Using fallback data:', error);
        statusBanner.textContent = 'Fallback Data Active';
        statusBanner.classList.add('fallback');
        allData = [['Date','Q1','Q2'],['2025-11-01',8,6],['2025-11-02',9,4]];
        renderTable(['Date','Q1','Q2'], allData);
        populateQuestionFilter(['Q1','Q2']);
        processMetrics(['Q1','Q2'], allData);
        renderCharts(allData);
    }
}

function renderTable(cols, data) {
    tableHeader.innerHTML = cols.map(c => `<th>${c}</th>`).join('');
    tableBody.innerHTML = data.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('');
}

function populateQuestionFilter(cols) {
    questionFilter.innerHTML = '<option value="">All Questions</option>' + cols.slice(1).map(c => `<option value="${c}">${c}</option>`).join('');
}

function processMetrics(cols, data) {
    let scores = [];
    let questionScores = {};
    data.slice(1).forEach(row => {
        row.slice(1).forEach((score, idx) => {
            if (typeof score === 'number') {
                scores.push(score);
                const q = cols[idx+1];
                questionScores[q] = questionScores[q] || [];
                questionScores[q].push(score);
                if (score <= 5) lowScores.push({ question: q, score });
            }
        });
    });
    const avg = (scores.reduce((a,b)=>a+b,0)/scores.length).toFixed(2);
    avgScoreCard.textContent = `Average Score: ${avg}`;
    lowScoreCard.textContent = `Low Scores: ${lowScores.length}`;
    const sortedQuestions = Object.entries(questionScores).map(([q,arr])=>[q,(arr.reduce((a,b)=>a+b,0)/arr.length)]).sort((a,b)=>b[1]-a[1]);
    topQuestionsCard.textContent = `Top: ${sortedQuestions.slice(0,3).map(q=>q[0]).join(', ')}`;
    bottomQuestionsCard.textContent = `Bottom: ${sortedQuestions.slice(-3).map(q=>q[0]).join(', ')}`;
}

function renderCharts(data) {
    const scores = data.slice(1).map(row => row.slice(1).reduce((a,b)=>typeof b==='number'?a+b:a,0)/ (row.length-1));
    const ctxOverall = document.getElementById('overallTrendChart').getContext('2d');
    new Chart(ctxOverall, {
        type: 'line',
        data: {
            labels: data.slice(1).map(row => row[0]),
            datasets: [{ label: 'Overall Trend', data: scores, borderColor: '#42a5f5', fill: false }]
        }
    });
}

function applyFilters() {
    alert('Filter logic placeholder - can be implemented for date range and question');
}

fetchData();
