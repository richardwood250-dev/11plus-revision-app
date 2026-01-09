import React, { useState, useEffect } from 'react';
import { Upload, X, Check, Calculator, Book, Lightbulb, Puzzle, GraduationCap, ChevronLeft, Home, Info, Star, FileText, ZoomIn, Eye, Lock, Zap, Award } from 'lucide-react';

// --- CONFIGURATION ---

const ENGLISH_URLS = {
  comprehension: 'https://raw.githubusercontent.com/richardwood250-dev/11plus-english/refs/heads/main/questions%20comprehension.csv',
  spelling:      'https://raw.githubusercontent.com/richardwood250-dev/11plus-english/refs/heads/main/Questions%20-%20Spelling.csv',
  grammar:       'https://raw.githubusercontent.com/richardwood250-dev/11plus-english/refs/heads/main/Questions%20-%20Grammar.csv',
  cloze:         'https://raw.githubusercontent.com/richardwood250-dev/11plus-english/refs/heads/main/Questions%20-%20Cloze.csv'
};

const MATHS_URL = 'https://raw.githubusercontent.com/richardwood250-dev/11plus-maths/refs/heads/main/Questions%20-%20Maths.csv';
const MATHS_IMG_BASE = 'https://raw.githubusercontent.com/richardwood250-dev/11plus-maths/refs/heads/main/';
const ENGLISH_TEXT_BASE = 'https://raw.githubusercontent.com/richardwood250-dev/11plus-english/refs/heads/main/';
const REPO_BASE_VR = 'https://raw.githubusercontent.com/richardwood250-dev/11plus-verbal/refs/heads/main/';

// --- THEMES ---
const THEMES = {
  maths: { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-500', accent: 'bg-orange-500', header: 'bg-orange-600' },
  english: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-500', accent: 'bg-blue-600', header: 'bg-blue-600' },
  vr: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-500', accent: 'bg-purple-600', header: 'bg-purple-600' },
  nvr: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-500', accent: 'bg-emerald-600', header: 'bg-emerald-600' },
  default: { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-400', accent: 'bg-slate-600', header: 'bg-slate-700' },
  mixed: { bg: 'bg-pink-50', text: 'text-pink-600', border: 'border-pink-500', accent: 'bg-pink-500', header: 'bg-gradient-to-r from-pink-500 to-rose-500' }
};

// --- CONTENT DICTIONARIES ---
const ENGLISH_INSTRUCTIONS = {
  "spelling": { title: "Spelling", instruction: "Read the sentence options. Select the part that contains a spelling mistake, or select 'No Mistake'.", tip: "Read phonetically. Does it look right?" },
  "grammar": { title: "Grammar", instruction: "Select the option that contains a punctuation or grammatical error. If there are no errors, select 'No Mistake'.", tip: "Check for capital letters, full stops, and correct verb tenses." },
  "cloze": { title: "Cloze", instruction: "Fill in the missing words to complete the passage.", tip: "Use the context of the whole sentence." },
  "default": { title: "English", instruction: "Answer the questions below.", tip: "Take your time." }
};

const MATHS_INSTRUCTION = { 
  title: "Maths", 
  instruction: "Solve the problems below. You can click on any image to make it bigger!", 
  tip: "Double-check your working out before selecting an answer." 
};

const VR_CONTENT = {
  "Hidden Words": { header: "Hidden Words", instruction: "Find the hidden word that is formed by joining the end of one word and the start of the next.", tip: "Read the sentence aloud slowly." },
  "Move a Letter": { header: "Move a Letter", instruction: "Move one letter from the first word to the second word to make two new words.", tip: "The letter is usually a vowel or 's'." },
  "Compound Word Bridge": { header: "Make a New Word", instruction: "Select one word from each group to combine into a new compound word.", tip: "Must form a real single word." },
  "Letters for Numbers": { header: "Word Algebra", instruction: "Letters stand for numbers. Solve the sum.", tip: "Write values above the letters." },
  "Missing 3 Letters": { header: "Complete the Word", instruction: "The word in capitals has had three consecutive letters removed. Find the missing letters.", tip: "Use the sentence context to guess the big word first." },
  "Synonyms & Antonyms": { header: "Synonyms & Antonyms", instruction: "Select two words closest in meaning (Synonym) or most opposite (Antonym).", tip: "Check the header to see which one is required!" },
  "Verbal Analogies": { header: "Word Connections", instruction: "Identify the relationship between the first pair of words. Select the word that completes the second pair using the same relationship.", tip: "Create a sentence linking the first two words (e.g. 'A Glove goes on a Hand'), then apply it to the second pair." },
  "Logical Deduction": { header: "Logic Puzzle", instruction: "Read the scenario carefully. Use the information provided to deduce the correct answer.", tip: "Only use the facts provided in the text. Do not guess!" },
  "Corresponding Letters": { header: "Alphabet Relations", instruction: "Find the letters that complete the pattern.", tip: "Count the jumps between letters." },
  "Letter Codes": { header: "Crack the Code", instruction: "Work out the code pattern to find the answer.", tip: "Check the first and last letters." },
  "Sequences": { header: "Number Series", instruction: "Find the number that continues the sequence.", tip: "Look for gaps (add, subtract, double)." },
  "Missing Letter": { header: "Insert a Letter", instruction: "Find the letter that finishes the first word and starts the second.", tip: "Try vowels first." },
  "Letter Sequences": { header: "Letter Series", instruction: "Choose the pair of letters that comes next.", tip: "Treat first and second letters as separate patterns." },
  "Compound Words": { header: "Middle Word Link", instruction: "Find the word that bridges the two others.", tip: "Must make sense with both sides." },
  "Homonyms": { header: "One Word for Two Pairs", instruction: "Find one word that fits both pairs.", tip: "Think of words with double meanings." },
  "Odd 2 Out": { header: "Odd Ones Out", instruction: "Select the TWO words that do not belong in the group.", tip: "Find the three words that are related first, then pick the other two." },
  "Code Words": { header: "Code Matching", instruction: "Match the correct number code to the word.", tip: "Look for repeated letters." },
  "default": { header: "Verbal Reasoning", instruction: "Answer the questions below.", tip: "Read carefully." }
};

const VR_TOPICS = [
  { name: "Hidden Words", file: "Questions%20-%20Hidden%20word%20(1).csv" },
  { name: "Move a Letter", file: "Questions%20-%20Move%20a%20letter%20(1).csv" },
  { name: "Compound Word Bridge", file: "Questions%20-%20Compound%20word%20bridge.csv" },
  { name: "Letters for Numbers", file: "Questions%20-%20Letters%20for%20numbers.csv" },
  { name: "Missing 3 Letters", file: "Questions%20-%20M3L.csv" },
  { name: "Synonyms & Antonyms", file: "Questions%20-%20Syn-Ant.csv" },
  { name: "Verbal Analogies", file: "Questions%20-%20Verbal%20analogies.csv" },
  { name: "Logical Deduction", file: "Questions%20-%20Logical%20deduction.csv" },
  { name: "Corresponding Letters", file: "Questions%20-%20Corresponding%20letters.csv" },
  { name: "Letter Codes", file: "Questions%20-%20Letter%20codes.csv" },
  { name: "Sequences", file: "Questions%20-%20Sequences.csv" },
  { name: "Missing Letter", file: "Questions%20-%20Missing%20letter.csv" },
  { name: "Letter Sequences", file: "Questions%20-%20Letter%20sequences.csv" },
  { name: "Compound Words", file: "Questions%20-%20Compound%20words.csv" },
  { name: "Homonyms", file: "Questions%20-%20Homonyms.csv" },
  { name: "Odd 2 Out", file: "Questions%20-%20Odd%202%20out.csv" },
  { name: "Code Words", file: "Questions%20-%20Word%20codes..csv" },
];

// --- HELPER COMPONENTS ---

const QuizHeader = ({ title, onBack, themeColor = "bg-slate-700", subText }) => (
  <div className={`${themeColor} text-white p-4 shadow-md`}>
    <div className="max-w-5xl mx-auto flex items-center justify-between">
      <button onClick={onBack} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/20 transition-colors">
        <ChevronLeft size={20} />
        <span className="font-bold text-sm uppercase tracking-wide">Back</span>
      </button>
      <div className="text-center">
        <h2 className="text-lg md:text-xl font-bold truncate max-w-xs md:max-w-md">{title}</h2>
        {subText && <p className="text-xs opacity-80">{subText}</p>}
      </div>
      <div className="w-16"></div> 
    </div>
  </div>
);

// Alphabet Bar for Letter Codes / Sequences / Code Words
const AlphabetBar = () => (
  <div className="bg-white border-b border-slate-200 shadow-sm overflow-x-auto py-2">
    <div className="max-w-4xl mx-auto px-4 flex justify-between min-w-[600px]">
      {"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map(char => (
        <div key={char} className="flex flex-col items-center w-6">
          <span className="text-[10px] font-bold text-slate-400">{char.charCodeAt(0) - 64}</span>
          <span className="text-base font-black text-slate-700">{char}</span>
        </div>
      ))}
    </div>
  </div>
);

const SubjectMenuHeader = ({ title, onHome, themeColor = "bg-slate-700" }) => (
  <div className={`${themeColor} text-white p-6 shadow-xl rounded-b-3xl mb-6 relative overflow-hidden`}>
    <div className="absolute top-0 left-0 w-full h-full bg-white/5 pointer-events-none"></div>
    <div className="max-w-5xl mx-auto flex items-center justify-between relative z-10">
      <button onClick={onHome} className="flex items-center gap-2 px-4 py-2 bg-white/20 rounded-xl hover:bg-white/30 transition-colors backdrop-blur-sm">
        <Home size={20} />
        <span className="font-bold text-sm">Home</span>
      </button>
      <h1 className="text-3xl md:text-4xl font-black tracking-tight drop-shadow-md">{title}</h1>
      <div className="w-24"></div> 
    </div>
  </div>
);

const ImageWithFallback = ({ filename, baseUrl, alt }) => {
  const [src, setSrc] = useState(baseUrl + filename);
  const [attempt, setAttempt] = useState(0); 
  const [isZoomed, setIsZoomed] = useState(false);

  const handleError = () => {
    if (attempt === 0) { setSrc(baseUrl + filename.toLowerCase()); setAttempt(1); }
    else if (attempt === 1) { setSrc(baseUrl + filename.toUpperCase()); setAttempt(2); }
    else { setSrc(null); }
  };

  if (!src) return null;

  return (
    <>
      <div className="mt-4 relative group cursor-zoom-in inline-block" onClick={() => setIsZoomed(true)}>
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-xl flex items-center justify-center pointer-events-none">
           <ZoomIn className="text-white opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 transition-all drop-shadow-md" size={32} />
        </div>
        <img src={src} alt={alt} onError={handleError} className="rounded-xl border border-slate-200 max-h-64 object-contain bg-white" />
        <p className="text-xs text-slate-400 mt-2 text-center font-medium italic">Click to zoom</p>
      </div>
      {isZoomed && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 cursor-pointer" onClick={(e) => { e.stopPropagation(); setIsZoomed(false); }}>
           <img src={src} alt="Zoomed" className="max-w-full max-h-full rounded-lg shadow-2xl" />
           <button className="absolute top-6 right-6 text-white bg-white/20 p-2 rounded-full hover:bg-white/30"><X size={32}/></button>
        </div>
      )}
    </>
  );
};

// --- DATA NORMALIZATION ---
const parseCSV = (text) => {
  if (!text) return [];
  const rows = [];
  let currentRow = [];
  let currentVal = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];
    if (char === '"') {
      if (inQuotes && nextChar === '"') { currentVal += '"'; i++; } else { inQuotes = !inQuotes; }
    } else if (char === ',' && !inQuotes) {
      currentRow.push(currentVal.trim()); currentVal = '';
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (currentVal || currentRow.length > 0) currentRow.push(currentVal.trim());
      if (currentRow.length > 0) rows.push(currentRow);
      currentRow = []; currentVal = '';
      if (char === '\r' && nextChar === '\n') i++;
    } else { currentVal += char; }
  }
  if (currentVal || currentRow.length > 0) { currentRow.push(currentVal.trim()); rows.push(currentRow); }
  return rows;
};

// --- SCREENS ---

const DashboardButton = ({ theme, onClick, label, icon: Icon }) => (
  <button onClick={onClick} className="group relative flex flex-col items-center justify-center bg-white p-6 md:p-8 rounded-3xl shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 w-full h-48 md:h-64 overflow-hidden">
    <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 ${theme.bg} transition-opacity duration-300`}></div>
    <div className={`p-5 md:p-6 rounded-full ${theme.bg} ${theme.text} mb-4 md:mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shadow-sm z-10`}>
      {Icon ? <Icon size={48} className="md:w-16 md:h-16" /> : <span className="text-4xl">?</span>}
    </div>
    <span className="text-xl md:text-3xl font-black text-slate-800 z-10 tracking-tight">{label}</span>
  </button>
);

const MenuScreen = ({ navigate }) => (
  <div className="flex flex-col min-h-screen bg-slate-50">
    <header className="bg-gradient-to-br from-indigo-600 to-indigo-800 py-4 px-4 md:px-8 rounded-b-2xl shadow-xl relative z-10 overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-white/10 to-transparent pointer-events-none"></div>
      <div className="max-w-7xl mx-auto flex items-center gap-4 md:gap-6">
        
        {/* LOGO REPLACEMENT: Uses built-in icon so it never fails */}
        <div className="bg-white p-3 rounded-xl shadow-lg border-2 border-white/20">
           <GraduationCap size={40} className="text-indigo-600" />
        </div>

        <div className="text-left">
          <h1 className="text-2xl md:text-4xl font-black text-white tracking-tight drop-shadow-lg leading-tight">Free 4 All <span className="text-orange-300">Education</span></h1>
          <p className="text-indigo-100 font-medium opacity-90 text-sm md:text-base">Your Complete 11+ Revision Companion</p>
        </div>
      </div>
    </header>
    <main className="flex-1 p-6 w-full max-w-7xl mx-auto flex flex-col items-center justify-center">
      
      {/* QUICK START BUTTON */}
      <button onClick={() => navigate('loading', { mode: 'mixed', title: 'Quick Start' })} className="w-full mb-8 group relative flex items-center justify-between p-6 bg-gradient-to-r from-rose-500 to-pink-600 rounded-3xl shadow-xl hover:shadow-2xl hover:scale-[1.01] transition-all duration-300 overflow-hidden">
         <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
         <div className="flex items-center gap-6 z-10">
            <div className="p-4 bg-white/20 rounded-full backdrop-blur-sm">
               <Zap size={40} className="text-white fill-yellow-300" />
            </div>
            <div className="text-left">
               <h2 className="text-2xl md:text-3xl font-black text-white">Quick Start</h2>
               <p className="text-pink-100 font-medium">A bit of everything! (Maths, English & VR)</p>
            </div>
         </div>
         <div className="bg-white text-pink-600 px-6 py-2 rounded-full font-bold text-lg shadow-md group-hover:translate-x-1 transition-transform">Go!</div>
      </button>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 w-full mb-12">
        <DashboardButton theme={THEMES.maths} label="Maths" icon={Calculator} onClick={() => navigate('maths_menu')} />
        <DashboardButton theme={THEMES.english} label="English" icon={Book} onClick={() => navigate('english_menu')} />
        <DashboardButton theme={THEMES.vr} label="Verbal" icon={Lightbulb} onClick={() => navigate('vr_menu')} />
        <DashboardButton theme={THEMES.nvr} label="Non-Verbal" icon={Puzzle} onClick={() => navigate('coming_soon')} />
      </div>

      {/* FOOTER BANNER */}
      <div className="w-full bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-8 shadow-2xl relative overflow-hidden text-center md:text-left flex flex-col md:flex-row items-center gap-8">
         <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
         
         <div className="shrink-0 p-6 bg-white/10 rounded-full backdrop-blur-md border border-white/10">
            <Award size={64} className="text-yellow-400" />
         </div>
         
         <div className="relative z-10 flex-1">
            <h3 className="text-2xl font-bold text-white mb-3">Education should be free for everyone.</h3>
            <p className="text-slate-300 leading-relaxed text-sm md:text-base">
               We believe that everyone, regardless of economic background, should get a fair shot at passing the 11+ exams. 
               To that end we have made this resource, with thousands of practice questions, free to all who need or want to use it. 
               Please use it to your own advantage, and feel free to provide feedback on how we can make it even better.
            </p>
         </div>
      </div>

    </main>
    <footer className="text-center p-4 text-slate-400 text-xs font-semibold">© 2024 Free 4 All Education</footer>
  </div>
);

// --- COMPREHENSION SCREEN ---
const ComprehensionScreen = ({ data, navigate }) => {
  const [answers, setAnswers] = useState({});
  const [showResult, setShowResult] = useState(false);
  const [reviewMode, setReviewMode] = useState(false); 
  const [storyText, setStoryText] = useState("Loading story...");
  
  const questions = data.questions || [];
  const filename = data.filename;

  useEffect(() => {
    if (filename) {
        fetch(ENGLISH_TEXT_BASE + filename)
            .then(r => {
                if(!r.ok) throw new Error("Failed to load text");
                return r.text();
            })
            .then(text => setStoryText(text))
            .catch(err => setStoryText("Error loading story text: " + err.message));
    }
  }, [filename]);

  const handleSelect = (qIndex, option) => {
    if (showResult && !reviewMode) return;
    setAnswers(prev => ({ ...prev, [qIndex]: option }));
  };

  const calculateScore = () => {
    let s = 0;
    questions.forEach((q, idx) => { if (answers[idx] === q.correct) s++; });
    return s;
  };

  const allAnswered = Object.keys(answers).length === questions.length;

  if (showResult && !reviewMode) {
    const score = calculateScore();
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-blue-50">
        <div className="bg-white p-8 rounded-3xl shadow-xl text-center max-w-md w-full">
          <h2 className="text-4xl font-black text-blue-600 mb-4">Reading Complete!</h2>
          <div className="text-6xl font-black text-slate-800 mb-2">{score} / {questions.length}</div>
          <p className="text-slate-500 mb-8 font-medium text-lg">{score === questions.length ? "Perfect Score! 🌟" : "Great Effort! 📚"}</p>
          <button onClick={() => setReviewMode(true)} className="w-full py-4 rounded-xl text-blue-600 font-bold text-lg border-2 border-blue-100 hover:bg-blue-50 mb-4 flex items-center justify-center gap-2"><Eye size={20}/> Review Answers</button>
          <button onClick={() => navigate('english_menu')} className="w-full py-4 rounded-xl text-white font-bold text-lg shadow-lg bg-blue-600 hover:opacity-90">Back to English</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-slate-100 overflow-hidden">
      <QuizHeader title={reviewMode ? "Review Answers" : "Comprehension"} onBack={() => reviewMode ? setReviewMode(false) : navigate('english_menu')} themeColor="bg-blue-600" />
      <div className="flex flex-1 flex-col md:flex-row overflow-hidden">
        <div className="flex-1 bg-white p-8 overflow-y-auto border-r border-slate-200 shadow-inner">
           <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2 sticky top-0 bg-white py-2"><FileText size={24}/> The Story</h3>
           <div className="prose max-w-none text-slate-700 leading-8 text-lg font-serif whitespace-pre-wrap">{storyText}</div>
        </div>
        <div className="flex-1 bg-slate-50 p-6 overflow-y-auto">
          <h3 className="text-xl font-bold text-slate-800 mb-4">{reviewMode ? "Review" : "Questions"}</h3>
          <div className="space-y-6 pb-20">
            {questions.map((q, idx) => {
              return (
                <div key={idx} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                   <div className="flex gap-3 mb-4">
                     <span className="bg-blue-100 text-blue-700 font-bold w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0">{idx+1}</span>
                     <p className="font-semibold text-slate-800 text-lg">{q.question}</p>
                   </div>
                   <div className="flex flex-col gap-3">
                     {q.options.map((opt, i) => {
                       let btnClass = "border-slate-200 hover:border-blue-300";
                       if (reviewMode) {
                          if (opt === q.correct) btnClass = "bg-green-100 border-green-500 text-green-800 font-bold";
                          else if (answers[idx] === opt) btnClass = "bg-red-100 border-red-500 text-red-800";
                          else btnClass = "opacity-50 border-slate-100";
                       } else {
                          if (answers[idx] === opt) btnClass = "border-blue-500 bg-blue-50 text-blue-700 ring-1 ring-blue-500";
                       }
                       return (
                         <button disabled={reviewMode} key={i} onClick={() => handleSelect(idx, opt)} className={`w-full p-4 text-left text-base rounded-lg border-2 transition-all ${btnClass}`}>{opt}</button>
                       );
                     })}
                   </div>
                   {reviewMode && q.explanation && (
                     <div className="mt-4 p-3 bg-blue-50 text-blue-800 rounded-lg text-sm border border-blue-200">
                       <strong>Explanation:</strong> {q.explanation}
                     </div>
                   )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      {!reviewMode && (
        <div className="bg-white p-4 border-t shadow-lg z-20">
           <button onClick={() => setShowResult(true)} disabled={!allAnswered} className={`w-full max-w-md mx-auto block py-3 text-white font-bold rounded-xl transition-all ${allAnswered ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-300 cursor-not-allowed flex items-center justify-center gap-2'}`}>
             {allAnswered ? 'Submit Answers' : <><Lock size={18}/> Answer All Questions</>}
           </button>
        </div>
      )}
    </div>
  );
};

// --- CLOZE SCREEN ---
const ClozeScreen = ({ data, navigate }) => {
  const [answers, setAnswers] = useState({});
  const [showResult, setShowResult] = useState(false);
  const [reviewMode, setReviewMode] = useState(false); 
  
  const questions = data.questions || [];
  const storyText = questions.length > 0 ? questions[0].text : "No text found.";

  const handleSelect = (qIndex, option) => {
    if (showResult && !reviewMode) return;
    setAnswers(prev => ({ ...prev, [qIndex]: option }));
  };

  const calculateScore = () => {
    let s = 0;
    questions.forEach((q, idx) => { if (answers[idx] === q.correct) s++; });
    return s;
  };

  const allAnswered = Object.keys(answers).length === questions.length;

  if (showResult && !reviewMode) {
    const score = calculateScore();
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-blue-50">
        <div className="bg-white p-8 rounded-3xl shadow-xl text-center max-w-md w-full">
          <h2 className="text-4xl font-black text-blue-600 mb-4">Cloze Complete!</h2>
          <div className="text-6xl font-black text-slate-800 mb-2">{score} / {questions.length}</div>
          <p className="text-slate-500 mb-8 font-medium text-lg">{score === questions.length ? "Perfect Score! 🌟" : "Good Practice! 📚"}</p>
          <button onClick={() => setReviewMode(true)} className="w-full py-4 rounded-xl text-blue-600 font-bold text-lg border-2 border-blue-100 hover:bg-blue-50 mb-4 flex items-center justify-center gap-2"><Eye size={20}/> Review Answers</button>
          <button onClick={() => navigate('english_menu')} className="w-full py-4 rounded-xl text-white font-bold text-lg shadow-lg bg-blue-600 hover:opacity-90">Back to English</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-slate-100 overflow-hidden">
      <QuizHeader title={reviewMode ? "Review Answers" : "Cloze Exercise"} onBack={() => reviewMode ? setReviewMode(false) : navigate('english_menu')} themeColor="bg-blue-600" />
      <div className="flex flex-1 flex-col md:flex-row overflow-hidden">
        <div className="flex-1 bg-white p-8 overflow-y-auto border-r border-slate-200 shadow-inner">
           <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2 sticky top-0 bg-white py-2"><FileText size={24}/> The Passage</h3>
           <div className="prose max-w-none text-slate-700 leading-8 text-lg font-serif whitespace-pre-wrap">{storyText}</div>
        </div>
        <div className="flex-1 bg-slate-50 p-6 overflow-y-auto">
          <h3 className="text-xl font-bold text-slate-800 mb-4">{reviewMode ? "Review" : "Fill the Gaps"}</h3>
          <div className="space-y-6 pb-20">
            {questions.map((q, idx) => {
              return (
                <div key={idx} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                   <div className="flex gap-3 mb-4">
                     <span className="bg-blue-100 text-blue-700 font-bold w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0">{idx+1}</span>
                     <p className="font-semibold text-slate-800 text-lg">Question {q.question}</p> 
                   </div>
                   <div className="flex flex-wrap gap-3">
                     {q.options.map((opt, i) => {
                       let btnClass = "border-slate-200 hover:border-blue-300";
                       if (reviewMode) {
                          if (opt === q.correct) btnClass = "bg-green-100 border-green-500 text-green-800 font-bold";
                          else if (answers[idx] === opt) btnClass = "bg-red-100 border-red-500 text-red-800";
                          else btnClass = "opacity-50 border-slate-100";
                       } else {
                          if (answers[idx] === opt) btnClass = "border-blue-500 bg-blue-50 text-blue-700 ring-1 ring-blue-500";
                       }
                       return (
                         <button disabled={reviewMode} key={i} onClick={() => handleSelect(idx, opt)} className={`flex-1 min-w-[80px] p-3 text-center text-base rounded-lg border-2 transition-all ${btnClass}`}>{opt}</button>
                       );
                     })}
                   </div>
                   {reviewMode && q.explanation && (
                     <div className="mt-4 p-3 bg-blue-50 text-blue-800 rounded-lg text-sm border border-blue-200">
                       <strong>Explanation:</strong> {q.explanation}
                     </div>
                   )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      {!reviewMode && (
        <div className="bg-white p-4 border-t shadow-lg z-20">
           <button onClick={() => setShowResult(true)} disabled={!allAnswered} className={`w-full max-w-md mx-auto block py-3 text-white font-bold rounded-xl transition-all ${allAnswered ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-300 cursor-not-allowed flex items-center justify-center gap-2'}`}>
             {allAnswered ? 'Submit Answers' : <><Lock size={18}/> Answer All Questions</>}
           </button>
        </div>
      )}
    </div>
  );
};

// --- SCROLLABLE QUIZ (WORKSHEET) ---
const ScrollableQuizScreen = ({ data, navigate }) => {
  const [answers, setAnswers] = useState({});
  const [showResult, setShowResult] = useState(false);
  const [reviewMode, setReviewMode] = useState(false); 
  const [zoomedImg, setZoomedImg] = useState(null); 
  const questions = data.questions || [];
  const mode = data.mode;
  
  const theme = THEMES[mode] || THEMES.default;
  
  // Title Logic
  const title = data.title || (mode === 'maths' ? "Maths" : "Quiz");
  const isOdd2Out = title === 'Odd 2 Out';
  const showAlphabet = ['Letter Codes', 'Letter Sequences', 'Code Words'].includes(title);
  
  let content;
  let headerColor;
  if (mode === 'maths') {
    content = { ...MATHS_INSTRUCTION, title: "Maths" };
    headerColor = THEMES.maths.header;
  } else if (mode === 'vr') {
    content = VR_CONTENT[title] || VR_CONTENT["default"];
    headerColor = THEMES.vr.header;
  } else if (mode === 'mixed') {
    content = { title: "Quick Start", instruction: "A mix of Maths, English, and Verbal Reasoning!", tip: "Switch your brain gears quickly!" };
    headerColor = THEMES.mixed.header;
  } else {
    // English (Spelling, Grammar, etc when standalone)
    content = ENGLISH_INSTRUCTIONS[mode] || ENGLISH_INSTRUCTIONS["default"];
    headerColor = THEMES.english.header;
  }

  const handleSelect = (qIndex, option) => {
    if (showResult && !reviewMode) return;
    
    // ODD 2 OUT LOGIC (Multi-Select, max 2)
    if (isOdd2Out) {
        const currentSelected = answers[qIndex] || [];
        let newSelected;
        if (currentSelected.includes(option)) {
            newSelected = currentSelected.filter(o => o !== option);
        } else {
            if (currentSelected.length < 2) {
                newSelected = [...currentSelected, option];
            } else {
                newSelected = [currentSelected[1], option];
            }
        }
        setAnswers(prev => ({ ...prev, [qIndex]: newSelected }));
    } else {
        setAnswers(prev => ({ ...prev, [qIndex]: option }));
    }
  };

  // Helper to check answer loose match 
  const isCorrect = (q, selected) => {
      if(!q.correct || !selected) return false;
      const cleanCorrect = (q.correct || "").toString().trim();
      
      // ODD 2 OUT LOGIC
      if (isOdd2Out) {
          if (!Array.isArray(selected) || selected.length !== 2) return false;
          // Parse correct string "AD" -> indices 0 and 3 -> Options[0] and Options[3]
          const correctIndices = cleanCorrect.split('').map(char => char.charCodeAt(0) - 65); // A=0, B=1...
          const correctOptions = correctIndices.map(i => q.options[i]);
          
          // Check if both selected options are in the correctOptions array
          return selected.every(s => correctOptions.includes(s));
      }

      const cleanSelected = (selected || "").toString().trim();
      
      // Strict matching for Maths/VR (except specific types)
      if (mode === 'maths') {
          return cleanCorrect === cleanSelected;
      }

      // Exact match
      if(cleanCorrect === cleanSelected) return true;
      if(cleanCorrect.toLowerCase() === cleanSelected.toLowerCase()) return true;

      // Single Letter mapping 
      if((mode === 'english' || mode === 'vr' || mode === 'mixed') && cleanCorrect.length === 1 && cleanCorrect >= 'A' && cleanCorrect <= 'E') {
         const index = cleanCorrect.toUpperCase().charCodeAt(0) - 65; 
         if(q.options && q.options[index] === selected) return true;
      }

      // English Loose Match (Explanation check)
      if (mode === 'english' || (mode === 'mixed' && q.subject === 'english')) {
          if (q.explanation && q.explanation.toLowerCase().includes(cleanSelected.toLowerCase())) return true;
      }
      
      // VR Hidden Word specific (ignore spaces)
      if ((mode === 'vr' || mode === 'mixed') && q.topic === 'Hidden Words') {
          if (cleanSelected.replace(/\s+/g, '').toLowerCase().includes(cleanCorrect.toLowerCase())) return true;
      }

      return false;
  };

  const calculateScore = () => {
    let s = 0;
    questions.forEach((q, idx) => { 
        if (isCorrect(q, answers[idx])) s++; 
    });
    return s;
  };

  const isAnsweredCorrectly = (idx) => {
      if (isOdd2Out) return (answers[idx] && answers[idx].length === 2);
      return answers[idx] !== undefined;
  }

  const allAnswered = questions.every((_, idx) => isAnsweredCorrectly(idx));

  if (showResult && !reviewMode) {
    const score = calculateScore();
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center p-6 ${theme.bg}`}>
        <div className="bg-white p-8 rounded-3xl shadow-xl text-center max-w-md w-full">
          <h2 className={`text-4xl font-black ${theme.text} mb-4`}>Quiz Complete!</h2>
          <div className="text-6xl font-black text-slate-800 mb-2">{score} / {questions.length}</div>
          <p className="text-slate-500 mb-8 font-medium text-lg">{score === questions.length ? "Perfect! 🌟" : "Good Practice! 📚"}</p>
          <button onClick={() => setReviewMode(true)} className={`w-full py-4 rounded-xl ${theme.text} font-bold text-lg border-2 border-slate-200 hover:bg-slate-50 mb-4 flex items-center justify-center gap-2`}><Eye size={20}/> Review Answers</button>
          <button onClick={() => navigate('menu')} className={`w-full py-4 rounded-xl text-white font-bold text-lg shadow-lg hover:opacity-90 transition-all ${theme.accent}`}>Back to Menu</button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col ${theme.bg}`}>
      {zoomedImg && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 cursor-pointer" onClick={() => setZoomedImg(null)}>
           <img src={zoomedImg} alt="Zoomed" className="max-w-full max-h-full rounded-lg shadow-2xl transition-transform transform scale-100 hover:scale-105" />
           <button className="absolute top-6 right-6 text-white bg-white/20 p-2 rounded-full"><X size={32}/></button>
        </div>
      )}
      
      <div className="sticky top-0 z-40">
        <QuizHeader title={reviewMode ? "Reviewing Answers" : (content.header || content.title || title)} subText={reviewMode ? "Check your mistakes" : `${questions.length} Questions`} onBack={() => reviewMode ? setReviewMode(false) : navigate('menu')} themeColor={headerColor} />
        {showAlphabet && <AlphabetBar />}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto space-y-8 pb-24 pt-4">
          {!reviewMode && (content.instruction || content.tip) && (
          <div className="bg-white p-6 rounded-[2rem] border-4 border-dashed border-slate-200 shadow-sm relative overflow-hidden">
             <div className="flex flex-col md:flex-row gap-6 items-start">
                <div className="flex-1">
                   <div className="flex items-center gap-2 mb-2"><Info className={`${theme.text}`} size={24} /><h3 className={`text-xl font-black ${theme.text} uppercase tracking-wider`}>Mission</h3></div>
                   <p className="text-lg text-slate-700 font-medium leading-relaxed">{content.instruction}</p>
                </div>
                {content.tip && <div className="relative bg-gradient-to-br from-yellow-50 to-amber-50 p-5 rounded-2xl shadow-sm border border-amber-100 max-w-sm w-full"><div className="absolute top-4 -left-2 w-4 h-4 bg-yellow-50 border-l border-b border-amber-100 transform rotate-45"></div><div className="flex items-start gap-3"><div className="bg-amber-100 p-2 rounded-full text-amber-600"><Star size={20} fill="currentColor" /></div><div><h4 className="font-bold text-amber-800 text-sm uppercase mb-1">Pro Tip</h4><p className="text-amber-900 text-sm font-medium italic">"{content.tip}"</p></div></div></div>}
             </div>
          </div>
          )}
          {questions.map((q, idx) => {
            const isAnswered = isOdd2Out ? (answers[idx] && answers[idx].length > 0) : (answers[idx] !== undefined);
            const correctState = isCorrect(q, answers[idx]);
            
            // Determine header for mixed mode
            let qHeader = q.topic || (mode === 'maths' ? "Maths" : "Question");
            
            return (
              <div key={idx} className={`bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow ${reviewMode && !correctState ? 'ring-2 ring-red-200' : ''}`}>
                <div className="flex gap-5 mb-6">
                  <span className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-black text-lg shadow-sm ${reviewMode ? (correctState ? 'bg-green-500 text-white' : 'bg-red-500 text-white') : (isAnswered ? theme.accent + ' text-white' : 'bg-slate-100 text-slate-400')}`}>{reviewMode && correctState ? <Check size={20}/> : (reviewMode ? <X size={20}/> : idx + 1)}</span>
                  <div className="flex-1">
                    {/* Header for Mixed Mode */}
                    {mode === 'mixed' && <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 block">{qHeader}</span>}

                    {/* HIDE QUESTION ID IF MODE IS VR OR SPELLING/GRAMMAR */}
                    {q.question && <h3 className="text-xl font-bold text-slate-800 leading-relaxed whitespace-pre-wrap">{q.question}</h3>}
                    
                    {/* MOVE A LETTER FORMATTING */}
                    {q.topic === 'Move a Letter' && !q.question && q.options && (
                        <h3 className="text-xl font-bold text-slate-800 leading-relaxed tracking-wide text-center bg-slate-50 p-4 rounded-xl border border-slate-200 mb-4">
                           Move a letter from the left word to the right.
                        </h3>
                    )}
                    
                    {q.image && <ImageWithFallback filename={q.image} baseUrl={MATHS_IMG_BASE} alt={`Question ${idx + 1}`} />}
                  </div>
                </div>
                <div className="flex flex-wrap gap-3 pl-0 md:pl-16">
                  {q.options.map((opt, i) => {
                    let btnClass = "border-slate-100 bg-white text-slate-600";
                    const isSelected = isOdd2Out ? (answers[idx] || []).includes(opt) : (answers[idx] === opt);

                    if (reviewMode) {
                        let isThisOptCorrect = false;
                        if (isOdd2Out) {
                            const correctIndices = (q.correct || "").toString().trim().split('').map(c => c.charCodeAt(0) - 65);
                            const correctOptions = correctIndices.map(ci => q.options[ci]);
                            isThisOptCorrect = correctOptions.includes(opt);
                        } else {
                            isThisOptCorrect = isCorrect(q, opt);
                        }

                        if (isThisOptCorrect) btnClass = "bg-green-100 border-green-500 text-green-800 ring-2 ring-green-200 font-bold";
                        else if (isSelected) btnClass = "bg-red-100 border-red-500 text-red-800";
                        else btnClass = "opacity-50 grayscale";
                    } else {
                        if (isSelected) btnClass = `border-${theme.text.split('-')[1]}-500 bg-${theme.text.split('-')[1]}-50 text-${theme.text.split('-')[1]}-700 ring-2 ring-${theme.text.split('-')[1]}-200`;
                        else btnClass = "hover:border-slate-300 hover:bg-slate-50";
                    }
                    return (
                      <button disabled={reviewMode} key={i} onClick={() => handleSelect(idx, opt)} className={`flex-1 min-w-[120px] p-4 rounded-2xl text-left text-base font-semibold transition-all border-2 shadow-sm ${btnClass}`}>{opt}</button>
                    );
                  })}
                </div>
                {reviewMode && q.explanation && (
                  <div className="mt-4 p-3 bg-blue-50 text-blue-800 rounded-lg text-sm border border-blue-200 flex gap-2">
                    <Info size={18} className="shrink-0 mt-0.5" />
                    <div><strong>Explanation:</strong> {q.explanation}</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      {!reviewMode && <div className="fixed bottom-0 left-0 w-full bg-white border-t p-4 shadow-[0_-5px_20px_rgba(0,0,0,0.05)] z-30"><div className="max-w-3xl mx-auto"><button onClick={() => setShowResult(true)} disabled={!allAnswered} className={`w-full py-4 rounded-2xl font-bold text-xl shadow-lg transition-all transform active:scale-95 ${allAnswered ? theme.accent + ' text-white hover:brightness-110' : 'bg-slate-200 text-slate-400 cursor-not-allowed flex items-center justify-center gap-2'}`}>{allAnswered ? 'Submit Answers! 🚀' : <><Lock size={20}/> Answer All Questions</>}</button></div></div>}
    </div>
  );
};

// --- DATA LOADER ---
const GenericLoadingScreen = ({ config, navigate }) => {
 const [status, setStatus] = useState("Connecting...");
 const mode = config.mode;
 const theme = THEMES[mode] || THEMES.default;

 const mapQuestionData = (row, mode, subMode, title) => {
    if (!row || row.length === 0) return {};
    let q = { topic: title, subject: mode }; 
    
    if (mode === 'maths') {
       q = { ...q, question: row[0], image: (row[1] || "").trim() || null, options: [row[2], row[3], row[4], row[5], row[6]].filter(x => x && x.trim()), correct: row[7], difficulty: parseInt(row[8]) || 0, ref: row[11] || "" };
    } else if (mode === 'vr') {
       if (title === 'Move a Letter') {
          const w1 = row[1]; const w2 = row[2];
          q = { ...q, question: `${w1}  ➔  ${w2}`, options: [row[3], row[4], row[5], row[6], row[7]].filter(x => x), correct: row[8], explanation: row[9] };
       } 
       else if (title === 'Compound Word Bridge') {
          q = { ...q, question: row[0], options: [row[1], row[2], row[3], row[4], row[5]].filter(x => x), correct: row[6], difficulty: parseInt(row[7]), explanation: "" };
       }
       else if (title === 'Letters for Numbers') {
          let correct = row[8]; if (correct && correct.startsWith("Option")) correct = correct.replace("Option", "");
          q = { ...q, question: `Key: ${row[1] || ""}\n\nEquation: ${row[2] || ""}`, options: [row[3], row[4], row[5], row[6], row[7]].filter(x => x), correct: correct, explanation: row[9] };
       }
       else if (title === 'Missing 3 Letters') { 
          q = { ...q, question: row[1], options: [row[2], row[3], row[4], row[5], row[6]].filter(x => x), correct: row[7], explanation: row[8] };
       }
       else if (title === 'Synonyms & Antonyms') {
          q = { ...q, question: row[0], options: [row[1], row[2], row[3], row[4], row[5]].filter(x => x), correct: row[6], difficulty: parseInt((row[7] || "").replace('Level ', '')) || 1, explanation: "" };
       }
       else if (title === 'Verbal Analogies') {
          q = { ...q, question: row[1], options: [row[2], row[3], row[4], row[5], row[6]].filter(x => x), correct: row[7], explanation: row[8] };
       }
       else if (title === 'Logical Deduction') {
          q = { ...q, question: row[2], options: [row[3], row[4], row[5], row[6], row[7]].filter(x => x), correct: row[8], explanation: row[9] };
       }
       else if (title === 'Missing Letter' || title === 'Letter Sequences') {
          q = { ...q, question: row[0], options: [row[1], row[2], row[3], row[4], row[5]].filter(x => x), correct: row[6], explanation: row[7] };
       }
       else if (title === 'Homonyms') {
          q = { ...q, question: row[2], options: [row[3], row[4], row[5], row[6], row[7]].filter(x => x), correct: row[8], explanation: row[9] };
       }
       else if (title === 'Sequences') {
          q = { ...q, question: row[1], options: [row[2], row[3], row[4], row[5], row[6]].filter(x => x), correct: row[7], difficulty: parseInt(row[8]), explanation: "" };
       }
       else if (['Corresponding Letters', 'Letter Codes', 'Compound Words', 'Odd 2 Out', 'Code Words'].includes(title)) {
          q = { ...q, question: row[1], options: [row[2], row[3], row[4], row[5], row[6]].filter(x => x), correct: row[7], explanation: row[8] };
       }
       else {
          q = { ...q, question: null, options: [row[2], row[3], row[4], row[5], row[6]].filter(x => x), correct: row[7], explanation: row[9] || row[8] || "" };
       }
    } 
    else if (mode === 'english') {
       if (subMode === 'spelling') {
          const opts = [row[1], row[2], row[3], row[4]].filter(x => x); if(opts.length === 4) opts.push("No mistake");
          let correct = (row[5] || "").trim(); if(correct === 'N' || correct === 'n') correct = "No mistake";
          q = { ...q, question: null, options: opts, correct: correct, explanation: row[6] };
       }
       else if (subMode === 'grammar') {
          const opts = [row[2], row[3], row[4], row[5]].filter(x => x); if(opts.length === 4) opts.push("No mistake");
          let correctRaw = (row[6] || "").trim();
          let correct = correctRaw;
          if (correctRaw.length === 1) { const upper = correctRaw.toUpperCase(); if (upper === 'A') correct = opts[0]; else if (upper === 'B') correct = opts[1]; else if (upper === 'C') correct = opts[2]; else if (upper === 'D') correct = opts[3]; else if (upper === 'E' || upper === 'N') correct = opts[4]; }
          else if (correctRaw.toLowerCase() === 'no mistake') { correct = opts[4]; }
          q = { ...q, question: null, options: opts, correct: correct, explanation: row[7] };
       }
       else if (subMode === 'cloze') {
          const opts = [row[4], row[5], row[6], row[7], row[8]].filter(x => x);
          q = { ...q, question: row[3], text: row[2], options: opts, correct: row[9], passageId: row[0], explanation: row[10] };
       }
    }
    return q;
 };

 const processData = async () => {
  if (mode === 'mixed' && config.title === 'Quick Start') {
      try {
          const mathRes = await fetch(MATHS_URL);
          const mathRows = parseCSV(await mathRes.text()); mathRows.shift();
          const maths = mathRows.map(r => mapQuestionData(r, 'maths')).filter(q => q.difficulty >= 13 && q.difficulty <= 38).sort(() => 0.5 - Math.random()).slice(0, 3);

          const engTypes = ['grammar', 'spelling', 'cloze'];
          const pickedEngType = engTypes[Math.floor(Math.random() * engTypes.length)];
          const engRes = await fetch(ENGLISH_URLS[pickedEngType]);
          const engRows = parseCSV(await engRes.text()); engRows.shift();
          let engQs = [];
          if(pickedEngType === 'cloze') {
             const groups = {}; engRows.forEach(r => { if(r.length>5) { const k=r[0]; if(!groups[k]) groups[k]=[]; groups[k].push(mapQuestionData(r, 'english', 'cloze')); }});
             const keys = Object.keys(groups);
             if(keys.length > 0) { const randKey = keys[Math.floor(Math.random()*keys.length)]; engQs = groups[randKey].slice(0, 3); }
          } else {
             engQs = engRows.map(r => mapQuestionData(r, 'english', pickedEngType)).sort(() => 0.5 - Math.random()).slice(0, 3);
          }

          const vrTopicsShuffled = VR_TOPICS.sort(() => 0.5 - Math.random()).slice(0, 2);
          let vrQs = [];
          for (const topic of vrTopicsShuffled) {
              try {
                  const res = await fetch(REPO_BASE_VR + topic.file);
                  const rows = parseCSV(await res.text()); rows.shift();
                  const qs = rows.map(r => mapQuestionData(r, 'vr', null, topic.name)).sort(() => 0.5 - Math.random()).slice(0, 3);
                  vrQs = [...vrQs, ...qs];
              } catch(e) { console.error("Skip topic", topic); }
          }

          const combined = [...maths, ...engQs, ...vrQs];
          navigate('quiz_scrollable', { questions: combined, title: 'Quick Start', mode: 'mixed' });

      } catch (e) {
          alert("Error loading quick start: " + e.message);
          navigate('menu');
      }
      return;
  }

  const url = config.url || (config.mode === 'maths' ? MATHS_URL : null); 
  if (!url) return;
  
  try {
      const res = await fetch(url);
      const rows = parseCSV(await res.text());
      if (rows.length > 0 && (rows[0][0].toLowerCase().includes('question') || rows[0][0].toLowerCase().includes('id') || rows[0][0].toLowerCase().includes('passage'))) rows.shift();

      if (mode === 'english' && config.subMode === 'cloze') {
         const groups = {};
         rows.forEach(r => { if(r.length < 5) return; const key = r[0]; if(!groups[key]) groups[key] = []; groups[key].push(mapQuestionData(r, mode, config.subMode, config.title)); });
         const keys = Object.keys(groups); const randomKey = keys[Math.floor(Math.random() * keys.length)];
         navigate('cloze_screen', { questions: groups[randomKey], mode: 'english' });
         return;
      }

      if (mode === 'english' && config.subMode === 'grammar') {
         const groups = {};
         rows.forEach(r => { if(r.length < 5) return; const key = r[0]; if(!groups[key]) groups[key] = []; groups[key].push(mapQuestionData(r, mode, config.subMode, config.title)); });
         const keys = Object.keys(groups); const randomKey = keys[Math.floor(Math.random() * keys.length)];
         navigate('quiz_scrollable', { questions: groups[randomKey], title: config.title, mode: config.subMode });
         return;
      }

      if (mode === 'english' && config.subMode === 'comprehension') {
         const groups = {};
         rows.forEach(r => { if(r.length < 5) return; const rawQ = mapQuestionData(r, mode, config.subMode, config.title); const key = rawQ.file; if(!key) return; if(!groups[key]) groups[key] = []; groups[key].push(rawQ); });
         const keys = Object.keys(groups); const randomKey = keys[Math.floor(Math.random() * keys.length)];
         navigate('comprehension_screen', { questions: groups[randomKey], filename: randomKey, mode: 'english' });
         return;
      }

      let pool = rows.map(r => mapQuestionData(r, mode, config.subMode, config.title)).filter(q => q.options && q.options.length > 1);

      if (mode === 'maths') {
        let diffMode = config.difficulty;
        if (diffMode && diffMode !== "Mixed") {
          pool = pool.filter(q => {
             let d = q.difficulty;
             if (diffMode === "Easy") return d >= 1 && d <= 25;
             if (diffMode === "Medium") return d >= 13 && d <= 38;
             if (diffMode === "Hard") return d >= 26 && d <= 50;
             return false;
          });
        }
        const groups = {}; pool.forEach(q => { const key = q.ref && q.ref.length >= 5 ? q.ref.substring(0, 5) : "MISC"; if (!groups[key]) groups[key] = []; groups[key].push(q); });
        let groupKeys = Object.keys(groups).sort(() => 0.5 - Math.random());
        let selected = []; const targetCount = config.count || 10;
        while (selected.length < targetCount && groupKeys.length > 0) {
          for (let i = 0; i < groupKeys.length; i++) {
            if (selected.length >= targetCount) break;
            const list = groups[groupKeys[i]];
            if (list.length > 0) { const randIndex = Math.floor(Math.random() * list.length); selected.push(list[randIndex]); list.splice(randIndex, 1); }
          }
          groupKeys = groupKeys.filter(k => groups[k].length > 0);
        }
        pool = selected.sort((a, b) => a.difficulty - b.difficulty);
      } else {
        if (config.title === 'Compound Word Bridge') { pool.sort(() => 0.5 - Math.random()); pool = pool.slice(0, 8).sort((a, b) => a.difficulty - b.difficulty); } 
        else if (config.title === 'Synonyms & Antonyms' || config.title === 'Sequences') { pool.sort(() => 0.5 - Math.random()); pool = pool.slice(0, 10).sort((a, b) => a.difficulty - b.difficulty); }
        else { pool.sort(() => 0.5 - Math.random()); const count = mode === 'vr' ? 8 : 10; pool = pool.slice(0, count); }
      }

      if (pool.length === 0) { alert("No questions found."); navigate('menu'); return; }
      navigate('quiz_scrollable', { questions: pool, title: config.title, mode: config.subMode || mode });

  } catch (e) {
      alert("Error: " + e.message);
      navigate('menu');
  }
 };

 useEffect(() => {
   processData();
 }, []);

 return (
  <div className={`flex flex-col items-center justify-center min-h-screen p-6 text-center ${theme.bg}`}>
    <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${theme.text} mb-4`}></div>
    <p>{status}</p>
  </div>
 );
};

// --- APP ROUTER ---
const App = () => {
  const [screen, setScreen] = useState('menu');
  const [config, setConfig] = useState({});
  const [data, setData] = useState({});
  const [mathsDiff, setMathsDiff] = useState(null);

  const navigate = (nextScreen, params = {}) => {
    if (params) {
      if (params.title) setConfig(c => ({ ...c, ...params }));
      if (params.questions) setData(d => ({ ...d, questions: params.questions }));
      if (params.filename) setData(d => ({ ...d, filename: params.filename }));
      if (params.mode) setConfig(c => ({ ...c, mode: params.mode }));
      if (params.subMode) setConfig(c => ({ ...c, subMode: params.subMode })); 
      if (params.url) setConfig(c => ({ ...c, url: params.url }));
    }
    setScreen(nextScreen);
  };

  if (screen === 'maths_menu') {
    return (
      <div className="min-h-screen bg-orange-50">
        <SubjectMenuHeader title="Maths Practice" onHome={() => setScreen('menu')} themeColor="bg-orange-600" />
        <div className="p-6 flex flex-col items-center">
          {!mathsDiff ? (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-4xl">
               {['Easy', 'Medium', 'Hard'].map(lvl => (
                 <button key={lvl} onClick={() => setMathsDiff(lvl)} className="bg-white p-8 rounded-2xl shadow-lg hover:scale-105 transition-all text-xl font-bold text-orange-600 border-l-8 border-orange-400">{lvl}</button>
               ))}
               <button onClick={() => { setConfig({ mode: 'maths', difficulty: 'Mixed', count: 50 }); setScreen('loading'); }} className="bg-orange-600 p-8 rounded-2xl shadow-lg hover:scale-105 transition-all text-xl font-bold text-white">Mixed <span className="block text-sm text-white/80 font-normal mt-1">(50 Questions)</span></button>
             </div>
          ) : (
             <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-lg text-center">
               <h3 className="text-2xl font-bold text-slate-700 mb-6">How many questions?</h3>
               <div className="flex gap-4 justify-center">
                 <button onClick={() => { setConfig({ mode: 'maths', difficulty: mathsDiff, count: 10 }); setScreen('loading'); }} className="px-8 py-4 bg-orange-100 text-orange-700 font-bold rounded-xl hover:bg-orange-200 text-xl">10</button>
                 <button onClick={() => { setConfig({ mode: 'maths', difficulty: mathsDiff, count: 25 }); setScreen('loading'); }} className="px-8 py-4 bg-orange-600 text-white font-bold rounded-xl hover:bg-orange-700 text-xl">25</button>
               </div>
               <button onClick={() => setMathsDiff(null)} className="mt-6 text-slate-400 underline">Back</button>
             </div>
          )}
        </div>
      </div>
    );
  }

  if (screen === 'english_menu') {
    return (
      <div className="min-h-screen bg-blue-50">
        <SubjectMenuHeader title="English Practice" onHome={() => setScreen('menu')} themeColor="bg-blue-600" />
        <div className="p-6 flex flex-col items-center">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
             <button onClick={() => { setConfig({ mode: 'english', subMode: 'comprehension', url: ENGLISH_URLS.comprehension, title: "Comprehension" }); setScreen('loading'); }} className="bg-white p-8 rounded-2xl shadow-lg hover:scale-105 transition-all text-xl font-bold text-blue-600 border-l-8 border-blue-400">Comprehension</button>
             <button onClick={() => { setConfig({ mode: 'english', subMode: 'spelling', url: ENGLISH_URLS.spelling, title: "Spelling" }); setScreen('loading'); }} className="bg-white p-8 rounded-2xl shadow-lg hover:scale-105 transition-all text-xl font-bold text-blue-600 border-l-8 border-blue-400">Spelling</button>
             <button onClick={() => { setConfig({ mode: 'english', subMode: 'grammar', url: ENGLISH_URLS.grammar, title: "Grammar" }); setScreen('loading'); }} className="bg-white p-8 rounded-2xl shadow-lg hover:scale-105 transition-all text-xl font-bold text-blue-600 border-l-8 border-blue-400">Grammar</button>
             <button onClick={() => { setConfig({ mode: 'english', subMode: 'cloze', url: ENGLISH_URLS.cloze, title: "Cloze" }); setScreen('loading'); }} className="bg-white p-8 rounded-2xl shadow-lg hover:scale-105 transition-all text-xl font-bold text-blue-600 border-l-8 border-blue-400">Cloze</button>
          </div>
        </div>
      </div>
    );
  }

  if (screen === 'vr_menu') {
    return (
      <div className="min-h-screen bg-purple-50">
        <SubjectMenuHeader title="Verbal Reasoning" onHome={() => setScreen('menu')} themeColor="bg-purple-600" />
        <div className="p-6 flex flex-col items-center">
           <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 w-full max-w-6xl pb-10">
             {VR_TOPICS.map((topic, idx) => (
               <button key={idx} onClick={() => { setConfig({ mode: 'vr', url: REPO_BASE_VR + topic.file, title: topic.name }); setScreen('loading'); }} className="bg-white p-6 rounded-2xl shadow-md hover:shadow-xl hover:-translate-y-1 transition-all border-b-4 border-purple-200 group">
                 <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform"><Lightbulb size={24} /></div>
                 <span className="text-lg font-bold text-slate-700 block leading-tight">{topic.name}</span>
               </button>
             ))}
           </div>
        </div>
      </div>
    );
  }
  
  if (screen === 'coming_soon') return <div className="p-10 text-center text-2xl">Coming Soon! <br/><button onClick={()=>setScreen('menu')} className="text-sm underline mt-4">Back</button></div>;
  if (screen === 'loading') return <GenericLoadingScreen config={config} navigate={navigate} />;
  if (screen === 'comprehension_screen') return <ComprehensionScreen data={{...data, title: config.title}} navigate={navigate} />;
  if (screen === 'cloze_screen') return <ClozeScreen data={{...data, title: config.title}} navigate={navigate} />;
  if (screen === 'quiz_scrollable') return <ScrollableQuizScreen data={{...data, title: config.title, mode: config.mode}} navigate={navigate} />;
  
  return <MenuScreen navigate={navigate} />;
};

export default App;