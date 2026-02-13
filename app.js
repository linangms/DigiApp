// DigiApp Logic (V2)

// State
let assessments = [];
let referenceData = []; // [{ DEPT, SUBJ_CODE, COURSE_SITE_ID, ... }]

// DOM Elements
const form = document.getElementById('assessmentForm');
const tableBody = document.querySelector('#assessmentTable tbody');
const searchInput = document.getElementById('searchInput');
const exportBtn = document.getElementById('exportBtn');
const refDataInput = document.getElementById('refDataInput');
const emptyState = document.getElementById('emptyState');
const toggleFormHeader = document.getElementById('toggleFormHeader');
const formChevron = document.getElementById('formChevron');
const dashboardSection = document.getElementById('dashboardSection');

// Selects
const schoolSelect = document.getElementById('schoolSelect');
const courseSelect = document.getElementById('courseSelect');
const courseIdSelect = document.getElementById('courseIdSelect');

// Dashboard Elements
const coverageStat = document.getElementById('coverageStat');
const totalStat = document.getElementById('totalStat');
// Breakdown Elements Removed
// const breakdownTableBody = document.querySelector('#breakdownTable tbody');
// const breakdownSchoolFilter = document.getElementById('breakdownSchoolFilter');

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    loadData();

    // Event Listeners
    form.addEventListener('submit', handleAdd);
    searchInput.addEventListener('input', handleSearch);
    exportBtn.addEventListener('click', handleExport);
    toggleFormHeader.addEventListener('click', toggleForm);

    refDataInput.addEventListener('change', handleRefDataUpload);

    // Cascading Dropdowns
    schoolSelect.addEventListener('change', handleSchoolChange);
    courseSelect.addEventListener('change', handleCourseChange);

    // Filter Listener
    // Filter Listener Removed
    // breakdownSchoolFilter.addEventListener('change', updateDashboard);

    lucide.createIcons();
});

// --- State Management ---

async function loadData() {
    try {
        // Assessments
        const assessmentsRes = await fetch('/api/assessments');
        if (assessmentsRes.ok) {
            assessments = await assessmentsRes.json();
        }

        // Reference Data
        const refRes = await fetch('/api/refdata');
        if (refRes.ok) {
            referenceData = await refRes.json();
            populateSchoolDropdown();
            updateDashboard();
            if (referenceData.length > 0) {
                dashboardSection.classList.remove('hidden');
            }
        }

        renderTable(assessments);
    } catch (err) {
        console.error('Error loading data:', err);
    }
}

// function saveAssessments() removed - using granular API calls


async function saveRefData() {
    try {
        await fetch('/api/refdata', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(referenceData)
        });
    } catch (err) {
        console.error('Error saving reference data:', err);
        alert('Failed to save reference data!');
    }
}

// --- Logic: Ref Data & Cascading Dropdowns ---

function handleRefDataUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // Parse JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        // Validate columns
        if (jsonData.length > 0 && (!jsonData[0].DEPT || !jsonData[0].SUBJ_CODE)) {
            alert('Invalid Spreadsheet Format! Expected columns: DEPT, SUBJ_CODE, COURSE_SITE_ID');
            return;
        }

        referenceData = jsonData;
        saveRefData();

        alert(`Successfully uploaded ${referenceData.length} records.`);
        populateSchoolDropdown();
        dashboardSection.classList.remove('hidden');
        updateDashboard();
    };
    reader.readAsArrayBuffer(file);
}

function populateSchoolDropdown() {
    // Get unique DEPTs
    const schools = [...new Set(referenceData.map(item => item.DEPT))].sort();

    schoolSelect.innerHTML = '<option value="">-- Select School --</option>';
    schools.forEach(school => {
        const opt = document.createElement('option');
        opt.value = school;
        opt.textContent = school;
        schoolSelect.appendChild(opt);
    });
}

function handleSchoolChange() {
    const selectedSchool = schoolSelect.value;

    // Reset Child Dropdowns
    courseSelect.innerHTML = '<option value="">-- Select Course (Subject) --</option>';
    courseIdSelect.innerHTML = '<option value="">-- Select Course Site ID --</option>';
    courseSelect.disabled = true;
    courseIdSelect.disabled = true;

    if (!selectedSchool) return;

    // Filter Courses for School
    const possibleCourses = [...new Set(
        referenceData
            .filter(item => item.DEPT === selectedSchool)
            .map(item => item.SUBJ_CODE)
            .sort()
    )];

    possibleCourses.forEach(course => {
        const opt = document.createElement('option');
        opt.value = course;
        opt.textContent = course;
        courseSelect.appendChild(opt);
    });

    courseSelect.disabled = false;
}

function handleCourseChange() {
    const selectedCourse = courseSelect.value;
    const selectedSchool = schoolSelect.value; // Need this to be strict

    // Reset Child Dropdown
    courseIdSelect.innerHTML = '<option value="">-- Select Course Site ID --</option>';
    courseIdSelect.disabled = true;

    if (!selectedCourse) return;

    // Filter IDs for Course + School
    const possibleIds = referenceData
        .filter(item => item.DEPT === selectedSchool && item.SUBJ_CODE === selectedCourse)
        .map(item => item.COURSE_SITE_ID)
        .sort();

    possibleIds.forEach(id => {
        const opt = document.createElement('option');
        opt.value = id;
        opt.textContent = id;
        courseIdSelect.appendChild(opt);
    });

    courseIdSelect.disabled = false;
}

// --- Logic: Core ---

function toggleForm() {
    form.classList.toggle('hidden-content');
    if (form.classList.contains('hidden-content')) {
        formChevron.style.transform = 'rotate(0deg)';
    } else {
        formChevron.style.transform = 'rotate(180deg)';
    }
}


async function handleAdd(e) {
    e.preventDefault();
    const formData = new FormData(form);

    const questionTypes = [];
    document.querySelectorAll('input[name="qType"]:checked').forEach((checkbox) => {
        questionTypes.push(checkbox.value);
    });

    const newAssessment = {
        id: crypto.randomUUID(),
        school: formData.get('school'),
        course: formData.get('course'),
        courseId: formData.get('courseId'),
        semester: formData.get('semester'),
        instructorName: formData.get('instructorName'),
        instructorEmail: formData.get('instructorEmail'),
        studentCount: formData.get('studentCount'),
        examWeek: formData.get('examWeek'),
        examDate: formData.get('examDate'),
        venue: formData.get('venue'),
        venueBooked: formData.get('venueBooked') === 'on',
        openBook: formData.get('openBook') === 'on',

        firstContact: false,
        demoTraining: false,
        mockSetup: false,
        mockTest: false,
        approved: false,
        confirmed: false,

        platform: formData.get('platform'),
        questionTypes: questionTypes,
        remarks: formData.get('remarks'),
        createdAt: new Date().toISOString()
    };

    try {
        const res = await fetch('/api/assessments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newAssessment)
        });

        if (res.ok) {
            const savedItem = await res.json();
            assessments.unshift(savedItem);
            renderTable(assessments);
            updateDashboard();
            form.reset();
            toggleForm();
        } else {
            alert('Failed to save!');
        }
    } catch (err) {
        console.error(err);
        alert('Error saving assessment');
    }
}

async function handleDelete(id) {
    if (confirm('Are you sure you want to delete this assessment?')) {
        try {
            const res = await fetch(`/api/assessments/${id}`, { method: 'DELETE' });
            if (res.ok) {
                assessments = assessments.filter(a => a.id !== id);
                renderTable(assessments);
                updateDashboard();
            } else {
                alert('Failed to delete');
            }
        } catch (err) {
            console.error(err);
            alert('Error deleting assessment');
        }
    }
}

function handleSearch(e) {
    const term = e.target.value.toLowerCase();
    const filtered = assessments.filter(a =>
        a.school.toLowerCase().includes(term) ||
        a.course.toLowerCase().includes(term) ||
        a.courseId.toLowerCase().includes(term) ||
        a.instructorName.toLowerCase().includes(term)
    );
    renderTable(filtered);
}

function handleExport() {
    if (assessments.length === 0) {
        alert('No data to export!');
        return;
    }

    const exportData = assessments.map(a => ({
        School: a.school,
        Course: a.course,
        'Course ID': a.courseId,
        Semester: a.semester,
        Instructor: a.instructorName,
        Email: a.instructorEmail,
        Students: a.studentCount,
        'Exam Week': a.examWeek,
        'Exam Date': a.examDate,
        'First Contact': a.firstContact ? 'Yes' : 'No',
        'Demo/Training': a.demoTraining ? 'Yes' : 'No',
        'Mock Setup': a.mockSetup ? 'Yes' : 'No',
        'Mock Test': a.mockTest ? 'Yes' : 'No',
        'Approved': a.approved ? 'Yes' : 'No',
        'Venue Booked': a.venueBooked ? 'Yes' : 'No',
        'Confirmed': a.confirmed ? 'Yes' : 'No',
        Platform: a.platform || '',
        'Question Types': a.questionTypes.join(', '),
        Status: a.status,
        Remarks: a.remarks
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Assessments");

    const dateStr = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `DigiApp_Assessments_${dateStr}.xlsx`);
}

// --- Logic: Dashboard & Modal ---

// DOM Elements for New Stats
const totalCoursesStat = document.getElementById('totalCoursesStat');
const onboardedStat = document.getElementById('onboardedStat');
const totalSitesStat = document.getElementById('totalSitesStat');

// Modal Elements
const statusModal = document.getElementById('statusModal');
const modalTitle = document.getElementById('modalTitle');
const statusEditTableBody = document.querySelector('#statusEditTable tbody');

let statusChartInstance = null;
let platformChartInstance = null;

function updateDashboard() {
    if (referenceData.length === 0) return;

    // 1. Logic for 4 Cards
    // Total Courses (Total Unique SUBJ_CODE in RefData)
    const totalRefCourses = new Set(referenceData.map(d => d.SUBJ_CODE)).size;
    totalCoursesStat.textContent = totalRefCourses;

    // Group assessments by Course (Subject Code) to find Onboarded count
    const courseStatusMap = {};
    assessments.forEach(a => {
        if (!courseStatusMap[a.course]) courseStatusMap[a.course] = [];
        courseStatusMap[a.course].push(a.status);
    });

    let onboardedCount = 0;
    Object.values(courseStatusMap).forEach(statuses => {
        if (statuses.some(s => s !== 'CANCELED')) onboardedCount++;
    });

    onboardedStat.textContent = onboardedCount;

    // Coverage %
    const percentage = totalRefCourses > 0 ? ((onboardedCount / totalRefCourses) * 100).toFixed(1) : 0;
    coverageStat.textContent = `${percentage}%`;

    // Total Sites (Total assessments not deleted, regardless of status? usually total records)
    // Request says "Total # of Course Sites"
    totalSitesStat.textContent = assessments.length;


    // 2. Breakdown Table Removed - Only calculating stats for Chart

    const schoolStats = {};

    assessments.forEach(a => {
        const st = a.status; // 'COMPLETED' or 'CANCELED' or empty

        // Chart Data - Granular
        if (!schoolStats[a.school]) {
            schoolStats[a.school] = {
                'First Contact': 0,
                'Demo/Training': 0,
                'Mock Setup': 0,
                'Mock Test': 0,
                'Approved': 0,
                'Venue Booked': 0,
                'Confirmed': 0,
                'COMPLETED': 0,
                'CANCELED': 0
            };
        }

        if (a.firstContact) schoolStats[a.school]['First Contact']++;
        if (a.demoTraining) schoolStats[a.school]['Demo/Training']++;
        if (a.mockSetup) schoolStats[a.school]['Mock Setup']++;
        if (a.mockTest) schoolStats[a.school]['Mock Test']++;
        if (a.approved) schoolStats[a.school]['Approved']++;
        if (a.venueBooked) schoolStats[a.school]['Venue Booked']++;
        if (a.confirmed) schoolStats[a.school]['Confirmed']++;
        if (st === 'COMPLETED') schoolStats[a.school]['COMPLETED']++;
        if (st === 'CANCELED') schoolStats[a.school]['CANCELED']++;
    });

    // 3. Render Bar Chart
    renderChart(schoolStats);

    // 4. Render Platform Pie Chart
    const platformStats = {
        'Examena': 0,
        'Respondus Lock Down Browser': 0,
        'Gradescope': 0
    };

    assessments.forEach(a => {
        if (a.platform && platformStats.hasOwnProperty(a.platform)) {
            platformStats[a.platform]++;
        }
    });

    console.log("Calculated Platform Stats:", platformStats);
    renderPlatformChart(platformStats);
}

// --- Modal Logic ---

function renderPlatformChart(platformStats) {
    const canvas = document.getElementById('platformChart');
    if (!canvas) {
        console.error("Platform Chart Canvas not found");
        return;
    }
    const ctx = canvas.getContext('2d');

    if (platformChartInstance) {
        platformChartInstance.destroy();
    }

    const labels = Object.keys(platformStats);
    const data = Object.values(platformStats);
    const total = data.reduce((a, b) => a + b, 0);

    const colors = [
        '#8b5cf6', // Examena (Purple)
        '#f59e0b', // Respondus (Amber/Orange)
        '#10b981', // Gradescope (Emerald/Green)
        '#64748b'  // Others (Slate)
    ];

    // If no data, show a placeholder config or just the title
    const chartData = total > 0 ? {
        labels: labels,
        datasets: [{
            data: data,
            backgroundColor: colors,
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1
        }]
    } : {
        labels: ["No Data"],
        datasets: [{
            data: [1], // Dummy data to show a grey circle
            backgroundColor: ['rgba(255, 255, 255, 0.1)'],
            borderColor: 'transparent',
            borderWidth: 0
        }]
    };

    platformChartInstance = new Chart(ctx, {
        type: 'pie',
        data: chartData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: total > 0 ? 'Platform Distribution' : 'Platform Distribution (No Data)',
                    color: '#fff',
                    font: { size: 16 }
                },
                legend: {
                    position: 'bottom',
                    labels: { color: '#fff', padding: 20 },
                    display: total > 0
                },
                tooltip: {
                    enabled: total > 0
                }
            }
        }
    });
}

function renderChart(schoolStats) {
    const ctx = document.getElementById('statusChart').getContext('2d');
    const schools = Object.keys(schoolStats).sort();

    if (statusChartInstance) {
        statusChartInstance.destroy();
    }

    const statuses = [
        'First Contact',
        'Demo/Training',
        'Mock Setup',
        'Mock Test',
        'Approved',
        'Venue Booked',
        'Confirmed',
        'COMPLETED',
        'CANCELED'
    ];

    // Updated Colors for new categories
    const colors = {
        'First Contact': '#d946ef', // Fuchsia (Distinct)
        'Demo/Training': '#fbbf24', // Amber
        'Mock Setup': '#fca5a5',   // Light Red
        'Mock Test': '#f87171',    // Red
        'Approved': '#60a5fa',     // Blue
        'Venue Booked': '#818cf8', // Indigo
        'Confirmed': '#a78bfa',    // Purple
        'COMPLETED': '#16a34a',    // Green (Distinct from Teal)
        'CANCELED': '#9ca3af'      // Gray
    };

    const datasets = statuses.map(st => ({
        label: st,
        data: schools.map(sch => schoolStats[sch][st] || 0),
        backgroundColor: colors[st],
        // stack: 'Stack 0', 
    }));

    statusChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: schools,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Status Breakdown by School',
                    color: '#fff',
                    font: { size: 16 }
                },
                legend: {
                    labels: { color: '#fff', boxWidth: 12, padding: 10 },
                    position: 'bottom'
                }
            },
            scales: {
                x: {
                    ticks: { color: '#ccc' },
                    grid: { color: 'rgba(255,255,255,0.1)' }
                },
                y: {
                    ticks: { color: '#ccc' },
                    grid: { color: 'rgba(255,255,255,0.1)' }
                }
            }
        }
    });
}

// --- Rendering ---

// Helper for circle toggles
// Helper for circle toggles
async function toggleField(id, field) {
    const assessment = assessments.find(a => a.id === id);
    if (assessment) {
        const newValue = !assessment[field];
        // Optimistic UI update
        assessment[field] = newValue;
        renderTable(assessments); // Re-render to show change immediately

        try {
            await fetch(`/api/assessments/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ [field]: newValue })
            });
            updateDashboard();
        } catch (err) {
            console.error(err);
            // Revert on error
            assessment[field] = !newValue;
            renderTable(assessments);
            alert('Failed to update status');
        }
    }
}

function renderTable(data) {
    tableBody.innerHTML = '';

    if (data.length === 0) {
        emptyState.classList.remove('hidden');
        return;
    }
    emptyState.classList.add('hidden');

    data.forEach(item => {
        const row = document.createElement('tr');

        // Status Dropdown Logic (Final Column)
        const options = ['', 'COMPLETED', 'CANCELED'];
        let optionsHtml = '';
        options.forEach(optVal => {
            const selected = item.status === optVal ? 'selected' : '';
            optionsHtml += `<option value="${optVal}" ${selected}>${optVal || '-'}</option>`;
        });

        const statusSelectHtml = `<select class="status-dropdown status-${(item.status || '').toLowerCase()}" 
                                    onchange="handleStatusChange('${item.id}', this.value)">
                                    ${optionsHtml}
                                  </select>`;

        // Helper to create circle toggle
        const createToggle = (field, isChecked) => {
            return `<div class="circle-toggle ${isChecked ? 'active' : ''}" 
                        onclick="toggleField('${item.id}', '${field}')"></div>`;
        };

        const venueDisplay = `<div>${item.venue || 'TBD'}</div>
                             <div class="text-xs text-muted">${item.studentCount ? item.studentCount + ' Students' : '-'}</div>`;

        row.innerHTML = `
            <td>
                <div class="fw-bold">${item.school}</div>
                <div class="text-xs text-muted">${item.course} | ${item.courseId}</div>
            </td>
            <td>
                <div>${item.instructorName}</div>
                <div class="text-xs text-muted">Sem: ${item.semester}</div>
            </td>
            <td>
                <div>${item.examDate ? new Date(item.examDate).toLocaleDateString() : '-'}</div>
                ${venueDisplay}
                <div class="text-xs text-muted" style="margin-top:2px; font-style:italic;">${item.platform || ''}</div>
            </td>
            <!-- New Columns -->
            <td class="text-center">${createToggle('firstContact', item.firstContact)}</td>
            <td class="text-center">${createToggle('demoTraining', item.demoTraining)}</td>
            <td class="text-center">${createToggle('mockSetup', item.mockSetup)}</td>
            <td class="text-center">${createToggle('mockTest', item.mockTest)}</td>
            <td class="text-center">${createToggle('approved', item.approved)}</td>
            <td class="text-center">${createToggle('venueBooked', item.venueBooked)}</td>
            <td class="text-center">${createToggle('confirmed', item.confirmed)}</td>
            
            <td>${statusSelectHtml}</td>
            <td>
                <div class="action-btn-group">
                    <button class="icon-btn btn-delete" onclick="handleDelete('${item.id}')">
                        <i data-lucide="trash-2"></i>
                    </button>
                </div>
            </td>
        `;

        // Removed Status Dropdown Append

        tableBody.appendChild(row);
    });

    lucide.createIcons();
}

async function handleStatusChange(id, newStatus) {
    const assessment = assessments.find(a => a.id === id);
    if (assessment) {
        assessment.status = newStatus;

        try {
            await fetch(`/api/assessments/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
            updateDashboard();
        } catch (err) {
            console.error(err);
            alert('Failed to update status');
        }
    }
}

// Logic Styles
const style = document.createElement('style');
style.innerHTML = `
    .fw-bold { font-weight: 600; color: #fff; }
    .text-xs { font-size: 0.75rem; }
    .text-muted { color: var(--text-muted); }
    .hidden-content { display: none; }
    .tags-wrapper { display: flex; flex-wrap: wrap; gap: 4px; max-width: 150px; }
    .pill-sm { 
        background: rgba(255,255,255,0.1); 
        padding: 2px 6px; 
        border-radius: 4px; 
        font-size: 0.7rem; 
        border: 1px solid rgba(255,255,255,0.1);
    }
    .badge-sm {
        font-size: 0.7rem;
        padding: 2px 6px;
        border-radius: 4px;
        margin-right: 4px;
        border: 1px solid rgba(255,255,255,0.2);
    }
    .badge-sm.intended { color: #aaa; border-color: #aaa; }
    .badge-sm.approved { color: #60a5fa; border-color: #60a5fa; } /* Blue */
    .badge-sm.confirmed { color: #a78bfa; border-color: #a78bfa; } /* Purple */
    .badge-sm.completed { color: #34d399; border-color: #34d399; } /* Green */
    .badge-sm.canceled { color: #f87171; border-color: #f87171; } /* Red */
    
    .status-row { display: flex; flex-wrap: wrap; gap: 4px; }
    
    /* Circle Toggle Styles */
    .circle-toggle {
        width: 20px;
        height: 20px;
        border-radius: 50%;
        border: 2px solid rgba(255, 255, 255, 0.4);
        cursor: pointer;
        margin: 0 auto; /* Center in cell */
        transition: all 0.2s ease;
    }

    .circle-toggle:hover {
        border-color: #fff;
        background: rgba(255, 255, 255, 0.1);
    }

    .circle-toggle.active {
        background-color: var(--primary); /* Uses existing primary color global variable if available, otherwise fallback */
        border-color: #60a5fa; /* Light blue accent */
        box-shadow: 0 0 8px rgba(96, 165, 250, 0.5);
    }
`;
document.head.appendChild(style);
