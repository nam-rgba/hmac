import { Routes, Route } from "react-router-dom";

import axios from "axios";

import Host from "./pages/host/Host.jsx";

axios.defaults.baseURL = "https://hmac-three.vercel.app/";
// axios.defaults.baseURL = "http://127.0.0.1:4000";
axios.defaults.withCredentials = true;

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Host />} />
      </Routes>
    </>
  );
}

export default App;
