import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { initNativeNotify } from "./nativeNotify.js";

initNativeNotify();
createRoot(document.getElementById("root")).render(<App />);
