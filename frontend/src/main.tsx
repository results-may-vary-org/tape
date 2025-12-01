import React from 'react'
import {createRoot} from 'react-dom/client'
import './style.css'
import App from './App'
import {ThemeProvider} from "next-themes";

const container = document.getElementById('root')

const root = createRoot(container!)

root.render(
    <React.StrictMode>
      <ThemeProvider attribute="class">
        <App/>
      </ThemeProvider>
    </React.StrictMode>
)
