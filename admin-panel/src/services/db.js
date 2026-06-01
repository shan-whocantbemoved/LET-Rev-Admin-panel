import { db } from './firebase';
import { collection, addDoc, getDocs, serverTimestamp, query, orderBy, doc, updateDoc, deleteDoc, writeBatch, limit, getCountFromServer } from 'firebase/firestore';

// References to our collections
const categoriesCollection = collection(db, 'categories');
const questionsCollection = collection(db, 'questions');
const usersCollection = collection(db, 'users');

// ==========================================
// CATEGORY FUNCTIONS
// ==========================================

export const addCategory = async (name, description, type = 'General Education') => {
  try {
    const docRef = await addDoc(categoriesCollection, {
      name, 
      description, 
      type, // <-- WE ADDED THIS
      isActive: true, 
      updatedAt: serverTimestamp(), 
    });
    return { id: docRef.id, success: true };
  } catch (error) {
    console.error("Error adding category: ", error);
    return { success: false, error };
  }
};

export const getCategories = async () => {
  try {
    const q = query(categoriesCollection, orderBy('updatedAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching categories: ", error);
    return [];
  }
};

export const updateCategory = async (id, newName, type) => {
  try {
    const categoryRef = doc(db, 'categories', id);
    await updateDoc(categoryRef, { 
      name: newName, 
      type, // <-- WE ADDED THIS
      updatedAt: serverTimestamp() 
    });
    return { success: true };
  } catch (error) {
    console.error("Error updating category: ", error);
    return { success: false, error };
  }
};

export const deleteCategory = async (id) => {
  try {
    const categoryRef = doc(db, 'categories', id);
    await deleteDoc(categoryRef);
    return { success: true };
  } catch (error) {
    console.error("Error deleting category: ", error);
    return { success: false, error };
  }
};

// ==========================================
// QUESTION FUNCTIONS
// ==========================================

export const addQuestion = async (questionData) => {
  try {
    const docRef = await addDoc(questionsCollection, {
      ...questionData, isActive: true, updatedAt: serverTimestamp(),
    });
    return { id: docRef.id, success: true };
  } catch (error) {
    console.error("Error adding question: ", error);
    return { success: false, error };
  }
};

// Optimized: Only grabs the latest 200 questions to save read quota and browser memory!
export const getQuestions = async () => {
  try {
    const q = query(questionsCollection, orderBy('updatedAt', 'desc'), limit(200));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching questions: ", error);
    return [];
  }
};

// ULTRA CHEAP STATS: Costs only 3 reads total, no matter how many questions you have!
export const getSystemStats = async () => {
  try {
    const qCountSnap = await getCountFromServer(questionsCollection);
    const cCountSnap = await getCountFromServer(categoriesCollection);
    
    // Get only the 1 latest question to find the timestamp
    const latestQ = query(questionsCollection, orderBy('updatedAt', 'desc'), limit(1));
    const latestSnap = await getDocs(latestQ);
    
    let lastUpdate = null;
    if (!latestSnap.empty && latestSnap.docs[0].data().updatedAt) {
      lastUpdate = latestSnap.docs[0].data().updatedAt;
    }

    return {
      questionCount: qCountSnap.data().count,
      categoryCount: cCountSnap.data().count,
      lastUpdate: lastUpdate
    };
  } catch (error) {
    console.error("Error getting stats: ", error);
    return { questionCount: 0, categoryCount: 0, lastUpdate: null };
  }
};

export const updateQuestion = async (id, questionData) => {
  try {
    const questionRef = doc(db, 'questions', id);
    await updateDoc(questionRef, {
      ...questionData, updatedAt: serverTimestamp(),
    });
    return { success: true };
  } catch (error) {
    console.error("Error updating question: ", error);
    return { success: false, error };
  }
};

export const deleteQuestion = async (id) => {
  try {
    const questionRef = doc(db, 'questions', id);
    await deleteDoc(questionRef);
    return { success: true };
  } catch (error) {
    console.error("Error deleting question: ", error);
    return { success: false, error };
  }
};

// ==========================================
// BULK UPLOAD FUNCTION
// ==========================================

export const bulkAddQuestions = async (questionsArray) => {
  try {
    // A "Batch" ensures either ALL questions save, or NONE save. No half-finished uploads!
    const batch = writeBatch(db);
    
    questionsArray.forEach((q) => {
      // Generate a new document ID automatically
      const docRef = doc(questionsCollection);
      batch.set(docRef, {
        ...q,
        isActive: true,
        updatedAt: serverTimestamp(), // Very important for your groupmate's PWA Sync
      });
    });

    // Fire them all into the database at once
    await batch.commit();
    return { success: true };
  } catch (error) {
    console.error("Error in bulk upload: ", error);
    return { success: false, error };
  }
};

// ==========================================
// USER MANAGEMENT FUNCTIONS
// ==========================================

export const addUserRecord = async (userData) => {
  try {
    const docRef = await addDoc(usersCollection, {
      ...userData,
      isActive: true,
      createdAt: serverTimestamp(),
    });
    return { id: docRef.id, success: true };
  } catch (error) {
    console.error("Error adding user record: ", error);
    return { success: false, error };
  }
};

export const getUsers = async () => {
  try {
    const q = query(usersCollection, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching users: ", error);
    return [];
  }
};

export const updateUserRole = async (id, newRole) => {
  try {
    const userRef = doc(db, 'users', id);
    await updateDoc(userRef, { role: newRole });
    return { success: true };
  } catch (error) {
    console.error("Error updating user role: ", error);
    return { success: false, error };
  }
};

export const deleteUserRecord = async (id) => {
  try {
    const userRef = doc(db, 'users', id);
    await deleteDoc(userRef);
    return { success: true };
  } catch (error) {
    console.error("Error deleting user: ", error);
    return { success: false, error };
  }
};