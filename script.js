async function fetchData() {
    const url = `https://cors-anywhere.herokuapp.com/https://docs.google.com/spreadsheets/d/1fAVab8nrLB9Ee_Y4tAj0ynto9bqkRhJeTGmbhDvlcp8/gviz/tq?tqx=out:csv`;
    const response = await fetch(url);
    const text = await response.text();
    return parseCSV(text);
}

function parseCSV(text) {
    const rows = text.split('\n').map(r => r.split(','));
    const headers = rows.shift();
    return rows.filter(r => r.length === headers.length).map(row => Object.fromEntries(row.map((val, i) => [headers[i], val])));
}

function applyFilters() {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    console.log(`Filter applied from ${startDate} to ${endDate}`);
}

function calculateRiskIndex(data) {
    let lowScores = 0, totalScores = 0;
    data.forEach(row => {
        for (let key in row) {
            const val = parseFloat(row[key]);
            if (!isNaN(val)) {
                totalScores++;
                if (val <= 6) lowScores++;
            }
        }
    });
    const risk = ((lowScores / totalScores) * 100).toFixed(2);
    document.getElementById('riskIndex').textContent = `Risk Index: ${risk}%`;
}

function generateHeatmap(data) {
    const container = document.getElementById('heatmapGrid');
    container.innerHTML = '';
    const questions = Object.keys(data[0]).filter(k => !isNaN(parseFloat(data[0][k])));
    questions.forEach(q => {
        let sum = 0, count = 0;
        data.forEach(row => {
            const val = parseFloat(row[q]);
            if (!isNaN(val)) { sum += val; count++; }
        });
        const avg = (sum / count).toFixed(1);
        const cell = document.createElement('div');
        cell.className = 'heatmap-cell';
        const color = avg >= 8 ? '#4caf50' : avg >= 6 ? '#ff9800' : '#f44336';
        cell.style.backgroundColor = color;
        cell.textContent = `${q}: ${avg}`;
        container.appendChild(cell);
    });
}

function calculateCorrelation(data) {
    const questions = Object.keys(data[0]).filter(k => !isNaN(parseFloat(data[0][k])));
    const correlations = [];
    for (let i = 0; i < questions.length; i++) {
        for (let j = i + 1; j < questions.length; j++) {
            const x = data.map(row => parseFloat(row[questions[i]]) || 0);
            const y = data.map(row => parseFloat(row[questions[j]]) || 0);
            const corr = pearson(x, y);
            correlations.push({ pair: `${questions[i]} vs ${questions[j]}`, value: corr });
        }
    }
    renderCorrelationChart(correlations);
}

function pearson(x, y) {
    const n = x.length;
    const sumX = x.reduce((a,b) => a+b,0);
    const sumY = y.reduce((a,b) => a+b,0);
    const sumXY = x.reduce((a,b,i) => a+b*y[i],0);
    const sumX2 = x.reduce((a,b) => a+b*b,0);
    const sumY2 = y.reduce((a,b) => a+b*b,0);
    return ((n*sumXY - sumX*sumY) / Math.sqrt((n*sumX2 - sumX**2)*(n*sumY2 - sumY**2))).toFixed(2);
}

function renderCorrelationChart(correlations) {
    const ctx = document.getElementById('correlationChart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: correlations.map(c => c.pair),
            datasets: [{ label: 'Correlation', data: correlations.map(c => c.value) }]
        }
    });
}

function renderTrendChart(ctx, data) {
    const grouped = {};
    data.forEach(row => {
        const date = row['Submitted At'] ? row['Submitted At'].split(' ')[0] : 'Unknown';
        if (!grouped[date]) grouped[date] = [];
        const score = parseFloat(row[Object.keys(row)[0]]) || 0;
        grouped[date].push(score);
    });
    const labels = Object.keys(grouped);
    const values = labels.map(d => grouped[d].reduce((a,b)=>a+b,0)/grouped[d].length);
    new Chart(ctx, {
        type: 'line',
        data: { labels: labels, datasets: [{ label: 'Trend', data: values }] }
    });
}

function exportCSV() {
    fetchData().then(data => {
        const headers = Object.keys(data[0]);
        const rows = data.map(row => headers.map(h => row[h]).join(','));
        const csv = [headers.join(','), ...rows].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'dashboard_data.csv'; a.click();
    });
}

function exportPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.text('Executive Dashboard Report', 10, 10);
    doc.text(document.getElementById('riskIndex').textContent, 10, 20);
    doc.save('dashboard_report.pdf');
}

(async function init() {
    const data = await fetchData();
    calculateRiskIndex(data);
    generateHeatmap(data);
    calculateCorrelation(data);
    const trendCtx = document.getElementById('trendChart').getContext('2d');
    renderTrendChart(trendCtx, data);
})();