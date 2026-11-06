// PDF to Canvas / Image Extraction Service for Excalidraw
import * as pdfjsLib from 'pdfjs-dist/build/pdf';

// Configure PDF.js Worker for browser execution
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '3.11.174'}/pdf.worker.min.js`;
}

/**
 * Loads a PDF document from a File, ArrayBuffer, or URL string
 */
export async function loadPdfDocument(source) {
  try {
    let loadingTask;
    if (typeof source === 'string') {
      loadingTask = pdfjsLib.getDocument(source);
    } else if (source instanceof File || source instanceof Blob) {
      const buffer = await source.arrayBuffer();
      loadingTask = pdfjsLib.getDocument({ data: buffer });
    } else if (source instanceof ArrayBuffer || source instanceof Uint8Array) {
      loadingTask = pdfjsLib.getDocument({ data: source });
    } else {
      throw new Error('Unsupported PDF source type');
    }

    const pdfDoc = await loadingTask.promise;
    return pdfDoc;
  } catch (error) {
    console.error('Failed to load PDF document:', error);
    throw error;
  }
}

/**
 * Renders a specific page of a PDF document to a high-resolution PNG data URL
 */
export async function renderPdfPageToImage(pdfDoc, pageNumber = 1, scale = 1.75) {
  try {
    const page = await pdfDoc.getPage(pageNumber);
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d', { alpha: false });

    // Fill white background before rendering PDF
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const renderContext = {
      canvasContext: ctx,
      viewport: viewport,
    };

    await page.render(renderContext).promise;

    const dataUrl = canvas.toDataURL('image/png', 0.95);
    return {
      pageNumber,
      totalPages: pdfDoc.numPages,
      dataUrl,
      // Target display dimensions at standard 72-96 DPI
      displayWidth: Math.round(viewport.width / (scale / 1.0)),
      displayHeight: Math.round(viewport.height / (scale / 1.0)),
      renderWidth: viewport.width,
      renderHeight: viewport.height,
    };
  } catch (error) {
    console.error(`Failed to render PDF page ${pageNumber}:`, error);
    throw error;
  }
}

/**
 * Creates an Excalidraw-compatible locked background image element
 */
export function createExcalidrawBackgroundElement(fileId, width, height, x = 60, y = 60) {
  const randomSuffix = Math.random().toString(36).substring(2, 9);
  return {
    id: `pdf_bg_${fileId}_${randomSuffix}`,
    type: 'image',
    x,
    y,
    width,
    height,
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
    fileId,
    status: 'saved',
    scale: [1, 1],
    locked: true, // Locked as background so pen/shapes/text draw right over it
  };
}
