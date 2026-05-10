import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { initializeFirebase } from "./lib/firebase";

initializeFirebase();
createRoot(document.getElementById("root")!).render(<App />);
