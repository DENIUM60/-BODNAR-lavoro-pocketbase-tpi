// src/pb.js
import PocketBase from 'pocketbase';

// Ritorna alla porta standard e corretta
const pb = new PocketBase('http://127.0.0.1:8090');

export default pb;