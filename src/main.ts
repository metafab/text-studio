import './app.css'
import { mount } from 'svelte'
import App from './App.svelte'

// @ts-ignore - Svelte 5 compatibility mode
const app = mount(App, {
  target: document.getElementById('app')!,
})

export default app
