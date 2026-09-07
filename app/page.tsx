"use client";

import { useEffect, useRef, useState } from 'react';

type Prediction = {
  success: boolean;
  label?: string;
  confidence?: number;
  box?: number[];
  message?: string;
};

const API_URL = 'http://127.0.0.1:8000';

type Sign = {
  word: string;
  time: string;
};



export default function Home() {
  const [recentSigns, setRecentSigns] = useState<Sign[]>([]);
  const [cameraActive, setCameraActive] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [confidence, setConfidence] = useState(55);
  const [cameraOpen, setCameraOpen] = useState(false);
const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
const [selectedCamera, setSelectedCamera] = useState("Mobile");
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastSpokenRef = useRef<string | null>(null);
  const confidenceRef = useRef(confidence);
  confidenceRef.current = confidence;
  const [detectionStatus, setDetectionStatus] = useState<
  "waiting" | "accepted" | "rejected"
>("waiting");
  const lastRecentRef = useRef<string | null>(null);
  const [speakingText, setSpeakingText] = useState("Hello");

  useEffect(() => {
  confidenceRef.current = confidence;
}, [confidence]);

  useEffect(() => {
    const savedTheme = localStorage.getItem("asl2voice-theme");

    if (savedTheme === "light") {
      setDarkMode(false);
    }
  }, []);

  useEffect(() => {
  const loadCameras = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();

      const videoDevices = devices.filter(
        (device) => device.kind === "videoinput"
      );

      setCameras(videoDevices);
    } catch (error) {
      console.error("Could not list cameras:", error);
    }
  };

  loadCameras();
}, []);

useEffect(() => {
  let cancelled = false;

  const startCamera = async () => {
    try {
      // Give the previous camera stream time to fully release
      await new Promise((resolve) => setTimeout(resolve, 500));

      if (cancelled) {
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({

  video: {
    width: { ideal: 1280 },
    height: { ideal: 720 },
  },
  audio: false,
});

if (cancelled) {
  stream.getTracks().forEach((track) => track.stop());
  return;
}

streamRef.current = stream;

if (videoRef.current) {
  videoRef.current.srcObject = stream;

  try {
    await videoRef.current.play();
  } catch (error) {
    console.error("Could not start video playback:", error);
  }
}


    } catch (error) {
      console.error("Camera access failed:", error);
    }
  };

  const sendFrame = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas || video.readyState < 2) {
      return;
    }

    const width = video.videoWidth;
    const height = video.videoHeight;

    if (!width || !height) {
      return;
    }

    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");

    if (!context) {
      return;
    }

    context.drawImage(video, 0, 0, width, height);

    canvas.toBlob(async (blob) => {
      if (!blob) {
        return;
      }

      try {
        const response = await fetch(`${API_URL}/predict`, {
          method: "POST",
          headers: {
            "Content-Type": "image/jpeg",
          },
          body: blob,
        });

       const result: Prediction = await response.json();

console.log("ASL prediction:", result);

const currentThreshold = confidenceRef.current / 100;

console.log(
  "Current threshold:",
  confidenceRef.current + "%",
  "| Prediction:",
  Math.round((result.confidence ?? 0) * 100) + "%"
);

if (
  result.success &&
  result.confidence !== undefined
) {
  const currentThreshold = confidenceRef.current / 100;

  console.log(
    "Current threshold:",
    confidenceRef.current + "%",
    "| Prediction:",
    Math.round(result.confidence * 100) + "%"
  );

  if (result.confidence >= currentThreshold) {
    setPrediction(result);
    setDetectionStatus("accepted");
  } else {
    setPrediction(null);
    setDetectionStatus("rejected");
  }
} else {
  setPrediction(null);
  setDetectionStatus("waiting");
}


      } catch (error) {
        console.error("Prediction request failed:", error);
      }
    }, "image/jpeg", 0.75);
  };

 if (!cameraActive) {
  return;
}

startCamera();

const interval = setInterval(sendFrame, 800);

return () => {
  cancelled = true;

  clearInterval(interval);

  if (videoRef.current) {
    videoRef.current.pause();
    videoRef.current.srcObject = null;
  }

  if (streamRef.current) {
    streamRef.current.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }
};

}, [cameraActive]);

  useEffect(() => {
    localStorage.setItem(
      "asl2voice-theme",
      darkMode ? "dark" : "light"
    );
  }, [darkMode]);

  useEffect(() => {
  if (!voiceEnabled || !prediction?.success || !prediction.label) {
    return;
  }

  if (lastSpokenRef.current === prediction.label) {
    return;
  }

  lastSpokenRef.current = prediction.label;

  const speechText =
    prediction.label === "1"
      ? "one"
      : prediction.label === "2"
      ? "two"
      : prediction.label.toLowerCase();

  setSpeakingText(speechText);

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(speechText);
  utterance.rate = 0.9;
  utterance.pitch = 1;

  window.speechSynthesis.speak(utterance);
}, [prediction, voiceEnabled]);

useEffect(() => {
  if (!prediction?.success || !prediction.label) {
    return;
  }

  if (lastRecentRef.current === prediction.label) {
    return;
  }

  lastRecentRef.current = prediction.label;

  setRecentSigns((previous) => [
    {
      word: prediction.label!,
      time: "just now",
    },
    ...previous,
  ].slice(0, 4));
}, [prediction]);


  const scrollTo = (id: string) => {
    setMenuOpen(false);

    document
      .getElementById(id)
      ?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
  };

  return (
    <main className={darkMode ? "app dark" : "app light"}>

      {/* Background */}
      <div className="background-glow" />

      {/* ================================================== */}
      {/* NAVIGATION */}
      {/* ================================================== */}

      <nav className="navbar">

        <button
          className="brand"
          onClick={() => scrollTo("home")}
          aria-label="Go to home"
        >
          <div className="brand-icon">✋</div>

          <div>
            <div className="brand-name">ASL2VOICE</div>
            <div className="brand-tagline">
              Turning signs into speech.
            </div>
          </div>
        </button>


        <div className="nav-links">

          <button
            className="nav-link active"
            onClick={() => scrollTo("home")}
          >
            Home
          </button>

          <button
            className="nav-link"
            onClick={() => scrollTo("how-it-works")}
          >
            How it works
          </button>

          <button
            className="nav-link"
            onClick={() => scrollTo("about")}
          >
            About
          </button>

        </div>


        <div className="nav-actions">

          {/* Theme toggle */}

          <button
            className="theme-toggle"
            onClick={() => setDarkMode(!darkMode)}
            aria-label={
              darkMode
                ? "Switch to light mode"
                : "Switch to dark mode"
            }
          >
            <span
              className={
                darkMode
                  ? "theme-icon active"
                  : "theme-icon"
              }
            >
              ☾
            </span>

            <span
              className={
                !darkMode
                  ? "theme-icon active"
                  : "theme-icon"
              }
            >
              ☀
            </span>
          </button>


          <button
            className="inclusion-button"
            onClick={() => scrollTo("about")}
          >
            Make inclusion a reality →
          </button>


          <button
            className="mobile-menu-button"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? "×" : "☰"}
          </button>

        </div>


        {/* Mobile menu */}

        {menuOpen && (
          <div className="mobile-menu">

            <button onClick={() => scrollTo("home")}>
              Home
            </button>

            <button onClick={() => scrollTo("how-it-works")}>
              How it works
            </button>

            <button onClick={() => scrollTo("about")}>
              About
            </button>

          </div>
        )}

      </nav>


      {/* ================================================== */}
      {/* HERO / DETECTION */}
      {/* ================================================== */}

      <section
        id="home"
        className="hero-section"
      >

        {/* LEFT */}

        <div className="hero-copy">

          <div className="status-badge">
            <span className="status-dot" />
            Real-time ASL Recognition
          </div>


          <h1>
            Sign language,
            <span> understood.</span>
          </h1>


          <p className="hero-description">
            Turn signs into words with the power of AI.
            Real-time detection, speech output, and a
            more inclusive tomorrow.
          </p>


         <button
  className="start-button"
  onClick={() => {
    setCameraActive((current) => !current);
    scrollTo("recognition");
  }}
>
  <span className="play-icon">
    {cameraActive ? "■" : "▶"}
  </span>
  {cameraActive ? "Stop Detecting" : "Start Detecting"}
  <span>→</span>
</button>


          <p className="hero-note">
            Communication without barriers.
          </p>

        </div>


        {/* CAMERA */}

        <div
          id="recognition"
          className="camera-section"
        >

          <div className="camera-card">

            <div className="camera-screen">
<video
  ref={videoRef}
  autoPlay
  playsInline
  muted
  className="camera-background"
  style={{
    width: "100%",
    height: "100%",
    objectFit: "cover",
  }}
/>

<canvas
  ref={canvasRef}
  style={{ display: "none" }}
/>


              {/* Bounding box */}

             {prediction?.success && prediction.box && prediction.box.length === 4 && (
  <div
    className="hand-box"
    style={{
      top: `${prediction.box[0] * 100}%`,
      left: `${prediction.box[1] * 100}%`,
      height: `${(prediction.box[2] - prediction.box[0]) * 100}%`,
      width: `${(prediction.box[3] - prediction.box[1]) * 100}%`,
    }}
  >
    <div className="detection-label">
      {prediction.label}

      <span>
        {prediction.confidence !== undefined
          ? prediction.confidence.toFixed(2)
          : "0.00"}
      </span>
    </div>
  </div>
)}

              


              {/* Live badge */}

              <div className="live-badge">
                <span />
                LIVE
              </div>


              {/* Camera selector */}

              <div className="camera-selector">
                <span>◉</span>
                {selectedCamera}
                <span>⌄</span>
              </div>


              {/* Camera instruction */}

              <div className="camera-message">
                Keep your hand in the frame
              </div>

            </div>

          </div>

        </div>


        {/* RIGHT */}

        <aside className="result-column">

          {/* Detected sign */}

          <div className="result-card">

            <div className="card-title">
              Detected Sign
            </div>


            <div className="detected-result">

              <div className="hand-symbol">
                ✋
              </div>

              <div>

               <div className="detected-word">
  {prediction?.success ? prediction.label : "—"}
</div>

<div className="confidence-text">
  {prediction?.success && prediction.confidence !== undefined
    ? `${Math.round(prediction.confidence * 100)}% confidence`
    : detectionStatus === "rejected"
    ? "Prediction below threshold"
    : "Waiting for sign..."}
</div>

<div
  className={`detection-status ${detectionStatus}`}
>
  <span className="status-dot" />

  {detectionStatus === "accepted"
    ? `Accepted · threshold ${confidenceRef.current}%`
    : detectionStatus === "rejected"
    ? `Rejected · threshold ${confidenceRef.current}%`
    : "Waiting for sign"}
</div>

              </div>

            </div>


            <div className="speech-status">

              <span className="speaker-icon">
                🔊
              </span>

              <span>
{voiceEnabled
  ? `Speaking "${speakingText}"`
  : "Voice output off"}
              </span>

              <span className="speech-check">
                ✓
              </span>

            </div>

          </div>


          {/* Recent signs */}

          <div className="result-card recent-card">

            <div className="card-title recent-title">
              <span>◷</span>
              Recent Signs
            </div>


            <div className="recent-list">

              {recentSigns.map((sign, index) => (

                <div
                  className="recent-item"
                  key={`${sign.word}-${index}`}
                >

                  <span>{sign.word}</span>

                  <span>{sign.time}</span>

                </div>

              ))}

            </div>

          </div>

        </aside>

      </section>


      {/* ================================================== */}
      {/* CONTROLS */}
      {/* ================================================== */}

      <section className="controls-section">

        {/* Camera */}

        <div className="control">

          <div className="control-icon">
            ◉
          </div>

          <span className="control-label">
            Camera
          </span>

          <div style={{ position: "relative" }}>
  <button
    className="select-control"
    onClick={() => setCameraOpen(!cameraOpen)}
  >
    {selectedCamera}
    <span>{cameraOpen ? "⌃" : "⌄"}</span>
  </button>

  {cameraOpen && (
    <div
  style={{
    position: "absolute",
    bottom: "calc(100% + 8px)",
    left: 0,
    width: "100%",
    background: "var(--card-bg, #111718)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: "12px",
    padding: "6px",
    zIndex: 100,
    boxShadow: "0 12px 30px rgba(0,0,0,0.35)",
  }}
>
      {cameras.length > 0 ? (
        cameras.map((camera, index) => (
          <button
  key={camera.deviceId}
  type="button"
  onClick={async () => {
  try {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    const currentStream = streamRef.current;

if (currentStream) {
  currentStream.getTracks().forEach((track) => track.stop());
  streamRef.current = null;
}

video.pause();
video.srcObject = null;

// Give the browser time to release the previous camera
await new Promise((resolve) => setTimeout(resolve, 2000));

const newStream = await navigator.mediaDevices.getUserMedia({
      video: {
        deviceId: {
          exact: camera.deviceId,
        },
      },
      audio: false,
    });

    streamRef.current = newStream;
    video.srcObject = newStream;
    

    setSelectedCamera(
      camera.label?.includes("Camo")
        ? "Camo"
        : camera.label?.includes("HD User Facing")
        ? "Laptop Camera"
        : camera.label || `Camera ${index + 1}`
    );

    setCameraOpen(false);

    console.log("Camera switched to:", camera.label);
  } catch (error) {
    console.error("Could not switch camera:", error);
  }
}}
  style={{
    width: "100%",
    padding: "10px 12px",
    border: "none",
    background: "transparent",
    color: "inherit",
    textAlign: "left",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  }}
>
  {camera.label?.includes("Camo")
    ? "Camo"
    : camera.label?.includes("HD User Facing")
    ? "Laptop Camera"
    : camera.label || `Camera ${index + 1}`}
</button>
        ))
      ) : (
        <div
          style={{
            padding: "10px 12px",
            color: "#888",
            fontSize: "13px",
          }}
        >
          No cameras found
        </div>
      )}
    </div>
  )}
</div>

        </div>


        {/* Voice */}

        <div className="control">

          <div className="control-icon">
            🔊
          </div>

          <span className="control-label">
            Voice Output
          </span>

          <div className="voice-control">

            <button
              className={
                voiceEnabled
                  ? "switch on"
                  : "switch"
              }
              onClick={() =>
                setVoiceEnabled(!voiceEnabled)
              }
              aria-label="Toggle voice output"
            >
              <span />
            </button>

            <span className="on-label">
              {voiceEnabled ? "ON" : "OFF"}
            </span>

          </div>

        </div>


        {/* Confidence */}

        <div className="control confidence-control">

          <div className="control-icon">
            ◌
          </div>

          <span className="control-label">
            Confidence Threshold
          </span>


          <div className="slider-wrapper">

           <input
  type="range"
  min="30"
  max="90"
  value={confidence}
  onChange={(e) => {
    const value = Number(e.target.value);

    confidenceRef.current = value;
    setConfidence(value);

    console.log("Slider changed to:", value);
  }}
/>

<span>
  {confidence}%
</span>

          </div>

        </div>

      </section>


      {/* ================================================== */}
      {/* HOW IT WORKS */}
      {/* ================================================== */}

      <section
        id="how-it-works"
        className="how-section"
      >

        <div className="section-heading">

          <span>
            SIMPLE BY DESIGN
          </span>

          <h2>
            How ASL2VOICE works
          </h2>

          <p>
            From a simple hand gesture to spoken
            communication in three steps.
          </p>

        </div>


        <div className="steps">

          <article className="step-card">

            <div className="step-number">
              01
            </div>

            <div className="step-icon">
              ✋
            </div>

            <h3>
              Show
            </h3>

            <p>
              Show an ASL sign in front of
              the camera.
            </p>

          </article>


          <article className="step-card">

            <div className="step-number">
              02
            </div>

            <div className="step-icon">
              ◉
            </div>

            <h3>
              Recognize
            </h3>

            <p>
              Our AI detects and identifies
              the sign in real time.
            </p>

          </article>


          <article className="step-card">

            <div className="step-number">
              03
            </div>

            <div className="step-icon">
              🔊
            </div>

            <h3>
              Speak
            </h3>

            <p>
              The recognized sign is converted
              into speech automatically.
            </p>

          </article>

        </div>

      </section>


      {/* ================================================== */}
      {/* ABOUT */}
      {/* ================================================== */}

      <section
  id="about"
  className="about-section"
>

  {/* ABOUT ASL2VOICE */}

  <div className="about-card">

    <div className="about-label">
      ABOUT ASL2VOICE
    </div>

    <h2>
      Built for a more
      <span> inclusive world.</span>
    </h2>

    <p>
      ASL2VOICE is a real-time sign language
      recognition system designed to make
      communication easier. It recognizes
      American Sign Language gestures through
      computer vision and converts them into
      spoken words.
    </p>

    <div className="technology-list">

      <span>Computer Vision</span>
      <span>SSD MobileNet V2</span>
      <span>ASL Recognition</span>
      <span>Text to Speech</span>

    </div>

  </div>


  {/* PROJECT INFORMATION */}

  <div className="project-info-card">

  <div className="about-label">
    PROJECT INFORMATION
  </div>

  <h3>
    Deep Learning Based Hand Gesture
    Recognition for Assistive Communication
  </h3>


  <div className="project-info-layout">

    {/* LEFT — TEAM */}

    <div className="team-column">

      <div className="info-section-title">
        PROJECT TEAM
      </div>

      <div className="team-list">

        <div className="team-member">
          <div className="member-name">
            Arlangki Sungoh
          </div>
          <div className="member-usn">
            4SH23CS023
          </div>
        </div>

        <div className="team-member">
          <div className="member-name">
            Abdul Samad K A
          </div>
          <div className="member-usn">
            4SH23CS009
          </div>
        </div>

        <div className="team-member">
          <div className="member-name">
            Ahmed Nazim Nisham
          </div>
          <div className="member-usn">
            4SH23CS004
          </div>
        </div>

        <div className="team-member">
          <div className="member-name">
            Abdul Rahman Arshad
          </div>
          <div className="member-usn">
            4SH23CS002
          </div>
        </div>

      </div>

    </div>


    {/* RIGHT — INSTITUTION DETAILS */}

    <div className="institution-column">

      <div className="detail-block">

        <div className="info-section-title">
          INSTITUTION
        </div>

        <div className="info-value">
          Shree Devi Institute of Technology
        </div>

        <div className="info-secondary">
          Department of Computer Science and Engineering
        </div>

        <div className="info-secondary">
          Affiliated to Visvesvaraya Technological University
          and approved by AICTE New Delhi
        </div>

        <div className="info-secondary">
          Airport Road, Kenjar, Mangaluru – 574142
        </div>

      </div>


      <div className="detail-block">

        <div className="info-section-title">
          ACADEMIC YEAR
        </div>

        <div className="info-value">
          2026 – 2027
        </div>

      </div>


      <div className="detail-block">

        <div className="info-section-title">
          PROJECT GUIDE
        </div>

        <div className="info-value">
          Prof. Shruti
        </div>

      </div>

    </div>

  </div>

</div>

</section>


      {/* ================================================== */}
      {/* FOOTER */}
      {/* ================================================== */}

      <footer className="footer">

        <div className="footer-brand">

          <div className="brand-icon small">
            ✋
          </div>

          <div>

            <div className="footer-name">
              ASL2VOICE
            </div>

            <div className="footer-tagline">
              Turning signs into speech.
            </div>

          </div>

        </div>


        <div className="footer-text">
          Accessibility&nbsp; | &nbsp;AI&nbsp; | &nbsp;A more inclusive tomorrow
        </div>

      </footer>


      {/* ================================================== */}
      {/* STYLES */}
      {/* ================================================== */}

      <style jsx>{`

        * {
          box-sizing: border-box;
        }


        .app {
          --background: #080c0e;
          --surface: #111719;
          --surface-2: #151b1d;
          --border: rgba(255,255,255,0.09);
          --text: #f3f6f5;
          --muted: #92999a;
          --muted-2: #626a6c;
          --accent: #9be7be;
          --accent-dark: #143c29;

          min-height: 100vh;
          position: relative;
          overflow: hidden;

          background: var(--background);
          color: var(--text);

          transition:
            background-color 350ms ease,
            color 350ms ease;
        }


        .app.light {
          --background: #f4f6f4;
          --surface: #ffffff;
          --surface-2: #f8faf8;
          --border: rgba(20,30,25,0.10);
          --text: #111817;
          --muted: #68706d;
          --muted-2: #8b9390;
          --accent: #4fa86b;
          --accent-dark: #e1f2e7;
        }


        .background-glow {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 0;

          background:
            radial-gradient(
              circle at 48% 12%,
              rgba(104,205,157,0.075),
              transparent 28%
            ),
            radial-gradient(
              circle at 90% 70%,
              rgba(82,123,139,0.055),
              transparent 28%
            );
        }


        .navbar {
          position: relative;
          z-index: 10;

          width: min(1480px, calc(100% - 48px));
          margin: auto;

          min-height: 90px;

          display: flex;
          align-items: center;
          justify-content: space-between;
        }


        .brand {
          display: flex;
          align-items: center;
          gap: 13px;

          border: none;
          background: none;
          color: var(--text);

          cursor: pointer;
          text-align: left;
        }


        .brand-icon {
          width: 44px;
          height: 44px;

          display: flex;
          align-items: center;
          justify-content: center;

          border-radius: 14px;

          border: 1px solid var(--border);
          background: rgba(255,255,255,0.035);

          font-size: 22px;

          transition:
            background 300ms ease,
            border-color 300ms ease;
        }


        .light .brand-icon {
          background: white;
        }


        .brand-name {
          font-size: 18px;
          font-weight: 700;
          letter-spacing: 0.16em;
        }


        .brand-tagline {
          margin-top: 5px;

          font-size: 10px;
          color: var(--muted);

          letter-spacing: 0.03em;
        }


        .nav-links {
          display: flex;
          align-items: center;
          gap: 42px;
        }


        .nav-link {
          position: relative;

          border: none;
          background: none;

          padding: 10px 0;

          color: var(--muted);
          font-size: 14px;

          cursor: pointer;

          transition: color 200ms ease;
        }


        .nav-link:hover {
          color: var(--text);
        }


        .nav-link.active {
          color: var(--text);
        }


        .nav-link.active::after {
          content: "";

          position: absolute;

          left: 0;
          right: 0;
          bottom: 0;

          height: 2px;

          border-radius: 20px;

          background: var(--accent);
        }


        .nav-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }


        .theme-toggle {
          width: 74px;
          height: 40px;

          display: flex;
          align-items: center;
          justify-content: space-around;

          padding: 4px;

          border-radius: 30px;

          border: 1px solid var(--border);
          background: var(--surface);

          cursor: pointer;

          transition:
            background 300ms ease,
            border-color 300ms ease;
        }


        .theme-icon {
          width: 30px;
          height: 30px;

          display: flex;
          align-items: center;
          justify-content: center;

          border-radius: 50%;

          color: var(--muted);

          font-size: 15px;

          transition:
            background 250ms ease,
            color 250ms ease,
            transform 250ms ease;
        }


        .theme-icon.active {
          background: var(--accent);
          color: #102018;

          transform: scale(1.04);
        }


        .inclusion-button {
          padding: 11px 18px;

          border-radius: 30px;

          border: 1px solid var(--border);
          background: var(--surface);

          color: var(--text);

          font-size: 12px;
          font-weight: 600;

          cursor: pointer;

          transition:
            transform 200ms ease,
            border-color 200ms ease;
        }


        .inclusion-button:hover {
          transform: translateY(-2px);
          border-color: var(--accent);
        }


        .mobile-menu-button {
          display: none;

          width: 40px;
          height: 40px;

          border-radius: 50%;

          border: 1px solid var(--border);
          background: var(--surface);

          color: var(--text);

          font-size: 20px;

          cursor: pointer;
        }


        .mobile-menu {
          position: absolute;

          top: 78px;
          left: 0;
          right: 0;

          padding: 10px;

          border: 1px solid var(--border);
          border-radius: 18px;

          background: var(--surface);

          box-shadow: 0 20px 50px rgba(0,0,0,0.2);
        }


        .mobile-menu button {
          display: block;

          width: 100%;

          padding: 13px 15px;

          border: none;
          border-radius: 12px;

          background: none;

          color: var(--text);

          text-align: left;
          cursor: pointer;
        }


        .mobile-menu button:hover {
          background: rgba(127,127,127,0.08);
        }


        /* HERO */

        .hero-section {
          position: relative;
          z-index: 1;

          width: min(1480px, calc(100% - 48px));
          margin: auto;

          display: grid;

          grid-template-columns:
            minmax(250px, 0.78fr)
            minmax(420px, 1.35fr)
            minmax(260px, 0.82fr);

          gap: 22px;

          align-items: center;

          padding: 50px 0 24px;
        }


        .hero-copy {
          max-width: 390px;
        }


        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 9px;

          padding: 9px 14px;

          border: 1px solid var(--border);
          border-radius: 30px;

          background: var(--surface);

          color: var(--muted);

          font-size: 11px;
          letter-spacing: 0.03em;
        }


        .status-dot {
          width: 7px;
          height: 7px;

          border-radius: 50%;

          background: var(--accent);

          box-shadow: 0 0 12px var(--accent);
        }


        h1 {
          margin: 24px 0 0;

          font-size: clamp(48px, 5vw, 78px);
          line-height: 0.98;

          letter-spacing: -0.065em;
          font-weight: 650;
        }


        h1 span {
          color: var(--accent);
        }


        .hero-description {
          max-width: 365px;

          margin: 26px 0 0;

          color: var(--muted);

          font-size: 16px;
          line-height: 1.75;
        }


        .start-button {
          display: inline-flex;
          align-items: center;
          gap: 14px;

          margin-top: 28px;

          padding: 14px 22px;

          border: none;
          border-radius: 40px;

          background: var(--text);
          color: var(--background);

          font-size: 14px;
          font-weight: 700;

          cursor: pointer;

          transition:
            transform 200ms ease,
            background 200ms ease;
        }


        .start-button:hover {
          transform: translateY(-3px);
          background: var(--accent);
        }


        .play-icon {
          width: 26px;
          height: 26px;

          display: flex;
          align-items: center;
          justify-content: center;

          border-radius: 50%;

          background: var(--background);
          color: var(--text);

          font-size: 9px;
        }


        .hero-note {
          margin-top: 14px;

          color: var(--muted-2);

          font-size: 11px;
        }


        /* CAMERA */

        .camera-card {
          padding: 10px;

          border-radius: 23px;

          border: 1px solid var(--border);

          background: var(--surface);

          box-shadow: 0 25px 70px rgba(0,0,0,0.22);
        }


        .camera-screen {
          position: relative;

          aspect-ratio: 1.4 / 1;

          overflow: hidden;

          border-radius: 16px;

          background: #29353a;
        }


        .camera-background {
          position: absolute;
          inset: 0;

          background:
            radial-gradient(
              ellipse at 65% 35%,
              rgba(190,211,213,0.42),
              transparent 21%
            ),
            linear-gradient(
              125deg,
              #43545a 0%,
              #202b30 42%,
              #3d4c53 70%,
              #172124 100%
            );
        }


        .person-head {
          position: absolute;

          width: 27%;
          height: 46%;

          right: 15%;
          top: 11%;

          border-radius: 50%;

          background: rgba(180,194,191,0.82);

          box-shadow:
            inset -18px -8px 25px rgba(30,40,42,0.28);
        }


        .person-body {
          position: absolute;

          width: 62%;
          height: 54%;

          right: 4%;
          bottom: -8%;

          border-radius: 45% 45% 0 0;

          background: #172124;
        }


        .hand-box {
          position: absolute;

          width: 27%;
          height: 40%;

          left: 17%;
          top: 25%;

          border: 2px solid var(--accent);

          border-radius: 45%;

          transform: rotate(-8deg);

          box-shadow:
            0 0 22px rgba(91,203,145,0.14);
        }


        .detection-label {
          position: absolute;

          left: -1px;
          top: -28px;

          padding: 5px 8px;

          border-radius: 4px;

          background: var(--accent);
          color: #102018;

          font-size: 10px;
          font-weight: 700;
        }


        .detection-label span {
          font-weight: 400;
        }


        .live-badge {
          position: absolute;

          top: 12px;
          left: 12px;

          display: flex;
          align-items: center;
          gap: 7px;

          padding: 8px 11px;

          border-radius: 20px;

          background: rgba(0,0,0,0.32);

          color: white;

          font-size: 10px;
          font-weight: 700;

          backdrop-filter: blur(10px);
        }


        .live-badge span {
          width: 7px;
          height: 7px;

          border-radius: 50%;

          background: #ff5151;

          box-shadow: 0 0 10px #ff5151;

          animation: pulse 1.5s infinite;
        }


        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }

          50% {
            opacity: 0.35;
          }
        }


        .camera-selector {
          position: absolute;

          top: 12px;
          right: 12px;

          display: flex;
          align-items: center;
          gap: 8px;

          padding: 9px 11px;

          border-radius: 8px;

          background: rgba(0,0,0,0.32);

          color: white;

          font-size: 10px;

          backdrop-filter: blur(10px);
        }


        .camera-message {
          position: absolute;

          bottom: 12px;
          left: 12px;
          right: 12px;

          padding: 9px;

          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 20px;

          background: rgba(0,0,0,0.3);

          color: rgba(255,255,255,0.85);

          font-size: 10px;
          text-align: center;

          backdrop-filter: blur(10px);
        }


        /* RESULTS */

        .result-column {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }


        .result-card {
          padding: 20px;

          border: 1px solid var(--border);
          border-radius: 18px;

          background: var(--surface);
        }


        .card-title {
          font-size: 16px;
          font-weight: 650;
        }


        .detected-result {
          display: flex;
          align-items: center;
          gap: 17px;

          margin-top: 30px;
        }


        .hand-symbol {
          font-size: 39px;
          filter: grayscale(0.4);
        }


        .detected-word {
          color: var(--accent);

          font-size: 43px;
          line-height: 1;

          font-weight: 600;

          letter-spacing: -0.055em;
        }


        .confidence-text {
          margin-top: 7px;

          color: var(--muted);

          font-size: 12px;
        }

        .detection-status {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-top: 12px;
  font-size: 11px;
  font-weight: 500;
}

.detection-status.accepted {
  color: #7ee2ae;
}

.detection-status.rejected {
  color: #ff6b6b;
}

.detection-status.waiting {
  color: var(--muted);
}

.status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: currentColor;
  flex-shrink: 0;
}


        .speech-status {
          display: flex;
          align-items: center;
          gap: 9px;

          margin-top: 24px;

          padding: 11px;

          border: 1px solid rgba(110,210,157,0.3);
          border-radius: 13px;

          background: rgba(99,213,150,0.07);

          color: var(--accent);

          font-size: 11px;
        }


        .speech-check {
          margin-left: auto;

          width: 23px;
          height: 23px;

          display: flex;
          align-items: center;
          justify-content: center;

          border-radius: 50%;

          background: var(--accent);
          color: #163b29;
        }


        .recent-title {
          display: flex;
          align-items: center;
          gap: 8px;
        }


        .recent-list {
          margin-top: 8px;
        }


        .recent-item {
          display: flex;
          justify-content: space-between;

          padding: 10px 0;

          border-bottom: 1px solid var(--border);

          font-size: 12px;
        }


        .recent-item:last-child {
          border-bottom: none;
        }


        .recent-item span:last-child {
          color: var(--muted-2);
          font-size: 10px;
        }


        /* CONTROLS */

        .controls-section {
          position: relative;
          z-index: 1;

          width: min(1480px, calc(100% - 48px));
          margin: 0 auto;

          display: grid;
          grid-template-columns: 1fr 1fr 1.3fr;

          border: 1px solid var(--border);
          border-radius: 18px;

          background: var(--surface);

          overflow: visible;
        }


        .control {
          min-height: 78px;

          display: flex;
          align-items: center;
          gap: 12px;

          padding: 13px 18px;

          border-right: 1px solid var(--border);
        }


        .control:last-child {
          border-right: none;
        }


        .control-icon {
          width: 40px;
          height: 40px;

          display: flex;
          align-items: center;
          justify-content: center;

          border-radius: 50%;

          background: rgba(127,127,127,0.08);

          font-size: 17px;
        }


        .control-label {
          font-size: 12px;
          font-weight: 600;

          white-space: nowrap;
        }


        .select-control {
          margin-left: 200px;

          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;

          padding: 10px 12px;

          border: 1px solid var(--border);
          border-radius: 10px;

          background: transparent;

          color: var(--text);

          font-size: 10px;

          cursor: pointer;
        }


        .voice-control {
          margin-left: auto;

          display: flex;
          align-items: center;
          gap: 9px;
        }


        .switch {
          width: 48px;
          height: 27px;

          padding: 3px;

          border: none;
          border-radius: 30px;

          background: #555e5f;

          cursor: pointer;

          transition: background 200ms ease;
        }


        .switch span {
          display: block;

          width: 21px;
          height: 21px;

          border-radius: 50%;

          background: white;

          transition: transform 200ms ease;
        }


        .switch.on {
          background: var(--accent);
        }


        .switch.on span {
          transform: translateX(21px);
        }


        .on-label {
          color: var(--muted);

          font-size: 10px;
        }


       .slider-wrapper {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 10px;
  position: relative;
  z-index: 20;
}

.slider-wrapper input {
  width: 120px;
  accent-color: var(--accent);
  cursor: pointer;
  position: relative;
  z-index: 21;
  pointer-events: auto;
}


        .slider-wrapper span {
          min-width: 32px;

          color: var(--muted);

          font-size: 11px;
        }


        /* HOW IT WORKS */

        .how-section {
          position: relative;
          z-index: 1;

          width: min(1480px, calc(100% - 48px));
          margin: auto;

          padding: 90px 0 30px;
        }


        .section-heading {
          max-width: 600px;

          margin-bottom: 25px;
        }


        .section-heading > span {
          color: var(--accent);

          font-size: 10px;
          font-weight: 700;

          letter-spacing: 0.14em;
        }


        .section-heading h2 {
          margin: 10px 0;

          font-size: clamp(30px, 4vw, 48px);

          letter-spacing: -0.05em;
        }


        .section-heading p {
          color: var(--muted);

          font-size: 14px;
          line-height: 1.7;
        }


        .steps {
          display: grid;

          grid-template-columns: repeat(3, 1fr);

          gap: 14px;
        }


        .step-card {
          position: relative;

          min-height: 190px;

          padding: 20px;

          border: 1px solid var(--border);
          border-radius: 18px;

          background: var(--surface);
        }


        .step-number {
          width: 38px;
          height: 38px;

          display: flex;
          align-items: center;
          justify-content: center;

          border-radius: 50%;

          background: rgba(127,127,127,0.08);

          color: var(--muted);

          font-family: monospace;
          font-size: 11px;
        }


        .step-icon {
          position: absolute;

          top: 20px;
          right: 20px;

          font-size: 30px;
        }


        .step-card h3 {
          margin: 25px 0 7px;

          font-size: 20px;
        }


        .step-card p {
          max-width: 250px;

          color: var(--muted);

          font-size: 12px;
          line-height: 1.7;
        }


        /* ABOUT */

        .about-section {
          position: relative;
          z-index: 1;

          width: min(1480px, calc(100% - 48px));
          margin: auto;

          padding: 30px 0 70px;
        }


        .about-card {
          padding: 35px;

          border: 1px solid var(--border);
          border-radius: 22px;

          background: var(--surface);
        }

                .project-info-card {
          margin-top: 24px;

          padding: 34px;

          border-radius: 23px;

          border: 1px solid var(--border);

          background: var(--surface);

          box-shadow: 0 25px 70px rgba(0,0,0,0.16);
        }


        .project-info-card h3 {
          margin: 18px 0 32px;

          max-width: 900px;

          font-size: 30px;

          line-height: 1.2;

          font-weight: 500;

          letter-spacing: -0.02em;

          color: var(--text);
        }


        .project-info-section {
          padding-bottom: 28px;

          border-bottom: 1px solid var(--border);
        }


        .info-section-title {
          margin-bottom: 10px;

          font-size: 11px;

          font-weight: 600;

          letter-spacing: 0.12em;

          color: var(--accent);

          text-transform: uppercase;
        }

        .project-info-layout {
  display: grid;

  grid-template-columns: 1fr 1fr;

  gap: 40px;

  margin-top: 28px;
}


.team-column {
  min-width: 0;
}


.institution-column {
  min-width: 0;

  display: flex;

  flex-direction: column;

  gap: 28px;

  padding-left: 40px;

  border-left: 1px solid var(--border);
}


.team-list {
  display: flex;

  flex-direction: column;

  gap: 12px;
}


.detail-block {
  min-width: 0;
}

        .team-member {
          padding: 18px 20px;

          border: 1px solid var(--border);

          border-radius: 14px;

          background: var(--background);
        }


        .member-name {
          font-size: 16px;

          font-weight: 500;

          color: var(--text);
        }


        .member-usn {
          margin-top: 6px;

          font-size: 13px;

          color: var(--muted);
        }


        .info-value {
          font-size: 17px;

          font-weight: 500;

          color: var(--text);
        }


        .info-secondary {
          max-width: 850px;

          margin-top: 7px;

          font-size: 13px;

          line-height: 1.6;

          color: var(--muted);
        }


        .about-label {
          color: var(--accent);

          font-size: 10px;
          font-weight: 700;

          letter-spacing: 0.15em;
        }


        .about-card h2 {
          max-width: 700px;

          margin: 14px 0;

          font-size: clamp(32px, 4vw, 52px);

          letter-spacing: -0.055em;
        }


        .about-card h2 span {
          color: var(--accent);
        }


        .about-card p {
          max-width: 700px;

          color: var(--muted);

          font-size: 14px;
          line-height: 1.8;
        }


        .technology-list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;

          margin-top: 24px;
        }


        .technology-list span {
          padding: 8px 12px;

          border: 1px solid var(--border);
          border-radius: 20px;

          color: var(--muted);

          font-size: 10px;
        }


        /* FOOTER */

        .footer {
          position: relative;
          z-index: 1;

          width: min(1480px, calc(100% - 48px));
          margin: auto;

          display: flex;
          align-items: center;
          justify-content: space-between;

          padding: 22px 0;

          border-top: 1px solid var(--border);
        }


        .footer-brand {
          display: flex;
          align-items: center;
          gap: 10px;
        }


        .brand-icon.small {
          width: 34px;
          height: 34px;

          border-radius: 10px;

          font-size: 16px;
        }


        .footer-name {
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.13em;
        }


        .footer-tagline {
          margin-top: 3px;

          color: var(--muted-2);

          font-size: 9px;
        }


        .footer-text {
          color: var(--muted-2);

          font-size: 10px;
        }


        /* RESPONSIVE */

        @media (max-width: 1100px) {

          .hero-section {
            grid-template-columns:
              0.8fr
              1.2fr;
          }


          @media (max-width: 900px) {
  .select-control {
    margin-left: auto;
  }
}

          .result-column {
            grid-column: 1 / -1;

            display: grid;
            grid-template-columns: 1fr 1fr;
          }


          .controls-section {
            grid-template-columns: 1fr;
          }


          .control {
            border-right: none;
            border-bottom: 1px solid var(--border);
          }


          .control:last-child {
            border-bottom: none;
          }

        }

                .team-grid {
          grid-template-columns: 1fr;
        }

        .project-info-row {
          flex-direction: column;

          gap: 24px;
        }

        .academic-year {
          min-width: 0;
        }


        @media (max-width: 800px) {

          .navbar,
          .hero-section,
          .controls-section,
          .how-section,
          .about-section,
          .footer {
            width: min(100% - 28px, 650px);
          }


          .nav-links,
          .inclusion-button {
            display: none;
          }


          .mobile-menu-button {
            display: block;
          }


          .hero-section {
            grid-template-columns: 1fr;

            padding-top: 30px;
          }


          .hero-copy {
            max-width: none;
          }


          .hero-description {
            max-width: 600px;
          }


          .result-column {
            grid-template-columns: 1fr;
          }


          .steps {
            grid-template-columns: 1fr;
          }


          .footer {
            flex-direction: column;
            align-items: flex-start;
            gap: 15px;
          }

        }


        @media (max-width: 500px) {

          .brand-tagline {
            display: none;
          }


          .brand-name {
            font-size: 15px;
          }


          .theme-toggle {
            width: 65px;
          }


          h1 {
            font-size: 48px;
          }


          .camera-selector {
            font-size: 9px;
          }


          .control {
            flex-wrap: wrap;
          }


          .confidence-control {
            align-items: flex-start;
          }


          .slider-wrapper {
            width: 100%;
            margin-left: 52px;
          }


          .slider-wrapper input {
            flex: 1;
            width: auto;
          }


          .about-card {
            padding: 25px;
          }

        }

      `}</style>

    </main>
  );
}