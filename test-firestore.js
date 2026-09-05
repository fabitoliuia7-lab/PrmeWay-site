const { initializeApp } = require('firebase/app');
const { getFirestore, getDoc, doc } = require('firebase/firestore');
const firebaseConfig = require('./firebase-applet-config.json');

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function testConnection() {
  try {
    console.log("Testing connection...");
    await getDoc(doc(db, 'test', 'connection'));
    console.log("Connection successful!");
  } catch (error) {
    console.error("Error connecting:", error);
  }
}
testConnection();
