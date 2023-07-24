import { createApp } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';
import { GlobalWorkerOptions } from 'pdfjs-dist';
import workerSrc from './pdf.worker';
import App from './App.vue';
import { routes } from './routes';

if (process.env.NODE_ENV === 'production' && location.hostname.toLowerCase().endsWith('.firebaseapp.com')) {
   const { hostname } = location;
   location.hostname = hostname.replace(/\.firebaseapp\.com$/i, '.web.app');
}

GlobalWorkerOptions.workerSrc = workerSrc;

const app = createApp(App);
const router = createRouter({
   history: createWebHistory(),
   routes,
});
app.use(router);
app.mount(document.body);
