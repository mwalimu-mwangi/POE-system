import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Add meta tags for SEO
const metaDescription = document.createElement('meta');
metaDescription.name = 'description';
metaDescription.content = 'Digital Portfolio of Evidence System for educational institutions - streamline assessment, verification, and certification processes';
document.head.appendChild(metaDescription);

// Add title
const titleElement = document.createElement('title');
titleElement.textContent = 'College PoE System | Digital Portfolio of Evidence';
document.head.appendChild(titleElement);

createRoot(document.getElementById("root")!).render(<App />);
