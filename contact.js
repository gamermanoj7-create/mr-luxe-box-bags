import { app } from "./firebase.js";

import {
  getFirestore,
  collection,
  addDoc
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const db = getFirestore(app);

const form = document.getElementById("contactForm");

form.addEventListener("submit", async (e) => {

    e.preventDefault();

    try {

        await addDoc(collection(db, "contacts"), {

            name: document.getElementById("name").value,

            phone: document.getElementById("phone").value,

            email: document.getElementById("email").value,

            message: document.getElementById("message").value,

            date: new Date()

        });

        alert("Message Sent Successfully!");

        form.reset();

    } catch (err) {

        alert("Error: " + err.message);

    }

});