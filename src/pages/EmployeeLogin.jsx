import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Activity, QrCode, Camera, X, CheckCircle } from "lucide-react";
import { useAuth } from "../layout/AuthProvider";
import "./css/login.css";
import { authAPI } from "../api/auth.api";

export default function EmployeeLogin() {
  const [scanning, setScanning] = useState(false);
  const [manualToken, setManualToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const scanTimeoutRef = useRef(null);
  const redirectTimeoutRef = useRef(null);
  const mountedRef = useRef(true);

  const { loginEmployee } = useAuth();
  const navigate = useNavigate();

  const stopCamera = useCallback(() => {
    clearTimeout(scanTimeoutRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setScanning(false);
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      stopCamera();
      clearTimeout(redirectTimeoutRef.current);
    };
  }, [stopCamera]);

  const doLogin = useCallback(
    async (qrToken) => {
      if (!qrToken || !qrToken.trim()) {
        setError("Token noto'g'ri");
        return;
      }

      setLoading(true);
      setError("");

      try {
        const { token, user } = await authAPI.qrLogin(qrToken.trim());
        if (!mountedRef.current) return;

        setSuccess(`Xush kelibsiz, ${user.firstName}!`);
        loginEmployee(token, user);

        redirectTimeoutRef.current = setTimeout(() => {
          if (mountedRef.current) navigate("/");
        }, 1000);
      } catch (err) {
        if (mountedRef.current) setError(err.message || "QR kod yaroqsiz");
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    },
    [loginEmployee, navigate]
  );

  const startCamera = async () => {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });

      if (!mountedRef.current) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setScanning(true);

      // TODO: bu yerga real QR-decoder (masalan jsQR yoki @zxing/browser) ulanadi.
      // Hozircha kamera faqat ko'rsatiladi — token kameradan avtomatik o'qilmaydi,
      // foydalanuvchi pastdagi "token bilan" maydondan kiritadi.
    } catch (err) {
      setError("Kamera ruxsati berilmadi. Tokenni qo'lda kiriting.");
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualToken.trim() || loading) return;
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

            {error && <div className="loginError" role="alert">{error}</div>}

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
                  type="button"
                >
                  <Camera size={24} />
                  <span>Kamera orqali skanerlash</span>
                </button>
              )}
            </div>

            <div className="orDivider">
              <span>yoki token bilan</span>
            </div>

            <form onSubmit={handleManualSubmit} className="manualForm" noValidate>
              <div className="inputWrapManual">
                <QrCode size={16} className="inputIcon" />
                <input
                  type="text"
                  placeholder="QR token ni kiriting..."
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