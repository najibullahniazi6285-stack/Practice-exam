document.addEventListener('DOMContentLoaded', () => {
    const startButton = document.getElementById('start-btn');
    const nextButton = document.getElementById('next-btn');
    const pauseButton = document.getElementById('pause-btn');
    const questionContainerElement = document.getElementById('question-container');
    const questionElement = document.getElementById('question');
    const answerButtonsElement = document.getElementById('answer-buttons');
    const scoreContainerElement = document.getElementById('score-container');
    const correctScoreElement = document.getElementById('correct-score');
    const wrongScoreElement = document.getElementById('wrong-score');
    const timerElement = document.getElementById('timer');
    const incorrectAnswersContainer = document.getElementById('incorrect-answers-container');
    const examDetailsElement = document.getElementById('exam-details');
    const progressBar = document.getElementById('progress-bar');
    const resultsSummaryContainer = document.getElementById('results-summary-container');

    let allQuestions = [];
    let shuffledQuestions, currentQuestionIndex;
    let correctScore, wrongScore;
    let timer;
    let timeRemaining = 5400; // 90 minutes in seconds
        let isPaused = false;
        let selectedAnswers = [];
        const explanationContainer = document.getElementById('explanation-container');
    
        fetch('questions.json')
            .then(res => res.json())
            .then(data => {
                allQuestions = data; // Keep original data structure
                
                // Prepare questions for the quiz, but keep original data handy
                const quizQuestions = data.map(q => {
                    if (q.type === 'fill-in-the-blank') {
                        return {
                            type: 'fill-in-the-blank',
                            question: q.question,
                            answer: q.answer,
                            // Keep a reference to the original object if needed, or just use its ID
                            originalId: q.id 
                        };
                    }
    
                    const answers = Object.keys(q.options).map(key => ({
                        text: key + '. ' + q.options[key],
                        correct: key === q.answer
                    }));
    
                    return {
                        type: 'multiple-choice',
                        question: q.question,
                        answers: answers,
                        originalId: q.id // Use ID to link back to original question object
                    };
                }).filter(q => (q.type === 'multiple-choice' && q.answers.some(a => a.correct)) || q.type === 'fill-in-the-blank');
    
                startButton.addEventListener('click', () => startGame(quizQuestions));
                nextButton.addEventListener('click', handleNextButton);
                pauseButton.addEventListener('click', togglePause);
            })
            .catch(error => console.error('Error loading questions:', error));
    
        function startGame(quizQuestions) {
            shuffledQuestions = quizQuestions.sort(() => Math.random() - 0.5).slice(0, 90);
            startButton.classList.add('hide');
            examDetailsElement.classList.remove('hide');
            questionContainerElement.classList.remove('hide');
            scoreContainerElement.classList.remove('hide');
            incorrectAnswersContainer.innerHTML = ''; // Clear previous results
            incorrectAnswersContainer.classList.add('hide');
            resultsSummaryContainer.classList.add('hide');
            pauseButton.classList.remove('hide');
    
            currentQuestionIndex = 0;
            correctScore = 0;
            wrongScore = 0;
            timeRemaining = 5400;
            isPaused = false;
            pauseButton.textContent = 'Pause';
            updateScore();
            
            startTimer();
            setNextQuestion();
        }
    
        function startTimer() {
            timer = setInterval(() => {
                if (!isPaused) {
                    timeRemaining--;
                    updateTimerDisplay();
                    if (timeRemaining <= 0) {
                        endGame();
                    }
                }
            }, 1000);
        }
    
        function updateTimerDisplay() {
            const minutes = Math.floor(timeRemaining / 60);
            const seconds = timeRemaining % 60;
            timerElement.textContent = `Time Remaining: ${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
        }
    
        function togglePause() {
            isPaused = !isPaused;
            if (isPaused) {
                pauseButton.textContent = 'Resume';
                clearInterval(timer);
            } else {
                pauseButton.textContent = 'Pause';
                startTimer();
            }
        }
    
        function setNextQuestion() {
            resetState();
            if (currentQuestionIndex < shuffledQuestions.length) {
                showQuestion(shuffledQuestions[currentQuestionIndex]);
            } else {
                endGame();
            }
        }
    
        function showQuestion(question) {
            questionElement.textContent = `Question ${currentQuestionIndex + 1}: ${question.question}`;
            updateProgressBar();
            
            if (question.type === 'fill-in-the-blank') {
                const input = document.createElement('input');
                input.type = 'text';
                input.id = 'fill-in-the-blank-input';
                input.classList.add('fill-in-the-blank-input');
                answerButtonsElement.appendChild(input);
    
                const submitButton = document.createElement('button');
                submitButton.textContent = 'Submit';
                submitButton.classList.add('btn', 'submit-btn');
                submitButton.addEventListener('click', () => {
                    const userAnswer = input.value.trim();
                    checkAnswer(userAnswer);
                });
                answerButtonsElement.appendChild(submitButton);
            } else {
                const isMultipleAnswer = Array.isArray(allQuestions.find(q => q.id === question.originalId).answer);

                question.answers.forEach(answer => {
                    const button = document.createElement('button');
                    button.textContent = answer.text;
                    button.classList.add('btn', 'answer-btn');
                    button.dataset.correct = answer.correct;
                    if (isMultipleAnswer) {
                        button.addEventListener('click', toggleSelection);
                    } else {
                        button.addEventListener('click', selectAnswer);
                    }
                    answerButtonsElement.appendChild(button);
                });

                if (isMultipleAnswer) {
                    const submitButton = document.createElement('button');
                    submitButton.textContent = 'Submit';
                    submitButton.classList.add('btn', 'submit-btn');
                    submitButton.addEventListener('click', () => {
                        checkAnswer();
                    });
                    answerButtonsElement.appendChild(submitButton);
                }
            }
        }
    
        function resetState() {
            clearStatusClass(document.body);
            nextButton.classList.add('hide');
            while (answerButtonsElement.firstChild) {
                answerButtonsElement.removeChild(answerButtonsElement.firstChild);
            }
            explanationContainer.classList.add('hide'); // Hide explanation for new question
            explanationContainer.innerHTML = ''; // Clear previous explanation
            selectedAnswers = [];
        }
    
        function toggleSelection(e) {
            const selectedButton = e.target;
            selectedButton.classList.toggle('selected');
            selectedAnswers = Array.from(answerButtonsElement.querySelectorAll('.answer-btn.selected'));
        }

        function selectAnswer(e) {
            const selectedButton = e.target;
            selectedAnswers = [selectedButton];
            checkAnswer();
        }
        
        function handleNextButton() {
            currentQuestionIndex++;
            setNextQuestion();
        }
    
        function checkAnswer(userAnswer) {
            const question = shuffledQuestions[currentQuestionIndex];
            const originalQuestion = allQuestions.find(q => q.id === question.originalId);
            let isCorrect = false;
            const isMultipleAnswer = Array.isArray(originalQuestion.answer);

            if (question.type === 'fill-in-the-blank') {
                isCorrect = userAnswer.toLowerCase() === originalQuestion.answer.toLowerCase();
                const input = document.getElementById('fill-in-the-blank-input');
                setStatusClass(input, isCorrect);
                input.disabled = true;
                answerButtonsElement.querySelector('.submit-btn').disabled = true;
            } else if (isMultipleAnswer) {
                const correctKeys = originalQuestion.answer;
                const selectedKeys = selectedAnswers.map(btn => btn.textContent.charAt(0));

                const allCorrectSelected = correctKeys.every(key => selectedKeys.includes(key));
                const noIncorrectSelected = selectedKeys.every(key => correctKeys.includes(key));
                isCorrect = allCorrectSelected && noIncorrectSelected;

                Array.from(answerButtonsElement.children).forEach(button => {
                    const buttonKey = button.textContent.charAt(0);
                    const isButtonCorrect = correctKeys.includes(buttonKey);
                    const isButtonSelected = selectedKeys.includes(buttonKey);

                    if (isButtonSelected && isButtonCorrect) {
                        setStatusClass(button, true); // Correctly selected (green)
                    } else if (isButtonSelected && !isButtonCorrect) {
                        setStatusClass(button, false); // Incorrectly selected (red)
                    } else if (!isButtonSelected && isButtonCorrect) {
                        button.classList.add('correct-unselected'); // Correct but not selected (yellow)
                    }
                    button.disabled = true;
                });
                const submitButton = answerButtonsElement.querySelector('.submit-btn');
                if (submitButton) submitButton.disabled = true;

            } else { // Single answer multiple choice
                isCorrect = selectedAnswers.length > 0 && selectedAnswers.every(btn => btn.dataset.correct === 'true');
                
                if (isCorrect) {
                    selectedAnswers.forEach(btn => setStatusClass(btn, true));
                } else {
                    selectedAnswers.forEach(btn => setStatusClass(btn, false));
                    Array.from(answerButtonsElement.children).forEach(button => {
                        if (button.dataset.correct === 'true') {
                            button.classList.add('correct-unselected');
                        }
                    });
                }
                
                Array.from(answerButtonsElement.children).forEach(button => {
                    button.disabled = true;
                });
            }
    
            if (isCorrect) {
                correctScore++;
            } else {
                wrongScore++;
                let userAnswerText;
                if (question.type === 'fill-in-the-blank') {
                    userAnswerText = userAnswer;
                } else {
                    userAnswerText = selectedAnswers.map(btn => btn.textContent).join(', ');
                }
                incorrectAnswersContainer.appendChild(createIncorrectAnswerElement(question, currentQuestionIndex, userAnswerText));
            }
            
            updateScore();
            displayExplanation(originalQuestion); // Display explanation after checking answer
            nextButton.classList.remove('hide'); // Show next button to advance
        }
    
        function displayExplanation(originalQuestion) {
            let optionsDetails = '';
            if (originalQuestion && originalQuestion.explanation && originalQuestion.options) {
                optionsDetails = '<ul>';
                for (const key in originalQuestion.options) {
                    const isCorrect = key === originalQuestion.answer;
                    const explanationText = isCorrect 
                        ? (originalQuestion.explanation.correct || '')
                        : (originalQuestion.explanation.incorrect && originalQuestion.explanation.incorrect[key] ? originalQuestion.explanation.incorrect[key] : '');
                    optionsDetails += `<li><strong>${key}:</strong> ${originalQuestion.options[key]}<br><em>${explanationText}</em></li>`;
                }
                optionsDetails += '</ul>';
            }
    
            const referenceLink = (originalQuestion && originalQuestion.reference && originalQuestion.reference.link)
                ? `<a href="${originalQuestion.reference.link}" target="_blank">${originalQuestion.reference.objective || originalQuestion.reference.link}</a>`
                : 'N/A';
    
            explanationContainer.innerHTML = `
                <h4>Explanation:</h4>
                <div>${optionsDetails}</div>
                <p><strong>Reference:</strong> ${referenceLink}</p>
            `;
            explanationContainer.classList.remove('hide');
        }
    
        function setStatusClass(element, isCorrect) {
            clearStatusClass(element);
            if (isCorrect) {
                element.classList.add('correct');
            } else {
                element.classList.add('wrong');
            }
        }
    
        function clearStatusClass(element) {
            element.classList.remove('correct', 'wrong', 'selected', 'correct-unselected');
        }
    
        function updateScore() {
            correctScoreElement.textContent = correctScore;
            wrongScoreElement.textContent = wrongScore;
        }
    
        function updateProgressBar() {
            const progress = ((currentQuestionIndex) / shuffledQuestions.length) * 100;
            progressBar.style.width = `${progress}%`;
        }
        
        function createIncorrectAnswerElement(question, index, userAnswerText) {
            const originalQuestion = allQuestions.find(q => q.id === question.originalId);
            const element = document.createElement('div');
            element.classList.add('incorrect-answer');
            let correctAnswerHTML;
            let optionsDetails = '';
            const isMultipleAnswer = Array.isArray(originalQuestion.answer);
    
            if (question.type === 'fill-in-the-blank') {
                correctAnswerHTML = `<p><strong>Correct Answer:</strong> ${originalQuestion.answer}</p>`;
            } else if (isMultipleAnswer) {
                const correctKeys = originalQuestion.answer;
                const correctValues = correctKeys.map(key => `${key}. ${originalQuestion.options[key]}`);
                correctAnswerHTML = `<p><strong>Correct Answers:</strong> ${correctValues.join(', ')}</p>`;

                if (originalQuestion && originalQuestion.explanation && originalQuestion.options) {
                    optionsDetails = '<ul>';
                    const userSelectedKeys = userAnswerText.split(', ').map(text => text.charAt(0));

                    for (const key in originalQuestion.options) {
                        const isUserAnswer = userSelectedKeys.includes(key);
                        const liClass = isUserAnswer ? 'class="selected-answer"' : '';

                        const isCorrectOption = correctKeys.includes(key);
                        const explanationText = isCorrectOption 
                            ? (originalQuestion.explanation.correct && originalQuestion.explanation.correct[key] ? originalQuestion.explanation.correct[key] : '')
                            : (originalQuestion.explanation.incorrect && originalQuestion.explanation.incorrect[key] ? originalQuestion.explanation.incorrect[key] : '');
                        optionsDetails += `<li ${liClass}><strong>${key}:</strong> ${originalQuestion.options[key]}<br><em>${explanationText}</em></li>`;
                    }
                    optionsDetails += '</ul>';
                }

            } else { // Single answer multiple choice
                const correctKey = originalQuestion.answer;
                const correctValue = originalQuestion.options[correctKey];
                correctAnswerHTML = `<p><strong>Correct Answer:</strong> ${correctKey}. ${correctValue}</p>`;

                if (originalQuestion && originalQuestion.explanation && originalQuestion.options) {
                    optionsDetails = '<ul>';
                    for (const key in originalQuestion.options) {
                        const optionText = `${key}. ${originalQuestion.options[key]}`;
                        const isUserAnswer = optionText === userAnswerText;
                        const liClass = isUserAnswer ? 'class="selected-answer"' : '';

                        const isCorrect = key === originalQuestion.answer;
                        const explanationText = isCorrect 
                            ? (originalQuestion.explanation.correct || '')
                            : (originalQuestion.explanation.incorrect && originalQuestion.explanation.incorrect[key] ? originalQuestion.explanation.incorrect[key] : '');
                        optionsDetails += `<li ${liClass}><strong>${key}:</strong> ${originalQuestion.options[key]}<br><em>${explanationText}</em></li>`;
                    }
                    optionsDetails += '</ul>';
                }
            }
    
            const referenceLink = (originalQuestion && originalQuestion.reference && originalQuestion.reference.link)
                ? `<a href="${originalQuestion.reference.link}" target="_blank">${originalQuestion.reference.objective || originalQuestion.reference.link}</a>`
                : 'N/A';
    
            element.innerHTML = `
                <p><strong>Question ${index + 1}:</strong> ${question.question}</p>
                <p><strong>Your Answer:</strong> ${userAnswerText}</p>
                ${correctAnswerHTML}
                <div><strong>Explanations:</strong>${optionsDetails}</div>
                <p><strong>Reference:</strong> ${referenceLink}</p>
            `;
            return element;
        }

    function endGame() {
        clearInterval(timer);
        questionContainerElement.classList.add('hide');
        nextButton.classList.add('hide');
        pauseButton.classList.add('hide');
        
        if (wrongScore > 0) {
            const header = document.createElement('h3');
            header.textContent = 'Review Incorrect Answers';
            incorrectAnswersContainer.prepend(header);
            incorrectAnswersContainer.classList.remove('hide');
        }

        const passMark = Math.ceil(shuffledQuestions.length * 0.75);
        const passed = correctScore >= passMark;
        const message = passed
            ? `Congratulations! You passed.`
            : `You did not pass. You need ${passMark} correct answers to pass.`;
        
        resultsSummaryContainer.innerHTML = `
            <h2>Exam Results</h2>
            <p class="${passed ? 'pass' : 'fail'}">${message}</p>
            <p>Your Score: ${correctScore} / ${shuffledQuestions.length}</p>
        `;
        resultsSummaryContainer.classList.remove('hide');

        startButton.textContent = 'Restart Exam';
        startButton.classList.remove('hide');
    }
});
