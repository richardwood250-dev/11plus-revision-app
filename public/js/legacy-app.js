(function () {
    // Namespace
    window.LegacyApp = window.LegacyApp || {};
    var App = window.LegacyApp;

    // State
    App.state = {
        view: 'menu', // menu, quiz, review
        subject: null,
        score: 0,
        currentQuestionIndex: 0,
        questions: [],
        answers: {}, // { index: value }
        startTime: null
    };

    // Constants
    var STORAGE_KEY = 'LEGACY_STATS_V1';

    // UI Cache
    var ui = {
        menuData: document.getElementById('menu-view'),
        quizData: document.getElementById('quiz-view'),
        reviewData: document.getElementById('review-view'),
        questionText: document.getElementById('question-text'),
        optionsContainer: document.getElementById('options-container'),
        progressText: document.getElementById('progress-text'),
        scoreText: document.getElementById('score-text'),
        feedbackText: document.getElementById('feedback-text')
    };

    // --- INIT ---
    App.init = function () {
        console.log("Legacy App Init");
        App.loadStats();
        App.showView('menu');
    };

    // --- NAVIGATION ---
    App.showView = function (viewName) {
        // Hide all
        document.querySelectorAll('.view').forEach(function (el) {
            el.style.display = 'none';
        });

        // Show specific
        var target = document.getElementById(viewName + '-view');
        if (target) target.style.display = 'block';

        App.state.view = viewName;
        window.scrollTo(0, 0);
    };

    // --- QUIZ LOGIC ---
    App.startQuiz = function (subject) {
        document.getElementById('loading-overlay').style.display = 'flex';

        // 1. Check if data loaded
        if (!window.QUIZ_DATA || !window.QUIZ_DATA[subject.toUpperCase()]) {
            // Load script dynamically? Or assume preloaded?
            // For this prototype, we assume preloaded OR we load it now.
            var script = document.createElement('script');
            script.src = '/data/' + subject.toLowerCase() + '-legacy.js';
            script.onload = function () {
                App._startQuizExecution(subject);
            };
            script.onerror = function () {
                alert("Failed to load " + subject + " data. Please check internet.");
                document.getElementById('loading-overlay').style.display = 'none';
            };
            document.body.appendChild(script);
        } else {
            App._startQuizExecution(subject);
        }
    };

    App._startQuizExecution = function (subject) {
        var allQuestions = window.QUIZ_DATA[subject.toUpperCase()];
        if (!allQuestions || allQuestions.length === 0) {
            alert("No questions found for " + subject);
            document.getElementById('loading-overlay').style.display = 'none';
            return;
        }

        // Shuffle
        var questions = allQuestions.sort(function () { return 0.5 - Math.random() }).slice(0, 10);

        App.state.subject = subject;
        App.state.questions = questions;
        App.state.currentQuestionIndex = 0;
        App.state.score = 0;
        App.state.answers = {};
        App.state.startTime = new Date();

        App.renderQuestion();
        App.showView('quiz');
        document.getElementById('loading-overlay').style.display = 'none';
    };

    App.renderQuestion = function () {
        var q = App.state.questions[App.state.currentQuestionIndex];
        var index = App.state.currentQuestionIndex;
        var total = App.state.questions.length;

        // Progress
        document.getElementById('progress-text').innerText = "Question " + (index + 1) + " of " + total;

        // Question Text
        var qTextEl = document.getElementById('question-text');
        qTextEl.innerHTML = q.question;

        // Image?
        var imgContainer = document.getElementById('question-image-container');
        imgContainer.innerHTML = '';
        if (q.image) {
            var img = document.createElement('img');
            img.src = q.image;
            img.className = 'question-image';
            img.onclick = function () {
                // Simple zoom overlay?
                window.open(q.image, '_blank');
            };
            imgContainer.appendChild(img);
        }

        // Options
        var optsContainer = document.getElementById('options-container');
        optsContainer.innerHTML = '';

        q.options.forEach(function (opt, i) {
            var letter = String.fromCharCode(65 + i); // A, B, C...
            var btn = document.createElement('div');
            btn.className = 'option-btn';
            btn.onclick = function () { App.handleAnswer(letter); };

            var label = document.createElement('span');
            label.className = 'option-label';
            label.innerText = letter;

            var text = document.createElement('span');
            text.innerText = opt;

            btn.appendChild(label);
            btn.appendChild(text);
            optsContainer.appendChild(btn);
        });
    };

    App.handleAnswer = function (selectedLetter) {
        var q = App.state.questions[App.state.currentQuestionIndex];

        // Save answer
        App.state.answers[App.state.currentQuestionIndex] = selectedLetter;

        // Score logic (Immediate feedback? No, wait for end usually. But simple quiz apps often do immediate. 
        // Student Dojo is typical completion-based.)

        // Go to next
        if (App.state.currentQuestionIndex < App.state.questions.length - 1) {
            App.state.currentQuestionIndex++;
            App.renderQuestion();
        } else {
            App.finishQuiz();
        }
    };

    App.finishQuiz = function () {
        // Calculate Score
        var correctCount = 0;
        App.state.questions.forEach(function (q, index) {
            var userAns = App.state.answers[index];
            if (userAns === q.correctAnswer) {
                correctCount++;
            }
        });

        App.state.score = correctCount;

        // Save Stats
        var timeTaken = Math.floor((new Date() - App.state.startTime) / 1000);
        App.saveStats(App.state.subject, correctCount, App.state.questions.length, timeTaken);

        // Render Review
        document.getElementById('score-text').innerText = correctCount + " / " + App.state.questions.length;

        var feedback = "";
        var pct = (correctCount / App.state.questions.length) * 100;
        if (pct >= 90) feedback = "Ninja Master! 🥷";
        else if (pct >= 70) feedback = "Great work! Keep training.";
        else if (pct >= 50) feedback = "Good effort. Try again!";
        else feedback = "Keep practicing, young grasshopper.";

        document.getElementById('feedback-text').innerText = feedback;

        App.showView('review');
    };

    // --- STORAGE ---
    App.loadStats = function () {
        try {
            var json = localStorage.getItem(STORAGE_KEY);
            if (json) {
                App.stats = JSON.parse(json);
            } else {
                App.stats = { totalQuestions: 0, totalCorrect: 0, history: [] };
            }
        } catch (e) {
            console.error("Storage Error", e);
            App.stats = { totalQuestions: 0, totalCorrect: 0, history: [] };
        }
        App.renderStats();
    };

    App.saveStats = function (subject, score, total, time) {
        if (!App.stats) App.stats = { totalQuestions: 0, totalCorrect: 0, history: [] };

        App.stats.totalQuestions += total;
        App.stats.totalCorrect += score;
        App.stats.history.unshift({
            date: new Date().toISOString(),
            subject: subject,
            score: score,
            total: total,
            time: time
        });

        // Limit history
        if (App.stats.history.length > 20) App.stats.history.length = 20;

        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(App.stats));
        } catch (e) {
            console.error("Save Error", e);
        }
        App.renderStats();
    };

    App.renderStats = function () {
        var el = document.getElementById('stats-display');
        if (el && App.stats) {
            el.innerText = "Total Questions Answered: " + App.stats.totalQuestions +
                " (Accuracy: " + (App.stats.totalQuestions > 0 ? Math.round((App.stats.totalCorrect / App.stats.totalQuestions) * 100) : 0) + "%)";
        }
    };

})();
