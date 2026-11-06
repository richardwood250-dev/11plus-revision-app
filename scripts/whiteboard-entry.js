import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { Excalidraw } from '@excalidraw/excalidraw';

window.EXCALIDRAW_ASSET_PATH = 'https://unpkg.com/@excalidraw/excalidraw@0.18.1/dist/prod/';

function WhiteboardApp() {
  const [api, setApi] = useState(null);
  const isRemoteUpdate = useRef(false);
  const lastSentTime = useRef(0);
  const pendingUpdateRef = useRef(null);
  const throttleTimerRef = useRef(null);

  useEffect(() => {
    window.parent.postMessage({ type: 'CANVAS_READY' }, '*');

    const handleParentMessage = (event) => {
      const data = event.data;
      if (!data || !api) return;

      if (data.type === 'LOAD_PDF_PAGE') {
        const { fileId, dataUrl, width, height } = data;
        isRemoteUpdate.current = true;
        try {
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

          const currentElements = api.getSceneElements().filter(el => !el.id.startsWith('pdf_bg_'));
          api.updateScene({
            elements: [bgElement, ...currentElements],
            commitToHistory: true,
          });

          api.scrollToContent(bgElement, { fitToViewport: true });
        } catch (err) {
          console.error('Error in LOAD_PDF_PAGE:', err);
        }
        setTimeout(() => { isRemoteUpdate.current = false; }, 200);
      } else if (data.type === 'SYNC_ELEMENTS') {
        isRemoteUpdate.current = true;
        try {
          const currentElements = api.getSceneElements();
          const bgElement = currentElements.find(el => el.id && el.id.startsWith('pdf_bg_'));

          // Reconcile and merge remote elements into local scene by ID and version
          const elementMap = new Map();
          if (bgElement) {
            elementMap.set(bgElement.id, bgElement);
          }
          for (const el of currentElements) {
            if (el.id && !el.id.startsWith('pdf_bg_')) {
              elementMap.set(el.id, el);
            }
          }
          for (const rEl of data.elements || []) {
            if (!rEl || !rEl.id) continue;
            if (rEl.id.startsWith('pdf_bg_')) continue; // Preserve local bg
            const local = elementMap.get(rEl.id);
            if (!local || (rEl.version || 0) >= (local.version || 0)) {
              elementMap.set(rEl.id, rEl);
            }
          }

          api.updateScene({
            elements: Array.from(elementMap.values()),
            commitToHistory: false,
          });
        } catch (err) {
          console.warn('Sync elements error:', err);
        }
        setTimeout(() => { isRemoteUpdate.current = false; }, 80);
      } else if (data.type === 'FIT_PAGE') {
        const bg = api.getSceneElements().find(el => el.id.startsWith('pdf_bg_'));
        if (bg) {
          api.scrollToContent(bg, { fitToViewport: true });
        }
      } else if (data.type === 'CLEAR_CANVAS') {
        const bg = api.getSceneElements().find(el => el.id.startsWith('pdf_bg_'));
        api.updateScene({
          elements: bg ? [bg] : [],
          commitToHistory: true,
        });
      }
    };

    window.addEventListener('message', handleParentMessage);
    return () => window.removeEventListener('message', handleParentMessage);
  }, [api]);

  const handleChange = (elements) => {
    if (isRemoteUpdate.current) return;

    // Filter out deleted elements to keep payload compact
    const activeElements = (elements || []).filter(el => !el.isDeleted);
    pendingUpdateRef.current = activeElements;

    const now = Date.now();
    const elapsed = now - lastSentTime.current;

    const dispatchChange = () => {
      if (!pendingUpdateRef.current || isRemoteUpdate.current) return;
      lastSentTime.current = Date.now();
      window.parent.postMessage({
        type: 'CANVAS_CHANGE',
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
      },
      onChange: handleChange,
      initialData: {
        appState: {
          viewBackgroundColor: '#F8FAFC',
          currentItemStrokeColor: '#1E293B',
          theme: 'light',
        },
      },
      UIOptions: {
        canvasActions: {
          saveAsImage: true,
        },
      },
    })
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(WhiteboardApp));
