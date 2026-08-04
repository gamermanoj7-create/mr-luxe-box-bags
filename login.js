import { auth, provider } from "./firebase.js";

import {
  signInWithPopup,
  signOut
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

const btn = document.getElementById("googleLogin");

btn.addEventListener("click", async () => {

    try {

        const result = await signInWithPopup(auth, provider);

        const user = result.user;

        if (user.email === "gamermanoj7@gmail.com") {

            alert("Welcome Admin");

            window.location.href = "admin.html";

        } else {

            alert("Access Denied");

            await signOut(auth);

            window.location.href = "index.html";

        }

    } catch (error) {

        alert(error.message);

        console.error(error);

    }

});