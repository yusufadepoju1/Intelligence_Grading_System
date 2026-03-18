import './style.css'; // Make sure styles are loaded by Vite

const API_BASE = 'http://localhost:3000';

document.addEventListener('DOMContentLoaded', () => {
    // Handle File Drop Areas
    setupFileDrop('studentFileArea', 'studentFile');
    setupFileDrop('markingGuideArea', 'markingGuide');

    const form = document.getElementById('gradingForm');
    const submitBtn = document.getElementById('submitBtn');
    const btnText = submitBtn.querySelector('.btn-text');
    const spinner = document.getElementById('loadingSpinner');
    
    const uploadCard = document.getElementById('uploadCard');
    const resultsCard = document.getElementById('resultsCard');
    const resetBtn = document.getElementById('resetBtn');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const studentFileInput = document.getElementById('studentFile');
        if (!studentFileInput.files.length) {
            alert('Please upload a student submission file.');
            return;
        }

        // UI Loading State
        submitBtn.disabled = true;
        btnText.textContent = 'Analyzing...';
        spinner.classList.remove('hidden');

        try {
            const formData = new FormData();
            formData.append('studentFile', studentFileInput.files[0]);
            
            const markingGuideInput = document.getElementById('markingGuide');
            if (markingGuideInput.files.length > 0) {
                formData.append('markingGuide', markingGuideInput.files[0]);
            }

            const instructions = document.getElementById('teacherInstructions').value;
            if (instructions) {
                formData.append('teacherInstructions', instructions);
            }

            const response = await fetch(`${API_BASE}/upload`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || 'Failed to analyze submission');
            }

            const data = await response.json();
            renderResults(data.result);

            // Swap views
            uploadCard.classList.add('hidden');
            resultsCard.classList.remove('hidden');

        } catch (error) {
            alert(`Error: ${error.message}`);
        } finally {
            // Restore UI State
            submitBtn.disabled = false;
            btnText.textContent = 'Grade Submission';
            spinner.classList.add('hidden');
        }
    });

    resetBtn.addEventListener('click', () => {
        form.reset();
        // Reset file area text
        document.querySelector('#studentFileArea .file-msg').textContent = 'Drag & Drop or Click to browse (PDF, DOCX, TXT)';
        document.querySelector('#markingGuideArea .file-msg').textContent = 'Drag & Drop or Click to browse (PDF, DOCX, TXT)';
        
        resultsCard.classList.add('hidden');
        uploadCard.classList.remove('hidden');
    });
});

// Helper for sleek drag-and-drop file inputs
function setupFileDrop(areaId, inputId) {
    const dropArea = document.getElementById(areaId);
    const fileInput = document.getElementById(inputId);
    const fileMsg = dropArea.querySelector('.file-msg');

    // Prevent default drag behaviors
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    // Highlight drop area when item is dragged over it
    ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, () => dropArea.classList.add('dragover'), false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, () => dropArea.classList.remove('dragover'), false);
    });

    // Handle dropped files
    dropArea.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        if (files.length) {
            fileInput.files = files; // Assign files to input
            updateFileName(fileInput, fileMsg);
        }
    }, false);

    // Handle file selection via click
    fileInput.addEventListener('change', () => {
        updateFileName(fileInput, fileMsg);
    });
}

function updateFileName(inputElement, msgElement) {
    if (inputElement.files.length > 0) {
        msgElement.textContent = `Selected: ${inputElement.files[0].name}`;
        msgElement.style.color = 'var(--primary)';
        msgElement.style.fontWeight = '600';
    } else {
        msgElement.textContent = 'Drag & Drop or Click to browse (PDF, DOCX, TXT)';
        msgElement.style.color = 'var(--text-muted)';
        msgElement.style.fontWeight = 'normal';
    }
}

function renderResults(resultStr) {
    // resultStr is already a JSON object based on our backend code 
    // (Wait, backend `res.json({ result: aiResult })` => aiResult is an object!)
    const aiResult = typeof resultStr === 'string' ? JSON.parse(resultStr) : resultStr;

    // Student Info Panel
    const nameEl = document.getElementById('resName');
    const idEl = document.getElementById('resId');
    const scoreEl = document.getElementById('resScore');
    const remarksEl = document.getElementById('resRemarks');
    const remarksBox = document.getElementById('resRemarksBox');

    nameEl.textContent = aiResult.student_info?.name || 'Unknown User';
    idEl.textContent = aiResult.student_info?.id || 'N/A';
    
    const score = aiResult.total_score || '-';
    scoreEl.textContent = score;

    if (aiResult.remarks) {
        remarksBox.classList.remove('hidden');
        remarksEl.textContent = aiResult.remarks;
    } else {
        remarksBox.classList.add('hidden');
    }

    // Question Cards
    const container = document.getElementById('qaContainer');
    container.innerHTML = ''; // Clear old

    const questions = aiResult.questions || [];
    if (questions.length === 0) {
        container.innerHTML = '<p style="text-align:center; color: var(--text-muted)">No specific questions extracted.</p>';
        return;
    }

    questions.forEach((q, idx) => {
        const card = document.createElement('div');
        card.className = 'qa-card';
        
        card.innerHTML = `
            <div class="qa-header">
                <h3 class="qa-question">Q${idx + 1}: ${q.question || 'Untitled Question'}</h3>
                <span class="qa-score-badge">${q.score || 0} / ${q.max_score || '?'}</span>
            </div>
            <div class="qa-body">
                <div class="qa-section ans-student">
                    <span class="label">Student's Answer</span>
                    <p>${q.student_answer || 'No answer provided.'}</p>
                </div>
                <div class="qa-section ans-expected">
                    <span class="label">Expected / Marking Criteria</span>
                    <p>${q.expected_answer || 'N/A'}</p>
                </div>
                <div class="qa-section ans-feedback">
                    <span class="label">AI Feedback</span>
                    <p>${q.feedback || 'No feedback provided.'}</p>
                </div>
            </div>
        `;
        
        container.appendChild(card);
    });
}
