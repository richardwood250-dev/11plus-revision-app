import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  View, Text, TouchableOpacity, TextInput, StyleSheet, 
  Platform, ActivityIndicator, Alert, Dimensions, ScrollView, Modal 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { auth } from '../firebase-config';
import { logIn, getProfile } from '../utils/storage';
import { 
  DAILY_DOMAIN, DEFAULT_ROOM_NAME, 
  createDailyMeetingToken, createDailyRoom 
} from '../utils/dailyService';
import { 
  loadPdfDocument, renderPdfPageToImage 
} from '../utils/pdfService';
import { QuizImporterModal } from '../components/QuizImporterModal';
import { 
  loadClassroomSession, 
  saveClassroomMeta, 
  saveClassroomPage, 
  saveClassroomPageDrawings, 
  saveClassroomNotes 
} from '../utils/classroomStorage';

// Daily.co Iframe embed SDK
let DailyIframe = null;
if (Platform.OS === 'web') {
  try {
    DailyIframe = require('@daily-co/daily-js');
    if (DailyIframe && DailyIframe.default) {
      DailyIframe = DailyIframe.default;
    }
  } catch (e) {
    console.warn('Failed to import DailyIframe:', e);
  }
}

export const ClassroomScreen = () => {
  const navigation = useNavigation();
  const [windowWidth, setWindowWidth] = useState(() => 
    Platform.OS === 'web' && typeof window !== 'undefined' ? window.innerWidth : 1200
  );

  // --- Master Tutor Password ---
  const TUTOR_MASTER_PASSWORD = 'Ninjatutor81!';

  // --- Auth / Access State ---
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [authMode, setAuthMode] = useState('tutor'); // 'tutor' | 'login'
  const [authUsername, setAuthUsername] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authPasscode, setAuthPasscode] = useState('');
  const [authError, setAuthError] = useState('');
  const [isSubmittingAuth, setIsSubmittingAuth] = useState(false);

  // User Role & Session
  const [userRole, setUserRole] = useState('tutor'); // 'tutor' | 'student'
  const [userName, setUserName] = useState('Sensei Richard');
  const [roomName, setRoomName] = useState(DEFAULT_ROOM_NAME);

  // --- Layout State (Desktop 75/25, Mobile Tabs) ---
  const [activeMobileTab, setActiveMobileTab] = useState('canvas'); // 'canvas' | 'sidebar'
  const [isNotesMinimized, setIsNotesMinimized] = useState(false);

  // --- Excalidraw Canvas Iframe Reference ---
  const canvasIframeRef = useRef(null);
  const [isCanvasReady, setIsCanvasReady] = useState(false);
  const [isCanvasMenusMinimized, setIsCanvasMenusMinimized] = useState(false);

  const toggleCanvasMenus = () => {
    const next = !isCanvasMenusMinimized;
    setIsCanvasMenusMinimized(next);
    if (canvasIframeRef.current && canvasIframeRef.current.contentWindow) {
      canvasIframeRef.current.contentWindow.postMessage({
        type: 'TOGGLE_MENUS',
        minimized: next,
      }, '*');
    }
  };

  // --- PDF & Worksheet State ---
  const pdfDocRef = useRef(null);
  const quizPagesRef = useRef(null);
  const lastRenderedPageRef = useRef(null);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [pdfFileName, setPdfFileName] = useState('');
  const [totalPdfPages, setTotalPdfPages] = useState(0);
  const [currentPdfPage, setCurrentPdfPage] = useState(0);
  const [isLoadingPdf, setIsLoadingPdf] = useState(false);
  const [pdfStatusMessage, setPdfStatusMessage] = useState('');

  // --- PDF Export State ---
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportStatusText, setExportStatusText] = useState('');

  // --- Persistent Classroom Storage State ---
  const savedPagesMapRef = useRef({});
  const [cloudSyncStatus, setCloudSyncStatus] = useState('saved'); // 'saved' | 'saving'
  const saveDebounceTimerRef = useRef(null);
  const notesDebounceTimerRef = useRef(null);

  // --- Daily.co Call State ---
  const videoContainerRef = useRef(null);
  const dailyCallRef = useRef(null);
  const [callStatus, setCallStatus] = useState('idle'); // 'idle' | 'connecting' | 'in-call' | 'error'
  const [callErrorReason, setCallErrorReason] = useState('');
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  // --- Session Notes State ---
  const [sessionNotes, setSessionNotes] = useState(
    `# 1-on-1 Tutoring Session Notes\n` +
    `Date: ${new Date().toLocaleDateString('en-GB')}\n` +
    `Student: Alex (11+ Candidate)\n` +
    `Topic: Multi-step Word Problems & Fractions\n\n` +
    `## Key Concepts Mastered\n- Simplifying fractions\n- Speed, Distance, Time formulas\n\n` +
    `## Questions to Review\n- Question 5: Ratio problem\n\n` +
    `## Assigned Homework\n- Complete Practice Paper 1 (Questions 8-10)\n`
  );
  const [copyStatus, setCopyStatus] = useState('');

  // Multi-tab sync BroadcastChannel
  const broadcastChannelRef = useRef(null);

  // 1. Handle Window Resize & Hide Social Share Bar
  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const handleResize = () => setWindowWidth(window.innerWidth);
      window.addEventListener('resize', handleResize);

      // Remove social media bar from whiteboard page
      document.body.classList.add('classroom-active');
      const shareBar = document.getElementById('social-share-container');
      if (shareBar) shareBar.style.display = 'none';

      return () => {
        window.removeEventListener('resize', handleResize);
        document.body.classList.remove('classroom-active');
        if (shareBar) shareBar.style.display = '';
      };
    }
  }, []);

  // 2. Initial Auth & URL parameters
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const currentUser = auth.currentUser;
        const profile = await getProfile();
        
        if (typeof window !== 'undefined') {
          const urlParams = new URLSearchParams(window.location.search);
          let roomParam = urlParams.get('room');
          const roleParam = urlParams.get('role');
          const tokenParam = urlParams.get('token');

          // Ensure each session has a unique private room by default to prevent overlap
          if (!roomParam) {
            const randomCode = Math.random().toString(36).substring(2, 8);
            roomParam = `session-${randomCode}`;
            const newUrl = new URL(window.location.href);
            newUrl.searchParams.set('room', roomParam);
            window.history.replaceState({}, '', newUrl.toString());
          }

          setRoomName(roomParam);

          // Load any previously saved session for this room
          try {
            const saved = await loadClassroomSession(roomParam);
            if (saved && saved.exists) {
              if (saved.meta) {
                if (saved.meta.title) setPdfFileName(saved.meta.title);
                if (saved.meta.totalPdfPages) setTotalPdfPages(saved.meta.totalPdfPages);
                if (saved.meta.currentPdfPage) setCurrentPdfPage(saved.meta.currentPdfPage);
                if (saved.meta.sessionNotes) setSessionNotes(saved.meta.sessionNotes);
              }
              if (saved.pages) {
                savedPagesMapRef.current = saved.pages;
                const drawingsObj = {};
                for (const [pNum, pData] of Object.entries(saved.pages)) {
                  if (pData && pData.drawings) {
                    drawingsObj[Number(pNum)] = pData.drawings;
                  }
                }
                pageDrawingsRef.current = drawingsObj;
              }
            }
          } catch (loadErr) {
            console.warn('Error loading saved session on init:', loadErr);
          }

          // A. Student Access via Tutor's Invite Link:
          // When a student arrives via invite link (role=student and a token), grant automatic entry!
          if (roleParam === 'student' && (tokenParam === 'ninja-student' || tokenParam === 'ninja' || tokenParam === 'student')) {
            setIsAuthenticated(true);
            setUserRole('student');
            setUserName('Alex (Student)');
          } else if (sessionStorage.getItem('ninja_tutor_authorized') === 'true') {
            // Tutor already entered password in this browser session
            setIsAuthenticated(true);
            setUserRole('tutor');
            setUserName('Sensei Richard');
          }
        }

        if (currentUser && !currentUser.isAnonymous) {
          setIsAuthenticated(true);
          setUserName(currentUser.email ? currentUser.email.split('@')[0] : 'Ninja User');
        } else if (profile && profile.username) {
          setUserName(profile.username);
        }
      } catch (err) {
        console.warn('Auth check error:', err);
      } finally {
        setIsAuthChecking(false);
      }
    };
    checkAuthStatus();
  }, []);

  // Keep callStatus in a ref to avoid stale closures in event listeners
  const callStatusRef = useRef(callStatus);
  useEffect(() => {
    callStatusRef.current = callStatus;
  }, [callStatus]);

  const lastCanvasElementsRef = useRef([]);
  // Per-page drawings store: { [pageNumber]: Array<ExcalidrawElement> }
  const pageDrawingsRef = useRef({});
  const currentPdfPageRef = useRef(currentPdfPage);
  useEffect(() => {
    currentPdfPageRef.current = currentPdfPage;
  }, [currentPdfPage]);

  // --- Peer Broadcast Helper (Stable Reference via Refs) ---
  const broadcastToPeer = useCallback((payload) => {
    // 1. Send via Daily.co WebRTC data channel if in call
    if (dailyCallRef.current) {
      try {
        const state = typeof dailyCallRef.current.meetingState === 'function' 
          ? dailyCallRef.current.meetingState() 
          : null;
        if (state === 'joined-meeting' || callStatusRef.current === 'in-call') {
          dailyCallRef.current.sendAppMessage(payload, '*');
        }
      } catch (err) {
        console.warn('Daily sendAppMessage error:', err);
      }
    }

    // 2. Send via BroadcastChannel for same-machine tabs
    if (broadcastChannelRef.current) {
      try {
        broadcastChannelRef.current.postMessage(payload);
      } catch (err) {
        // ignore
      }
    }
  }, []);

  const broadcastToPeerRef = useRef(broadcastToPeer);
  useEffect(() => {
    broadcastToPeerRef.current = broadcastToPeer;
  }, [broadcastToPeer]);

  // --- Incoming Peer Message Handler ---
  const handleIncomingPeerMessage = useCallback((msg) => {
    if (!msg || !msg.type) return;

    if (msg.type === 'CANVAS_SYNC') {
      const pNum = Number(msg.pageNumber) || currentPdfPageRef.current || 1;
      if (msg.allPages && typeof msg.allPages === 'object') {
        pageDrawingsRef.current = { ...pageDrawingsRef.current, ...msg.allPages };
      }
      if (msg.elements) {
        pageDrawingsRef.current[pNum] = msg.elements;
        lastCanvasElementsRef.current = msg.elements;
      }
      // Forward synced drawing to Excalidraw iframe
      if (canvasIframeRef.current && canvasIframeRef.current.contentWindow) {
        canvasIframeRef.current.contentWindow.postMessage({
          type: 'SYNC_ELEMENTS',
          pageNumber: pNum,
          elements: msg.elements,
          allPages: msg.allPages || pageDrawingsRef.current,
        }, '*');
      }
    } else if (msg.type === 'REQUEST_STATE_SYNC') {
      if (lastRenderedPageRef.current && broadcastToPeerRef.current) {
        broadcastToPeerRef.current(lastRenderedPageRef.current);
      }
      const pNum = currentPdfPageRef.current || 1;
      if (broadcastToPeerRef.current) {
        broadcastToPeerRef.current({
          type: 'CANVAS_SYNC',
          pageNumber: pNum,
          elements: pageDrawingsRef.current[pNum] || lastCanvasElementsRef.current || [],
          allPages: pageDrawingsRef.current,
        });
      }
    } else if (msg.type === 'PDF_PAGE_LOADED') {
      // Load peer's active PDF page on local canvas
      if (canvasIframeRef.current && canvasIframeRef.current.contentWindow) {
        canvasIframeRef.current.contentWindow.postMessage({
          type: 'LOAD_PDF_PAGE',
          fileId: msg.fileId,
          dataUrl: msg.dataUrl,
          width: msg.width,
          height: msg.height,
          pageNumber: msg.pageNumber,
          isNewDocument: msg.isNewDocument,
        }, '*');
      }
      setCurrentPdfPage(msg.pageNumber);
      if (msg.totalPdfPages) setTotalPdfPages(msg.totalPdfPages);
      if (msg.fileName) setPdfFileName(msg.fileName);
      lastRenderedPageRef.current = msg;
    } else if (msg.type === 'NOTES_SYNC') {
      setSessionNotes(msg.notes);
    }
  }, []);

  const handleIncomingPeerMessageRef = useRef(handleIncomingPeerMessage);
  useEffect(() => {
    handleIncomingPeerMessageRef.current = handleIncomingPeerMessage;
  }, [handleIncomingPeerMessage]);

  // 3. Listen to messages from Excalidraw Iframe and BroadcastChannel
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // A. BroadcastChannel for same-machine multi-tab collaboration
    try {
      const channel = new BroadcastChannel(`ninja_classroom_${roomName}`);
      broadcastChannelRef.current = channel;

      channel.onmessage = (event) => {
        if (handleIncomingPeerMessageRef.current) {
          handleIncomingPeerMessageRef.current(event.data);
        }
      };
    } catch (e) {
      console.warn('BroadcastChannel error:', e);
    }

    // B. Window PostMessage listener for Excalidraw Iframe
    const handleWindowMessage = (event) => {
      const data = event.data;
      if (!data) return;

      if (data.type === 'CANVAS_READY') {
        setIsCanvasReady(true);
        if (broadcastToPeerRef.current) {
          broadcastToPeerRef.current({ type: 'REQUEST_STATE_SYNC' });
        }
        // If we restored a saved session from persistence, load active page into canvas
        const activeP = currentPdfPageRef.current || 1;
        const savedPage = savedPagesMapRef.current && savedPagesMapRef.current[activeP];
        if (savedPage && savedPage.background && canvasIframeRef.current && canvasIframeRef.current.contentWindow) {
          canvasIframeRef.current.contentWindow.postMessage({
            type: 'LOAD_PDF_PAGE',
            fileId: savedPage.fileId || `saved_p${activeP}`,
            dataUrl: savedPage.background.dataUrl,
            width: savedPage.background.width,
            height: savedPage.background.height,
            pageNumber: activeP,
            isNewDocument: false,
          }, '*');
        }
        if (pageDrawingsRef.current && Object.keys(pageDrawingsRef.current).length > 0 && canvasIframeRef.current && canvasIframeRef.current.contentWindow) {
          canvasIframeRef.current.contentWindow.postMessage({
            type: 'SYNC_ELEMENTS',
            pageNumber: activeP,
            elements: pageDrawingsRef.current[activeP] || [],
            allPages: pageDrawingsRef.current,
          }, '*');
        }
      } else if (data.type === 'CANVAS_CHANGE') {
        const pNum = Number(data.pageNumber) || currentPdfPageRef.current || 1;
        pageDrawingsRef.current[pNum] = data.elements || [];
        lastCanvasElementsRef.current = data.elements || [];
        // Forward drawing changes to peer in real time
        if (broadcastToPeerRef.current) {
          broadcastToPeerRef.current({
            type: 'CANVAS_SYNC',
            pageNumber: pNum,
            elements: data.elements,
            allPages: pageDrawingsRef.current,
          });
        }
        // Debounce auto-save drawings to persistent storage
        setCloudSyncStatus('saving');
        if (saveDebounceTimerRef.current) {
          clearTimeout(saveDebounceTimerRef.current);
        }
        saveDebounceTimerRef.current = setTimeout(() => {
          saveClassroomPageDrawings(roomName, pNum, data.elements);
          setCloudSyncStatus('saved');
        }, 1200);
      } else if (data.type === 'MENUS_MINIMIZED_CHANGED') {
        setIsCanvasMenusMinimized(data.minimized);
      } else if (data.type === 'REQUEST_EXPORT_PDF') {
        if (handleExportPdfClickRef.current) {
          handleExportPdfClickRef.current();
        }
      } else if (data.type === 'EXPORT_PROGRESS') {
        setExportStatusText(`Rendering page ${data.current} of ${data.total}...`);
      } else if (data.type === 'EXPORT_COMPLETE') {
        setIsExportingPdf(false);
        setShowExportModal(false);
        if (data.success) {
          Alert.alert('PDF Exported 🎉', `Successfully downloaded ${data.fileName || 'your lesson PDF'}!`);
        } else {
          Alert.alert('Export Error', data.error || 'Failed to generate PDF. Please try again.');
        }
      }
    };

    window.addEventListener('message', handleWindowMessage);

    return () => {
      window.removeEventListener('message', handleWindowMessage);
      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.close();
      }
    };
  }, [roomName]);

  // --- PDF Loading & Rendering ---
  const loadPdfFromSource = async (source, fileName = '11plus_paper.pdf') => {
    setIsLoadingPdf(true);
    setPdfStatusMessage('Parsing PDF pages...');
    try {
      const doc = await loadPdfDocument(source);
      pdfDocRef.current = doc;

      const hasExisting = totalPdfPages > 0 && Object.keys(savedPagesMapRef.current || {}).length > 0;
      let shouldAppend = false;

      if (hasExisting && typeof window !== 'undefined') {
        shouldAppend = window.confirm(
          `You already have ${totalPdfPages} page(s) in this session.\n\nClick OK to APPEND the new PDF pages (Pages ${totalPdfPages + 1} to ${totalPdfPages + doc.numPages}), or Cancel to REPLACE existing pages.`
        );
      }

      if (shouldAppend) {
        const startingPage = totalPdfPages;
        const newTotal = startingPage + doc.numPages;
        const firstNewPage = startingPage + 1;

        // Render and save all pages of the appended PDF
        setPdfStatusMessage(`Appending ${doc.numPages} pages...`);
        for (let p = 1; p <= doc.numPages; p++) {
          const targetP = startingPage + p;
          const rendered = await renderPdfPageToImage(doc, p, 1.75);
          const fileId = `pdf_p${targetP}_${Date.now()}`;
          const pageInfo = {
            pageNumber: targetP,
            fileId,
            background: {
              dataUrl: rendered.dataUrl,
              width: rendered.displayWidth,
              height: rendered.displayHeight,
            },
            drawings: [],
            title: `${fileName} (Page ${p})`,
          };
          savedPagesMapRef.current[targetP] = pageInfo;
          saveClassroomPage(roomName, targetP, pageInfo);
        }

        setTotalPdfPages(newTotal);
        setCurrentPdfPage(firstNewPage);
        saveClassroomMeta(roomName, {
          totalPdfPages: newTotal,
          currentPdfPage: firstNewPage,
        });

        const firstNewPageInfo = savedPagesMapRef.current[firstNewPage];
        if (canvasIframeRef.current && canvasIframeRef.current.contentWindow) {
          canvasIframeRef.current.contentWindow.postMessage({
            type: 'LOAD_PDF_PAGE',
            fileId: firstNewPageInfo.fileId,
            dataUrl: firstNewPageInfo.background.dataUrl,
            width: firstNewPageInfo.background.width,
            height: firstNewPageInfo.background.height,
            pageNumber: firstNewPage,
            isNewDocument: false,
          }, '*');
        }

        const payload = {
          type: 'PDF_PAGE_LOADED',
          pageNumber: firstNewPage,
          fileId: firstNewPageInfo.fileId,
          dataUrl: firstNewPageInfo.background.dataUrl,
          width: firstNewPageInfo.background.width,
          height: firstNewPageInfo.background.height,
          fileName: pdfFileName || fileName,
          totalPdfPages: newTotal,
          isNewDocument: false,
        };
        lastRenderedPageRef.current = payload;
        broadcastToPeer(payload);
        setPdfStatusMessage(`Appended ${doc.numPages} pages (Pages ${firstNewPage}-${newTotal}) 📄`);
      } else {
        // Start fresh
        quizPagesRef.current = null;
        pageDrawingsRef.current = {};
        lastCanvasElementsRef.current = [];
        savedPagesMapRef.current = {};
        setPdfFileName(fileName);
        setTotalPdfPages(doc.numPages);
        setPdfStatusMessage(`Loaded ${doc.numPages} pages. Rendering Page 1...`);
        await renderAndInjectPage(doc, 1, true);
        setPdfStatusMessage(`Page 1 active`);
      }
    } catch (err) {
      console.error('Error loading PDF:', err);
      Alert.alert('PDF Error', 'Failed to parse the PDF document. Please try another file.');
      setPdfStatusMessage('Failed to load PDF');
    } finally {
      setIsLoadingPdf(false);
    }
  };

  const renderAndInjectPage = async (doc, pageNum, isNewDocument = false) => {
    if (!doc) return;
    setIsLoadingPdf(true);
    try {
      const rendered = await renderPdfPageToImage(doc, pageNum, 1.75);
      const fileId = `pdf_p${pageNum}_${Date.now()}`;

      // Send to Excalidraw canvas iframe
      if (canvasIframeRef.current && canvasIframeRef.current.contentWindow) {
        canvasIframeRef.current.contentWindow.postMessage({
          type: 'LOAD_PDF_PAGE',
          fileId,
          dataUrl: rendered.dataUrl,
          width: rendered.displayWidth,
          height: rendered.displayHeight,
          pageNumber: pageNum,
          isNewDocument,
        }, '*');
      }

      setCurrentPdfPage(pageNum);

      // Broadcast page load to peer
      const pagePayload = {
        type: 'PDF_PAGE_LOADED',
        pageNumber: pageNum,
        fileId,
        dataUrl: rendered.dataUrl,
        width: rendered.displayWidth,
        height: rendered.displayHeight,
        fileName: pdfFileName || 'Sample 11+ Maths Paper.pdf',
        totalPdfPages: doc.numPages || totalPdfPages,
        isNewDocument,
      };
      lastRenderedPageRef.current = pagePayload;
      broadcastToPeer(pagePayload);

      // Save page background and metadata to persistent storage
      const pageInfo = {
        pageNumber: pageNum,
        fileId,
        background: {
          dataUrl: rendered.dataUrl,
          width: rendered.displayWidth,
          height: rendered.displayHeight,
        },
        drawings: pageDrawingsRef.current[pageNum] || [],
      };
      savedPagesMapRef.current[pageNum] = pageInfo;
      saveClassroomPage(roomName, pageNum, pageInfo);
      saveClassroomMeta(roomName, {
        title: pdfFileName || '11+ Practice Paper',
        totalPdfPages: doc.numPages || totalPdfPages,
        currentPdfPage: pageNum,
      });
    } catch (err) {
      console.error('Failed to render PDF page:', err);
    } finally {
      setIsLoadingPdf(false);
    }
  };

  const handlePdfUploadClick = () => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const fileInput = document.getElementById('pdf-file-uploader');
      if (fileInput) {
        fileInput.value = '';
        fileInput.click();
      }
    }
  };

  const onFileInputChange = (event) => {
    const file = event.target.files && event.target.files[0];
    if (file) {
      loadPdfFromSource(file, file.name);
    }
  };

  const handleLoadSamplePdf = () => {
    loadPdfFromSource('/assets/sample-11plus-paper.pdf', 'Sample 11+ Maths Paper.pdf');
  };

  // --- Quiz Worksheet Handlers ---
  const handleLoadQuizQuestion = async ({ question, rendered }) => {
    // Check if room already has existing pages (append mode)
    const hasExistingPages = totalPdfPages > 0 && Object.keys(savedPagesMapRef.current || {}).length > 0;
    const targetPage = hasExistingPages ? totalPdfPages + 1 : 1;
    const fileId = `quiz_${question.id}_${Date.now()}`;
    const questionTitle = `11+ ${question.subject}: ${question.topic} (Q${targetPage})`;

    // Save drawings of the page we are navigating away from
    if (hasExistingPages && pageDrawingsRef.current[currentPdfPageRef.current]) {
      saveClassroomPageDrawings(roomName, currentPdfPageRef.current, pageDrawingsRef.current[currentPdfPageRef.current]);
    }

    const pageInfo = {
      pageNumber: targetPage,
      fileId,
      background: {
        dataUrl: rendered.dataUrl,
        width: rendered.displayWidth,
        height: rendered.displayHeight,
      },
      drawings: [],
      question,
      title: questionTitle,
    };

    savedPagesMapRef.current[targetPage] = pageInfo;
    saveClassroomPage(roomName, targetPage, pageInfo);

    if (hasExistingPages) {
      setTotalPdfPages(targetPage);
      setCurrentPdfPage(targetPage);
      saveClassroomMeta(roomName, {
        totalPdfPages: targetPage,
        currentPdfPage: targetPage,
      });
    } else {
      setPdfFileName(questionTitle);
      setTotalPdfPages(1);
      setCurrentPdfPage(1);
      saveClassroomMeta(roomName, {
        title: questionTitle,
        totalPdfPages: 1,
        currentPdfPage: 1,
      });
    }

    if (canvasIframeRef.current && canvasIframeRef.current.contentWindow) {
      canvasIframeRef.current.contentWindow.postMessage({
        type: 'LOAD_PDF_PAGE',
        fileId,
        dataUrl: rendered.dataUrl,
        width: rendered.displayWidth,
        height: rendered.displayHeight,
        pageNumber: targetPage,
        isNewDocument: !hasExistingPages,
      }, '*');
    }

    const payload = {
      type: 'PDF_PAGE_LOADED',
      pageNumber: targetPage,
      fileId,
      dataUrl: rendered.dataUrl,
      width: rendered.displayWidth,
      height: rendered.displayHeight,
      fileName: pdfFileName || questionTitle,
      totalPdfPages: targetPage,
      isNewDocument: !hasExistingPages,
    };
    lastRenderedPageRef.current = payload;
    broadcastToPeer(payload);

    setPdfStatusMessage(hasExistingPages ? `Added Question as Page ${targetPage} of ${targetPage} 📄` : 'Page 1 active');
    setTimeout(() => setPdfStatusMessage(''), 3000);
  };

  const handleLoadQuizSet = async (set, title) => {
    if (!set || set.length === 0) return;

    // Check if room already has existing pages (append mode)
    const hasExistingPages = totalPdfPages > 0 && Object.keys(savedPagesMapRef.current || {}).length > 0;
    const startingPage = hasExistingPages ? totalPdfPages : 0;
    const newTotal = startingPage + set.length;
    const firstActivePage = startingPage + 1;
    const setTitle = title || `11+ Practice: Set of ${set.length}`;

    // Save drawings of the page we are navigating away from
    if (hasExistingPages && pageDrawingsRef.current[currentPdfPageRef.current]) {
      saveClassroomPageDrawings(roomName, currentPdfPageRef.current, pageDrawingsRef.current[currentPdfPageRef.current]);
    }

    // Save all pages of the set
    set.forEach((item, idx) => {
      const pNum = startingPage + idx + 1;
      const fileId = `quiz_set_p${pNum}_${Date.now()}`;
      const pageInfo = {
        pageNumber: pNum,
        fileId,
        background: {
          dataUrl: item.rendered.dataUrl,
          width: item.rendered.displayWidth,
          height: item.rendered.displayHeight,
        },
        drawings: [],
        question: item.question,
      };
      savedPagesMapRef.current[pNum] = pageInfo;
      saveClassroomPage(roomName, pNum, pageInfo);
    });

    if (!hasExistingPages) {
      setPdfFileName(setTitle);
    }
    setTotalPdfPages(newTotal);
    setCurrentPdfPage(firstActivePage);

    saveClassroomMeta(roomName, {
      title: pdfFileName || setTitle,
      totalPdfPages: newTotal,
      currentPdfPage: firstActivePage,
    });

    const firstItem = set[0];
    const firstFileId = savedPagesMapRef.current[firstActivePage].fileId;

    if (canvasIframeRef.current && canvasIframeRef.current.contentWindow) {
      canvasIframeRef.current.contentWindow.postMessage({
        type: 'LOAD_PDF_PAGE',
        fileId: firstFileId,
        dataUrl: firstItem.rendered.dataUrl,
        width: firstItem.rendered.displayWidth,
        height: firstItem.rendered.displayHeight,
        pageNumber: firstActivePage,
        isNewDocument: !hasExistingPages,
      }, '*');
    }

    const payload = {
      type: 'PDF_PAGE_LOADED',
      pageNumber: firstActivePage,
      fileId: firstFileId,
      dataUrl: firstItem.rendered.dataUrl,
      width: firstItem.rendered.displayWidth,
      height: firstItem.rendered.displayHeight,
      fileName: pdfFileName || setTitle,
      totalPdfPages: newTotal,
      isNewDocument: !hasExistingPages,
    };
    lastRenderedPageRef.current = payload;
    broadcastToPeer(payload);

    setPdfStatusMessage(hasExistingPages 
      ? `Added ${set.length} questions (Pages ${firstActivePage}-${newTotal}) 📚` 
      : `Loaded ${set.length} questions`);
    setTimeout(() => setPdfStatusMessage(''), 3500);
  };

  const handleAddBlankPage = () => {
    const newPage = (totalPdfPages || 1) + 1;
    // Save current drawings before navigating
    if (pageDrawingsRef.current[currentPdfPageRef.current]) {
      saveClassroomPageDrawings(roomName, currentPdfPageRef.current, pageDrawingsRef.current[currentPdfPageRef.current]);
    }

    const fileId = `blank_p${newPage}_${Date.now()}`;
    const pageInfo = {
      pageNumber: newPage,
      fileId,
      background: null,
      drawings: [],
      title: `Page ${newPage} (Blank Canvas)`,
    };

    savedPagesMapRef.current[newPage] = pageInfo;
    saveClassroomPage(roomName, newPage, pageInfo);
    setTotalPdfPages(newPage);
    setCurrentPdfPage(newPage);
    saveClassroomMeta(roomName, {
      totalPdfPages: newPage,
      currentPdfPage: newPage,
    });

    if (canvasIframeRef.current && canvasIframeRef.current.contentWindow) {
      canvasIframeRef.current.contentWindow.postMessage({
        type: 'LOAD_PDF_PAGE',
        fileId,
        dataUrl: null,
        width: 800,
        height: 1130,
        pageNumber: newPage,
        isNewDocument: false,
      }, '*');
    }

    const payload = {
      type: 'PDF_PAGE_LOADED',
      pageNumber: newPage,
      fileId,
      dataUrl: null,
      fileName: pdfFileName,
      totalPdfPages: newPage,
      isNewDocument: false,
    };
    lastRenderedPageRef.current = payload;
    broadcastToPeer(payload);

    setPdfStatusMessage(`Added Blank Page ${newPage} 📄`);
    setTimeout(() => setPdfStatusMessage(''), 2500);
  };

  const handlePageNavigation = async (targetPage) => {
    if (targetPage < 1 || targetPage > totalPdfPages || isLoadingPdf) return;

    if (quizPagesRef.current && quizPagesRef.current.length > 0) {
      const item = quizPagesRef.current[targetPage - 1];
      if (item) {
        const fileId = `quiz_set_p${targetPage}_${Date.now()}`;
        if (canvasIframeRef.current && canvasIframeRef.current.contentWindow) {
          canvasIframeRef.current.contentWindow.postMessage({
            type: 'LOAD_PDF_PAGE',
            fileId,
            dataUrl: item.rendered.dataUrl,
            width: item.rendered.displayWidth,
            height: item.rendered.displayHeight,
            pageNumber: targetPage,
          }, '*');
        }
        setCurrentPdfPage(targetPage);

        const payload = {
          type: 'PDF_PAGE_LOADED',
          pageNumber: targetPage,
          fileId,
          dataUrl: item.rendered.dataUrl,
          width: item.rendered.displayWidth,
          height: item.rendered.displayHeight,
          fileName: pdfFileName,
          totalPdfPages: totalPdfPages,
        };
        lastRenderedPageRef.current = payload;
        broadcastToPeer(payload);
      }
    } else if (pdfDocRef.current) {
      await renderAndInjectPage(pdfDocRef.current, targetPage);
    } else if (savedPagesMapRef.current && savedPagesMapRef.current[targetPage]) {
      const item = savedPagesMapRef.current[targetPage];
      if (item && item.background) {
        const fileId = item.fileId || `saved_p${targetPage}`;
        if (canvasIframeRef.current && canvasIframeRef.current.contentWindow) {
          canvasIframeRef.current.contentWindow.postMessage({
            type: 'LOAD_PDF_PAGE',
            fileId,
            dataUrl: item.background.dataUrl,
            width: item.background.width,
            height: item.background.height,
            pageNumber: targetPage,
          }, '*');
        }
        setCurrentPdfPage(targetPage);
        saveClassroomMeta(roomName, { currentPdfPage: targetPage });
        const payload = {
          type: 'PDF_PAGE_LOADED',
          pageNumber: targetPage,
          fileId,
          dataUrl: item.background.dataUrl,
          width: item.background.width,
          height: item.background.height,
          fileName: pdfFileName,
          totalPdfPages: totalPdfPages,
        };
        lastRenderedPageRef.current = payload;
        broadcastToPeer(payload);
      }
    }
  };

  // --- PDF Export Logic ---
  const handleExportPdfClick = () => {
    if (isLoadingPdf || isExportingPdf) return;
    if (totalPdfPages > 1) {
      setShowExportModal(true);
    } else {
      executeExportPdf('current');
    }
  };

  const handleExportPdfClickRef = useRef(handleExportPdfClick);
  useEffect(() => {
    handleExportPdfClickRef.current = handleExportPdfClick;
  });

  const executeExportPdf = async (mode = 'all') => {
    if (isExportingPdf) return;
    setIsExportingPdf(true);
    setExportStatusText('Preparing pages for PDF...');

    try {
      if (mode === 'current' || totalPdfPages <= 1) {
        if (canvasIframeRef.current && canvasIframeRef.current.contentWindow) {
          canvasIframeRef.current.contentWindow.postMessage({
            type: 'EXPORT_PDF_COMMAND',
            mode: 'current',
            fileName: pdfFileName || '11plus_lesson_export',
          }, '*');
        }
        return;
      }

      // Multi-page export: gather background info and drawings for all pages
      const pagesToExport = [];
      for (let p = 1; p <= totalPdfPages; p++) {
        let background = null;

        if (quizPagesRef.current && quizPagesRef.current.length >= p) {
          const quizItem = quizPagesRef.current[p - 1];
          if (quizItem && quizItem.rendered) {
            background = {
              dataUrl: quizItem.rendered.dataUrl,
              width: quizItem.rendered.displayWidth,
              height: quizItem.rendered.displayHeight,
              fileId: `quiz_page_${p}`,
            };
          }
        } else if (pdfDocRef.current) {
          setExportStatusText(`Rendering background for page ${p} of ${totalPdfPages}...`);
          const rendered = await renderPdfPageToImage(pdfDocRef.current, p, 1.75);
          background = {
            dataUrl: rendered.dataUrl,
            width: rendered.displayWidth,
            height: rendered.displayHeight,
            fileId: `pdf_p${p}`,
          };
        } else if (savedPagesMapRef.current && savedPagesMapRef.current[p] && savedPagesMapRef.current[p].background) {
          background = {
            dataUrl: savedPagesMapRef.current[p].background.dataUrl,
            width: savedPagesMapRef.current[p].background.width,
            height: savedPagesMapRef.current[p].background.height,
            fileId: savedPagesMapRef.current[p].fileId || `saved_p${p}`,
          };
        }

        pagesToExport.push({
          pageNumber: p,
          background,
          elements: pageDrawingsRef.current[p] || [],
        });
      }

      setExportStatusText('Compiling PDF document...');
      if (canvasIframeRef.current && canvasIframeRef.current.contentWindow) {
        canvasIframeRef.current.contentWindow.postMessage({
          type: 'EXPORT_PDF_COMMAND',
          mode: 'all',
          pages: pagesToExport,
          fileName: pdfFileName || '11plus_lesson_export',
        }, '*');
      }
    } catch (err) {
      console.error('Error preparing PDF export:', err);
      setIsExportingPdf(false);
      Alert.alert('Export Error', 'Failed to prepare PDF pages: ' + (err.message || 'Unknown error'));
    }
  };

  const handleInsertQuestionNotes = (question) => {
    const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
    const optionsText = question.options && question.options.length > 0
      ? question.options.map((opt, i) => `  - **${letters[i] || i + 1})** ${opt}`).join('\n')
      : '';
    const block = 
      `\n\n---\n### 🎯 11+ Practice: ${question.question}\n` +
      `**Subject:** ${question.subject} • **Topic:** ${question.topic} (ID: ${question.id})\n\n` +
      (question.passage ? `> *${question.passage.slice(0, 160)}...*\n\n` : '') +
      (optionsText ? `**Options:**\n${optionsText}\n\n` : '') +
      `**Correct Answer:** \`${question.correctAnswer}\`` +
      (question.explanation ? `\n*Explanation:* ${question.explanation}` : '') +
      `\n---`;

    setSessionNotes((prev) => {
      const updated = prev + block;
      broadcastToPeer({ type: 'NOTES_SYNC', notes: updated });
      saveClassroomNotes(roomName, updated);
      return updated;
    });

    setCopyStatus('Quiz Added to Notes! 📋');
    setTimeout(() => setCopyStatus(''), 2500);
  };

  const handleInsertFullQuizNotes = (title, questions) => {
    if (!questions || questions.length === 0) return;
    const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
    let block = `\n\n========================================\n` +
      `📋 MARKING SCHEME: ${title.toUpperCase()}\n` +
      `Total Questions: ${questions.length} • Generated: ${new Date().toLocaleTimeString()}\n` +
      `========================================\n\n`;

    questions.forEach((q, idx) => {
      const qNum = idx + 1;
      const optionsText = q.options && q.options.length > 0
        ? q.options.map((opt, i) => `[${letters[i] || i + 1}] ${opt}`).join('  ')
        : '';
      block += `Q${qNum}. [${(q.subject || '').toUpperCase()} - ${q.topic}] (ID: ${q.id})\n` +
        `   Question: ${q.question}\n` +
        (optionsText ? `   Choices: ${optionsText}\n` : '') +
        `   👉 Answer: ${q.correctAnswer}` +
        (q.explanation ? ` | ${q.explanation}` : '') +
        `\n\n`;
    });
    block += `========================================\n`;

    setSessionNotes((prev) => {
      const updated = prev + block;
      broadcastToPeer({ type: 'NOTES_SYNC', notes: updated });
      saveClassroomNotes(roomName, updated);
      return updated;
    });

    setCopyStatus('Full Marking Scheme Added to Notes! 📋');
    setTimeout(() => setCopyStatus(''), 3000);
  };

  // --- Daily.co Call Integration ---
  const joinDailyCall = async () => {
    if (!videoContainerRef.current) return;
    if (!DailyIframe) {
      Alert.alert('Video Error', 'Daily.co SDK is not available in this environment.');
      return;
    }

    setCallStatus('connecting');
    try {
      // 1. Ensure private 2-person Daily room exists for this unique session
      await createDailyRoom(roomName, 'private');

      // 2. Generate meeting token
      const token = await createDailyMeetingToken(
        roomName, 
        userName, 
        userRole === 'tutor'
      );

      if (dailyCallRef.current) {
        try {
          await dailyCallRef.current.destroy();
        } catch (e) {}
        dailyCallRef.current = null;
      }

      const callFrame = DailyIframe.createFrame(videoContainerRef.current, {
        iframeStyle: {
          width: '100%',
          height: '100%',
          border: '0',
          borderRadius: '8px',
          backgroundColor: '#0F172A',
        },
        activeSpeakerMode: false,
        showLeaveButton: true,
        showFullscreenButton: true,
        theme: {
          colors: {
            accent: '#BE1E2D',
            mainAreaBg: '#0F172A',
          },
        },
      });

      dailyCallRef.current = callFrame;

      callFrame.on('joined-meeting', () => {
        setCallStatus('in-call');
        callStatusRef.current = 'in-call';
        setCallErrorReason('');
        // Request state sync from peer once connected to the call
        setTimeout(() => {
          if (broadcastToPeerRef.current) {
            broadcastToPeerRef.current({ type: 'REQUEST_STATE_SYNC' });
          }
        }, 800);
      });

      callFrame.on('left-meeting', () => {
        setCallStatus('idle');
        callStatusRef.current = 'idle';
      });

      callFrame.on('error', (err) => {
        console.error('Daily error event:', JSON.stringify(err) || err);
        const reason = err?.errorMsg || (typeof err === 'object' && err?.errorMsg) || '';
        if (reason === 'account-missing-payment-method') {
          setCallErrorReason('account-missing-payment-method');
          setCallStatus('error');
        }
      });

      callFrame.on('camera-error', (err) => {
        console.warn('Daily camera warning/error:', JSON.stringify(err) || err);
      });

      callFrame.on('app-message', (evt) => {
        if (evt && evt.data && handleIncomingPeerMessageRef.current) {
          handleIncomingPeerMessageRef.current(evt.data);
        }
      });

      const roomUrl = `https://${DAILY_DOMAIN}/${roomName}`;
      await callFrame.join({
        url: roomUrl,
        token: token || undefined,
        userName: userName,
      });
      setCallStatus('in-call');
    } catch (err) {
      console.error('Failed to join Daily call:', err?.message || JSON.stringify(err) || err);
      const reason = err?.errorMsg || (typeof err === 'object' && err?.errorMsg) || '';
      if (reason === 'account-missing-payment-method') {
        setCallErrorReason('account-missing-payment-method');
        setCallStatus('error');
      } else {
        setCallStatus('in-call');
      }
    }
  };

  const leaveDailyCall = async () => {
    if (dailyCallRef.current) {
      try {
        await dailyCallRef.current.leave();
        await dailyCallRef.current.destroy();
      } catch (e) {
        console.warn('Error leaving call:', e);
      }
      dailyCallRef.current = null;
      setCallStatus('idle');
    }
  };

  const toggleMic = () => {
    if (dailyCallRef.current) {
      const nextMuted = !isMicMuted;
      dailyCallRef.current.setLocalAudio(!nextMuted);
      setIsMicMuted(nextMuted);
    }
  };

  const toggleCamera = () => {
    if (dailyCallRef.current) {
      const nextOff = !isCameraOff;
      dailyCallRef.current.setLocalVideo(!nextOff);
      setIsCameraOff(nextOff);
    }
  };

  const toggleScreenShare = () => {
    if (dailyCallRef.current) {
      if (isScreenSharing) {
        dailyCallRef.current.stopScreenShare();
        setIsScreenSharing(false);
      } else {
        dailyCallRef.current.startScreenShare();
        setIsScreenSharing(true);
      }
    }
  };

  // --- Auth Handlers ---
  const handleAuthSubmit = async () => {
    setAuthError('');
    setIsSubmittingAuth(true);

    try {
      if (authMode === 'tutor') {
        const entered = authPassword.trim();
        if (!entered) {
          setAuthError('Please enter your tutor password.');
          setIsSubmittingAuth(false);
          return;
        }
        if (entered === TUTOR_MASTER_PASSWORD) {
          setIsAuthenticated(true);
          setUserRole('tutor');
          setUserName('Sensei Richard');
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('ninja_tutor_authorized', 'true');
          }
        } else {
          setAuthError('Incorrect tutor password. Access denied.');
        }
      } else if (authMode === 'login') {
        if (!authUsername || !authPassword) {
          setAuthError('Please enter your ninja username and password.');
          setIsSubmittingAuth(false);
          return;
        }
        const res = await logIn(authUsername, authPassword);
        if (res.success) {
          setIsAuthenticated(true);
          setUserRole('tutor');
          setUserName(authUsername);
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('ninja_tutor_authorized', 'true');
          }
        } else {
          setAuthError(res.error || 'Authentication failed. Please check credentials.');
        }
      }
    } catch (e) {
      setAuthError('Authentication error occurred.');
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  const copyInviteLink = () => {
    if (typeof window !== 'undefined' && navigator.clipboard) {
      const shareUrl = `${window.location.origin}/classroom?room=${roomName}&role=${userRole === 'tutor' ? 'student' : 'tutor'}&token=ninja-student`;
      navigator.clipboard.writeText(shareUrl);
      setCopyStatus('Student invite link copied! 📋');
      setTimeout(() => setCopyStatus(''), 2500);
    }
  };

  const appendNote = (snippet) => {
    const updated = sessionNotes + `\n${snippet}`;
    setSessionNotes(updated);
    broadcastToPeer({ type: 'NOTES_SYNC', notes: updated });
  };

  const isDesktop = windowWidth >= 960;

  // --- Render Auth Gate if not authenticated ---
  if (!isAuthenticated && !isAuthChecking) {
    return (
      <View style={styles.authContainer}>
        <View style={styles.authCard}>
          <Text style={styles.authNinjaIcon}>🥋</Text>
          <Text style={styles.authTitle}>11+ Ninja Classroom</Text>
          <Text style={styles.authSubtitle}>Private 1-on-1 Tutoring Dojo</Text>

          {/* Mode Switcher */}
          <View style={styles.authTabsRow}>
            <TouchableOpacity 
              style={[styles.authTab, authMode === 'tutor' && styles.authTabActive]}
              onPress={() => { setAuthMode('tutor'); setAuthError(''); }}
            >
              <Text style={[styles.authTabText, authMode === 'tutor' && styles.authTabTextActive]}>🔐 Tutor Password</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.authTab, authMode === 'login' && styles.authTabActive]}
              onPress={() => { setAuthMode('login'); setAuthError(''); }}
            >
              <Text style={[styles.authTabText, authMode === 'login' && styles.authTabTextActive]}>👤 Ninja Account</Text>
            </TouchableOpacity>
          </View>

          {/* Tutor Password View */}
          {authMode === 'tutor' && (
            <View style={styles.authSection}>
              <Text style={styles.authHelperText}>
                This classroom is password protected. Enter your Tutor Password to unlock:
              </Text>
              <TextInput 
                style={styles.authInput}
                placeholder="Enter Tutor Password"
                placeholderTextColor="#94A3B8"
                secureTextEntry={true}
                value={authPassword}
                onChangeText={setAuthPassword}
                onSubmitEditing={handleAuthSubmit}
                autoFocus={true}
              />
              <View style={{ backgroundColor: '#1E293B', padding: 12, borderRadius: 8, marginTop: 10, borderLeftWidth: 3, borderLeftColor: '#3B82F6' }}>
                <Text style={{ color: '#94A3B8', fontSize: 12, lineHeight: 18 }}>
                  💡 <Text style={{ color: '#E2E8F0', fontWeight: 'bold' }}>Students:</Text> You do not need a password. Simply click the direct invite link provided by your tutor to enter your tutoring session automatically.
                </Text>
              </View>
            </View>
          )}

          {/* Ninja Account Login View */}
          {authMode === 'login' && (
            <View style={styles.authSection}>
              <Text style={styles.authHelperText}>Sign in with your registered 11+ Ninja account:</Text>
              <TextInput 
                style={styles.authInput}
                placeholder="Ninja Username"
                placeholderTextColor="#94A3B8"
                value={authUsername}
                onChangeText={setAuthUsername}
                autoCapitalize="none"
              />
              <TextInput 
                style={styles.authInput}
                placeholder="Password"
                placeholderTextColor="#94A3B8"
                secureTextEntry={true}
                value={authPassword}
                onChangeText={setAuthPassword}
                onSubmitEditing={handleAuthSubmit}
              />
            </View>
          )}

          {authError ? <Text style={styles.authErrorText}>{authError}</Text> : null}

          <TouchableOpacity 
            style={styles.authSubmitBtn}
            onPress={handleAuthSubmit}
            disabled={isSubmittingAuth}
          >
            {isSubmittingAuth ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.authSubmitBtnText}>Unlock Classroom 🚀</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.authBackBtn}
            onPress={() => navigation.navigate('Home')}
          >
            <Text style={styles.authBackBtnText}>← Return to 11+ Dojo</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // --- Main Classroom View ---
  return (
    <View style={styles.classroomContainer}>
      {/* Hidden File Input for PDF Upload */}
      {Platform.OS === 'web' && (
        <input 
          id="pdf-file-uploader" 
          type="file" 
          accept="application/pdf" 
          style={{ display: 'none' }} 
          onChange={onFileInputChange} 
        />
      )}

      {/* Classroom Top Bar */}
      <View style={styles.topNavbar}>
        <View style={styles.topNavLeft}>
          <TouchableOpacity 
            style={styles.homeBadge}
            onPress={() => navigation.navigate('Home')}
          >
            <Text style={styles.homeBadgeIcon}>🥋</Text>
            <Text style={styles.homeBadgeText}>11+ Ninja Classroom</Text>
          </TouchableOpacity>

          <View style={styles.roomBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.roomBadgeText}>Room: {roomName}</Text>
          </View>

          <TouchableOpacity style={styles.copyLinkBtn} onPress={copyInviteLink}>
            <Text style={styles.copyLinkBtnText}>🔗 Share Link</Text>
          </TouchableOpacity>
          {copyStatus ? <Text style={styles.copyToast}>{copyStatus}</Text> : null}

          <View style={styles.syncStatusBadge} title={cloudSyncStatus === 'saving' ? 'Auto-saving classroom session...' : 'Session auto-saved'}>
            <Text style={styles.syncStatusIcon}>
              {cloudSyncStatus === 'saving' ? '🔄' : '☁️'}
            </Text>
            <Text style={styles.syncStatusText}>
              {cloudSyncStatus === 'saving' ? 'Saving...' : 'Saved'}
            </Text>
          </View>
        </View>

        {/* PDF Question Sheet Quick Controls */}
        <View style={styles.topNavCenter}>
          <TouchableOpacity 
            style={[styles.pdfActionBtn, styles.pdfUploadBtn]} 
            onPress={handlePdfUploadClick}
            disabled={isLoadingPdf}
          >
            <Text style={styles.pdfActionBtnText}>📁 Import resources</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            nativeID="import-quiz-btn"
            accessibilityRole="button"
            style={[styles.pdfActionBtn, styles.quizImportBtn]} 
            onPress={() => {
              console.log('🔥 IMPORT DOJO QUIZ CLICKED!');
              setShowQuizModal(true);
            }}
            disabled={isLoadingPdf}
          >
            <Text style={styles.quizImportBtnText}>🎯 Import Dojo Quiz</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            nativeID="export-pdf-btn"
            accessibilityRole="button"
            style={[styles.pdfActionBtn, styles.exportPdfBtn]} 
            onPress={handleExportPdfClick}
            disabled={isLoadingPdf || isExportingPdf}
            title="Download worksheet and annotations as a PDF document"
          >
            <Text style={styles.pdfActionBtnText}>
              {isExportingPdf ? '⏳ Exporting...' : '📥 Export PDF'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            nativeID="toggle-menus-btn"
            accessibilityRole="button"
            style={[styles.pdfActionBtn, isCanvasMenusMinimized ? styles.menuMinimizedBtnActive : styles.menuMinimizedBtn]} 
            onPress={toggleCanvasMenus}
            disabled={isLoadingPdf}
            title={isCanvasMenusMinimized ? 'Expand toolbars' : 'Minimise toolbars to maximise worksheet drawing space'}
          >
            <Text style={styles.pdfActionBtnText}>
              {isCanvasMenusMinimized ? '🛠️ Expand Menus' : '🪄 Minimise Menus'}
            </Text>
          </TouchableOpacity>

          {/* Page Switcher & Add Blank Page */}
          <View style={styles.pdfPaginationRow}>
            {totalPdfPages > 1 && (
              <>
                <TouchableOpacity 
                  style={[styles.pageNavBtn, currentPdfPage <= 1 && styles.pageNavBtnDisabled]}
                  onPress={() => handlePageNavigation(currentPdfPage - 1)}
                  disabled={currentPdfPage <= 1 || isLoadingPdf}
                  title="Previous page"
                >
                  <Text style={styles.pageNavBtnText}>◀</Text>
                </TouchableOpacity>
                
                <Text style={styles.pageIndicatorText}>
                  Page {currentPdfPage} / {totalPdfPages}
                </Text>

                <TouchableOpacity 
                  style={[styles.pageNavBtn, currentPdfPage >= totalPdfPages && styles.pageNavBtnDisabled]}
                  onPress={() => handlePageNavigation(currentPdfPage + 1)}
                  disabled={currentPdfPage >= totalPdfPages || isLoadingPdf}
                  title="Next page"
                >
                  <Text style={styles.pageNavBtnText}>▶</Text>
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity 
              style={styles.addPageBtn}
              onPress={handleAddBlankPage}
              title="Add a new blank page to the session"
            >
              <Text style={styles.addPageBtnText}>➕ Page</Text>
            </TouchableOpacity>
          </View>

          {isLoadingPdf && (
            <View style={styles.pdfLoadingBadge}>
              <ActivityIndicator size="small" color="#BE1E2D" />
              <Text style={styles.pdfLoadingText}>{pdfStatusMessage || 'Loading...'}</Text>
            </View>
          )}
        </View>

        {/* Role & Status */}
        <View style={styles.topNavRight}>
          <TouchableOpacity 
            style={styles.roleToggleBtn}
            onPress={() => setUserRole(userRole === 'tutor' ? 'student' : 'tutor')}
          >
            <Text style={styles.roleToggleText}>
              {userRole === 'tutor' ? '🧑‍🏫 Tutor View' : '🥋 Student View'}
            </Text>
          </TouchableOpacity>

          {/* Mobile Tab Switcher */}
          {!isDesktop && (
            <View style={styles.mobileTabsSwitch}>
              <TouchableOpacity 
                style={[styles.mobileTabBtn, activeMobileTab === 'canvas' && styles.mobileTabBtnActive]}
                onPress={() => setActiveMobileTab('canvas')}
              >
                <Text style={styles.mobileTabBtnText}>🎨 Canvas</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.mobileTabBtn, activeMobileTab === 'sidebar' && styles.mobileTabBtnActive]}
                onPress={() => setActiveMobileTab('sidebar')}
              >
                <Text style={styles.mobileTabBtnText}>📹 Call & Notes</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {/* Main Two-Column Layout */}
      <View style={styles.columnsContainer}>
        {/* ============================================================ */}
        {/* LEFT COLUMN (75% WIDTH): FULL-HEIGHT COLLABORATIVE CANVAS     */}
        {/* ============================================================ */}
        {(isDesktop || activeMobileTab === 'canvas') && (
          <View style={[styles.canvasColumn, !isDesktop && styles.columnFullWidth]}>
            {Platform.OS === 'web' ? (
              <iframe
                ref={canvasIframeRef}
                src="/classroom-canvas.html"
                style={{
                  width: '100%',
                  height: '100%',
                  border: '0',
                  backgroundColor: '#F8FAFC',
                }}
                title="Collaborative Drawing Canvas"
              />
            ) : (
              <View style={styles.canvasLoading}>
                <Text style={styles.canvasLoadingText}>Web whiteboard available on desktop browser</Text>
              </View>
            )}

            {/* Canvas Bottom Floating Helper */}
            {pdfFileName ? (
              <View style={styles.canvasFloatingBar}>
                <Text style={styles.canvasFloatingText}>
                  📋 Active Sheet: <Text style={{ fontWeight: '700' }}>{pdfFileName}</Text> (Page {currentPdfPage} of {totalPdfPages})
                </Text>
                <TouchableOpacity 
                  style={styles.canvasFitBtn}
                  onPress={() => {
                    if (canvasIframeRef.current && canvasIframeRef.current.contentWindow) {
                      canvasIframeRef.current.contentWindow.postMessage({ type: 'FIT_PAGE' }, '*');
                    }
                  }}
                >
                  <Text style={styles.canvasFitBtnText}>🔍 Fit Page</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        )}

        {/* ============================================================ */}
        {/* RIGHT COLUMN (25% WIDTH): DAILY.CO WEBCAM & SESSION NOTES    */}
        {/* ============================================================ */}
        {(isDesktop || activeMobileTab === 'sidebar') && (
          <View style={[styles.sidebarColumn, !isDesktop && styles.columnFullWidth]}>
            {/* Top Section: Daily.co Video Call Container */}
            <View style={[styles.videoSection, isNotesMinimized && styles.videoSectionExpanded]}>
              <View style={styles.videoSectionHeader}>
                <View style={styles.videoHeaderLeft}>
                  <Text style={styles.videoTitle}>📹 Live 1-on-1 Call</Text>
                  <View style={[
                    styles.callStatusBadge,
                    callStatus === 'in-call' ? styles.statusInCall :
                    callStatus === 'connecting' ? styles.statusConnecting : styles.statusIdle
                  ]}>
                    <Text style={styles.callStatusText}>
                      {callStatus === 'in-call' ? 'Connected' :
                       callStatus === 'connecting' ? 'Connecting...' : 'Ready'}
                    </Text>
                  </View>
                </View>

                {callStatus === 'in-call' ? (
                  <TouchableOpacity style={styles.leaveCallBtn} onPress={leaveDailyCall}>
                    <Text style={styles.leaveCallBtnText}>Leave</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity 
                    style={styles.joinCallBtn} 
                    onPress={joinDailyCall}
                    disabled={callStatus === 'connecting'}
                  >
                    <Text style={styles.joinCallBtnText}>
                      {callStatus === 'connecting' ? 'Joining...' : 'Join Call'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Prebuilt Daily.co Call Iframe Target Container */}
              <View style={[styles.videoFrameHolder, isNotesMinimized && styles.videoFrameHolderExpanded]}>
                <div 
                  ref={videoContainerRef} 
                  id="daily-call-container"
                  style={{ 
                    width: '100%', 
                    height: '100%', 
                    backgroundColor: '#0F172A',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    position: 'relative',
                  }} 
                >
                  {callStatus === 'idle' && (
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '16px',
                      backgroundColor: '#1E293B',
                      textAlign: 'center',
                      zIndex: 5,
                    }}>
                      <div style={{ fontSize: '32px', marginBottom: '6px' }}>📹</div>
                      <div style={{ color: '#E2E8F0', fontWeight: '700', fontSize: '13px' }}>Two-Way Webcam Call</div>
                      <div style={{ color: '#94A3B8', fontSize: '11px', marginTop: '3px', marginBottom: '14px' }}>
                        Room: {roomName}
                      </div>
                      <button 
                        onClick={joinDailyCall}
                        disabled={callStatus === 'connecting'}
                        style={{
                          backgroundColor: '#BE1E2D',
                          color: '#FFFFFF',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '8px 18px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                        }}
                      >
                        {callStatus === 'connecting' ? 'Connecting to Room...' : 'Start Video Call 🚀'}
                      </button>
                    </div>
                  )}

                  {callStatus === 'error' && (
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '16px',
                      backgroundColor: '#1E293B',
                      textAlign: 'center',
                      zIndex: 6,
                    }}>
                      <div style={{ fontSize: '28px', marginBottom: '6px' }}>⚠️</div>
                      <div style={{ color: '#F87171', fontWeight: '700', fontSize: '13px' }}>
                        {callErrorReason === 'account-missing-payment-method'
                          ? 'Daily.co Card on File Required'
                          : 'Call Connection Issue'}
                      </div>
                      <div style={{ color: '#CBD5E1', fontSize: '11px', marginTop: '6px', marginBottom: '12px', maxWidth: '220px', lineHeight: '1.4' }}>
                        {callErrorReason === 'account-missing-payment-method'
                          ? 'Daily requires a payment method at dashboard.daily.co to activate live video rooms. The whiteboard & PDF tools remain 100% active!'
                          : 'Could not connect to the Daily video room.'}
                      </div>
                      <button 
                        onClick={joinDailyCall}
                        style={{
                          backgroundColor: '#334155',
                          color: '#FFFFFF',
                          border: '1px solid #475569',
                          borderRadius: '6px',
                          padding: '6px 14px',
                          fontSize: '11px',
                          fontWeight: '600',
                          cursor: 'pointer',
                        }}
                      >
                        Retry Call 🔄
                      </button>
                    </div>
                  )}
                </div>
              </View>

              {/* Call In-flight Quick Toggles */}
              {callStatus === 'in-call' && (
                <View style={styles.callControlsRow}>
                  <TouchableOpacity 
                    style={[styles.callControlBtn, isMicMuted && styles.callControlBtnMuted]}
                    onPress={toggleMic}
                  >
                    <Text style={styles.callControlBtnText}>{isMicMuted ? '🔇 Unmute' : '🎙️ Mute'}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.callControlBtn, isCameraOff && styles.callControlBtnMuted]}
                    onPress={toggleCamera}
                  >
                    <Text style={styles.callControlBtnText}>{isCameraOff ? '📷 Cam On' : '🚫 Cam Off'}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.callControlBtn, isScreenSharing && styles.callControlBtnActive]}
                    onPress={toggleScreenShare}
                  >
                    <Text style={styles.callControlBtnText}>{isScreenSharing ? '🛑 Stop Share' : '💻 Share'}</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Bottom Section: Minimisable Session Notes */}
            <View style={[styles.toolkitSection, isNotesMinimized && styles.toolkitSectionMinimized]}>
              {/* Notes Header Bar with Minimise Toggle */}
              <View style={styles.notesHeaderBar}>
                <Text style={styles.notesHeaderTitle}>📝 Session Notes</Text>
                <TouchableOpacity 
                  style={styles.notesMinimizeToggleBtn}
                  onPress={() => setIsNotesMinimized(!isNotesMinimized)}
                >
                  <Text style={styles.notesMinimizeToggleText}>
                    {isNotesMinimized ? '▲ Expand Notes' : '▼ Minimise Notes'}
                  </Text>
                </TouchableOpacity>
              </View>

              {!isNotesMinimized && (
                <View style={styles.notesContainer}>
                  {/* Quick Action Snippets */}
                  <View style={styles.notesQuickSnippets}>
                    <TouchableOpacity 
                      style={styles.snippetBtn} 
                      onPress={() => appendNote('⭐ Excellent working out!')}
                    >
                      <Text style={styles.snippetBtnText}>⭐ Star</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.snippetBtn} 
                      onPress={() => appendNote('⚠️ Common Trap: Remember to check units!')}
                    >
                      <Text style={styles.snippetBtnText}>⚠️ Trap Alert</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.snippetBtn} 
                      onPress={() => appendNote('📝 Homework: Redo question 4 with bar model.')}
                    >
                      <Text style={styles.snippetBtnText}>📝 Homework</Text>
                    </TouchableOpacity>
                  </View>

                  <TextInput
                    style={styles.notesTextarea}
                    multiline
                    value={sessionNotes}
                    onChangeText={(text) => {
                      setSessionNotes(text);
                      broadcastToPeer({ type: 'NOTES_SYNC', notes: text });
                      if (notesDebounceTimerRef.current) clearTimeout(notesDebounceTimerRef.current);
                      notesDebounceTimerRef.current = setTimeout(() => {
                        saveClassroomNotes(roomName, text);
                      }, 1000);
                    }}
                    placeholder="Enter tutoring session notes, homework, feedback..."
                    placeholderTextColor="#64748B"
                  />

                  <View style={styles.notesFooterRow}>
                    <TouchableOpacity 
                      style={styles.notesActionBtn}
                      onPress={() => {
                        if (typeof window !== 'undefined' && navigator.clipboard) {
                          navigator.clipboard.writeText(sessionNotes);
                          Alert.alert('Copied', 'Lesson notes copied to clipboard!');
                        }
                      }}
                    >
                      <Text style={styles.notesActionBtnText}>📋 Copy Notes</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={styles.notesActionBtn}
                      onPress={() => {
                        if (typeof window !== 'undefined') {
                          const blob = new Blob([sessionNotes], { type: 'text/plain' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `11plus_tutoring_notes_${new Date().toISOString().split('T')[0]}.txt`;
                          a.click();
                        }
                      }}
                    >
                      <Text style={styles.notesActionBtnText}>💾 Download</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          </View>
        )}
      </View>

      {/* Quiz Importer Modal */}
      <QuizImporterModal
        visible={showQuizModal}
        onClose={() => setShowQuizModal(false)}
        onLoadQuestion={handleLoadQuizQuestion}
        onLoadQuizSet={handleLoadQuizSet}
        onInsertNotes={handleInsertQuestionNotes}
        onInsertFullQuizNotes={handleInsertFullQuizNotes}
      />

      {/* PDF Export Choice Modal */}
      <Modal
        visible={showExportModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          if (!isExportingPdf) setShowExportModal(false);
        }}
      >
        <View style={styles.exportModalOverlay}>
          <View style={styles.exportModalCard}>
            <View style={styles.exportModalHeader}>
              <Text style={styles.exportModalTitle}>📥 Export Worksheet as PDF</Text>
              {!isExportingPdf && (
                <TouchableOpacity onPress={() => setShowExportModal(false)} style={styles.exportModalCloseBtn}>
                  <Text style={styles.exportModalCloseText}>✕</Text>
                </TouchableOpacity>
              )}
            </View>

            <Text style={styles.exportModalDescription}>
              This lesson worksheet contains {totalPdfPages} pages. How would you like to export?
            </Text>

            {isExportingPdf ? (
              <View style={styles.exportProgressContainer}>
                <ActivityIndicator size="large" color="#059669" />
                <Text style={styles.exportProgressText}>{exportStatusText || 'Generating PDF...'}</Text>
                <Text style={styles.exportProgressSubtext}>Please keep this tab open while your PDF is being generated.</Text>
              </View>
            ) : (
              <View style={styles.exportOptionsList}>
                <TouchableOpacity
                  style={[styles.exportOptionCard, styles.exportOptionPrimary]}
                  onPress={() => executeExportPdf('all')}
                >
                  <View style={styles.exportOptionIconBox}>
                    <Text style={styles.exportOptionIcon}>📚</Text>
                  </View>
                  <View style={styles.exportOptionTextBox}>
                    <Text style={styles.exportOptionTitle}>Export All Pages (Pages 1 to {totalPdfPages})</Text>
                    <Text style={styles.exportOptionSubtitle}>
                      Combines all worked question sheets and drawing annotations into a single multi-page PDF.
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.exportOptionCard}
                  onPress={() => executeExportPdf('current')}
                >
                  <View style={styles.exportOptionIconBox}>
                    <Text style={styles.exportOptionIcon}>📄</Text>
                  </View>
                  <View style={styles.exportOptionTextBox}>
                    <Text style={styles.exportOptionTitle}>Export Current Page Only (Page {currentPdfPage})</Text>
                    <Text style={styles.exportOptionSubtitle}>
                      Downloads only the current active worksheet as a 1-page PDF.
                    </Text>
                  </View>
                </TouchableOpacity>

                <View style={styles.exportModalFooter}>
                  <TouchableOpacity
                    style={styles.exportCancelBtn}
                    onPress={() => setShowExportModal(false)}
                  >
                    <Text style={styles.exportCancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  classroomContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#0F172A',
    ...Platform.select({
      web: {
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      },
    }),
  },

  // --- Top Navigation Bar ---
  topNavbar: {
    height: 56,
    backgroundColor: '#1E293B',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    zIndex: 100,
  },
  topNavLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  homeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 6,
  },
  homeBadgeIcon: {
    fontSize: 18,
  },
  homeBadgeText: {
    color: '#F8FAFC',
    fontWeight: '700',
    fontSize: 14,
  },
  roomBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#0F172A',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#334155',
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  roomBadgeText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  copyLinkBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.4)',
  },
  copyLinkBtnText: {
    color: '#60A5FA',
    fontSize: 12,
    fontWeight: '600',
  },
  copyToast: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '600',
  },
  syncStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  syncStatusIcon: {
    fontSize: 11,
  },
  syncStatusText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
  },

  // PDF Bar in Center
  topNavCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  pdfActionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  pdfUploadBtn: {
    backgroundColor: '#BE1E2D',
  },
  pdfSampleBtn: {
    backgroundColor: '#2563EB',
  },
  quizImportBtn: {
    backgroundColor: '#8B5CF6',
  },
  exportPdfBtn: {
    backgroundColor: '#059669',
    borderWidth: 1,
    borderColor: '#10B981',
  },
  menuMinimizedBtn: {
    backgroundColor: '#334155',
  },
  menuMinimizedBtnActive: {
    backgroundColor: '#059669',
    borderWidth: 1,
    borderColor: '#34D399',
  },
  quizImportBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  pdfActionBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  pdfPaginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 8,
  },
  pageNavBtn: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: '#1E293B',
    borderRadius: 4,
  },
  pageNavBtnDisabled: {
    opacity: 0.3,
  },
  pageNavBtnText: {
    color: '#E2E8F0',
    fontSize: 11,
    fontWeight: 'bold',
  },
  pageIndicatorText: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: '600',
  },
  addPageBtn: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: '#334155',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#475569',
  },
  addPageBtnText: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '700',
  },
  pdfLoadingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pdfLoadingText: {
    color: '#94A3B8',
    fontSize: 11,
  },

  topNavRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  roleToggleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#334155',
  },
  roleToggleText: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '600',
  },
  mobileTabsSwitch: {
    flexDirection: 'row',
    backgroundColor: '#0F172A',
    borderRadius: 6,
    padding: 2,
  },
  mobileTabBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  mobileTabBtnActive: {
    backgroundColor: '#BE1E2D',
  },
  mobileTabBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },

  // --- Two Column Layout ---
  columnsContainer: {
    flex: 1,
    flexDirection: 'row',
    width: '100%',
    height: 'calc(100% - 56px)',
    overflow: 'hidden',
  },

  // LEFT COLUMN: 75% WIDTH
  canvasColumn: {
    width: '75%',
    height: '100%',
    backgroundColor: '#F8FAFC',
    position: 'relative',
  },
  columnFullWidth: {
    width: '100%',
  },
  canvasLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F172A',
    gap: 12,
  },
  canvasLoadingText: {
    color: '#94A3B8',
    fontSize: 14,
  },
  canvasFloatingBar: {
    position: 'absolute',
    bottom: 16,
    left: 20,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    zIndex: 50,
  },
  canvasFloatingText: {
    color: '#E2E8F0',
    fontSize: 12,
  },
  canvasFitBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  canvasFitBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },

  // RIGHT COLUMN: 25% WIDTH
  sidebarColumn: {
    width: '25%',
    height: '100%',
    backgroundColor: '#1E293B',
    borderLeftWidth: 1,
    borderLeftColor: '#334155',
    display: 'flex',
    flexDirection: 'column',
  },

  // Video Call Section
  videoSection: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    backgroundColor: '#0F172A',
    flex: 1.2,
    display: 'flex',
    flexDirection: 'column',
    minHeight: 280,
  },
  videoSectionExpanded: {
    flex: 1,
    minHeight: 0,
  },
  videoSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  videoHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  videoTitle: {
    color: '#F8FAFC',
    fontWeight: '700',
    fontSize: 13,
  },
  callStatusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusInCall: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  statusConnecting: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
  },
  statusIdle: {
    backgroundColor: 'rgba(148, 163, 184, 0.2)',
  },
  callStatusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#34D399',
  },
  joinCallBtn: {
    backgroundColor: '#10B981',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  joinCallBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  leaveCallBtn: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  leaveCallBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  videoFrameHolder: {
    width: '100%',
    flex: 1,
    minHeight: 240,
    backgroundColor: '#0F172A',
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  videoFrameHolderExpanded: {
    flex: 1,
  },
  videoPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#1E293B',
  },
  videoPlaceholderIcon: {
    fontSize: 32,
    marginBottom: 6,
  },
  videoPlaceholderTitle: {
    color: '#E2E8F0',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  videoPlaceholderSubtitle: {
    color: '#64748B',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 2,
    marginBottom: 12,
  },
  startCallBigBtn: {
    backgroundColor: '#BE1E2D',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  startCallBigBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  callControlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    gap: 6,
  },
  callControlBtn: {
    flex: 1,
    paddingVertical: 6,
    backgroundColor: '#1E293B',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
  },
  callControlBtnMuted: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderColor: '#EF4444',
  },
  callControlBtnActive: {
    backgroundColor: 'rgba(37, 99, 235, 0.25)',
    borderColor: '#3B82F6',
  },
  callControlBtnText: {
    color: '#E2E8F0',
    fontSize: 10,
    fontWeight: '600',
  },

  // Notes Section
  toolkitSection: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#1E293B',
    minHeight: 200,
  },
  toolkitSectionMinimized: {
    flex: 0,
    minHeight: 44,
    height: 44,
  },
  notesHeaderBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#0F172A',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  notesHeaderTitle: {
    color: '#F8FAFC',
    fontSize: 12,
    fontWeight: '700',
  },
  notesMinimizeToggleBtn: {
    backgroundColor: '#334155',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#475569',
  },
  notesMinimizeToggleText: {
    color: '#CBD5E1',
    fontSize: 11,
    fontWeight: '600',
  },

  // Notes Content
  notesContainer: {
    flex: 1,
    padding: 10,
    display: 'flex',
    flexDirection: 'column',
  },
  notesQuickSnippets: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  snippetBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#334155',
  },
  snippetBtnText: {
    color: '#CBD5E1',
    fontSize: 10,
    fontWeight: '600',
  },
  notesTextarea: {
    flex: 1,
    backgroundColor: '#0F172A',
    borderRadius: 6,
    padding: 10,
    color: '#F1F5F9',
    fontSize: 12,
    fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
    borderWidth: 1,
    borderColor: '#334155',
    textAlignVertical: 'top',
  },
  notesFooterRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 8,
  },
  notesActionBtn: {
    backgroundColor: '#334155',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  notesActionBtnText: {
    color: '#F8FAFC',
    fontSize: 11,
    fontWeight: '600',
  },

  // --- Auth Gate Styles ---
  authContainer: {
    flex: 1,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    ...Platform.select({
      web: { height: '100vh', width: '100vw' }
    }),
  },
  authCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 28,
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
  },
  authNinjaIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  authTitle: {
    color: '#F8FAFC',
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  authSubtitle: {
    color: '#94A3B8',
    fontSize: 13,
    marginTop: 4,
    marginBottom: 20,
    textAlign: 'center',
  },
  authTabsRow: {
    flexDirection: 'row',
    width: '100%',
    backgroundColor: '#0F172A',
    borderRadius: 8,
    padding: 3,
    marginBottom: 16,
  },
  authTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  authTabActive: {
    backgroundColor: '#BE1E2D',
  },
  authTabText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  authTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  roleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    gap: 8,
    marginBottom: 16,
  },
  roleLabel: {
    color: '#94A3B8',
    fontSize: 12,
  },
  roleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
  },
  roleBtnActive: {
    backgroundColor: '#2563EB',
    borderColor: '#3B82F6',
  },
  roleBtnText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
  },
  roleBtnTextActive: {
    color: '#FFFFFF',
  },
  authSection: {
    width: '100%',
    gap: 10,
    marginBottom: 16,
  },
  authHelperText: {
    color: '#94A3B8',
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
    marginBottom: 4,
  },
  authInput: {
    width: '100%',
    height: 44,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    paddingHorizontal: 12,
    color: '#F8FAFC',
    fontSize: 14,
  },
  authErrorText: {
    color: '#EF4444',
    fontSize: 12,
    marginBottom: 10,
    textAlign: 'center',
  },
  authSubmitBtn: {
    width: '100%',
    height: 46,
    backgroundColor: '#BE1E2D',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  authSubmitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  authBackBtn: {
    marginTop: 16,
    paddingVertical: 6,
  },
  authBackBtnText: {
    color: '#64748B',
    fontSize: 13,
  },

  // --- PDF Export Modal Styles ---
  exportModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 9999,
  },
  exportModalCard: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#334155',
  },
  exportModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  exportModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  exportModalCloseBtn: {
    padding: 4,
  },
  exportModalCloseText: {
    fontSize: 18,
    color: '#94A3B8',
    fontWeight: '700',
  },
  exportModalDescription: {
    fontSize: 14,
    color: '#CBD5E1',
    lineHeight: 20,
    marginBottom: 20,
  },
  exportOptionsList: {
    gap: 12,
  },
  exportOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    padding: 16,
    gap: 14,
  },
  exportOptionPrimary: {
    borderColor: '#059669',
    backgroundColor: '#064E3B20',
  },
  exportOptionIconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
  },
  exportOptionIcon: {
    fontSize: 22,
  },
  exportOptionTextBox: {
    flex: 1,
  },
  exportOptionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  exportOptionSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    lineHeight: 16,
  },
  exportProgressContainer: {
    paddingVertical: 30,
    alignItems: 'center',
    gap: 12,
  },
  exportProgressText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#34D399',
    marginTop: 8,
  },
  exportProgressSubtext: {
    fontSize: 12,
    color: '#94A3B8',
  },
  exportModalFooter: {
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  exportCancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#334155',
  },
  exportCancelBtnText: {
    color: '#E2E8F0',
    fontSize: 13,
    fontWeight: '600',
  },
});
