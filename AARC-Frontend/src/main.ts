import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import './styles/styles.scss'
import '@aurouscia/au-color-picker/style.css'
import { appSetup } from './utils/app/setup/appSetup'

const pinia = createPinia()
const app = createApp(App).use(pinia);

const router = appSetup()

app.use(router).mount('#app')