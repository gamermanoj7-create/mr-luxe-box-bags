import { app } from "./firebase.js";

import {
  getFirestore,
  collection,
  addDoc
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const db = getFirestore(app);

const form = document.getElementById("contactForm");

if (form) {

    form.addEventListener("submit", async (e) => {

        e.preventDefault();

        const name = document.getElementById("name").value.trim();
        const phone = document.getElementById("phone").value.trim();
        const email = document.getElementById("email").value.trim();
        const message = document.getElementById("message").value.trim();

        if (!name || !phone || !message) {
            alert("Please fill all required fields.");
            return;
        }

        try {

            await addDoc(collection(db, "contacts"), {
                name: name,
                phone: phone,
                email: email,
                message: message,
                createdAt: new Date()
            });

            alert("Message Sent Successfully!");

            form.reset();

        } catch (error) {

            console.error(error);

            alert("Failed: " + error.message);

        }

    });

}