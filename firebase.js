import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";

import {
    getAuth,
    GoogleAuthProvider
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

import {
    getFirestore
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

import {
    getStorage
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-storage.js";

const firebaseConfig = {

    apiKey: "AIzaSyBaZIBbEhh5LzOK91N6QYndTL45hPmQEvo",

    authDomain: "mr-luxe-box-bags.firebaseapp.com",

    projectId: "mr-luxe-box-bags",

    storageBucket: "mr-luxe-box-bags.firebasestorage.app",

    messagingSenderId: "588182881842",

    appId: "1:588182881842:web:b749ba2eb076673ece1e2b",

    measurementId: "G-NHF26PN1JG"

};

const app = initializeApp(firebaseConfig);

// Authentication
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// Firestore Database
const db = getFirestore(app);

// Firebase Storage
const storage = getStorage(app);

// Export
export {
    app,
    auth,
    provider,
    db,
    storage
};