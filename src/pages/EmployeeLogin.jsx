import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Activity, QrCode, Camera, X, CheckCircle } from "lucide-react";
import { useAuth } from "../layout/AuthProvider";
import "./login.css";

// ─── MOCK: token kiritilsa shu hodim sifatida kiradi ───────
const MOCK_EMPLOYEE = {
  id: "mock-emp-1",
  firstName: "Aziz",
  lastName: "Karimov",
  role: "EMPLOYEE",
};

export default function EmployeeLogin() {
  const [scanning, setScanning] = useState(false);
  const [manualToken, setManualToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const scanIntervalRef = useRef(null);
  const { loginEmployee } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    return () => stopCamera();
  }, []);

  const stopCamera = () => {
    clearInterval(scanIntervalRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setScanning(false);
  };

  const startCamera = async () => {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setScanning(true);

      // ── MOCK: kamera 2 soniyadan keyin "QR topildi" deb hisoblanadi ──
      scanIntervalRef.current = setTimeout(() => {
        stopCamera();
        doLogin("mock-scanned-qr-token");
      }, 2000);
    } catch (err) {
      setError("Kamera ruxsati berilmadi. Tokenni qo'lda kiriting.");
    }
  };

  const doLogin = (qrToken) => {
    setLoading(true);
    setError("");

    // ── MOCK LOGIN — API o'rniga setTimeout bilan simulyatsiya ──
    setTimeout(() => {
      if (!qrToken || !qrToken.trim()) {
        setError("Token noto'g'ri");
        setLoading(false);
        return;
      }
      setSuccess(`Xush kelibsiz, ${MOCK_EMPLOYEE.firstName}!`);
      loginEmployee("mock-employee-token-" + Date.now(), MOCK_EMPLOYEE);
      setTimeout(() => navigate("/employee"), 1200);
      setLoading(false);
    }, 600);
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualToken.trim()) return;
    doLogin(manualToken.trim());
  };

  return (
    <div className="empLoginPage">
      <div className="empLoginCard">
        <div className="loginLogo">
          <div className="loginLogoIcon">
            <Activity size={22} />
          </div>
          <div>
            <h1 className="loginAppName">PharmaCRM</h1>
            <p className="loginAppSub">Xodim kirishi</p>
          </div>
        </div>

        <div className="loginDivider" />

        {success ? (
          <div className="successBox">
            <CheckCircle size={40} className="successIcon" />
            <p className="successText">{success}</p>
          </div>
        ) : (
          <>
            <h2 className="loginTitle">QR kod bilan kiring</h2>
            <p className="loginDesc">QR kodingizni kameraga ko'rsating</p>

            {error && <div className="loginError">{error}</div>}

            <div className="scanArea">
              {scanning ? (
                <div className="cameraBox">
                  <video ref={videoRef} className="cameraVideo" muted playsInline />
                  <div className="scanOverlay">
                    <div className="scanFrame" />
                  </div>
                  <button className="stopBtn" onClick={stopCamera}>
                    <X size={16} /> Bekor qilish
                  </button>
                </div>
              ) : (
                <button
                  className="startScanBtn"
                  onClick={startCamera}
                  disabled={loading}
                >
                  <Camera size={24} />
                  <span>Kamera orqali skanerlash</span>
                </button>
              )}
            </div>

            <div className="orDivider">
              <span>yoki token bilan</span>
            </div>

            <form onSubmit={handleManualSubmit} className="manualForm">
              <div className="inputWrapManual">
                <QrCode size={16} className="inputIcon" />
                <input
                  type="text"
                  placeholder="QR token ni kiriting... (istalgan matn)"
                  value={manualToken}
                  onChange={(e) => setManualToken(e.target.value)}
                  disabled={loading}
                />
              </div>
              <button type="submit" className="loginBtn" disabled={loading || !manualToken.trim()}>
                {loading ? <span className="spinner" /> : "Kirish"}
              </button>
            </form>

            <p className="loginFooter">
              Admin sifatida kirish uchun{" "}
              <a href="/admin-login">bu yerga bosing</a>
            </p>
          </>
        )}
      </div>
    </div>
  );
}