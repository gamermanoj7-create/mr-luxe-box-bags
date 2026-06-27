import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-analytics.js";

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
const analytics = getAnalytics(app);

console.log("Firebase Connected Successfully!");
export { app };