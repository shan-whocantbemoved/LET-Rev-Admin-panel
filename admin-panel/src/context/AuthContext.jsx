import { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../services/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null); // 'Admin' or 'Teacher'
  const [loading, setLoading] = useState(true); // Prevents the login bypass flicker!

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        
        // Fetch the user's role from our VIP list in Firestore
        try {
          const q = query(collection(db, 'users'), where('email', '==', user.email));
          const querySnapshot = await getDocs(q);
          
          if (!querySnapshot.empty) {
            const userData = querySnapshot.docs[0].data();
            setUserRole(userData.role);
          } else {
            setUserRole('Teacher'); // Safest fallback
          }
        } catch (error) {
          console.error("Error fetching role:", error);
          setUserRole('Teacher');
        }
      } else {
        setCurrentUser(null);
        setUserRole(null);
      }
      setLoading(false); // Finished checking!
    });

    return unsubscribe;
  }, []);

  const value = { currentUser, userRole };

  return (
    <AuthContext.Provider value={value}>
      {/* If loading is true, show nothing (or a spinner). This stops the bypass! */}
      {!loading && children}
    </AuthContext.Provider>
  );
}