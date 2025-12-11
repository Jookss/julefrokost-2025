const API_URL = 'https://script.google.com/macros/s/AKfycbzS_yVJwNPqezir1V-KrSgvPE6zaibHa_0PCVUOS_Ut97YJQNhXxcwAn8NijqpWj3WL/exec';

document.addEventListener('DOMContentLoaded', () => {
    initSnow();
    fetchParticipants();
    setupForm();
});

// --- Snow Effect ---
function initSnow() {
    const snowContainer = document.getElementById('snow-container');
    const snowflakeCount = 50;
    const symbols = ['❄', '❅', '❆'];

    for (let i = 0; i < snowflakeCount; i++) {
        const flake = document.createElement('div');
        flake.classList.add('snowflake');
        flake.innerText = symbols[Math.floor(Math.random() * symbols.length)];

        // Randomize initial position and animation props
        const left = Math.random() * 100;
        const duration = Math.random() * 5 + 5; // 5-10s
        const opacity = Math.random() * 0.5 + 0.3;
        const size = Math.random() * 1.5 + 0.5; // 0.5 - 2rem
        const delay = Math.random() * 10; // Start at different times

        flake.style.left = `${left}%`;
        flake.style.opacity = opacity;
        flake.style.fontSize = `${size}rem`;
        flake.style.animationDuration = `${duration}s`;
        flake.style.animationDelay = `-${delay}s`; // Negative delay to start mid-animation

        snowContainer.appendChild(flake);
    }
}

// --- API Interactions ---
async function fetchParticipants() {
    const listContainer = document.getElementById('participants-list');
    const loader = document.getElementById('loading-indicator');

    try {
        const response = await fetch(API_URL);
        const data = await response.json();

        loader.classList.add('hidden');
        listContainer.innerHTML = '';

        if (data.length === 0) {
            listContainer.innerHTML = '<li style="text-align:center; padding:10px;">Ingen tilmeldte endnu. Vær den første!</li>';
        } else {
            // Reverse to show newest first
            data.reverse().forEach(p => {
                const li = document.createElement('li');
                li.className = 'participant-card';
                li.innerHTML = `
                    <div class="participant-info">
                        <div class="participant-name">${escapeHtml(p.name)}</div>
                        <div class="participant-dish">Medbringer: ${escapeHtml(p.dish)}</div>
                    </div>
                    <div class="participant-count">${p.count} Personer</div>
                `;
                listContainer.appendChild(li);
            });
        }
        listContainer.classList.remove('hidden');

    } catch (error) {
        console.error('Error fetching data:', error);
        loader.textContent = 'Kunne ikke hente deltagere. Prøv at opdatere siden.';
        loader.style.color = '#c62828';
    }
}

function setupForm() {
    const form = document.getElementById('registration-form');
    const submitBtn = document.getElementById('submit-btn');
    const msgDiv = document.getElementById('form-message');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // UI Loading State
        submitBtn.disabled = true;
        submitBtn.textContent = 'Tilmelder...';
        msgDiv.textContent = '';
        msgDiv.className = '';

        const formData = {
            name: form.name.value,
            count: form.count.value,
            dish: form.dish.value
        };

        try {
            // Note: Google Apps Script Web Apps require strict content-type handling.
            // Even though we send JSON, we often use no-cors or text/plain to avoid preflight issues if not configured perfectly.
            // However, since we want to read the response, let's try standard POST.
            // IF CORS issues arise, we might need 'no-cors' mode but then we can't read response.
            // Standard fetch usually works if the script returns correct headers (which GAS does automatically for Web Apps usually).

            // NOTE: fetch with POST to Google Script often has CORS issues. 
            // The standard workaround is using 'no-cors' or ensuring the script handles OPTIONS.
            // Actually, for simple GAS Web Apps, sending as text/plain avoids the complex preflight
            // and the script can parse it.

            const response = await fetch(API_URL, {
                method: 'POST',
                // Using text/plain to avoid CORS preflight (OPTIONS request) which GAS doesn't handle well
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (result.status === 'success') {
                msgDiv.textContent = 'Succes! I er nu tilmeldt.';
                msgDiv.className = 'success-msg';
                form.reset();
                fetchParticipants(); // Refresh list
            } else {
                throw new Error(result.message || 'Ukendt fejl');
            }

        } catch (error) {
            console.error('Submission error:', error);
            msgDiv.textContent = 'Noget gik galt. Prøv venligst igen.';
            msgDiv.className = 'error-msg';
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Tilmeld';
        }
    });
}

function escapeHtml(text) {
    if (!text) return '';
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
