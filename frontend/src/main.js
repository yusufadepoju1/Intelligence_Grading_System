const API_BASE = 'http://localhost:3000';

document.addEventListener('DOMContentLoaded', () => {
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
            alert('Please select a file.');
            return;
        }

        submitBtn.disabled = true;
        btnText.textContent = 'Grading...';
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
                throw new Error('Failed to analyze');
            }

            const data = await response.json();
            renderResults(data.result);

            uploadCard.classList.add('hidden');
            resultsCard.classList.remove('hidden');

        } catch (error) {
            alert(`Error: ${error.message}`);
        } finally {
            submitBtn.disabled = false;
            btnText.textContent = 'Grade it';
            spinner.classList.add('hidden');
        }
    });

    resetBtn.addEventListener('click', () => {
        form.reset();
        resultsCard.classList.add('hidden');
        uploadCard.classList.remove('hidden');
    });
});

function renderResults(resultStr) {
    const aiResult = typeof resultStr === 'string' ? JSON.parse(resultStr) : resultStr;

    document.getElementById('resName').textContent = aiResult.student_info?.name || 'Unknown';
    document.getElementById('resId').textContent = aiResult.student_info?.id || 'N/A';
    document.getElementById('resScore').textContent = aiResult.total_score || '0';

    const remarksBox = document.getElementById('resRemarksBox');
    const remarksEl = document.getElementById('resRemarks');
    if (aiResult.remarks) {
        remarksBox.classList.remove('hidden');
        remarksEl.textContent = aiResult.remarks;
    } else {
        remarksBox.classList.add('hidden');
    }

    const container = document.getElementById('qaContainer');
    container.innerHTML = ''; 

    const questions = aiResult.questions || [];
    if (questions.length === 0) {
        container.innerHTML = '<p>No questions found.</p>';
        return;
    }

    questions.forEach((q, idx) => {
        const card = document.createElement('div');
        card.className = 'qa-card';
        card.innerHTML = `
            <p><b>Q${idx + 1}: ${q.question}</b> (Score: ${q.score}/${q.max_score})</p>
            <p>Student Answer: ${q.student_answer}</p>
            <p>Correct Answer: ${q.expected_answer}</p>
            <p>Feedback: ${q.feedback}</p>
        `;
        container.appendChild(card);
    });
}
