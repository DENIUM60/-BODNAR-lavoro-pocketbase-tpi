// src/pb.js
import PocketBase from 'pocketbase';

// indirizo ip e porta
const pb = new PocketBase('http://127.0.0.1:8090');

export default pb;