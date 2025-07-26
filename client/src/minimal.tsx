import { createRoot } from "react-dom/client";

function App() {
  return <h1>Test App</h1>;
}

createRoot(document.getElementById("root")!).render(<App />);