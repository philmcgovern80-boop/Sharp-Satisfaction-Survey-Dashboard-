const url = "https://cors-anywhere.herokuapp.com/https://docs.google.com/spreadsheets/d/1fAVab8nrLB9Ee_Y4tAj0ynto9bqkRhJeTGmbhDvlcp8/gviz/tq?tqx=out:json";
const statusBanner = document.getElementById('status-banner');
const avgScoreEl = document.getElementById('average-score');
const lowScoreBanner = document.getElementById('low-score-banner');
const lowScoreList = document.getElementById('low-score-list');

let lowScores = [];
let fallbackData = [
    { date: '2025-11-01', score: 8 },
    { date: '2025-11-02', score: 6 },
    { date: '2025-11-03', score: 4 },
    { date: '2025-11-04', score: 9 }
];

// Modal controls
function showModal() {
    document.getElementById('lowScoreModal').classList.remove('hidden');
}
function hideModal() {
    document.getElementById('lowScoreModal').classList.add('hidden');
}

// Close modal when clicking outside content
document.getElementById('lowScoreModal').addEventListener('click', function(e) {
    if (e.target === this) hideModal();
});

// Close modal on ESC key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') hideModal();
});

async function fetchData() {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Fetch failed');
        const text = await response.text();
        const json = JSON.parse(text.substr(47).slice(0, -2));
        const rows = json.table.rows;

        let scores = [];
        rows.forEach(r => {
            r.c.forEach((cell, idx) => {
                if (cell && typeof cell.v === 'number') {
                    scores.push(cell.v);
                    if (cell.v <= 5) {
                        lowScores.push({ question: json.table.cols[idx].label, score: cell.v });
                    }
                }
            });
        });

        updateDashboard(scores);
        statusBanner.textContent = 'Live Data Loaded';
        statusBanner.classList.add('live');
    } catch (error) {
        console.warn('Using fallback data:', error);
        statusBanner.textContent = 'Fallback Data Active';
        statusBanner.classList.add('fallback');
        let scores = fallbackData.map(d => d.score);
        updateDashboard(scores);
    }
}

function updateDashboard(scores) {
    const avg = (scores.reduce((a,b) => a+b, 0) / scores.length).toFixed(2);
    avgScoreEl.textContent = `Average Score: ${avg}`;

    if (lowScores.length > 0) {
        lowScoreBanner.classList.remove('hidden');
        lowScoreList.innerHTML = lowScores.map(item => `<li>${item.question}: ${item.score}</li>`).join('');
    }

    renderCharts(scores);
}

function renderCharts(scores) {
    const ctxTrend = document.getElementById('trendChart').getContext('2d');
    new Chart(ctxTrend, {
        type: 'line',
        data: {
            labels: Array.from({length: scores.length}, (_, i) => `Day ${i+1}`),
            datasets: [{ label: 'Scores Over Time', data: scores, borderColor: '#42a5f5', fill: false }]
        }
    });

    const ctxDist = document.getElementById('distributionChart').getContext('2d');
    const counts = {};
    scores.forEach(s => counts[s] = (counts[s] || 0) + 1);
    new Chart(ctxDist, {
        type: 'bar',
        data: {
            labels: Object.keys(counts),
            datasets: [{ label: 'Score Distribution', data: Object.values(counts), backgroundColor: '#66bb6a' }]
        }
    });
}

fetchData();
