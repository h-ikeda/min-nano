import { createApp } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';
import { GlobalWorkerOptions } from 'pdfjs-dist';
import workerSrc from './pdf.worker';
import App from './App.vue';
import { routes } from './routes';

GlobalWorkerOptions.workerSrc = workerSrc;

const app = createApp(App);
const router = createRouter({
  history: createWebHistory(),
  routes,
});
app.use(router);
app.mount(document.body);
