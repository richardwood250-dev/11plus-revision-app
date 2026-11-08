import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '../firebase-config';
import { doc, setDoc, getDoc, collection, getDocs, deleteDoc } from 'firebase/firestore';

const CLASSROOM_INDEX_KEY = 'NINJA_CLASSROOMS_INDEX_V1';
const META_KEY_PREFIX = 'NINJA_CLASSROOM_META_';
const PAGES_KEY_PREFIX = 'NINJA_CLASSROOM_PAGES_';

// Cloud sync capability flag (cached after first attempt)
let isCloudAvailable = true;

/**
 * Retrieve the master index of all saved classrooms (for Admin Hub)
 */
export const getAllClassroomsIndex = async () => {
  try {
    const raw = await AsyncStorage.getItem(CLASSROOM_INDEX_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.warn('Error reading classrooms index:', err);
    return [];
  }
};

/**
 * Update the master index with new/updated room info
 */
const updateClassroomIndex = async (roomId, partialInfo) => {
  try {
    const list = await getAllClassroomsIndex();
    const existingIndex = list.findIndex(c => c.roomId === roomId);
    const now = new Date().toISOString();

    const entry = {
      roomId,
      title: partialInfo.title || (existingIndex >= 0 ? list[existingIndex].title : `Room: ${roomId}`),
      totalPdfPages: partialInfo.totalPdfPages !== undefined 
        ? partialInfo.totalPdfPages 
        : (existingIndex >= 0 ? list[existingIndex].totalPdfPages : 1),
      updatedAt: now,
      createdAt: existingIndex >= 0 ? list[existingIndex].createdAt : now,
    };

    if (existingIndex >= 0) {
      list[existingIndex] = { ...list[existingIndex], ...entry };
    } else {
      list.unshift(entry);
    }

    await AsyncStorage.setItem(CLASSROOM_INDEX_KEY, JSON.stringify(list));
  } catch (err) {
    console.warn('Error updating classroom index:', err);
  }
};

/**
 * Load complete classroom session (metadata + all pages + drawings)
 */
export const loadClassroomSession = async (roomId) => {
  if (!roomId) return { exists: false, meta: null, pages: {} };

  try {
    // 1. Try local storage first (instant response)
    const metaRaw = await AsyncStorage.getItem(`${META_KEY_PREFIX}${roomId}`);
    const pagesRaw = await AsyncStorage.getItem(`${PAGES_KEY_PREFIX}${roomId}`);

    let localMeta = metaRaw ? JSON.parse(metaRaw) : null;
    let localPages = pagesRaw ? JSON.parse(pagesRaw) : {};

    // 2. Try Firestore if available to sync any remote changes
    if (isCloudAvailable && db) {
      try {
        const roomDocRef = doc(db, 'classrooms', roomId);
        const roomSnap = await getDoc(roomDocRef);

        if (roomSnap.exists()) {
          const cloudMeta = roomSnap.data();
          // Merge with local (prefer newer)
          if (!localMeta || (cloudMeta.updatedAt && new Date(cloudMeta.updatedAt) > new Date(localMeta.updatedAt))) {
            localMeta = { ...localMeta, ...cloudMeta };
            await AsyncStorage.setItem(`${META_KEY_PREFIX}${roomId}`, JSON.stringify(localMeta));

            // Load remote pages
            const pagesColRef = collection(db, 'classrooms', roomId, 'pages');
            const pagesSnap = await getDocs(pagesColRef);
            pagesSnap.forEach((pDoc) => {
              const pData = pDoc.data();
              if (pData && pData.pageNumber) {
                localPages[pData.pageNumber] = pData;
              }
            });
            await AsyncStorage.setItem(`${PAGES_KEY_PREFIX}${roomId}`, JSON.stringify(localPages));
          }
        }
      } catch (cloudErr) {
        if (cloudErr.code === 'permission-denied') {
          isCloudAvailable = false;
        }
        console.warn('Firestore load notice (falling back to local storage):', cloudErr.code || cloudErr.message);
      }
    }

    if (localMeta || Object.keys(localPages).length > 0) {
      return {
        exists: true,
        meta: localMeta || { roomId, title: `Room: ${roomId}`, totalPdfPages: Object.keys(localPages).length || 1 },
        pages: localPages,
      };
    }

    return { exists: false, meta: null, pages: {} };
  } catch (err) {
    console.warn('Error loading classroom session:', err);
    return { exists: false, meta: null, pages: {} };
  }
};

/**
 * Save classroom metadata (title, total pages, current page, notes)
 */
export const saveClassroomMeta = async (roomId, meta) => {
  if (!roomId) return;
  const now = new Date().toISOString();

  try {
    const existingRaw = await AsyncStorage.getItem(`${META_KEY_PREFIX}${roomId}`);
    const existing = existingRaw ? JSON.parse(existingRaw) : {};

    const updated = {
      ...existing,
      ...meta,
      roomId,
      updatedAt: now,
      createdAt: existing.createdAt || now,
    };

    await AsyncStorage.setItem(`${META_KEY_PREFIX}${roomId}`, JSON.stringify(updated));
    await updateClassroomIndex(roomId, updated);

    // Sync to Firestore in background
    if (isCloudAvailable && db) {
      try {
        const roomDocRef = doc(db, 'classrooms', roomId);
        await setDoc(roomDocRef, updated, { merge: true });
      } catch (cloudErr) {
        if (cloudErr.code === 'permission-denied') isCloudAvailable = false;
        console.warn('Firestore meta save notice:', cloudErr.code || cloudErr.message);
      }
    }
  } catch (err) {
    console.warn('Error saving classroom meta:', err);
  }
};

/**
 * Save a single page (background worksheet image + drawings)
 */
export const saveClassroomPage = async (roomId, pageNumber, pageData) => {
  if (!roomId || !pageNumber) return;
  const now = new Date().toISOString();

  try {
    const pagesRaw = await AsyncStorage.getItem(`${PAGES_KEY_PREFIX}${roomId}`);
    const pages = pagesRaw ? JSON.parse(pagesRaw) : {};

    const existingPage = pages[pageNumber] || {};
    const updatedPage = {
      ...existingPage,
      ...pageData,
      pageNumber,
      updatedAt: now,
    };

    pages[pageNumber] = updatedPage;
    await AsyncStorage.setItem(`${PAGES_KEY_PREFIX}${roomId}`, JSON.stringify(pages));

    // Sync to Firestore subcollection in background
    if (isCloudAvailable && db) {
      try {
        const pageDocRef = doc(db, 'classrooms', roomId, 'pages', String(pageNumber));
        await setDoc(pageDocRef, updatedPage, { merge: true });
      } catch (cloudErr) {
        if (cloudErr.code === 'permission-denied') isCloudAvailable = false;
        console.warn('Firestore page save notice:', cloudErr.code || cloudErr.message);
      }
    }
  } catch (err) {
    console.warn('Error saving classroom page:', err);
  }
};

/**
 * Save only drawings for a page (lightweight, debounced while drawing)
 */
export const saveClassroomPageDrawings = async (roomId, pageNumber, drawings) => {
  if (!roomId || !pageNumber) return;
  const now = new Date().toISOString();

  try {
    const pagesRaw = await AsyncStorage.getItem(`${PAGES_KEY_PREFIX}${roomId}`);
    const pages = pagesRaw ? JSON.parse(pagesRaw) : {};

    const existingPage = pages[pageNumber] || { pageNumber };
    existingPage.drawings = drawings || [];
    existingPage.updatedAt = now;

    pages[pageNumber] = existingPage;
    await AsyncStorage.setItem(`${PAGES_KEY_PREFIX}${roomId}`, JSON.stringify(pages));

    // Sync to Firestore in background
    if (isCloudAvailable && db) {
      try {
        const pageDocRef = doc(db, 'classrooms', roomId, 'pages', String(pageNumber));
        await setDoc(pageDocRef, { drawings: drawings || [], updatedAt: now }, { merge: true });
      } catch (cloudErr) {
        if (cloudErr.code === 'permission-denied') isCloudAvailable = false;
      }
    }
  } catch (err) {
    console.warn('Error saving classroom drawings:', err);
  }
};

/**
 * Save notes for a classroom session
 */
export const saveClassroomNotes = async (roomId, sessionNotes) => {
  if (!roomId) return;
  try {
    await saveClassroomMeta(roomId, { sessionNotes });
  } catch (err) {
    console.warn('Error saving classroom notes:', err);
  }
};

/**
 * Delete a classroom session
 */
export const deleteClassroomSession = async (roomId) => {
  if (!roomId) return;
  try {
    await AsyncStorage.removeItem(`${META_KEY_PREFIX}${roomId}`);
    await AsyncStorage.removeItem(`${PAGES_KEY_PREFIX}${roomId}`);

    const list = await getAllClassroomsIndex();
    const filtered = list.filter(c => c.roomId !== roomId);
    await AsyncStorage.setItem(CLASSROOM_INDEX_KEY, JSON.stringify(filtered));

    if (isCloudAvailable && db) {
      try {
        const roomDocRef = doc(db, 'classrooms', roomId);
        await deleteDoc(roomDocRef);
      } catch (e) {}
    }
  } catch (err) {
    console.warn('Error deleting classroom session:', err);
  }
};
