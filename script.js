
const sheetId = '1fAVab8nrLB9Ee_Y4tAj0ynto9bqkRhJeTGmbhDvlcp8';
const questionLabels = ['On a scale of one to ten, with ten being Excellent and one being Poor, how would you rate your overall experience with the company', 'On a scale of 1 to 10 how satisfied are you with the installation and project management of the project?', 'On a scale of 1 to 10 how satisfied are you with the engagement and responsiveness of our Sales Team?', 'On a scale of 1 to 10 how satisfied are you with the quality and speed of our service and support?', 'On a scale of 1 to 10, how effective is Sharp’s communication with you in regard to, (clarity, timeliness, transparency)?', 'How likely are you to recommend Sharp products/experience to your colleagues?”', 'How likely are you to purchase dvLED from Sharp in the future?', 'On a scale of 1 to 10, how satisfied are you with Sharp’s dvLED product offerings (features, availability,)?', 'On a scale of 1 to 10, how would you rate the overall value Sharp provides compared to other manufacturers?', 'How would you describe your perception of Sharp’s dvLED solutions within the current market?  (e.g., quality, reliability, innovation, support)', 'Last name.1', 'Phone number', 'Email.1', 'Company.1'];

async function fetchData() {
    const url = `https://cors-anywhere.herokuapp.com/https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv`;
    const response = await fetch(url);
    const text = await response.text();
    return parseCSV(text);
}

function parseCSV(text) {
    const rows = text.split('
').map(r => r.split(','));
    const headers = rows.shift();
    return rows.filter(r => r.length === headers.length).map(row => Object.fromEntries(row.map((val, i) => [headers[i], val])));
}

function applyFilters() {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    console.log(`Filter applied from ${startDate} to ${endDate}`);
}

function calculateMetrics(data) {
    let total = 0, count = 0;
    data.forEach(row => {
        questionLabels.forEach(q => {
            const val = parseFloat(row[q]);
            if (!isNaN(val)) { total += val; count++; }
        });
    });
    const avgScore = (total / count).toFixed(2);
    document.getElementById('metric-cards').innerHTML = `<div class='metric-card'><h3>Avg Score</h3><p>${avgScore}</p></div>`;
}

function calculateRiskIndex(data) {
    let lowScores = 0, totalScores = 0;
    data.forEach(row => {
        questionLabels.forEach(q => {
            const val = parseFloat(row[q]);
            if (!isNaN(val)) {
                totalScores++;
                if (val <= 6) lowScores++;
            }
        });
    });
    const risk = ((lowScores / totalScores) * 100).toFixed(2);
    document.getElementById('riskIndex').textContent = `Risk Index: ${risk}%`;
}

function generateHeatmap(data) {
    const container = document.getElementById('heatmapGrid');
    container.innerHTML = '';
    questionLabels.forEach(q => {
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
        cell.addEventListener('click', () => showDrillDown(q, data));
        container.appendChild(cell);
    });
}

function showDrillDown(question, data) {
    const modal = document.createElement('div');
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.backgroundColor = 'rgba(0,0,0,0.7)';
    modal.style.display = 'flex';
    modal.style.justifyContent = 'center';
    modal.style.alignItems = 'center';
    modal.style.zIndex = '9999';

    const content = document.createElement('div');
    content.style.backgroundColor = '#fff';
    content.style.padding = '20px';
    content.style.borderRadius = '8px';
    content.style.maxHeight = '80%';
    content.style.overflowY = 'auto';
    content.style.width = '400px';

    const title = document.createElement('h3');
    title.textContent = `Responses for: ${question}`;
    content.appendChild(title);

    const list = document.createElement('ul');
    data.forEach(row => {
        const li = document.createElement('li');
        li.textContent = `${row[question]} (Submitted: ${row['Submitted At'] || 'N/A'})`;
        list.appendChild(li);
    });
    content.appendChild(list);

    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'Close';
    closeBtn.style.marginTop = '10px';
    closeBtn.addEventListener('click', () => modal.remove());
    content.appendChild(closeBtn);

    modal.appendChild(content);
    document.body.appendChild(modal);
}

function exportCSV() {
    fetchData().then(data => {
        const headers = Object.keys(data[0]);
        const rows = data.map(row => headers.map(h => row[h]).join(','));
        const csv = [headers.join(','), ...rows].join('
');
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
    calculateMetrics(data);
    calculateRiskIndex(data);
    generateHeatmap(data);
})();
