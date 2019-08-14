import { WebSocket } from 'mock-socket';

global.XMLHttpRequest = require('w3c-xmlhttprequest').XMLHttpRequest;
global.WebSocket = WebSocket;
