import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { Excalidraw, exportToCanvas, MainMenu } from '@excalidraw/excalidraw';

window.EXCALIDRAW_ASSET_PATH = 'https://unpkg.com/@excalidraw/excalidraw@0.18.1/dist/prod/';

// Standalone PDF 1.4 Builder for JPEGs (Zero-dependency fallback)
function buildNativePdfFromJpegs(images) {
  const offsets = [];
  let currentOffset = 0;
  const parts = [];

  function writeString(str) {
    return new TextEncoder().encode(str);
  }

  function addPart(data) {
    if (typeof data === 'string') data = writeString(data);
    parts.push(data);
    currentOffset += data.length;
  }

  addPart('%PDF-1.4\n%\xFF\xFF\xFF\xFF\n');

  const numPages = images.length;
  const pageObjIds = [];
  for (let i = 0; i < numPages; i++) {
    pageObjIds.push(3 + 3 * i);
  }

  // 1 0 obj Catalog
  offsets.push(currentOffset);
  addPart('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');

  // 2 0 obj Pages
  offsets.push(currentOffset);
  const kidsStr = pageObjIds.map(id => `${id} 0 R`).join(' ');
  addPart(`2 0 obj\n<< /Type /Pages /Kids [${kidsStr}] /Count ${numPages} >>\nendobj\n`);

  for (let i = 0; i < numPages; i++) {
    const img = images[i];
    const pageId = 3 + 3 * i;
    const contentId = pageId + 1;
    const imgId = pageId + 2;

    const ptWidth = Math.round(img.width * 0.75); // 96 DPI to 72 pt
    const ptHeight = Math.round(img.height * 0.75);

    // Page object
    offsets.push(currentOffset);
    addPart(
      `${pageId} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${ptWidth} ${ptHeight}] ` +
      `/Contents ${contentId} 0 R /Resources << /XObject << /Im${i} ${imgId} 0 R >> >> >>\nendobj\n`
    );

    // Content stream: scale image to fit page
    const contentStream = `q ${ptWidth} 0 0 ${ptHeight} 0 0 cm /Im${i} Do Q\n`;
    offsets.push(currentOffset);
    addPart(
      `${contentId} 0 obj\n<< /Length ${contentStream.length} >>\nstream\n${contentStream}endstream\nendobj\n`
    );

    // Image object
    offsets.push(currentOffset);
    addPart(
      `${imgId} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${img.width} /Height ${img.height} ` +
      `/ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${img.jpegBytes.length} >>\nstream\n`
    );
    addPart(img.jpegBytes);
    addPart('\nendstream\nendobj\n');
  }

  // Xref table
  const startXref = currentOffset;
  const totalObjs = 1 + 2 + numPages * 3;
  addPart(`xref\n0 ${totalObjs}\n0000000000 65535 f \n`);
  for (const offset of offsets) {
    const padded = String(offset).padStart(10, '0');
    addPart(`${padded} 00000 n \n`);
  }

  addPart(`trailer\n<< /Size ${totalObjs} /Root 1 0 R >>\nstartxref\n${startXref}\n%%EOF\n`);

  const totalLen = parts.reduce((acc, a) => acc + a.length, 0);
  const result = new Uint8Array(totalLen);
  let offset = 0;
  for (const p of parts) {
    result.set(p, offset);
    offset += p.length;
  }
  return result;
}

// Generate and trigger download of PDF from an array of HTMLCanvasElement
async function generateAndDownloadPdf(canvases, defaultFilename = '11plus_lesson_export.pdf') {
  if (!canvases || canvases.length === 0) {
    throw new Error('No canvas pages to export');
  }

  const filename = defaultFilename.endsWith('.pdf') ? defaultFilename : `${defaultFilename}.pdf`;

  // 1. Try window.jspdf if loaded
  if (typeof window !== 'undefined' && window.jspdf && window.jspdf.jsPDF) {
    try {
      const { jsPDF } = window.jspdf;
      let doc = null;

      for (let i = 0; i < canvases.length; i++) {
        const c = canvases[i];
        const isLandscape = c.width > c.height;
        const ptWidth = Math.round(c.width * 0.75);
        const ptHeight = Math.round(c.height * 0.75);
        const imgData = c.toDataURL('image/jpeg', 0.92);

        if (i === 0) {
          doc = new jsPDF({
            orientation: isLandscape ? 'landscape' : 'portrait',
            unit: 'pt',
            format: [ptWidth, ptHeight],
          });
          doc.addImage(imgData, 'JPEG', 0, 0, ptWidth, ptHeight, undefined, 'FAST');
        } else {
          doc.addPage([ptWidth, ptHeight], isLandscape ? 'landscape' : 'portrait');
          doc.addImage(imgData, 'JPEG', 0, 0, ptWidth, ptHeight, undefined, 'FAST');
        }
      }

      if (doc) {
        doc.save(filename);
        return true;
      }
    } catch (jspdfErr) {
      console.warn('jsPDF export error, falling back to native builder:', jspdfErr);
    }
  }

  // 2. Native PDF builder fallback (100% offline, zero dependencies)
  const imagesData = canvases.map((c) => {
    const dataUrl = c.toDataURL('image/jpeg', 0.92);
    const base64 = dataUrl.split(',')[1];
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let j = 0; j < binary.length; j++) {
      bytes[j] = binary.charCodeAt(j);
    }
    return {
      jpegBytes: bytes,
      width: c.width,
      height: c.height,
    };
  });

  const pdfBytes = buildNativePdfFromJpegs(imagesData);
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const blobUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
  return true;
}

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

          if (dataUrl) {
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
          } else {
            // Blank canvas page (no background worksheet)
            const targetPageDrawings = pageDrawingsMapRef.current.get(targetPage) || [];
            api.updateScene({
              elements: targetPageDrawings,
              commitToHistory: false,
            });
          }
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
      } else if (data.type === 'EXPORT_PDF_COMMAND') {
        const { mode, pages, fileName } = data;
        const cleanTitle = (fileName || '11plus_lesson')
          .replace(/\.[^/.]+$/, '')
          .replace(/[^a-zA-Z0-9_\-\s]/g, '_')
          .trim();
        const dateStr = new Date().toISOString().slice(0, 10);
        const pdfDownloadName = `${cleanTitle}_${dateStr}.pdf`;

        (async () => {
          try {
            // Save current drawings before exporting
            const currentScene = api.getSceneElementsIncludingDeleted();
            const nonBgDrawings = currentScene.filter(el => !el.id.startsWith('pdf_bg_'));
            pageDrawingsMapRef.current.set(activePageRef.current, nonBgDrawings);

            const canvases = [];

            if (mode === 'all' && Array.isArray(pages) && pages.length > 0) {
              for (let idx = 0; idx < pages.length; idx++) {
                const pageInfo = pages[idx];
                const pNum = pageInfo.pageNumber || (idx + 1);

                window.parent.postMessage({
                  type: 'EXPORT_PROGRESS',
                  current: idx + 1,
                  total: pages.length,
                }, '*');

                // Assemble elements for this page
                const drawings = (pNum === activePageRef.current)
                  ? nonBgDrawings.filter(el => !el.isDeleted)
                  : (pageDrawingsMapRef.current.get(pNum) || pageInfo.elements || []).filter(el => !el.isDeleted);

                const filesMap = { ...(api.getFiles() || {}) };
                let pageElements = [...drawings];

                if (pageInfo.background && pageInfo.background.dataUrl) {
                  const bgFileId = pageInfo.background.fileId || `export_bg_p${pNum}`;
                  filesMap[bgFileId] = {
                    id: bgFileId,
                    dataURL: pageInfo.background.dataUrl,
                    mimeType: 'image/png',
                    created: Date.now(),
                    lastRetrieved: Date.now(),
                  };
                  const bgElement = {
                    id: `pdf_bg_${bgFileId}`,
                    type: 'image',
                    x: 60,
                    y: 60,
                    width: pageInfo.background.width || 800,
                    height: pageInfo.background.height || 1130,
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
                    seed: 12345,
                    version: 1,
                    versionNonce: 12345,
                    isDeleted: false,
                    fileId: bgFileId,
                    status: 'saved',
                    scale: [1, 1],
                    locked: true,
                  };
                  pageElements = [bgElement, ...drawings];
                }

                if (pageElements.length === 0) {
                  pageElements = [{
                    id: `blank_p${pNum}`,
                    type: 'rectangle',
                    x: 60,
                    y: 60,
                    width: 800,
                    height: 1130,
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
                    seed: 12345,
                    version: 1,
                    versionNonce: 12345,
                    isDeleted: false,
                  }];
                }

                const pageCanvas = await exportToCanvas({
                  elements: pageElements,
                  appState: {
                    viewBackgroundColor: '#FFFFFF',
                    exportBackground: true,
                    exportWithDarkMode: false,
                  },
                  files: filesMap,
                  exportPadding: 20,
                });
                canvases.push(pageCanvas);
              }
            } else {
              // Current page export
              const visibleElements = api.getSceneElements();
              let exportElements = visibleElements;
              if (exportElements.length === 0) {
                exportElements = [{
                  id: 'blank_current',
                  type: 'rectangle',
                  x: 60,
                  y: 60,
                  width: 800,
                  height: 1130,
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
                  seed: 12345,
                  version: 1,
                  versionNonce: 12345,
                  isDeleted: false,
                }];
              }

              const currentCanvas = await exportToCanvas({
                elements: exportElements,
                appState: {
                  viewBackgroundColor: '#FFFFFF',
                  exportBackground: true,
                  exportWithDarkMode: false,
                },
                files: api.getFiles(),
                exportPadding: 20,
              });
              canvases.push(currentCanvas);
            }

            await generateAndDownloadPdf(canvases, pdfDownloadName);

            window.parent.postMessage({
              type: 'EXPORT_COMPLETE',
              success: true,
              fileName: pdfDownloadName,
            }, '*');
          } catch (exportErr) {
            console.error('Export PDF error:', exportErr);
            window.parent.postMessage({
              type: 'EXPORT_COMPLETE',
              success: false,
              error: exportErr.message || 'Export failed',
            }, '*');
          }
        })();
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
          export: false,
          saveAsImage: true,
        },
      },
    },
    React.createElement(
      MainMenu,
      null,
      React.createElement(
        MainMenu.Item,
        {
          onSelect: () => {
            window.parent.postMessage({ type: 'REQUEST_EXPORT_PDF' }, '*');
          },
          icon: React.createElement('span', { style: { fontSize: '18px' } }, '📥'),
        },
        'Export as PDF'
      ),
      React.createElement(MainMenu.DefaultItems.SaveAsImage),
      React.createElement(MainMenu.DefaultItems.ClearCanvas),
      React.createElement(MainMenu.DefaultItems.ToggleTheme),
      React.createElement(MainMenu.DefaultItems.ChangeCanvasBackground)
    )),
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
