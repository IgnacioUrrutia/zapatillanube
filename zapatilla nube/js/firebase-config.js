// Firebase Configuration
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, doc, getDoc, updateDoc, deleteDoc, query, where, orderBy } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Tu configuración de Firebase (reemplaza estos valores con los de tu proyecto)
const firebaseConfig = {
  apiKey: "AIzaSyC-pguu8fjK7zz2ianj9SnyuhNhu1fw_vk",
  authDomain: "gengar-market-cbd5c.firebaseapp.com",
  projectId: "gengar-market-cbd5c",
  storageBucket: "gengar-market-cbd5c.firebasestorage.app",
  messagingSenderId: "475810259080",
  appId: "1:475810259080:web:fe20bc9d55972989863f3d"
};

// Variables para los servicios de Firebase
let app, auth, db;

// Inicializar Firebase con manejo de errores
try {
  console.log("Intentando inicializar Firebase con configuración:", 
    JSON.stringify({
      ...firebaseConfig,
      apiKey: "***" // Ocultar API key por seguridad
    })
  );
  
  app = initializeApp(firebaseConfig);
  console.log("Firebase inicializado correctamente");
  
  // Inicializar servicios
  auth = getAuth(app);
  console.log("Auth inicializado");
  
  db = getFirestore(app);
  console.log("Firestore inicializado");
  
} catch (error) {
  console.error("Error al inicializar Firebase:", error);
  // Crear objetos mock en caso de error
  app = null;
  auth = {
    currentUser: null,
    onAuthStateChanged: (callback) => callback(null)
  };
  db = null;
}

// Exportar para usarlo en otros archivos - ESTO DEBE ESTAR A NIVEL DE MÓDULO, NO DENTRO DE UN BLOQUE
export { 
  app, 
  auth, 
  db, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  onAuthStateChanged, 
  signOut, 
  GoogleAuthProvider, 
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  getDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy 
};


