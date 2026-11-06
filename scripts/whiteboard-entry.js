import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { Excalidraw } from '@excalidraw/excalidraw';

window.EXCALIDRAW_ASSET_PATH = 'https://unpkg.com/@excalidraw/excalidraw@0.18.1/dist/prod/';

function WhiteboardApp() {
  const [api, setApi] = useState(null);
  const isRemoteUpdate = useRef(false);
  const lastSentTime = useRef(0);

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
          api.updateScene({
            elements: data.elements,
            commitToHistory: false,
          });
        } catch (err) {
          console.warn('Sync elements error:', err);
        }
        setTimeout(() => { isRemoteUpdate.current = false; }, 150);
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
    const now = Date.now();
    if (now - lastSentTime.current < 60) return;
    lastSentTime.current = now;

    window.parent.postMessage({
      type: 'CANVAS_CHANGE',
      elements: elements,
    }, '*');
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
