// DigiApp Logic (V2)

// State
let assessments = [];
let editingId = null; // New State
let referenceData = []; // [{ DEPT, SUBJ_CODE, COURSE_SITE_ID, ... }]
let currentCalendarDate = new Date(); // State for Calendar navigations

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
const dashboardView = document.getElementById('dashboardView');
const recordsView = document.getElementById('recordsView');
const navDashboard = document.getElementById('nav-dashboard');
const navRecords = document.getElementById('nav-records');
const navIssues = document.getElementById('nav-issues');
const issuesView = document.getElementById('issuesView');

// Selects
const schoolSelect = document.getElementById('schoolSelect');
const courseSelect = document.getElementById('courseSelect');


// Dashboard Elements
const coverageStat = document.getElementById('coverageStat');
const totalStat = document.getElementById('totalStat');
const issueForm = document.getElementById('issueForm');
const toggleIssueFormHeader = document.getElementById('toggleIssueFormHeader');
const issueFormContent = document.getElementById('issueFormContent');
const issueFormChevron = document.getElementById('issueFormChevron');
const issueSchoolSelect = document.getElementById('issueSchoolSelect');
const issueCourseSelect = document.getElementById('issueCourseSelect');
const issueSearchInput = document.getElementById('issueSearchInput');
const issuesTableBody = document.querySelector('#issuesTable tbody');

let issues = [];
let editingIssueId = null;
// Breakdown Elements Removed
// const breakdownTableBody = document.querySelector('#breakdownTable tbody');
// const breakdownSchoolFilter = document.getElementById('breakdownSchoolFilter');

// --- Issues Management ---

async function loadIssues() {
    try {
        const res = await fetch('/api/issues');
        issues = await res.json();
        renderIssuesTable();
    } catch (err) {
        console.error('Error loading issues:', err);
    }
}

async function handleIssueSubmit(e) {
    e.preventDefault();
    const formData = {
        id: editingIssueId || crypto.randomUUID(),
        school: issueSchoolSelect.value,
        course: issueCourseSelect.value,
        instructor: document.getElementById('issueInstructor').value,
        email: document.getElementById('issueEmail').value,
        assessmentType: document.getElementById('issueAssessmentType').value,
        assessmentDate: document.getElementById('issueAssessmentDate').value,
        platform: document.getElementById('issuePlatform').value,
        vendor: document.getElementById('issueVendor').value,
        problemDescription: document.getElementById('issueDescription').value,
        remarks: document.getElementById('issueRemarks').value,
        status: document.getElementById('issueStatus').value
    };

    try {
        const url = editingIssueId ? `/api/issues/${editingIssueId}` : '/api/issues';
        const method = editingIssueId ? 'PUT' : 'POST';
        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        if (res.ok) {
            alert(editingIssueId ? 'Issue updated' : 'Issue created');
            resetIssueForm();
            await loadIssues();
        } else {
            const errData = await res.json().catch(() => ({}));
            alert(`Failed to save issue: ${errData.error || res.status}`);
            console.error('Server error response:', errData);
        }
    } catch (err) {
        console.error('Error saving issue:', err);
        alert('Failed to save issue');
    }
}

function resetIssueForm() {
    issueForm.reset();
    editingIssueId = null;
    issueCourseSelect.disabled = true;
    document.querySelector('#issueForm button[type="submit"]').innerHTML = '<i data-lucide="save"></i> Save Issue';
    lucide.createIcons();
}

function renderIssuesTable() {
    const searchTerm = issueSearchInput.value.toLowerCase();
    const filteredIssues = issues.filter(issue => 
        issue.school.toLowerCase().includes(searchTerm) ||
        issue.course.toLowerCase().includes(searchTerm) ||
        issue.instructor.toLowerCase().includes(searchTerm) ||
        issue.problemDescription.toLowerCase().includes(searchTerm)
    );

    issuesTableBody.innerHTML = filteredIssues.map(issue => `
        <tr>
            <td>
                <div style="font-weight: 600;">${issue.school}</div>
                <div style="font-size: 0.85rem; color: var(--text-muted);">${issue.course}</div>
            </td>
            <td>
                <div>${issue.instructor}</div>
                <div style="font-size: 0.85rem; color: var(--text-muted);">${issue.email}</div>
            </td>
            <td>
                <div class="badge badge-secondary">${issue.assessmentType}</div>
                <div style="font-size: 0.85rem; margin-top: 4px;">${new Date(issue.assessmentDate).toLocaleDateString()}</div>
            </td>
            <td>
                <div style="font-size: 0.9rem;">${issue.platform}</div>
                <div class="badge" style="background: rgba(255,255,255,0.1); margin-top: 4px;">${issue.vendor}</div>
            </td>
            <td style="max-width: 250px; font-size: 0.9rem;">
                <div style="white-space: pre-wrap;">${issue.problemDescription}</div>
                ${issue.remarks ? `<div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 5px; border-top: 1px dashed rgba(255,255,255,0.1); padding-top: 3px;">${issue.remarks}</div>` : ''}
            </td>
            <td>
                <span class="status-pill status-${issue.status.toLowerCase()}">${issue.status}</span>
            </td>
            <td>
                <div class="actions">
                    <button class="icon-btn" onclick="editIssue('${issue.id}')" title="Edit"><i data-lucide="edit-2"></i></button>
                    <button class="icon-btn" onclick="deleteIssue('${issue.id}')" title="Delete" style="color: var(--status-canceled);"><i data-lucide="trash-2"></i></button>
                </div>
            </td>
        </tr>
    `).join('');
    lucide.createIcons();
}

async function editIssue(id) {
    const issue = issues.find(i => i.id === id);
    if (!issue) return;

    editingIssueId = id;
    issueSchoolSelect.value = issue.school;
    populateCourseSelect(issue.school, issueCourseSelect);
    issueCourseSelect.value = issue.course;
    issueCourseSelect.disabled = false;

    document.getElementById('issueInstructor').value = issue.instructor;
    document.getElementById('issueEmail').value = issue.email;
    document.getElementById('issueAssessmentType').value = issue.assessmentType;
    document.getElementById('issueAssessmentDate').value = issue.assessmentDate ? new Date(issue.assessmentDate).toISOString().split('T')[0] : '';
    document.getElementById('issuePlatform').value = issue.platform;
    document.getElementById('issueVendor').value = issue.vendor;
    document.getElementById('issueDescription').value = issue.problemDescription;
    document.getElementById('issueRemarks').value = issue.remarks || '';
    document.getElementById('issueStatus').value = issue.status;

    // Expand form and scroll
    issueFormContent.classList.remove('hidden');
    issueFormChevron.style.transform = 'rotate(180deg)';
    issueForm.scrollIntoView({ behavior: 'smooth' });

    document.querySelector('#issueForm button[type="submit"]').innerHTML = '<i data-lucide="check"></i> Update Issue';
    lucide.createIcons();
}

async function deleteIssue(id) {
    if (!confirm('Are you sure you want to delete this issue?')) return;
    try {
        const res = await fetch(`/api/issues/${id}`, { method: 'DELETE' });
        if (res.ok) {
            await loadIssues();
        }
    } catch (err) {
        console.error('Error deleting issue:', err);
    }
}

function exportIssues() {
    if (issues.length === 0) {
        alert('No issues to export');
        return;
    }

    const data = issues.map(i => ({
        School: i.school,
        Course: i.course,
        Instructor: i.instructor,
        Email: i.email,
        'Assessment Type': i.assessmentType,
        'Assessment Date': i.assessmentDate ? new Date(i.assessmentDate).toLocaleDateString() : '',
        Platform: i.platform,
        Vendor: i.vendor,
        'Problem Description': i.problemDescription,
        Remarks: i.remarks,
        Status: i.status,
        'Last Updated By': i.last_updated_by,
        'Last Updated Date': i.last_updated_date ? new Date(i.last_updated_date).toLocaleString() : ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Issues");
    XLSX.writeFile(workbook, `Issues_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
}

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    loadData();

    // Event Listeners
    form.addEventListener('submit', handleAdd);
    searchInput.addEventListener('input', applyFilters);
    exportBtn.addEventListener('click', handleExport);
    toggleFormHeader.addEventListener('click', toggleForm);

    refDataInput.addEventListener('change', handleRefDataUpload);

    // Cascading Dropdowns
    schoolSelect.addEventListener('change', handleSchoolChange);

    // Filter Listener
    // Filter Listener Removed
    // breakdownSchoolFilter.addEventListener('change', updateDashboard);

    lucide.createIcons();

    // Navigation
    showView('dashboard');

    // Load Initial Data
    loadIssues();

    // Event Listeners for Issues
    toggleIssueFormHeader.addEventListener('click', () => {
        issueFormContent.classList.toggle('hidden');
        issueFormChevron.style.transform = issueFormContent.classList.contains('hidden') ? 'rotate(0deg)' : 'rotate(180deg)';
    });

    issueSchoolSelect.addEventListener('change', (e) => {
        populateCourseSelect(e.target.value, issueCourseSelect);
    });

    issueForm.addEventListener('submit', handleIssueSubmit);
    issueSearchInput.addEventListener('input', renderIssuesTable);
});

// --- Navigation Logic ---
function showView(view) {
    dashboardView.classList.add('hidden');
    recordsView.classList.add('hidden');
    issuesView.classList.add('hidden');
    
    navDashboard.classList.remove('active');
    navRecords.classList.remove('active');
    navIssues.classList.remove('active');

    if (view === 'dashboard') {
        dashboardView.classList.remove('hidden');
        navDashboard.classList.add('active');
        updateDashboard();
    } else if (view === 'records') {
        recordsView.classList.remove('hidden');
        navRecords.classList.add('active');
        applyFilters();
    } else if (view === 'issues') {
        issuesView.classList.remove('hidden');
        navIssues.classList.add('active');
        renderIssuesTable();
    }
}

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
        populateTableFilter();
        checkUpcomingDeadlines();
        renderCalendar(); // Initial Calendar Render
    } catch (err) {
        console.error('Error loading data:', err);
    }
}

// function saveAssessments() removed - using granular API calls


async function saveRefData() {
    try {
        const res = await fetch('/api/refdata', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(referenceData)
        });

        if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.error || `Server Error ${res.status}`);
        }
    } catch (err) {
        console.error('Error saving reference data:', err);
        alert('Failed to save reference data! ' + err.message);
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

    const options = schools.map(school => `<option value="${school}">${school}</option>`).join('');
    const defaultOpt = '<option value="">-- Select School --</option>';
    
    schoolSelect.innerHTML = defaultOpt + options;
    issueSchoolSelect.innerHTML = defaultOpt + options;
}

function handleSchoolChange() {
    populateCourseSelect(schoolSelect.value, courseSelect);
}

function populateCourseSelect(selectedSchool, targetSelect) {
    // Reset Child Dropdown
    targetSelect.innerHTML = '<option value="">-- Select Course (Subject) --</option>';
    targetSelect.disabled = true;

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
        targetSelect.appendChild(opt);
    });

    targetSelect.disabled = false;
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


// State Management (Moved to top)

// ... (existing code matches until handleAdd) ...

async function handleAdd(e) {
    e.preventDefault();
    const formData = new FormData(form);

    const questionTypes = [];
    document.querySelectorAll('input[name="qType"]:checked').forEach((checkbox) => {
        questionTypes.push(checkbox.value);
    });

    const assessmentData = {
        school: formData.get('school'),
        course: formData.get('course'),
        semester: formData.get('semester'),
        instructorName: formData.get('instructorName'),
        instructorEmail: formData.get('instructorEmail'),
        studentCount: formData.get('studentCount'),
        assessmentType: formData.get('assessmentType'),
        assessmentDate: formData.get('assessmentDate'),
        venue: formData.get('venue'),
        openBook: formData.get('openBook'),
        platform: formData.get('platform'),
        duration: formData.get('duration'),
        questionTypes: questionTypes,
        remarks: formData.get('remarks')
    };

    try {
        let res;
        if (editingId) {
            // UPDATE EXISTING
            res = await fetch(`/api/assessments/${editingId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(assessmentData)
            });
        } else {
            // CREATE NEW
            const newAssessment = {
                ...assessmentData,
                id: crypto.randomUUID(),
                firstContact: false,
                demoTraining: false,
                mockSetup: false,
                mockTest: false,
                approved: false,
                confirmed: false,
                createdAt: new Date().toISOString()
            };
            res = await fetch('/api/assessments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newAssessment)
            });
        }

        if (res.ok) {
            const savedItem = await res.json();

            if (editingId) {
                // Update local array
                const index = assessments.findIndex(a => a.id === editingId);
                if (index !== -1) assessments[index] = savedItem;
                alert('Assessment updated successfully!');
            } else {
                assessments.unshift(savedItem);
                alert('Assessment saved successfully!');
            }

            applyFilters();
            updateDashboard();
            resetForm();
            if (form.classList.contains('hidden-content')) toggleForm();
        } else {
            const errData = await res.json().catch(() => ({}));
            alert(`Failed to save! Server said: ${errData.error || res.status} ${res.statusText}`);
        }
    } catch (err) {
        console.error(err);
        alert('Client/Network Error: ' + err.message);
    }
}

// ... (existing code) ...

function editAssessment(id) {
    const item = assessments.find(a => a.id === id);
    if (!item) return;

    editingId = id;

    // Show Form if hidden
    if (form.classList.contains('hidden-content')) {
        toggleForm();
    }

    // Scroll to top
    form.scrollIntoView({ behavior: 'smooth' });

    // Populate Fields
    form.school.value = item.school;
    handleSchoolChange(); // Trigger to populate courses
    form.course.value = item.course; // Set course after options populate

    form.semester.value = item.semester;
    form.instructorName.value = item.instructorName;
    form.instructorEmail.value = item.instructorEmail;
    form.studentCount.value = item.studentCount;
    form.assessmentType.value = item.assessmentType;
    form.assessmentDate.value = item.assessmentDate ? item.assessmentDate.split('T')[0] : '';
    form.venue.value = item.venue;
    form.openBook.value = item.openBook;
    form.platform.value = item.platform;
    form.duration.value = item.duration || '';
    form.remarks.value = item.remarks;

    // Checkboxes
    document.querySelectorAll('input[name="qType"]').forEach(cb => {
        cb.checked = (item.questionTypes || []).includes(cb.value);
    });

    // UI Updates
    document.getElementById('submitBtn').innerHTML = '<i data-lucide="save"></i> Update Assessment';
    document.getElementById('cancelEditBtn').classList.remove('hidden');
    document.getElementById('formTitle').textContent = 'Edit Assessment Details';
}

function resetForm() {
    editingId = null;
    form.reset();
    document.getElementById('submitBtn').innerHTML = '<i data-lucide="save"></i> Save Entry';
    document.getElementById('cancelEditBtn').classList.add('hidden');
    document.getElementById('formTitle').textContent = 'Add New Assessment Details'; // Assuming this ID exists or I should add it

    // Reset dropdowns
    courseSelect.innerHTML = '<option value="">-- Select Course (Subject) --</option>';
    courseSelect.disabled = true;
}

async function handleDelete(id) {
    if (confirm('Are you sure you want to delete this assessment?')) {
        try {
            const res = await fetch(`/api/assessments/${id}`, { method: 'DELETE' });
            if (res.ok) {
                assessments = assessments.filter(a => a.id !== id);
                applyFilters();
                updateDashboard();
                if (editingId === id) {
                    resetForm();
                    if (!form.classList.contains('hidden-content')) toggleForm();
                }
            } else {
                alert('Failed to delete');
            }
        } catch (err) {
            console.error(err);
            alert('Error deleting assessment');
        }
    }
}

// --- Filtering Logic ---

const schoolCourseFilter = document.getElementById('schoolCourseFilter');
const platformFilter = document.getElementById('platformFilter');

function populateTableFilter() {
    // Get unique schools from current assessments, sort alphabetically
    const schools = [...new Set(assessments.map(a => a.school))].sort();

    const currentVal = schoolCourseFilter.value;

    schoolCourseFilter.innerHTML = '<option value="">All Schools</option>';
    schools.forEach(sch => {
        const opt = document.createElement('option');
        opt.value = sch;
        opt.textContent = sch;
        schoolCourseFilter.appendChild(opt);
    });

    if (schools.includes(currentVal)) {
        schoolCourseFilter.value = currentVal;
    }
}

function applyFilters() {
    const searchTerm = searchInput.value.toLowerCase();
    const scTerm = schoolCourseFilter.value; // Exact match for school
    const pTerm = platformFilter.value;

    const filtered = assessments.filter(a => {
        // 1. Global Search (Search Input)
        const matchesSearch = !searchTerm ||
            (a.school && a.school.toLowerCase().includes(searchTerm)) ||
            (a.course && a.course.toLowerCase().includes(searchTerm)) ||
            (a.instructorName && a.instructorName.toLowerCase().includes(searchTerm)) ||
            (a.assessmentType && a.assessmentType.toLowerCase().includes(searchTerm)) ||
            (a.venue && a.venue.toLowerCase().includes(searchTerm));

        // 2. School Column Filter (Dropdown - Exact Match)
        const matchesSchool = !scTerm || a.school === scTerm;

        // 3. Platform Column Filter
        const matchesPlatform = !pTerm || a.platform === pTerm;

        return matchesSearch && matchesSchool && matchesPlatform;
    });

    renderTable(filtered);
}

// Add Listeners
schoolCourseFilter.addEventListener('change', applyFilters);
platformFilter.addEventListener('change', applyFilters);
searchInput.addEventListener('input', applyFilters);

function handleExport() {
    if (assessments.length === 0) {
        alert('No data to export!');
        return;
    }

    const exportData = assessments.map(a => ({
        School: a.school,
        Course: a.course,
        Semester: a.semester,
        Instructor: a.instructorName,
        Email: a.instructorEmail,
        Students: a.studentCount,
        'Assessment Type': a.assessmentType,
        'Assessment Date': a.assessmentDate,
        Venue: a.venue || '',
        'Returning Course/ Instructor': a.return ? 'Yes' : 'No',
        'First Contact': a.firstContact ? 'Yes' : 'No',
        'Demo/Training': a.demoTraining ? 'Yes' : 'No',
        'Mock Setup': a.mockSetup ? 'Yes' : 'No',
        'Mock Test': a.mockTest ? 'Yes' : 'No',
        'OAS Approval': a.approved ? 'Yes' : 'No',
        'Venue Confirmation': a.confirmed ? 'Yes' : 'No',
        'Setup Check': a.setupChecked ? 'Yes' : 'No',
        Platform: a.platform || '',
        'Duration (hrs)': a.duration || '',
        'Question Types': a.questionTypes.join(', '),
        Status: a.status,
        Remarks: a.remarks,
        'Last Updated By': a.last_updated_by || '',
        'Last Updated Date': a.last_updated_date ? new Date(a.last_updated_date).toLocaleString('en-GB') : ''
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


// Modal Elements
const statusModal = document.getElementById('statusModal');
const modalTitle = document.getElementById('modalTitle');
const statusEditTableBody = document.querySelector('#statusEditTable tbody');

let statusChartInstance = null;
let platformChartInstance = null;
let coursesChartInstance = null;

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
                // 'Venue Booked': 0, // Removed
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
        if (a.confirmed) schoolStats[a.school]['Confirmed']++;
        if (st === 'COMPLETED') schoolStats[a.school]['COMPLETED']++;
        if (st === 'CANCELED') schoolStats[a.school]['CANCELED']++;
    });

    // 3. Render Bar Chart
    // renderChart(schoolStats);

    // Render Courses by School Chart
    renderCoursesBySchoolChart(assessments, referenceData);

    // 4. Render Platform Pie Chart
    const platformStats = {
        'Examena': 0,
        'NTULearn with LDB': 0,
        'Pen and Paper with Gradescope e-Grading': 0
    };

    assessments.forEach(a => {
        if (a.platform && platformStats.hasOwnProperty(a.platform)) {
            platformStats[a.platform]++;
        }
    });

    console.log("Calculated Platform Stats:", platformStats);
    renderPlatformChart(platformStats);
    renderCalendar(); // Refresh calendar when data changes
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
        '#10b981', // Pen and Paper with Gradescope e-Grading (Emerald/Green)
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
    const canvas = document.getElementById('statusChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
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
        // 'Venue Booked',
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
        // 'Venue Booked': '#818cf8', // Indigo
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

function renderCoursesBySchoolChart(assessments, referenceData) {
    const canvas = document.getElementById('coursesChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    if (coursesChartInstance) {
        coursesChartInstance.destroy();
    }

    const schools = [...new Set(referenceData.map(item => item.DEPT))].sort();
    
    // Map course to school
    const courseSchoolMap = {};
    referenceData.forEach(item => {
        courseSchoolMap[item.SUBJ_CODE] = item.DEPT;
    });
    // Fallback for assessments not in reference data
    assessments.forEach(a => {
        if (!courseSchoolMap[a.course]) courseSchoolMap[a.course] = a.school;
    });

    const cStats = {};
    assessments.forEach(a => {
        if (!cStats[a.course]) cStats[a.course] = [];
        cStats[a.course].push(a.status || '');
    });

    const schoolData = {};
    schools.forEach(sch => {
        schoolData[sch] = { 'Completed': 0, 'In Progress': 0 };
    });

    for (const course in cStats) {
        const statuses = cStats[course];
        const hasCompleted = statuses.some(s => s === 'COMPLETED');
        const hasPending = statuses.some(s => s !== 'COMPLETED' && s !== 'CANCELED');
        const hasCanceledOnly = statuses.every(s => s === 'CANCELED');

        if (hasCanceledOnly) continue; // Exclude

        const school = courseSchoolMap[course];
        if (!schoolData[school]) {
            schoolData[school] = { 'Completed': 0, 'In Progress': 0 };
        }

        if (!hasPending && hasCompleted) {
            schoolData[school]['Completed']++;
        } else {
            schoolData[school]['In Progress']++;
        }
    }

    const labels = Object.keys(schoolData).sort();
    const completedData = labels.map(sch => schoolData[sch]['Completed']);
    const inProgressData = labels.map(sch => schoolData[sch]['In Progress']);

    coursesChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Completed',
                    data: completedData,
                    backgroundColor: '#16a34a', // Match Green color
                },
                {
                    label: 'In Progress',
                    data: inProgressData,
                    backgroundColor: '#60a5fa', // Blue
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Courses by School',
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
                    stacked: true,
                    ticks: { color: '#ccc' },
                    grid: { color: 'rgba(255,255,255,0.1)' }
                },
                y: {
                    stacked: true,
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
        applyFilters(); // Re-render to show change immediately

        try {
            const res = await fetch(`/api/assessments/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ [field]: newValue })
            });
            if (res.ok) {
                const updatedItem = await res.json();
                Object.assign(assessment, updatedItem);
                applyFilters();
                updateDashboard();
            } else {
                throw new Error('Failed to update');
            }
        } catch (err) {
            console.error(err);
            // Revert on error
            assessment[field] = !newValue;
            applyFilters();
            alert('Failed to update status');
        }
    }
}

function renderTable(data) {
    // Sort data: empty/null status first, then alphabetically (CANCELED/COMPLETED)
    const sortedData = [...data].sort((a, b) => {
        const statusA = a.status || '';
        const statusB = b.status || '';
        if (statusA === statusB) return 0;
        if (!statusA) return -1;
        if (!statusB) return 1;
        return statusA.localeCompare(statusB);
    });

    tableBody.innerHTML = '';

    if (sortedData.length === 0) {
        emptyState.classList.remove('hidden');
        return;
    }
    emptyState.classList.add('hidden');

    sortedData.forEach(item => {
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

        const questionTypesHtml = (item.questionTypes || []).map(qt =>
            `<span class="badge-sm" style="border-color: rgba(255,255,255,0.3); display: inline-block; margin-bottom: 2px;">${qt}</span>`
        ).join('');

        row.innerHTML = `
            <td>
                <div class="fw-bold">${item.school}</div>
                <div class="text-xs text-muted">${item.course}</div>
            </td>
            <td>
                <div>${item.instructorName}</div>
                <div class="text-xs text-muted">Sem: ${item.semester}</div>
            </td>
            <td>
                <div>${item.assessmentDate ? new Date(item.assessmentDate).toLocaleDateString('en-GB') : '-'}</div>
                ${venueDisplay}
                <div class="text-xs text-muted" style="margin-top:2px;">
                    ${item.assessmentType || ''} ${item.duration ? '| ' + item.duration + ' hrs' : ''}
                </div>
            </td>
            <td>
                <div class="text-xs">${item.platform || '-'}</div>
            </td>
            <td>
                <div class="tags-wrapper">${questionTypesHtml || '-'}</div>
            </td>
            <td style="max-width: 150px; overflow-wrap: break-word;">
                <div class="text-xs">${item.remarks || '-'}</div>
            </td>
            <!-- New Columns -->
            <td class="text-center">${createToggle('return', item.return)}</td>
            <td class="text-center">${createToggle('firstContact', item.firstContact)}</td>
            <td class="text-center">${createToggle('demoTraining', item.demoTraining)}</td>
            <td class="text-center">${createToggle('mockSetup', item.mockSetup)}</td>
            <td class="text-center">${createToggle('mockTest', item.mockTest)}</td>
            <td class="text-center">${createToggle('approved', item.approved)}</td>
            <td class="text-center">${createToggle('confirmed', item.confirmed)}</td>
            <td class="text-center">${createToggle('setupChecked', item.setupChecked)}</td>
            
            <td>${statusSelectHtml}</td>
            <td>
                <div class="action-btn-group">
                    <button class="icon-btn btn-edit" onclick="editAssessment('${item.id}')" title="Edit">
                        <i data-lucide="edit"></i>
                    </button>
                    <button class="icon-btn btn-delete" onclick="handleDelete('${item.id}')" title="Delete">
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
            const res = await fetch(`/api/assessments/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
            if (res.ok) {
                const updatedItem = await res.json();
                Object.assign(assessment, updatedItem);
                applyFilters();
                updateDashboard();
            } else {
                throw new Error('Failed to update status');
            }
        } catch (err) {
            console.error(err);
            alert('Failed to update status');
        }
    }
}

// --- Logic: Calendar ---

function changeMonth(offset) {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() + offset);
    renderCalendar();
}

function renderCalendar() {
    const calendarMonthYear = document.getElementById('calendarMonthYear');
    const calendarDays = document.getElementById('calendarDays');
    if (!calendarMonthYear || !calendarDays) return;

    // Set Month/Year Title
    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"];
    calendarMonthYear.textContent = `${monthNames[currentCalendarDate.getMonth()]} ${currentCalendarDate.getFullYear()}`;

    // Calculate Days
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay(); // 0(Sun) - 6(Sat)
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Adjust firstDay to Mon-Sun (0 is Mon, 6 is Sun)
    // getDay(): 0=Sun, 1=Mon, ..., 6=Sat
    // We want: 0=Mon, 1=Tue, ..., 5=Sat, 6=Sun
    let startingDay = firstDay === 0 ? 6 : firstDay - 1;

    // Previous Month padding
    const prevMonthDays = new Date(year, month, 0).getDate();

    calendarDays.innerHTML = '';

    // Add padding days from previous month
    for (let i = startingDay - 1; i >= 0; i--) {
        const dayDiv = document.createElement('div');
        dayDiv.className = 'calendar-day other-month';
        dayDiv.innerHTML = `<span class="day-number">${prevMonthDays - i}</span>`;
        calendarDays.appendChild(dayDiv);
    }

    // Add actual month days
    const today = new Date();
    for (let i = 1; i <= daysInMonth; i++) {
        const dayDiv = document.createElement('div');
        dayDiv.className = 'calendar-day';
        if (i === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
            dayDiv.classList.add('today');
        }

        dayDiv.innerHTML = `<span class="day-number">${i}</span>`;

        // Check for assessments on this day
        const dayDate = new Date(year, month, i);
        const dayAssessments = assessments.filter(a => {
            if (!a.assessmentDate) return false;
            const aDate = new Date(a.assessmentDate);
            return aDate.getDate() === dayDate.getDate() &&
                aDate.getMonth() === dayDate.getMonth() &&
                aDate.getFullYear() === dayDate.getFullYear() &&
                a.status !== 'CANCELED';
        });

        dayAssessments.forEach(a => {
            const eventDiv = document.createElement('div');
            eventDiv.className = 'calendar-event';
            if (a.assessmentType === 'Exam') {
                eventDiv.classList.add('event-exam');
                if (a.platform === 'Pen and Paper with Gradescope e-Grading') {
                    eventDiv.classList.add('platform-gradescope');
                } else if (a.platform === 'NTULearn with LDB') {
                    eventDiv.classList.add('platform-ntulearn');
                } else if (a.platform === 'Examena') {
                    eventDiv.classList.add('platform-examena');
                }
            } else if (a.assessmentType === 'CA') {
                eventDiv.classList.add('event-ca');
            }
            eventDiv.textContent = `${a.school}: ${a.course}`;
            eventDiv.title = `${a.school} - ${a.course}\nInstructor: ${a.instructorName}\nPlatform: ${a.platform}`;
            eventDiv.onclick = (e) => {
                e.stopPropagation();
                editAssessment(a.id);
            };
            dayDiv.appendChild(eventDiv);
        });

        calendarDays.appendChild(dayDiv);
    }

    // Next Month padding
    const totalCells = startingDay + daysInMonth;
    const paddingNeeded = 42 - totalCells; // 6 rows of 7
    for (let i = 1; i <= paddingNeeded; i++) {
        const dayDiv = document.createElement('div');
        dayDiv.className = 'calendar-day other-month';
        dayDiv.innerHTML = `<span class="day-number">${i}</span>`;
        calendarDays.appendChild(dayDiv);
    }
}

// --- Notification Logic ---

function checkUpcomingDeadlines() {
    const now = new Date();
    // Reset time to start of day to ensure 'today' is included
    now.setHours(0, 0, 0, 0);

    const threeWeeksFromNow = new Date(now);
    threeWeeksFromNow.setDate(now.getDate() + 21);

    console.log('[DEBUG] Checking Deadlines:', { now, threeWeeksFromNow });

    const upcomingAssessments = assessments.filter(a => {
        if (!a.assessmentDate) return false;

        const date = new Date(a.assessmentDate);
        // Reset time to start of day for fair comparison (dates are usually 00:00 UTC/Local depending on parsing)
        // If assessmentDate is yyyy-mm-dd string, new Date() might treat as UTC.
        // new Date() is local time.
        // Mixing UTC and Local can be 8 hours off.
        // Let's just compare timestamp values or ISO strings if easier, but normalized.
        // Safest: set a.date to hours 0,0,0,0 in local time if it parsed that way.

        // Let's rely on standard comparison but logging will help.

        const isUpcoming = date >= now && date <= threeWeeksFromNow;

        if (!isUpcoming) return false;
        if (a.status === 'CANCELED' || a.status === 'COMPLETED') return false;

        const missing = [];
        const isCA = a.assessmentType === 'CA';
        const isExam = a.assessmentType === 'Exam';

        // Check if First Contact is true
        if (a.firstContact) {
            if (isCA) {
                if (!a.demoTraining) missing.push('DEMO/TRAINING');
                if (!a.mockSetup) missing.push('MOCK SETUP');
                if (!a.mockTest) missing.push('MOCK TEST');
                if (!a.confirmed) missing.push('VENUE CONFIRMATION');
                if (!a.setupChecked) missing.push('SETUP CHECK');
            } else if (isExam) {
                if (!a.demoTraining) missing.push('DEMO/TRAINING');
                if (!a.mockSetup) missing.push('MOCK SETUP');
                if (!a.mockTest) missing.push('MOCK TEST');
                if (!a.approved) missing.push('OAS APPROVAL');
                if (!a.confirmed) missing.push('VENUE CONFIRMATION');
                if (!a.setupChecked) missing.push('SETUP CHECK');
            }
        } 
        // Else check if Return is true
        else if (a.return) {
            if (isCA) {
                if (!a.confirmed) missing.push('VENUE CONFIRMATION');
                if (!a.setupChecked) missing.push('SETUP CHECK');
            } else if (isExam) {
                if (!a.approved) missing.push('OAS APPROVAL');
                if (!a.confirmed) missing.push('VENUE CONFIRMATION');
                if (!a.setupChecked) missing.push('SETUP CHECK');
            }
        }

        if (missing.length > 0) {
            console.log(`[DEBUG] Found Upcoming: ${a.course} on ${a.assessmentDate}. Missing: ${missing.join(', ')}`);
            a.missingActions = missing; // Attach for rendering
            return true;
        }
        return false;
    });

    console.log(`[DEBUG] Total Upcoming Found: ${upcomingAssessments.length}`);

    if (upcomingAssessments.length > 0) {
        const tbody = document.querySelector('#notificationTable tbody');
        tbody.innerHTML = '';

        upcomingAssessments.sort((a, b) => new Date(a.assessmentDate) - new Date(b.assessmentDate));

        upcomingAssessments.forEach(a => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${new Date(a.assessmentDate).toLocaleDateString()}</td>
                <td>
                    <div class="fw-bold">${a.school}</div>
                    <div class="text-xs text-muted">${a.course}</div>
                    <div class="text-xs text-muted" style="margin-top:2px;">Type: ${a.assessmentType || '-'}</div>
                </td>
                <td>
                    ${a.missingActions.map(action =>
                `<span class="badge-sm canceled" style="display: inline-block; margin-bottom: 2px;">${action}</span>`
            ).join('')}
                </td>
            `;
            tbody.appendChild(row);
        });

        document.getElementById('notificationModal').classList.remove('hidden');
    }
}

// Modify loadData to call checkUpcomingDeadlines
// We need to inject the call inside loadData. 
// Since we cant easily inject inside a function with this tool without replacing the whole function or using multi-replace effectively on a large range,
// I will just append the function here and assume I modified loadData separately or will do so next.
// Actually, I can append this function at the end, and then modify loadData in a separate step.
// Wait, I can try to replace the end of the file ... but I need to call it.
// Let's add the function definition here at the end.

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

    #notificationModal {
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    #notificationModal.hidden {
        display: none !important;
    }
`;
document.head.appendChild(style);
