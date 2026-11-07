import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { Excalidraw } from '@excalidraw/excalidraw';

window.EXCALIDRAW_ASSET_PATH = 'https://unpkg.com/@excalidraw/excalidraw@0.18.1/dist/prod/';

// Version-aware reconciliation that preserves deletions so erased elements stay deleted
function reconcileDrawings(localElements, remoteElements) {
  const localMap = new Map();
  for (const el of localElements || []) {
    if (el && el.id) localMap.set(el.id, el);
  }

  const reconciledMap = new Map();

  for (const remote of remoteElements || []) {
    if (!remote || !remote.id) continue;
    const local = localMap.get(remote.id);
    if (!local) {
      reconciledMap.set(remote.id, remote);
    } else {
      const localVer = local.version || 0;
      const remoteVer = remote.version || 0;
      if (remoteVer > localVer) {
        reconciledMap.set(remote.id, remote);
      } else if (localVer > remoteVer) {
        reconciledMap.set(local.id, local);
      } else {
        // Tie-breaker: if either is deleted, prefer deleted so erased elements never resurrect
        if (remote.isDeleted || local.isDeleted) {
          reconciledMap.set(remote.id, remote.isDeleted ? remote : local);
        } else {
          const localNonce = local.versionNonce || 0;
          const remoteNonce = remote.versionNonce || 0;
          reconciledMap.set(remote.id, localNonce < remoteNonce ? local : remote);
        }
      }
    }
  }

  for (const local of localElements || []) {
    if (local && local.id && !reconciledMap.has(local.id)) {
      reconciledMap.set(local.id, local);
    }
  }

  return Array.from(reconciledMap.values());
}

function WhiteboardApp() {
  const [api, setApi] = useState(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const isRemoteUpdate = useRef(false);
  const lastSentTime = useRef(0);
  const pendingUpdateRef = useRef(null);
  const throttleTimerRef = useRef(null);

  // Per-page drawings storage: Map<pageNumber, Array<ExcalidrawElement>>
  const pageDrawingsMapRef = useRef(new Map());
  const activePageRef = useRef(1);

  const toggleMinimized = (forceState) => {
    setIsMinimized((prev) => {
      const next = typeof forceState === 'boolean' ? forceState : !prev;
      if (next) {
        document.body.classList.add('menus-minimized');
      } else {
        document.body.classList.remove('menus-minimized');
      }
      if (api) {
        try {
          api.updateScene({
            appState: { zenModeEnabled: next }
          });
        } catch (e) {}
      }
      window.parent.postMessage({
        type: 'MENUS_MINIMIZED_CHANGED',
        minimized: next
      }, '*');
      return next;
    });
  };

  useEffect(() => {
    window.parent.postMessage({ type: 'CANVAS_READY' }, '*');

    const handleParentMessage = (event) => {
      const data = event.data;
      if (!data || !api) return;

      if (data.type === 'LOAD_PDF_PAGE') {
        const { fileId, dataUrl, width, height, isNewDocument } = data;
        const targetPage = Number(data.pageNumber) || 1;
        isRemoteUpdate.current = true;
        try {
          if (isNewDocument) {
            pageDrawingsMapRef.current.clear();
          } else {
            // Save drawings of the page we are navigating away from
            const currentSceneElements = api.getSceneElementsIncludingDeleted();
            const currentDrawings = currentSceneElements.filter(el => !el.id.startsWith('pdf_bg_'));
            pageDrawingsMapRef.current.set(activePageRef.current, currentDrawings);
          }

          activePageRef.current = targetPage;

          api.addFiles([{
            id: fileId,
            dataURL: dataUrl,
            mimeType: 'image/png',
            created: Date.now(),
            lastRetrieved: Date.now(),
          }]);

          const bgElement = {
            id: `pdf_bg_${fileId}`,
            type: 'image',
            x: 60,
            y: 60,
            width: width || 800,
            height: height || 1130,
            angle: 0,
            strokeColor: 'transparent',
            backgroundColor: '#ffffff',
            fillStyle: 'solid',
            strokeWidth: 1,
            strokeStyle: 'solid',
            roughness: 0,
            opacity: 100,
            groupIds: [],
            frameId: null,
            roundness: null,
            seed: Math.floor(Math.random() * 100000),
            version: 1,
            versionNonce: Math.floor(Math.random() * 100000),
            isDeleted: false,
            fileId: fileId,
            status: 'saved',
            scale: [1, 1],
            locked: true,
          };

          // Retrieve drawings specifically for the target page
          const targetPageDrawings = pageDrawingsMapRef.current.get(targetPage) || [];

          api.updateScene({
            elements: [bgElement, ...targetPageDrawings],
            commitToHistory: false,
          });

          api.scrollToContent(bgElement, { fitToViewport: true });
        } catch (err) {
          console.error('Error in LOAD_PDF_PAGE:', err);
        }
        setTimeout(() => { isRemoteUpdate.current = false; }, 200);
      } else if (data.type === 'SYNC_ELEMENTS') {
        isRemoteUpdate.current = true;
        try {
          // If bulk map of pages is provided, sync all background pages into map
          if (data.allPages && typeof data.allPages === 'object') {
            for (const [pStr, pElements] of Object.entries(data.allPages)) {
              const pNum = Number(pStr);
              if (pNum) {
                const existing = pageDrawingsMapRef.current.get(pNum) || [];
                const nonBgRemote = (pElements || []).filter(el => !el.id.startsWith('pdf_bg_'));
                pageDrawingsMapRef.current.set(pNum, reconcileDrawings(existing, nonBgRemote));
              }
            }
          }

          const msgPage = Number(data.pageNumber) || activePageRef.current;
          const remoteElements = (data.elements || []).filter(el => !el.id.startsWith('pdf_bg_'));

          if (msgPage === activePageRef.current) {
            const currentSceneElements = api.getSceneElementsIncludingDeleted();
            const bgElement = currentSceneElements.find(el => el.id && el.id.startsWith('pdf_bg_'));
            const localDrawings = currentSceneElements.filter(el => !el.id.startsWith('pdf_bg_'));

            const reconciled = reconcileDrawings(localDrawings, remoteElements);
            pageDrawingsMapRef.current.set(activePageRef.current, reconciled);

            api.updateScene({
              elements: bgElement ? [bgElement, ...reconciled] : reconciled,
              commitToHistory: false,
            });
          } else {
            const existing = pageDrawingsMapRef.current.get(msgPage) || [];
            pageDrawingsMapRef.current.set(msgPage, reconcileDrawings(existing, remoteElements));
          }
        } catch (err) {
          console.warn('Sync elements error:', err);
        }
        setTimeout(() => { isRemoteUpdate.current = false; }, 80);
      } else if (data.type === 'TOGGLE_MENUS') {
        toggleMinimized(data.minimized);
      } else if (data.type === 'FIT_PAGE') {
        const bg = api.getSceneElements().find(el => el.id.startsWith('pdf_bg_'));
        if (bg) {
          api.scrollToContent(bg, { fitToViewport: true });
        }
      } else if (data.type === 'CLEAR_CANVAS') {
        const bg = api.getSceneElements().find(el => el.id.startsWith('pdf_bg_'));
        pageDrawingsMapRef.current.set(activePageRef.current, []);
        api.updateScene({
          elements: bg ? [bg] : [],
          commitToHistory: true,
        });
        window.parent.postMessage({
          type: 'CANVAS_CHANGE',
          pageNumber: activePageRef.current,
          elements: [],
        }, '*');
      }
    };

    window.addEventListener('message', handleParentMessage);
    return () => window.removeEventListener('message', handleParentMessage);
  }, [api]);

  // Keyboard shortcut: Alt+Z or Ctrl+M to toggle menus
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.altKey && (e.key === 'z' || e.key === 'Z')) || (e.ctrlKey && (e.key === 'm' || e.key === 'M'))) {
        e.preventDefault();
        toggleMinimized();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [api]);

  const handleChange = (elements) => {
    if (isRemoteUpdate.current) return;

    // Filter out PDF background, but preserve deleted elements so deletion broadcasts to peer!
    const drawings = (elements || []).filter(el => !el.id.startsWith('pdf_bg_'));
    pageDrawingsMapRef.current.set(activePageRef.current, drawings);
    pendingUpdateRef.current = drawings;

    const now = Date.now();
    const elapsed = now - lastSentTime.current;

    const dispatchChange = () => {
      if (!pendingUpdateRef.current || isRemoteUpdate.current) return;
      lastSentTime.current = Date.now();
      window.parent.postMessage({
        type: 'CANVAS_CHANGE',
        pageNumber: activePageRef.current,
        elements: pendingUpdateRef.current,
      }, '*');
      pendingUpdateRef.current = null;
    };

    // Throttle to 50ms while drawing, with trailing debounce to guarantee final stroke is sent
    if (elapsed >= 50) {
      if (throttleTimerRef.current) {
        clearTimeout(throttleTimerRef.current);
        throttleTimerRef.current = null;
      }
      dispatchChange();
    } else if (!throttleTimerRef.current) {
      throttleTimerRef.current = setTimeout(() => {
        throttleTimerRef.current = null;
        dispatchChange();
      }, 50 - elapsed);
    }
  };

  return React.createElement(
    'div',
    { style: { width: '100%', height: '100%', position: 'relative' } },
    React.createElement(Excalidraw, {
      excalidrawAPI: (inst) => {
        setApi(inst);
        window.whiteboardApi = inst;
      },
      onChange: handleChange,
      initialData: {
        appState: {
          viewBackgroundColor: '#F8FAFC',
          currentItemStrokeColor: '#1E293B',
          theme: 'light',
          zenModeEnabled: false,
        },
      },
      UIOptions: {
        canvasActions: {
          saveAsImage: true,
        },
      },
    }),
    React.createElement(
      'button',
      {
        id: 'toggle-canvas-menus-btn',
        onClick: () => toggleMinimized(),
        title: isMinimized ? 'Expand full tool & pen menus' : 'Minimise menus to maximise canvas drawing space (Alt+Z)',
        style: {
          position: 'absolute',
          top: '16px',
          right: '16px',
          zIndex: 100,
          backgroundColor: isMinimized ? '#2563EB' : '#1E293B',
          color: '#FFFFFF',
          border: '1px solid ' + (isMinimized ? '#3B82F6' : '#475569'),
          borderRadius: '20px',
          padding: '6px 14px',
          fontSize: '12px',
          fontWeight: '600',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
          transition: 'all 0.2s ease',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        }
      },
      isMinimized ? '🛠️ Expand Menus' : '🪄 Minimise Menus'
    )
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(WhiteboardApp));
