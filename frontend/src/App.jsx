import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import CreateCode from "./pages/CreateCode";
import ViewCode from "./pages/ViewCode";
import RecentPastes from "./pages/RecentPastes";
import RoomView from "./pages/RoomView";

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<CreateCode />} />
                <Route path="/recent" element={<RecentPastes />} />
                <Route path="/code/:id" element={<ViewCode />} />
                <Route path="/room/:code" element={<RoomView />} />
            </Routes>
            <ToastContainer
                position="top-right"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="dark"
                style={{
                    "--toastify-color-progress-light": "var(--primary-color)",
                    "--toastify-color-progress-dark": "var(--primary-color)",
                    "--toastify-toast-background": "var(--card-bg)",
                    "--toastify-text-color-dark": "var(--foreground)",
                }}
            />
        </Router>
    );
}

export default App;
