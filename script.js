document.addEventListener('DOMContentLoaded', () => {


    const productForm = document.getElementById('product-form');
    const productInput = document.getElementById('product-input');
    const productCharCounter = document.getElementById('product-char-counter');
    const spinner = document.getElementById('spinner');
    const questionsContainer = document.getElementById('questions-container');
    const finalAssessmentBtn = document.getElementById('final-assessment-btn');
    const resultContainer = document.getElementById('result-container');
    const resultText = document.getElementById('result-text');
    const scoreCircle = document.querySelector('.score-circle');
    const scoreValue = document.getElementById('score-value');
    const resetBtn = document.getElementById('reset-btn');
    const historyList = document.getElementById('history-list');

    // state
    let appState = {
        productName: '',
        questions: {},
        answers: {},
    };

    // --- Event Listeners ---
    productForm.addEventListener('submit', handleStartAssessment);
    finalAssessmentBtn.addEventListener('click', getFinalAssessment);

    // Event Delegation
    questionsContainer.addEventListener('click', handleBooleanAnswer);
    questionsContainer.addEventListener('input', handleTextAnswer);
    resetBtn.addEventListener('click', resetUI);
    fetchHistory();

    productInput.addEventListener('input', updateCharCounter);
    updateCharCounter();

    async function handleStartAssessment(event) {
        event.preventDefault();
        const productName = productInput.value.trim();
        if (!productName) return;

        resetUI();
        appState.productName = productName;
        spinner.classList.remove('hidden');
        productForm.classList.add('hidden');

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
                questionHTML += `
                    <input type="text" class="text-answer-input" placeholder="Your answer..." data-question-key="${key}" maxlength="60">`;
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
            delete appState.answers[questionKey];
        }
        
        checkIfAllAnswered();
    }
    
    function checkIfAllAnswered() {
        const totalQuestions = Object.keys(appState.questions).length;
        const answeredQuestions = Object.keys(appState.answers).length;

        if (totalQuestions > 0 && totalQuestions === answeredQuestions) {
            finalAssessmentBtn.classList.remove('hidden');
        } else {
            finalAssessmentBtn.classList.add('hidden');
        }
    }

    function getScoreColor(score) {
        if (score < 40) return '#2ecc71';
        if (score > 75) return '#e74c3c';
        return '#ffb700';
    }
    
    async function fetchHistory() {
        const MAX_DISPLAY_LENGTH = 21; 
    
        try {
            const response = await fetch('/.netlify/functions/get-history');
            if (!response.ok) {
                throw new Error("Could not fetch history.");
            }
            
            const items = await response.json();
    
            historyList.innerHTML = ''; 
            
            items.forEach(item => {
                const li = document.createElement('li');
                const scoreColor = getScoreColor(item.score);
    
                let displayProductName = item.product_name;
                if (displayProductName.length > MAX_DISPLAY_LENGTH) {
                    displayProductName = displayProductName.substring(0, MAX_DISPLAY_LENGTH) + '...';
                }
    
                li.innerHTML = `
                    <span class="history-product">${displayProductName}</span>
                    <span class="history-score" style="color: ${scoreColor};">${item.score}</span>
                `;
    
                historyList.appendChild(li);
            });
    
        } catch (error) {
            console.error(error);
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
    
            const data = await response.json();
            console.log(data)
            resultText.textContent = data.assessment;
            scoreValue.textContent = data.score;
    
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

    function updateCharCounter() {
        const maxLength = productInput.maxLength; 
        const currentLength = productInput.value.length;
        const remainingChars = maxLength - currentLength;
        productCharCounter.textContent = remainingChars;

        if (remainingChars <= 10 && remainingChars >=0) { 
            productCharCounter.style.color = '#e74c3c'; 
        } else {
            productCharCounter.style.color = ''; 
        }
    }
    
    function resetUI() {
        spinner.classList.add('hidden');
        questionsContainer.classList.add('hidden');
        finalAssessmentBtn.classList.add('hidden');
        resultContainer.classList.add('hidden');
        productForm.classList.remove('hidden');
        productInput.value = '';
        appState = { productName: '', questions: {}, answers: {} };
        updateCharCounter(); 
    }

    function showError(message) {
        spinner.classList.add('hidden');
        resultText.textContent = message;
        resultContainer.classList.remove('hidden');
    }
});