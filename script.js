// in script.js (komplett ersetzen)

document.addEventListener('DOMContentLoaded', () => {

    // HTML-Elemente abrufen
    const productForm = document.getElementById('product-form');
    const productInput = document.getElementById('product-input');
    const spinner = document.getElementById('spinner');
    const questionsContainer = document.getElementById('questions-container');
    const finalAssessmentBtn = document.getElementById('final-assessment-btn'); // NEU
    const resultContainer = document.getElementById('result-container');
    const resultText = document.getElementById('result-text');
    const scoreCircle = document.querySelector('.score-circle');
    const scoreValue = document.getElementById('score-value');
    const resetBtn = document.getElementById('reset-btn');
    const historyList = document.getElementById('history-list');
    // App-Zustand
    let appState = {
        productName: '',
        questions: {},
        answers: {},
    };

    // --- Event Listeners ---
    productForm.addEventListener('submit', handleStartAssessment);
    finalAssessmentBtn.addEventListener('click', getFinalAssessment); // NEU

    // Event Delegation für dynamisch erstellte Fragen
    questionsContainer.addEventListener('click', handleBooleanAnswer);
    questionsContainer.addEventListener('change', handleTextAnswer); // 'change' ist besser als 'input'
    resetBtn.addEventListener('click', resetUI);
    fetchHistory();
    // --- Hauptfunktionen ---

    async function handleStartAssessment(event) {
        event.preventDefault();
        const productName = productInput.value.trim();
        if (!productName) return;

        resetUI();
        appState.productName = productName;
        spinner.classList.remove('hidden');
        productForm.classList.add('hidden'); // Verstecke das Start-Formular

        try {
            const response = await fetch('/.netlify/functions/generate-questions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productName }),
            });

            if (!response.ok) throw new Error(`Server error: ${response.statusText}`);

            const questionsJson = await response.json();
            appState.questions = questionsJson;
            appState.answers = {};
            
            spinner.classList.add('hidden');
            displayQuestions();

        } catch (error) {
            console.error("Error fetching questions:", error);
            showError("Oops! Something went wrong while fetching questions.");
        }
    }

    function displayQuestions() {
        questionsContainer.innerHTML = '';
        Object.keys(appState.questions).forEach(key => {
            const questionData = appState.questions[key];
            const questionBlock = document.createElement('div');
            questionBlock.className = 'question-block';

            let questionHTML = `<p>${key}. ${questionData.question}</p>`;

            if (questionData.type === 'boolean') {
                questionHTML += `
                    <div class="answer-buttons" data-question-key="${key}">
                        <button>Yes</button>
                        <button>No</button>
                    </div>`;
            } else if (questionData.type === 'text') {
                // NEU: Nur noch ein Input-Feld, kein Formular
                questionHTML += `
                    <input type="text" class="text-answer-input" placeholder="Your answer..." data-question-key="${key}">`;
            }
            
            questionBlock.innerHTML = questionHTML;
            questionsContainer.appendChild(questionBlock);
        });
        questionsContainer.classList.remove('hidden');
    }

    function handleBooleanAnswer(event) {
        if (!event.target.matches('.answer-buttons button')) return;

        const button = event.target;
        const buttonGroup = button.closest('.answer-buttons');
        const questionKey = buttonGroup.dataset.questionKey;
        const answer = button.textContent;

        appState.answers[questionKey] = answer;

        buttonGroup.querySelectorAll('button').forEach(btn => btn.classList.remove('selected'));
        button.classList.add('selected');
        
        checkIfAllAnswered();
    }
    
    function handleTextAnswer(event) {
        if (!event.target.matches('.text-answer-input')) return;

        const input = event.target;
        const questionKey = input.dataset.questionKey;
        const answer = input.value.trim();

        if (answer) {
            appState.answers[questionKey] = answer;
        } else {
            delete appState.answers[questionKey]; // Entferne die Antwort, wenn das Feld leer ist
        }
        
        checkIfAllAnswered();
    }
    
    function checkIfAllAnswered() {
        const totalQuestions = Object.keys(appState.questions).length;
        const answeredQuestions = Object.keys(appState.answers).length;

        // NEU: Zeige den finalen Button, statt direkt die API aufzurufen
        if (totalQuestions > 0 && totalQuestions === answeredQuestions) {
            finalAssessmentBtn.classList.remove('hidden');
        } else {
            finalAssessmentBtn.classList.add('hidden');
        }
    }

    function getScoreColor(score) {
        if (score < 40) return '#2ecc71'; // Grün
        if (score > 75) return '#e74c3c'; // Rot
        return '#ffb700'; // Gelb für alles dazwischen
    }
    
    /**
     * Ruft die letzten Bewertungen vom Backend ab und zeigt sie an.
     */
    async function fetchHistory() {
        try {
            // Rufe unsere neue serverlose Funktion auf
            const response = await fetch('/.netlify/functions/get-history');
            if (!response.ok) {
                throw new Error("Could not fetch history.");
            }
            
            const items = await response.json();
    
            // Leere die bestehende Liste, bevor wir sie neu befüllen
            historyList.innerHTML = ''; 
    
            // Gehe durch jeden Eintrag und erstelle ein Listenelement
            items.forEach(item => {
                const li = document.createElement('li');
                const scoreColor = getScoreColor(item.score);
    
                // Erstelle das HTML für das Listenelement
                li.innerHTML = `
                    <span class="history-product">${item.product_name}</span>
                    <span class="history-score" style="color: ${scoreColor};">${item.score}</span>
                `;
    
                // Füge das fertige Element zur Liste im HTML hinzu
                historyList.appendChild(li);
            });
    
        } catch (error) {
            console.error(error);
            // Zeige eine Fehlermeldung an, falls etwas schiefgeht
            historyList.innerHTML = '<li>Could not load recent assessments.</li>';
        }
    }
    
    async function getFinalAssessment() {
        questionsContainer.classList.add('hidden');
        finalAssessmentBtn.classList.add('hidden');
        spinner.classList.remove('hidden');
    
        try {
            const response = await fetch('/.netlify/functions/assess-idiocy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(appState),
            });
            if (!response.ok) throw new Error(`Server error: ${response.statusText}`);
    
            // Die Antwort ist jetzt ein Objekt mit "assessment" und "score"
            const data = await response.json();
            console.log(data)
            // UI mit beiden Werten aktualisieren
            resultText.textContent = data.assessment;
            scoreValue.textContent = data.score;
    
            // Den Tacho und die Farbe dynamisch anpassen
            const score = data.score;
            const scoreColor = getScoreColor(score);
            scoreCircle.style.setProperty('--score-percent', `${score}%`);
            scoreCircle.style.setProperty('--score-color', scoreColor);

            resultContainer.classList.remove('hidden');
    
        } catch (error) {
            console.error("Error fetching assessment:", error);
            showError("Oops! Could not get a verdict. The oracle is silent.");
        } finally {
            spinner.classList.add('hidden');
        }
    }
    
    
    function resetUI() {
        spinner.classList.add('hidden');
        questionsContainer.classList.add('hidden');
        finalAssessmentBtn.classList.add('hidden');
        resultContainer.classList.add('hidden'); // Versteckt automatisch den Score darin
        productForm.classList.remove('hidden');
        productInput.value = '';
        appState = { productName: '', questions: {}, answers: {} };
    }

    function showError(message) {
        spinner.classList.add('hidden');
        resultText.textContent = message;
        resultContainer.classList.remove('hidden');
    }
});