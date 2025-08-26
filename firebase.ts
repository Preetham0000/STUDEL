// Import the functions you need from the SDKs you need
import firebase from "firebase/app";
import "firebase/auth";
import "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC9jtXA-u6wPM4Fr3bR5YwK6T_PqetFREA",
  authDomain: "studel-c885d.firebaseapp.com",
  projectId: "studel-c885d",
  storageBucket: "studel-c885d.firebasestorage.app",
  messagingSenderId: "996891952940",
  appId: "1:996891952940:web:7e979a112bb4b9c3adce89",
  measurementId: "G-QNRQBHMCJG"
};

// Initialize Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// Export services
export const auth = firebase.auth();
export const db = firebase.firestore();
