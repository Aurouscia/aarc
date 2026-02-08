import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import App from './App.vue'
import './styles/styles.scss'
import '@aurouscia/au-color-picker/style.css'
import '@anilkumarthakur/vue3-json-viewer/styles.css'
import { appSetup } from './app/setup/appSetup'
import { enforceNoGesture } from './utils/eventUtils/enforceNoGesture'

const pinia = createPinia().use(piniaPluginPersistedstate)
const app = createApp(App).use(pinia);

const router = appSetup()

enforceNoGesture()
app.use(router).mount('#app')