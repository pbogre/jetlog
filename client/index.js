import { createRoot } from 'react-dom/client';
import { App } from './App';

import { initiateSettings } from './settings';
initiateSettings();

const container = document.getElementById("app");
const root = createRoot(container);
root.render(<App />);
