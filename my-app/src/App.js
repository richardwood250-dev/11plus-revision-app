import React, { useState, useEffect } from 'react';
import {
 BookOpen,
 Lightbulb,
 Calculator,
 Puzzle,
 ChevronLeft,
 Check,
 X,
 ArrowRight,
 Menu,
 Brain,
 Search,
 MoveUp,
 MoreHorizontal,
 Link as LinkIcon,
 ArrowLeftRight,
 GraduationCap,
 RefreshCw,
 WifiOff,
 Upload,
 AlertTriangle,
 Home,
 Play,
 FileText,
 List,
 Star
} from 'lucide-react';

// --- CONFIGURATION ---
const CSV_URLS = {
 // Corrected Maths URL with encoded spaces
 maths: "https://raw.githubusercontent.com/richardwood250-dev/11plus-maths/refs/heads/main/Questions%20-%20Maths.csv",
 hidden_word: "",
 move_letter: "",
 math_equations: "",
 missing_letter: "",
 comprehension: "https://raw.githubusercontent.com/richardwood250-dev/11plus-english/refs/heads/main/questions.csv",
 grammar: "https://raw.githubusercontent.com/richardwood250-dev/11plus-english/refs/heads/main/Questions%20-%20Grammar.csv",
 spelling: "https://raw.githubusercontent.com/richardwood250-dev/11plus-english/refs/heads/main/Questions%20-%20Spelling.csv",
 cloze: "https://raw.githubusercontent.com/richardwood250-dev/11plus-english/refs/heads/main/Questions%20-%20Cloze.csv"
};

const SUBJECT_IMAGE_URLS = {
 maths: "https://raw.githubusercontent.com/richardwood250-dev/11plus-maths/refs/heads/main/",
};

// Base URL for fetching text files
const ENGLISH_TEXT_BASE_URL = "https://raw.githubusercontent.com/richardwood250-dev/11plus-english/refs/heads/main/";

// --- THEME SYSTEM ---
const THEMES = {
 maths: {
  id: 'maths',
  label: 'Maths',
  icon: Calculator,
  bg: 'bg-gradient-to-br from-rose-50 via-white to-orange-50',
  header: 'bg-rose-600',
  headerGradient: 'from-rose-600 to-orange-500',
  button: 'bg-white border-rose-100 text-rose-700 hover:bg-rose-50 shadow-sm hover:shadow-md',
  buttonPrimary: 'bg-gradient-to-r from-rose-600 to-orange-500 text-white shadow-lg hover:shadow-xl hover:from-rose-700 hover:to-orange-600',
  accentText: 'text-rose-600',
  lightRing: 'ring-rose-200'
 },
 english: {
  id: 'english',
  label: 'English',
  icon: BookOpen,
  bg: 'bg-gradient-to-br from-blue-50 via-white to-indigo-50',
  header: 'bg-blue-600',
  headerGradient: 'from-blue-600 to-indigo-600',
  button: 'bg-white border-blue-100 text-blue-700 hover:bg-blue-50 shadow-sm hover:shadow-md',
  buttonPrimary: 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-indigo-700',
  accentText: 'text-blue-600',
  lightRing: 'ring-blue-200'
 },
 vr: {
  id: 'vr',
  label: 'Verbal Reasoning',
  icon: Lightbulb,
  bg: 'bg-gradient-to-br from-amber-50 via-white to-yellow-50',
  header: 'bg-amber-500',
  headerGradient: 'from-amber-500 to-yellow-500',
  button: 'bg-white border-amber-100 text-amber-800 hover:bg-amber-50 shadow-sm hover:shadow-md',
  buttonPrimary: 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white shadow-lg hover:shadow-xl hover:from-amber-600 hover:to-yellow-600',
  accentText: 'text-amber-600',
  lightRing: 'ring-amber-200'
 },
 nvr: {
  id: 'nvr',
  label: 'Non-Verbal',
  icon: Puzzle,
  bg: 'bg-gradient-to-br from-emerald-50 via-white to-teal-50',
  header: 'bg-emerald-600',
  headerGradient: 'from-emerald-600 to-teal-600',
  button: 'bg-white border-emerald-100 text-emerald-700 hover:bg-emerald-50 shadow-sm hover:shadow-md',
  buttonPrimary: 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg hover:shadow-xl hover:from-emerald-700 hover:to-teal-700',
  accentText: 'text-emerald-600',
  lightRing: 'ring-emerald-200'
 }
};

// --- ERROR BOUNDARY ---
class ErrorBoundary extends React.Component {
 constructor(props) {
  super(props);
  this.state = { hasError: false, error: null };
 }
 static getDerivedStateFromError(error) { return { hasError: true, error }; }
 componentDidCatch(error, errorInfo) { console.error("Crash:", error, errorInfo); }
 render() {
  if (this.state.hasError) {
   return (
    <div className="flex flex-col items-center justify-center h-screen bg-slate-50 p-6 text-center">
     <div className="bg-red-100 p-4 rounded-full mb-4"><AlertTriangle className="text-red-500" size={48} /></div>
     <h1 className="text-xl font-bold text-slate-800 mb-2">Something went wrong.</h1>
     <p className="text-slate-500 mb-6 text-sm">{this.state.error?.message || "Unknown Error"}</p>
     <button
      onClick={() => { this.setState({ hasError: false }); this.props.onReset(); }}
      className="bg-slate-800 text-white px-6 py-3 rounded-xl font-bold shadow-lg"
     >
      Restart App
     </button>
    </div>
   );
  }
  return this.props.children;
 }
}

// --- HELPERS ---
const MathRenderer = ({ text }) => {
 if (!text || typeof text !== 'string') return <span>{text}</span>;
 try {
  const parts = text.split(/(\\frac\{[^}]+\}\{[^}]+\})/g);
  return (
   <span className="inline-flex items-center flex-wrap justify-center font-medium">
    {parts.map((part, i) => {
     const match = part.match(/\\frac\{([^}]+)\}\{([^}]+)\}/);
     if (match) {
      return (
       <span key={i} className="inline-flex flex-col text-center align-middle mx-1 relative -top-1">
        <span className="border-b-2 border-current px-1 text-sm leading-tight">{match[1]}</span>
        <span className="px-1 text-sm leading-tight">{match[2]}</span>
       </span>
      );
     }
     let cleanText = part.replace(/\\times/g, '×').replace(/\\div/g, '÷').replace(/\^2/g, '²').replace(/\^3/g, '³').replace(/\\deg/g, '°').replace(/degrees/g, '°');
     return <span key={i} className="whitespace-pre-wrap">{cleanText}</span>;
    })}
   </span>
  );
 } catch (e) {
  return <span>{text}</span>;
 }
};

const ResilientImage = ({ src, onClick, alt, className }) => {
 const [currentSrc, setCurrentSrc] = useState(src);
 const [hidden, setHidden] = useState(false);
 const [retryCount, setRetryCount] = useState(0);

 useEffect(() => { setCurrentSrc(src); setHidden(false); setRetryCount(0); }, [src]);

 const handleError = () => {
  if (!currentSrc || currentSrc.includes('drive.google.com')) { setHidden(true); return; }
  const lastSlash = currentSrc.lastIndexOf('/');
  if (lastSlash === -1) { setHidden(true); return; }
  const base = currentSrc.substring(0, lastSlash);
  const file = currentSrc.substring(lastSlash + 1);

  if (retryCount === 0) { setCurrentSrc(`${base}/${file.toLowerCase()}`); setRetryCount(1); }
  else if (retryCount === 1) { setCurrentSrc(`${base}/${file.toUpperCase()}`); setRetryCount(2); }
  else { setHidden(true); }
 };

 if (hidden || !src) return null;
 return <img src={currentSrc} alt={alt} className={className} onClick={() => onClick && onClick(currentSrc)} onError={handleError} />;
};

const parseCSV = (text) => {
 if (!text || typeof text !== 'string') return [];
 if (text.trim().startsWith('<')) return [];
 const rows = [];
 let currentRow = [];
 let currentCell = "";
 let inQuotes = false;
 for (let i = 0; i < text.length; i++) {
  const char = text[i];
  const nextChar = text[i + 1];
  if (char === '"') {
   if (inQuotes && nextChar === '"') { currentCell += '"'; i++; }
   else { inQuotes = !inQuotes; }
  } else if (char === ',' && !inQuotes) {
   currentRow.push(currentCell.trim()); currentCell = "";
  } else if ((char === '\n' || (char === '\r' && nextChar === '\n')) && !inQuotes) {
   currentRow.push(currentCell.trim()); rows.push(currentRow); currentRow = []; currentCell = ""; if (char === '\r') i++;
  } else if (char === '\r' && !inQuotes) {
   currentRow.push(currentCell.trim()); rows.push(currentRow); currentRow = []; currentCell = "";
  } else { currentCell += char; }
 }
 if (currentCell || currentRow.length > 0) { currentRow.push(currentCell.trim()); rows.push(currentRow); }
 return rows;
};

const getDirectImageSrc = (url, subjectBaseUrl) => {
 if (!url) return null;
 let finalUrl = url.toString().trim();
 if (!finalUrl) return null;
 if (finalUrl.startsWith('http')) return finalUrl;
 if (subjectBaseUrl) {
  const safeBase = subjectBaseUrl.endsWith('/') ? subjectBaseUrl : subjectBaseUrl + '/';
  finalUrl = safeBase + finalUrl;
 }
 return finalUrl;
};

// --- MAIN APP SHELL ---
export default function App() {
 const [screen, setScreen] = useState('menu');
 const [screenData, setScreenData] = useState(null);
 const navigate = (to, data) => { setScreen(to); setScreenData(data); };
 const safeData = screenData || { questions: [] };

 return (
  <ErrorBoundary onReset={() => setScreen('menu')}>
   <div className="font-sans text-slate-900 bg-slate-50 min-h-screen">
    {screen === 'menu' && <MenuScreen navigate={navigate} />}
    
    {/* Menus */}
    {screen === 'english_menu' && <EnglishOptionsScreen navigate={navigate} />}
    {screen === 'vr_menu' && <VerbalReasoningScreen navigate={navigate} />}
    {screen === 'maths_menu' && <MathsScreen navigate={navigate} />}
    
    {/* Loaders */}
    {screen === 'loading' && <GenericLoadingScreen config={screenData} navigate={navigate} />}
    
    {/* Selection Screens */}
    {screen === 'comprehension_selection' && <ComprehensionSelectionScreen data={safeData} navigate={navigate} />}
    {screen === 'cloze_selection' && <ClozeSelectionScreen data={safeData} navigate={navigate} />}

    {/* Quizzes */}
    {screen === 'quiz_maths' && <MathsQuizScreen data={safeData} navigate={navigate} />}
    {screen === 'quiz_generic' && <GenericMultipleChoiceQuiz data={safeData} navigate={navigate} />}
    {screen === 'quiz_spelling' && <SpellingQuizScreen data={safeData} navigate={navigate} />}
    {screen === 'quiz_grammar' && <GrammarQuizScreen data={safeData} navigate={navigate} />}
    {screen === 'quiz_cloze' && <ClozeQuizScreen data={safeData} navigate={navigate} />}
    
    {/* Specific English/VR Quiz Screens */}
    {screen === 'quiz_comprehension' && <ComprehensionQuizScreen data={safeData} navigate={navigate} />}
    
    {screen === 'coming_soon' && (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-50 p-6 text-center">
      <div className="bg-indigo-100 p-6 rounded-full mb-4"><Puzzle size={48} className="text-indigo-600"/></div>
      <h2 className="text-2xl font-bold mb-2">Coming Soon</h2>
      <button onClick={() => navigate('menu')} className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-bold mt-4">Back to Menu</button>
      </div>
    )}
   </div>
  </ErrorBoundary>
 );
}

// --- SCREENS ---

const SubjectHeader = ({ theme, title, onBack }) => (
 <header className={`p-4 shadow-md flex items-center bg-gradient-to-r ${theme.headerGradient} text-white`}>
   <button onClick={onBack} className="p-2 hover:bg-white/20 rounded-full transition-colors mr-3"><ChevronLeft /></button>
   <h1 className="font-bold text-lg tracking-wide">{title}</h1>
   <div className="ml-auto opacity-50"><theme.icon size={24}/></div>
 </header>
);

const QuizHeader = ({ theme, title, onBack, onHome }) => (
  <header className={`p-4 shadow-md flex items-center justify-between bg-gradient-to-r ${theme.headerGradient} text-white sticky top-0 z-50`}>
    <div className="flex items-center">
     <button onClick={onBack} className="p-2 hover:bg-white/20 rounded-full transition-colors mr-3">
       <ChevronLeft size={24} />
     </button>
     <h1 className="font-bold text-lg tracking-wide truncate max-w-[200px] md:max-w-md">{title}</h1>
    </div>
    <button onClick={onHome} className="p-2 hover:bg-white/20 rounded-full transition-colors">
     <Home size={24} />
    </button>
  </header>
);

const MenuButton = ({ title, sub, icon: Icon, theme, onClick }) => (
 <button
  onClick={onClick}
  className={`w-full p-4 rounded-xl shadow-sm border border-slate-100 bg-white text-left flex items-center transition-all hover:shadow-md active:scale-95 group mb-3`}
 >
  <div className={`p-3 rounded-lg mr-4 ${theme.bg} ${theme.accentText}`}>
    <Icon size={24}/>
  </div>
  <div>
    <div className="font-bold text-slate-800 group-hover:text-indigo-900">{title}</div>
    {sub && <div className="text-xs text-slate-400">{sub}</div>}
  </div>
  <ArrowRight className="ml-auto text-slate-300 group-hover:text-indigo-400" size={18} />
 </button>
);

const DashboardButton = ({ theme, onClick }) => (
 <button
  onClick={onClick}
  className={`aspect-square flex flex-col items-center justify-center p-4 rounded-3xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 active:scale-95 bg-white border border-slate-100 group relative overflow-hidden`}
 >
  <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity bg-gradient-to-br ${theme.headerGradient}`}></div>
  <div className={`p-4 rounded-2xl mb-3 ${theme.bg} ${theme.accentText} group-hover:scale-110 transition-transform duration-300`}>
    <theme.icon size={32} />
  </div>
  <span className="font-bold text-slate-700 group-hover:text-slate-900">{theme.label}</span>
 </button>
);

const MenuScreen = ({ navigate }) => (
 <div className="flex flex-col min-h-screen bg-slate-50">
  <header className="bg-indigo-700 p-8 rounded-b-[3rem] shadow-xl text-center relative overflow-hidden">
   <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-white/10 to-transparent pointer-events-none"></div>
   <div className="inline-block bg-white/20 p-4 rounded-full mb-4 backdrop-blur-sm shadow-inner"><GraduationCap size={48} className="text-white drop-shadow-md" /></div>
   <h1 className="text-3xl font-black text-white tracking-tight drop-shadow-md mb-2">Free 4 All <span className="text-orange-300">Education</span></h1>
   <p className="text-indigo-100 font-medium opacity-90">11+ Revision Companion</p>
  </header>
  
  <main className="flex-1 p-6 max-w-lg mx-auto w-full">
   <div className="grid grid-cols-2 gap-4">
     <DashboardButton theme={THEMES.maths} onClick={() => navigate('maths_menu')} />
     <DashboardButton theme={THEMES.english} onClick={() => navigate('english_menu')} />
     <DashboardButton theme={THEMES.vr} onClick={() => navigate('vr_menu')} />
     <DashboardButton theme={THEMES.nvr} onClick={() => navigate('coming_soon')} />
   </div>
  </main>
 </div>
);

const MathsScreen = ({ navigate }) => {
 const [showModal, setShowModal] = useState(false);
 const [selectedDiff, setSelectedDiff] = useState(null);
 const startMaths = (count) => { setShowModal(false); navigate('loading', { mode: 'maths', difficulty: selectedDiff, count }); };
 const theme = THEMES.maths;

 return (
  <div className={`min-h-screen ${theme.bg}`}>
   <SubjectHeader theme={theme} title="Maths Practice" onBack={() => navigate('menu')} />
   <main className="p-6 max-w-md mx-auto">
    <h2 className={`text-center font-bold uppercase text-xs tracking-wider mb-4 ${theme.accentText}`}>Select Difficulty</h2>
    <MenuButton theme={theme} title="Easy" sub="0-25 Range" icon={Check} onClick={() => { setSelectedDiff("Easy"); setShowModal(true); }} />
    <MenuButton theme={theme} title="Medium" sub="13-38 Range" icon={Lightbulb} onClick={() => { setSelectedDiff("Medium"); setShowModal(true); }} />
    <MenuButton theme={theme} title="Hard" sub="26-50 Range" icon={Brain} onClick={() => { setSelectedDiff("Hard"); setShowModal(true); }} />
    <div className="my-2 border-t border-slate-200/50"></div>
    <MenuButton theme={theme} title="Full Paper" sub="Mixed Difficulty (50 Qs)" icon={FileText} onClick={() => navigate('loading', { mode: 'maths', difficulty: 'Mixed', count: 50 })} />
   </main>
   {showModal && (
    <div className="fixed inset-0 bg-black/60 flex items-end justify-center z-50 animate-in slide-in-from-bottom-10 backdrop-blur-sm">
     <div className="bg-white w-full max-w-md p-6 rounded-t-3xl shadow-2xl">
      <div className="flex justify-between items-center mb-6">
       <h3 className="text-2xl font-bold text-slate-800">{selectedDiff} Maths</h3>
       <button onClick={() => setShowModal(false)} className="bg-slate-100 p-2 rounded-full hover:bg-slate-200"><X size={20}/></button>
      </div>
      <div className="space-y-3">
       {[10, 25, 50].map(n => <button key={n} onClick={() => startMaths(n)} className={`w-full py-4 rounded-xl font-bold text-lg border transition-colors ${theme.button} hover:bg-rose-100`}>{n} Questions</button>)}
      </div>
      <div className="h-6" />
     </div>
    </div>
   )}
  </div>
 );
};

const VerbalReasoningScreen = ({ navigate }) => {
 const [showModal, setShowModal] = useState(false);
 const [selectedMode, setSelectedMode] = useState(null);
 const [selectedTitle, setSelectedTitle] = useState("");
 const handleTypeClick = (mode, title) => { setSelectedMode(mode); setSelectedTitle(title); setShowModal(true); };
 const startQuiz = (count) => { setShowModal(false); navigate('loading', { mode: selectedMode, count }); };
 const theme = THEMES.vr;

 return (
  <div className={`min-h-screen ${theme.bg}`}>
   <SubjectHeader theme={theme} title="Verbal Reasoning" onBack={() => navigate('menu')} />
   <main className="p-6 max-w-md mx-auto">
    <h2 className={`text-center font-bold uppercase text-xs tracking-wider mb-4 ${theme.accentText}`}>Select Type</h2>
    <MenuButton theme={theme} title="Type 1: Hidden Word" sub="Find the hidden word" icon={Search} onClick={() => handleTypeClick('hidden_word', "Hidden Word")} />
    <MenuButton theme={theme} title="Type 2: Move a Letter" sub="Make new words" icon={MoveUp} onClick={() => handleTypeClick('move_letter', "Move a Letter")} />
    <MenuButton theme={theme} title="Type 3: Missing Letters" sub="Complete the word in capitals" icon={MoreHorizontal} onClick={() => handleTypeClick('missing_letter', "Missing Letters")} />
    <MenuButton theme={theme} title="Type 7: Math Equations" sub="Solve with letters" icon={Calculator} onClick={() => handleTypeClick('math_equations', "Math Equations")} />
   </main>
    {showModal && (
     <div className="fixed inset-0 bg-black/60 flex items-end justify-center z-50 animate-in slide-in-from-bottom-10 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md p-6 rounded-t-3xl shadow-2xl">
       <div className="flex justify-between items-center mb-6"><h3 className="text-2xl font-bold text-slate-800">{selectedTitle}</h3><button onClick={() => setShowModal(false)} className="bg-slate-100 p-2 rounded-full hover:bg-slate-200"><X size={20}/></button></div>
       <div className="space-y-3">
        {[10, 25, 50].map(n => <button key={n} onClick={() => startQuiz(n)} className={`w-full py-4 rounded-xl font-bold text-lg border transition-colors ${theme.button} hover:bg-amber-100`}>{n} Questions</button>)}
       </div>
       <div className="h-6" />
      </div>
     </div>
   )}
  </div>
 );
};

const VRButton = ({ title, sub, icon, onClick }) => (
  <button onClick={onClick} className="bg-white p-5 rounded-xl shadow-sm border border-orange-100 text-left flex items-center active:scale-95 transition-transform w-full">
    <div className="bg-orange-100 text-orange-600 p-3 rounded-full mr-4">{icon}</div>
    <div><div className="font-bold text-slate-800">{title}</div><div className="text-xs text-slate-500">{sub}</div></div>
    <ArrowRight className="ml-auto text-orange-300" size={20}/>
  </button>
);

const EnglishOptionsScreen = ({ navigate }) => {
 const theme = THEMES.english;
 return (
  <div className={`min-h-screen ${theme.bg}`}>
   <SubjectHeader theme={theme} title="English" onBack={() => navigate('menu')} />
   <main className="p-6 max-w-md mx-auto">
    <h2 className={`text-center font-bold uppercase text-xs tracking-wider mb-4 ${theme.accentText}`}>Select Topic</h2>
    <MenuButton theme={theme} title="Comprehension" sub="Read passages & answer" icon={BookOpen} onClick={() => navigate('loading', { mode: 'comprehension' })} />
    <MenuButton theme={theme} title="Grammar & Punctuation" sub="Identify mistakes" icon={Lightbulb} onClick={() => navigate('loading', { mode: 'grammar' })} />
    <MenuButton theme={theme} title="Spelling Practice" sub="Spot the error" icon={Check} onClick={() => navigate('loading', { mode: 'spelling' })} />
    <MenuButton theme={theme} title="Cloze (Fill in Blanks)" sub="Complete the passage" icon={MoreHorizontal} onClick={() => navigate('loading', { mode: 'cloze' })} />
   </main>
  </div>
 );
};

// --- DATA FETCHING ---
const GenericLoadingScreen = ({ config, navigate }) => {
 const [status, setStatus] = useState("Connecting...");
 const [showUpload, setShowUpload] = useState(false);
 const [debugLog, setDebugLog] = useState([]);
 const addLog = (msg) => setDebugLog(prev => [...prev, msg]);
 
 const mode = config.mode;
 const isMaths = mode === 'maths';
 const isVR = ['hidden_word', 'move_letter', 'missing_letter', 'math_equations'].includes(mode);
 const theme = isMaths ? THEMES.maths : (isVR ? THEMES.vr : THEMES.english);

 // Moved OUTSIDE useEffect so the button can use it
 const processData = (rows) => {
  if (rows.length > 0 && (rows[0][0].toLowerCase().includes('question') || rows[0][0].toLowerCase().includes('id'))) rows.shift();
  let filtered = rows;
  let title = config.mode.charAt(0).toUpperCase() + config.mode.slice(1).replace('_', ' ');
  let isMaths = config.mode === 'maths';

  if (isMaths) {
    const diffMode = config.difficulty;
    if (diffMode === "Mixed") {
      title = "Full Practice Paper";
      const sortedAll = [...rows].sort((a,b) => (parseInt(a[8])||0) - (parseInt(b[8])||0));
      filtered = sortedAll;
    } else {
      filtered = rows.filter(r => {
       if (!r || r.length < 9) return false;
       let d = parseInt(r[8]); if (isNaN(d)) d = parseInt(r[9]); if (isNaN(d)) return false;
       if (diffMode === "Easy") return d <= 25;
       if (diffMode === "Medium") return d >= 13 && d <= 38;
       if (diffMode === "Hard") return d >= 26;
       return false;
      });
      title = `${diffMode} Maths`;
    }
  }

  if (filtered.length === 0) { alert("No questions found."); return; }

  let selected = [];

  if (config.mode === 'grammar') {
    const startIndices = [];
    filtered.forEach((r, idx) => {
      if (r.length > 1 && r[1].toString().trim() === '1') startIndices.push(idx);
    });

    if (startIndices.length === 0) {
      selected = filtered.slice(0, 10);
    } else {
      const rndStart = startIndices[Math.floor(Math.random() * startIndices.length)];
      selected = filtered.slice(rndStart, rndStart + 10);
    }
  } else {
    filtered.sort(() => 0.5 - Math.random());
    selected = filtered.slice(0, config.count || 10);
  }
  
  if (isMaths) {
   selected.sort((a,b) => (parseInt(a[8])||0) - (parseInt(b[8])||0));
   navigate('quiz_maths', { questions: selected, title, mode: config.mode });
  } else if (config.mode === 'spelling') {
   navigate('quiz_spelling', { questions: selected, title: "Spelling Practice" });
  } else if (config.mode === 'grammar') {
   navigate('quiz_grammar', { questions: selected, title: "Grammar Practice" });
  } else {
   navigate('quiz_generic', { questions: selected, title, mode: config.mode });
  }
 };

 const handleManualUpload = (e) => {
  const file = e.target.files[0];
  if (!file) return;
  setStatus("Reading file...");
  const reader = new FileReader();
  reader.onload = (evt) => processData(parseCSV(evt.target.result));
  reader.readAsText(file);
 };

 useEffect(() => {
  let isMounted = true;
  const timeoutId = setTimeout(() => { if (isMounted) handleError("Connection timed out (15s)."); }, 15000);
  const handleError = (msg) => { clearTimeout(timeoutId); addLog(`Error: ${msg}`); setShowUpload(true); setStatus("Failed"); };

  const fetchData = async () => {
   const url = CSV_URLS[config.mode];
   if (!url) { handleError(`No URL configured for ${config.mode}`); return; }
   setStatus("Downloading...");
   addLog(`Attempting fetch from: ${url}`);
   try {
    const response = await fetch(url, { cache: 'no-cache' });
    if (!response.ok) { addLog(`Direct failed (${response.status}).`); throw new Error(`HTTP Error ${response.status}`); }
    const text = await response.text();
    if (text.trim().startsWith('<')) throw new Error("Received HTML.");
    const rows = parseCSV(text);
    if (rows.length < 2) throw new Error("File empty.");
    if (isMounted) {
      clearTimeout(timeoutId);
      if (config.mode === 'comprehension') processComprehensionData(rows);
      else if (config.mode === 'cloze') processClozeData(rows);
      else processData(rows);
    }
   } catch (e) { if (isMounted) handleError(e.message); }
  };

  const processComprehensionData = async (rows) => {
    if (rows.length > 0 && rows[0][0].toLowerCase().includes('id')) rows.shift();
    let filenameIndex = 8;
    if (rows.length > 0) rows[0].forEach((c, i) => { if (c && c.toString().includes('.txt')) filenameIndex = i; });
    const groups = {};
    rows.forEach(r => {
      if (r.length <= filenameIndex) return;
      const file = r[filenameIndex].trim();
      if (!file || file.length < 3 || !file.includes('.')) return;
      if (!groups[file]) groups[file] = [];
      groups[file].push(r);
    });
    const filenames = Object.keys(groups);
    if (filenames.length === 0) { handleError("No stories found in CSV."); return; }
    navigate('comprehension_selection', { groups: groups });
  };

  const processClozeData = (rows) => {
    if (rows.length > 0 && rows[0][0].toLowerCase().includes('id')) rows.shift();
    const groups = {};
    rows.forEach(r => {
      if (!r[0]) return;
      const storyName = r[0].trim();
      if (!groups[storyName]) groups[storyName] = [];
      groups[storyName].push(r);
    });
    const filenames = Object.keys(groups);
    if (filenames.length === 0) { handleError("No Cloze stories found."); return; }
    navigate('cloze_selection', { groups });
  };

  fetchData();
  return () => { isMounted = false; clearTimeout(timeoutId); };
 }, []);

 return (
  <div className={`flex flex-col items-center justify-center min-h-screen p-6 text-center ${theme.bg}`}>
    {!showUpload ? (
     <>
      <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${theme.accentText} mb-4`}></div>
      <p className="text-lg text-slate-600 font-semibold">{status}</p>
     </>
    ) : (
     <div className="bg-white p-6 rounded-2xl shadow-xl max-w-sm w-full border-t-4 border-red-500">
      <h3 className="text-xl font-bold mb-2 text-slate-800">Connection Failed</h3>
      <div className="bg-red-50 text-red-700 text-xs p-2 rounded mb-4 text-left font-mono h-24 overflow-y-auto">{debugLog.join("\n")}</div>
      <label className="block w-full cursor-pointer group"><div className="flex items-center justify-center w-full h-12 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors"><Upload className="mr-2" size={20}/> Upload CSV Manually</div><input type="file" accept=".csv" className="hidden" onChange={handleManualUpload} /></label>
      <button onClick={() => navigate('menu')} className="mt-4 text-sm text-slate-400 hover:text-slate-600 underline">Cancel</button>
     </div>
    )}
  </div>
 );
};

// --- SELECTION SCREENS (Styled) ---
const ComprehensionSelectionScreen = ({ data, navigate }) => {
  const groups = data.groups || {};
  const filenames = Object.keys(groups);
  const loadStory = async (filename) => {
    try { const textUrl = ENGLISH_TEXT_BASE_URL + filename; const res = await fetch(textUrl); const textContent = await res.text(); navigate('quiz_comprehension', { questions: groups[filename], title: "Comprehension", passageText: textContent, filename, groups }); } catch(e){alert("Error")}
  };
  const pickRandom = () => { if (filenames.length>0) loadStory(filenames[Math.floor(Math.random()*filenames.length)]) };

  return (
   <div className={`flex flex-col min-h-screen ${THEMES.english.bg}`}>
     <SubjectHeader theme={THEMES.english} title="Select a Story" onBack={() => navigate('english_menu')} />
     <main className="p-6 flex-1 overflow-y-auto">
       <button onClick={pickRandom} className={`w-full ${THEMES.english.buttonPrimary} p-5 rounded-xl font-bold shadow-lg mb-6 flex items-center justify-center`}>
         <Brain className="mr-2" /> Surprise Me (Random)
       </button>
       <h2 className={`text-sm font-bold uppercase tracking-wider mb-3 ${THEMES.english.accentText}`}>Available Texts</h2>
       <div className="space-y-3">{filenames.map((file, idx) => (
         <button key={idx} onClick={() => loadStory(file)} className="w-full bg-white p-4 rounded-lg border border-blue-100 text-left hover:bg-white hover:shadow-md transition-all flex items-center">
           <div className="bg-blue-100 text-blue-600 w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs mr-3">{idx + 1}</div>
           <span className="font-medium text-slate-700">{file.replace('.txt', '').replace(/_/g, ' ')}</span>
           <ArrowRight className="ml-auto text-blue-200" size={16} />
         </button>
       ))}</div>
     </main>
   </div>
 );
};

const ClozeSelectionScreen = ({ data, navigate }) => {
  const groups = data.groups || {};
  const ids = Object.keys(groups);
  const loadCloze = (id) => {
    const q = groups[id];
    let p = "";
    const q1Row = q.find(r => r[3] && r[3].toString().trim() === '1');
    if (q1Row) p = q1Row[2];
    let t = id;
    navigate('quiz_cloze', { questions: q, title: t, passageText: p, groups });
  };
  const pickRandom = () => { if(ids.length>0) loadCloze(ids[Math.floor(Math.random()*ids.length)]); };

  return (
    <div className={`flex flex-col min-h-screen ${THEMES.english.bg}`}>
      <SubjectHeader theme={THEMES.english} title="Select Cloze Passage" onBack={() => navigate('english_menu')} />
      <main className="p-6 flex-1 overflow-y-auto">
        <button onClick={pickRandom} className={`w-full ${THEMES.english.buttonPrimary} p-5 rounded-xl font-bold shadow-lg mb-6 flex items-center justify-center`}>
          <Brain className="mr-2" /> Surprise Me (Random)
        </button>
        <div className="space-y-3">{ids.map((id, idx) => {
          let preview = id;
          if (groups[id]) {
            const q1 = groups[id].find(r => r[3] && r[3].toString().trim() === '1');
            if (q1 && q1[2]) {
              const firstLine = q1[2].split('\n')[0];
              if (firstLine.length < 40) preview = firstLine;
            }
          }
          return (
            <button key={idx} onClick={() => loadCloze(id)} className="w-full bg-white p-4 rounded-lg border border-purple-100 text-left hover:shadow-md transition-all flex items-center">
              <div className="bg-purple-100 text-purple-600 w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs mr-3">{idx + 1}</div>
              <span className="font-medium text-slate-700">{preview}</span>
              <ArrowRight className="ml-auto text-purple-200" size={16} />
            </button>
          );
        })}</div>
      </main>
    </div>
  );
};

// --- QUIZZES ---
const MathsQuizScreen = ({ data, navigate }) => {
  const theme = THEMES.maths;
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [zoomImg, setZoomImg] = useState(null);
  const questions = data.questions || [];
  if (questions.length === 0) return null;
  
  // Logic ... (Same as before)
  const getResultInfo = (row, idx) => {
    let qText = row[0]; let imgUrl = getDirectImageSrc(row[1], SUBJECT_IMAGE_URLS['maths']);
    let opts = [row[2], row[3], row[4], row[5], row[6]]; let rawAns = (row[7] || "").trim();
    let correctVal = String(rawAns);
    const letters = ['A','B','C','D','E'];
    if (letters.includes(rawAns.toUpperCase())) { const i = letters.indexOf(rawAns.toUpperCase()); correctVal = opts[i] ? String(opts[i]).toUpperCase() : String(rawAns).toUpperCase(); } else { correctVal = String(rawAns).toUpperCase(); }
    return { qText, opts, correctVal, imgUrl };
  };
  const currentScore = questions.reduce((acc, row, idx) => { const { correctVal } = getResultInfo(row, idx); const userVal = (answers[idx] || "").toString().trim().toUpperCase(); return acc + (userVal === correctVal ? 1 : 0); }, 0);

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      <header className={`bg-gradient-to-r ${theme.headerGradient} text-white p-4 shadow-md flex items-center justify-between`}>
        <div className="flex items-center"><button onClick={() => navigate('maths_menu')} className="mr-3"><ChevronLeft/></button><h1 className="font-bold">{data.title}</h1></div>
      </header>
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {questions.map((row, idx) => {
          const { qText, opts, correctVal, imgUrl } = getResultInfo(row, idx);
          const userSelIdx = answers[idx];
          return (
            <div key={idx} className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
               <div className="text-xs font-bold text-slate-400 mb-3 tracking-wide">QUESTION {idx+1}</div>
               <div className="text-lg font-bold text-slate-800 mb-6 text-center"><MathRenderer text={qText} /></div>
               {imgUrl && (<div className="flex justify-center mb-6"><ResilientImage src={imgUrl} alt="Question" className="max-h-48 rounded-lg shadow-sm border border-slate-100 cursor-zoom-in" onClick={(src) => setZoomImg(src)} /></div>)}
               <div className="flex flex-wrap gap-3 justify-center">
                 {opts.map((opt, i) => { if (!opt) return null; const letter = ['A','B','C','D','E'][i]; const optStr = String(opt).trim().toUpperCase(); const isSel = userSelIdx === optStr;
                   let btnClass = "bg-slate-50 text-slate-600 border border-slate-200 hover:bg-rose-50 hover:border-rose-200";
                   if (!submitted) { if (isSel) btnClass = "bg-rose-600 text-white border-rose-600 shadow-md transform scale-105"; }
                   else { if (optStr === correctVal.toUpperCase()) btnClass = "bg-green-500 text-white border-green-500"; else if (isSel) btnClass = "bg-red-500 text-white border-red-500"; else btnClass = "opacity-40 bg-slate-50"; }
                   return (<button key={i} onClick={() => !submitted && setAnswers(p => ({...p, [idx]: optStr}))} className={`py-4 px-6 min-w-[4rem] rounded-xl font-bold text-sm flex flex-col items-center justify-center transition-all duration-200 ${btnClass}`}><span className="text-[10px] opacity-70 mb-1 font-normal">{letter}</span><MathRenderer text={opt} /></button>)
                 })}
               </div>
               {submitted && (answers[idx] || "") !== correctVal && (<div className="mt-4 p-3 bg-rose-50 text-rose-700 text-sm rounded-lg border border-rose-100 text-center"><span className="font-bold">Correct Answer:</span> {correctVal}</div>)}
            </div>
          )
        })}
      </div>
      <div className="p-4 bg-white border-t shadow-lg z-10">{!submitted ? (<button disabled={Object.keys(answers).length !== questions.length} onClick={() => setSubmitted(true)} className={`w-full ${theme.buttonPrimary} py-4 rounded-xl font-bold shadow-lg disabled:opacity-50 disabled:shadow-none transition-all`}>Submit Answers</button>) : (<div className="text-center"><div className="text-3xl font-black text-slate-800 mb-2">{currentScore} <span className="text-lg text-slate-400 font-medium">/ {questions.length}</span></div><button onClick={() => navigate('maths_menu')} className="w-full bg-slate-800 text-white py-4 rounded-xl font-bold">Finish Review</button></div>)}</div>
      {zoomImg && <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 cursor-zoom-out" onClick={()=>setZoomImg(null)}><img src={zoomImg} className="max-w-full max-h-full rounded-lg shadow-2xl"/></div>}
    </div>
  )
};

const GenericMultipleChoiceQuiz = ({ data, navigate, color = "bg-orange-500" }) => {
  const theme = THEMES.vr;
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const questions = data?.questions || [];
  if (questions.length === 0) return null;
  const getResultInfo = (row) => { const qText = row[1]; const opts = [row[3], row[4], row[5], row[6], row[7]]; let correctVal = (row[8] || "").trim().toUpperCase(); const matchIdx = opts.findIndex(o => o && String(o).trim().toUpperCase() === correctVal); if (matchIdx === -1) { const letters = ['A','B','C','D','E']; const letterIdx = letters.indexOf(correctVal); if (letterIdx > -1 && opts[letterIdx]) { correctVal = String(opts[letterIdx]).trim().toUpperCase(); } } else { correctVal = String(opts[matchIdx]).trim().toUpperCase(); } return { qText, opts, correctVal }; };
  const currentScore = questions.reduce((acc, row, idx) => { const { correctVal } = getResultInfo(row, idx); const userVal = (answers[idx] || "").toString().trim().toUpperCase(); return acc + (userVal === correctVal ? 1 : 0); }, 0);

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      <QuizHeader theme={theme} title={data.title} onBack={() => navigate('vr_menu')} onHome={() => navigate('menu')} />
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {questions.map((row, idx) => {
          const { qText, opts, correctVal } = getResultInfo(row, idx);
          const userSelIdx = answers[idx];
          return (
            <div key={idx} className="bg-white rounded-xl shadow-sm p-5 border border-slate-100">
               <div className="text-xs font-bold text-slate-400 mb-2">Question {idx+1}</div>
               <div className="text-lg font-bold text-slate-800 mb-4 whitespace-pre-wrap text-center">{qText}</div>
               <div className="flex flex-wrap gap-2 justify-center">{opts.map((opt, i) => { if (!opt) return null; const letter = ['A','B','C','D','E'][i]; const isSel = userSelIdx === i; let btnClass = "bg-slate-50 border-slate-200 text-slate-600"; if (!submitted) { if (isSel) btnClass = "bg-amber-500 text-white border-amber-500 shadow-md"; } else { const optVal = String(opt).trim().toUpperCase(); if (optVal === correctVal) btnClass = "bg-green-500 text-white border-green-500"; else if (isSel) btnClass = "bg-red-500 text-white border-red-500"; else btnClass = "opacity-40"; } return (<button key={i} onClick={() => !submitted && setAnswers(p => ({...p, [idx]: i}))} className={`px-4 py-3 rounded-lg border font-bold text-sm transition-all ${btnClass}`}><span className="mr-2 opacity-70 text-xs">{letter}.</span> {opt}</button>) })}</div>
            </div>
          )
        })}
      </div>
      <div className="p-4 bg-white border-t">{!submitted ? (<button disabled={Object.keys(answers).length !== questions.length} onClick={() => setSubmitted(true)} className={`w-full ${theme.buttonPrimary} py-3 rounded-xl font-bold shadow-lg`}>Submit Answers</button>) : (<div className="text-center"><div className="text-xl font-bold mb-2">Score: {currentScore} / {questions.length}</div><button onClick={() => navigate('vr_menu')} className="w-full bg-slate-800 text-white py-3 rounded-lg font-bold">Finish</button></div>)}</div>
    </div>
  )
};

// --- SPELLING (Random: 0=QNum, 1-4=Opts, 5=Ans) ---
const SpellingQuizScreen = ({ data, navigate }) => {
  const theme = THEMES.english;
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const questions = data.questions || [];

  const currentScore = questions.reduce((acc, q, idx) => {
    // Answer is at Index 5 (Col F) for Spelling
    const correctVal = (q[5] || "").trim().toUpperCase();
    const userVal = (answers[idx] || "").toString().trim().toUpperCase();
    return acc + (userVal === correctVal ? 1 : 0);
  }, 0);

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      <QuizHeader theme={theme} title={data.title || "Spelling"} onBack={() => navigate('english_menu')} onHome={() => navigate('menu')} />
      <div className="bg-indigo-50 text-indigo-900 p-3 text-xs font-bold text-center border-b border-indigo-100 sticky top-0 z-10">Identify the mistake. Select 'No Mistake' (N) if none found.</div>
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {questions.map((row, idx) => {
          const qText = row[0]; // Q Num (Index 0)
          // Options A-D are indices 1, 2, 3, 4
          const opts = [row[1], row[2], row[3], row[4]];
          const correctVal = (row[5] || "").trim().toUpperCase(); // Answer is Col 6
          const explanation = row[6]; // Expl is Col 7
          const userSel = answers[idx];

          return (
            <div key={idx} className="bg-white rounded-xl shadow-sm p-4 border border-slate-100">
               <div className="text-xs font-bold text-slate-400 mb-2">Question {qText}</div>
               <div className="flex flex-row gap-2 mb-3 overflow-x-auto pb-2">{opts.map((opt, i) => { const letter = ['A','B','C','D'][i]; const isSel = userSel === letter; let btnClass = "bg-white border-slate-200 text-slate-600 hover:bg-blue-50"; if (!submitted && isSel) btnClass = "bg-indigo-600 text-white border-indigo-600 shadow-md"; if (submitted) { if (letter === correctVal) btnClass = "bg-green-500 text-white border-green-500"; else if (isSel) btnClass = "bg-red-500 text-white border-red-500"; else btnClass = "opacity-40 border-slate-100"; } return (<button key={i} onClick={() => !submitted && setAnswers(p => ({...p, [idx]: letter}))} className={`border rounded-lg p-3 text-center flex-1 flex flex-col items-center justify-center transition-all min-w-[4rem] ${btnClass}`}><span className="text-[10px] font-bold opacity-60 mb-1">{letter}</span> <span className="text-sm font-medium">{opt}</span></button>) })}</div>
               <button onClick={() => !submitted && setAnswers(p => ({...p, [idx]: 'N'}))} className={`w-full border rounded-lg p-3 font-bold text-center transition-all ${!submitted ? (userSel === 'N' ? "bg-indigo-600 text-white border-indigo-600 shadow-md" : "bg-slate-50 text-slate-500 hover:bg-slate-100") : (correctVal === 'N' ? "bg-green-500 text-white border-green-500" : (userSel === 'N' ? "bg-red-500 text-white border-red-500" : "opacity-40 border-slate-100"))}`}>N. No Mistake</button>
               {submitted && userSel !== correctVal && explanation && (<div className="mt-3 text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-100 flex items-start"><div className="font-bold mr-2">Explanation:</div>{explanation}</div>)}
            </div>
          )
        })}
      </div>
      <div className="p-4 bg-white border-t shadow-lg z-10">{!submitted ? (<button disabled={Object.keys(answers).length !== questions.length} onClick={() => setSubmitted(true)} className={`w-full ${theme.buttonPrimary} py-3 rounded-xl font-bold shadow-lg disabled:opacity-50`}>Submit Answers</button>) : (<div className="text-center"><div className="text-xl font-bold mb-2">You scored {currentScore} / {questions.length}</div><button onClick={() => navigate('english_menu')} className="w-full bg-slate-800 text-white py-3 rounded-lg font-bold">Finish</button></div>)}</div>
    </div>
  )
};

// --- QUIZ: GRAMMAR (Consecutive: 1=QNum, 2-5=Opts, 6=Ans) ---
const GrammarQuizScreen = ({ data, navigate, title = "Grammar", color = "bg-blue-500" }) => {
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const questions = data.questions || [];

  const currentScore = questions.reduce((acc, q, idx) => {
    // Answer is at Index 6 (Col G) for Grammar
    const correctVal = (q[6] || "").trim().toUpperCase();
    const userVal = (answers[idx] || "").toString().trim().toUpperCase();
    return acc + (userVal === correctVal ? 1 : 0);
  }, 0);

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      <QuizHeader theme={THEMES.english} title={title} onBack={() => navigate('english_menu')} onHome={() => navigate('menu')} />
      <div className={`bg-opacity-10 text-slate-800 p-3 text-xs font-bold text-center border-b border-slate-100 sticky top-0 z-10 ${color.replace('500', '50').replace('600', '50')}`}>Identify the mistake. Select 'No Mistake' (N) if none found.</div>
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {questions.map((row, idx) => {
          const qText = row[1]; // Q Num (Index 1)
          const opts = [row[2], row[3], row[4], row[5]]; // A-D (Indices 2-5)
          const correctVal = (row[6] || "").trim().toUpperCase(); // Ans (Index 6)
          const explanation = row[7]; // Expl (Index 7)
          const userSel = answers[idx];

          return (
            <div key={idx} className="bg-white rounded-xl shadow p-4 border border-slate-100">
               <div className="text-xs font-bold text-slate-400 mb-2">Question {qText}</div>
               <div className="flex flex-row gap-2 mb-3 overflow-x-auto">{opts.map((opt, i) => { const letter = ['A','B','C','D'][i]; const isSel = userSel === letter; let btnClass = `bg-white border-slate-200 text-slate-700 hover:bg-opacity-10`; if (!submitted && isSel) btnClass = `${color} text-white border-transparent`; if (submitted) { if (letter === correctVal) btnClass = "bg-green-500 text-white border-green-500"; else if (isSel) btnClass = "bg-red-500 text-white border-red-500"; else btnClass = "opacity-40 border-slate-100"; } return (<button key={i} onClick={() => !submitted && setAnswers(p => ({...p, [idx]: letter}))} className={`border rounded p-3 text-center flex-1 flex flex-col items-center justify-center transition-all ${btnClass}`}><span className="text-[10px] font-bold opacity-60 mb-1">{letter}</span> <span className="text-sm">{opt}</span></button>) })}</div>
               <button onClick={() => !submitted && setAnswers(p => ({...p, [idx]: 'N'}))} className={`w-full border rounded p-3 font-bold text-center transition-all ${!submitted ? (userSel === 'N' ? `${color} text-white` : "bg-slate-50 text-slate-600 hover:bg-slate-100") : (correctVal === 'N' ? "bg-green-500 text-white border-green-500" : (userSel === 'N' ? "bg-red-500 text-white border-red-500" : "opacity-40 border-slate-100"))}`}>N. No Mistake</button>
               {submitted && userSel !== correctVal && explanation && (<div className="mt-3 text-sm text-red-600 bg-red-50 p-2 rounded">{explanation}</div>)}
            </div>
          )
        })}
      </div>
      <div className="p-4 bg-white border-t">{!submitted ? (<button disabled={Object.keys(answers).length !== questions.length} onClick={() => setSubmitted(true)} className={`w-full ${color} text-white py-3 rounded-lg font-bold shadow-lg disabled:opacity-50`}>Submit Answers</button>) : (<div className="text-center"><div className="text-xl font-bold mb-2">You scored {currentScore} / {questions.length}</div><button onClick={() => navigate('english_menu')} className="w-full bg-slate-800 text-white py-3 rounded-lg font-bold">Finish</button></div>)}</div>
    </div>
  )
};

// --- CLOZE QUIZ SCREEN ---
const ClozeQuizScreen = ({ data, navigate }) => {
  const theme = THEMES.english;
  const [score, setScore] = useState(0); const [answers, setAnswers] = useState({}); const [submitted, setSubmitted] = useState(false); const questions = data.questions || [];
  if (questions.length === 0) return <div>No data.</div>;
  const calculateScore = () => { let currentScore = 0; questions.forEach((q, idx) => { const correctLetter = (q[9] || "").trim().toUpperCase(); const userChoice = answers[idx]; if (userChoice === correctLetter) currentScore++; }); return currentScore; };
  const handleAnswerClick = (qIdx, choiceLetter) => { if (submitted) return; setAnswers(prev => ({ ...prev, [qIdx]: choiceLetter })); };
  const handleSubmit = () => { setScore(calculateScore()); setSubmitted(true); };
  
  return (
    <div className="flex flex-col h-screen bg-slate-50 md:flex-row">
      <header className={`bg-gradient-to-r ${theme.headerGradient} text-white p-3 flex items-center justify-between shadow z-10 md:fixed md:top-0 md:left-0 md:right-0 md:h-16`}><button onClick={() => navigate('cloze_selection', { groups: data.groups })} className="mr-2"><ChevronLeft/></button><span className="font-bold text-sm">Cloze: {data.title}</span></header>
      <div className="flex flex-col md:flex-row flex-1 md:mt-16 h-full overflow-hidden">
        <div className="bg-purple-50 p-6 border-b-4 md:border-b-0 md:border-r-4 border-purple-100 shadow-inner h-[40%] md:h-full md:w-1/2 overflow-y-auto"><h3 className="text-xs font-bold text-purple-400 mb-2 uppercase tracking-wide sticky top-0 bg-purple-50 py-2">Passage</h3><p className="text-lg leading-relaxed font-serif text-slate-800 whitespace-pre-wrap">{data.passageText || "Loading passage..."}</p></div>
        <div className="bg-slate-100 p-4 flex-1 md:w-1/2 h-full overflow-y-auto"><h3 className="text-xs font-bold text-slate-400 mb-4 uppercase tracking-wide">Fill the Gaps</h3><div className="space-y-6 pb-24"> {questions.map((currentQ, idx) => { const userAnswer = answers[idx]; const correctLetter = (currentQ[9] || "").trim().toUpperCase(); return (<div key={idx} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200"><div className="flex justify-between items-start mb-3"><span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded">Gap {currentQ[3]}</span>{submitted && (userAnswer === correctLetter ? <span className="text-green-600 font-bold text-xs flex items-center"><Check size={14} className="mr-1"/> Correct</span> : <span className="text-red-500 font-bold text-xs flex items-center"><X size={14} className="mr-1"/> Wrong (Ans: {correctLetter})</span>)}</div><div className="flex flex-wrap gap-2">{['A', 'B', 'C', 'D', 'E'].map((letter, i) => { const optText = currentQ[4 + i]; if (!optText) return null; const isSelected = userAnswer === letter; let btnClass = "border-slate-200 hover:bg-purple-50 text-slate-600"; if (!submitted) { if (isSelected) btnClass = "bg-purple-600 text-white border-purple-600 ring-2 ring-purple-200"; } else { if (letter === correctLetter) btnClass = "bg-green-500 text-white border-green-500"; else if (isSelected) btnClass = "bg-red-500 text-white border-red-500"; else btnClass = "opacity-50"; } return (<button key={letter} onClick={() => handleAnswerClick(idx, letter)} className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${btnClass} flex-grow`}><span className="opacity-60 text-xs mr-1">{letter}.</span> {optText}</button>) })}</div></div>); })}</div></div></div>
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 shadow-lg md:left-1/2 z-30">{!submitted ? (<button onClick={handleSubmit} disabled={Object.keys(answers).length !== questions.length} className={`w-full ${theme.buttonPrimary} py-3 rounded-xl font-bold shadow-md disabled:opacity-50`}>Submit All Answers</button>) : (<div className="flex items-center justify-between"><div className="text-xl font-bold text-slate-800">Score: {score} <span className="text-slate-400 text-sm">/ {questions.length}</span></div><button onClick={() => navigate('english_menu')} className="bg-slate-800 text-white px-6 py-3 rounded-xl font-bold">Finish</button></div>)}</div>
    </div>
  );
};

// --- COMPREHENSION ---
const ComprehensionQuizScreen = ({ data, navigate }) => {
  // Reuse logic from before, just wrapped in styled layout
  const theme = THEMES.english;
  const [score, setScore] = useState(0); const [answers, setAnswers] = useState({}); const [submitted, setSubmitted] = useState(false);
  const questions = data.questions || [];
  if (questions.length === 0) return <div>No data</div>;
  const calculateScore = () => { let c=0; questions.forEach((q,i)=>{ if(answers[i] === (q[8]||"").trim().toUpperCase()) c++ }); return c; };
  const handleAnswerClick = (idx, lettr) => { if(submitted)return; setAnswers(prev=>({...prev, [idx]:lettr})); };
  const handleSubmit = () => { setScore(calculateScore()); setSubmitted(true); };

  return (
    <div className="flex flex-col h-screen bg-slate-50 md:flex-row">
      <header className={`bg-gradient-to-r ${theme.headerGradient} text-white p-3 flex items-center justify-between shadow z-10 md:fixed md:top-0 md:left-0 md:right-0 md:h-16`}><button onClick={() => navigate('comprehension_selection', { groups: data.groups })} className="mr-2"><ChevronLeft/></button><span className="font-bold text-sm">Comprehension</span></header>
      <div className="flex flex-col md:flex-row flex-1 md:mt-16 h-full overflow-hidden">
        <div className="bg-yellow-50 p-6 border-b-4 md:border-b-0 md:border-r-4 border-indigo-100 shadow-inner h-[40%] md:h-full md:w-1/2 overflow-y-auto"><h3 className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide sticky top-0 bg-yellow-50 py-2">Passage</h3><p className="text-lg leading-relaxed font-serif text-slate-800 whitespace-pre-wrap">{data.passageText}</p></div>
        <div className="bg-slate-100 p-4 flex-1 md:w-1/2 h-full overflow-y-auto"><h3 className="text-xs font-bold text-slate-400 mb-4 uppercase tracking-wide">Questions</h3><div className="space-y-6 pb-24">{questions.map((q, idx) => { const user = answers[idx]; const correct = (q[8]||"").trim().toUpperCase(); return (<div key={idx} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200"><div className="flex justify-between items-start mb-3"><span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded">Q{idx+1}</span>{submitted && (user === correct ? <span className="text-green-600 font-bold text-xs flex items-center"><Check size={14} className="mr-1"/> Correct</span> : <span className="text-red-500 font-bold text-xs flex items-center"><X size={14} className="mr-1"/> Wrong (Ans: {correct})</span>)}</div><p className="font-bold text-md mb-4 text-slate-800">{q[1]}</p><div className="flex flex-wrap gap-2">{['A','B','C','D','E'].map((l, i)=>{ const txt = q[3+i]; if(!txt)return null; const isSel = user===l; let cls = "border-slate-200 hover:bg-blue-50 text-slate-600"; if(!submitted){ if(isSel) cls="bg-blue-600 text-white border-blue-600 shadow-md"; } else { if(l===correct) cls="bg-green-500 text-white border-green-500"; else if(isSel) cls="bg-red-500 text-white border-red-500"; else cls="opacity-50"; } return (<button key={l} onClick={()=>handleAnswerClick(idx,l)} className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all ${cls} flex-grow`}>{l}. {txt}</button>) })}</div></div>) })}</div></div>
      </div>
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 shadow-lg md:left-1/2 z-30">{!submitted ? (<button onClick={handleSubmit} disabled={Object.keys(answers).length !== questions.length} className={`w-full ${theme.buttonPrimary} py-3 rounded-xl font-bold shadow-md disabled:opacity-50`}>Submit All</button>) : (<div className="flex items-center justify-between"><div className="text-xl font-bold text-slate-800">Score: {score} <span className="text-slate-400 text-sm">/ {questions.length}</span></div><button onClick={() => navigate('english_menu')} className="bg-slate-800 text-white px-6 py-3 rounded-xl font-bold">Finish</button></div>)}</div>
    </div>
  )
}