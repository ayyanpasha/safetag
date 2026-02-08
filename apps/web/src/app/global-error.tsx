"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div
          style={{
            display: "flex",
            minHeight: "100vh",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          <div style={{ textAlign: "center", maxWidth: "400px" }}>
            <div
              style={{
                margin: "0 auto 1.5rem",
                width: "80px",
                height: "80px",
                borderRadius: "50%",
                backgroundColor: "rgba(239, 68, 68, 0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <AlertTriangle style={{ width: "40px", height: "40px", color: "#ef4444" }} />
            </div>

            <h1 style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: "0.5rem" }}>
              Something went wrong!
            </h1>
            <p style={{ color: "#6b7280", marginBottom: "1.5rem" }}>
              We apologize for the inconvenience. Please try again.
            </p>

            <button
              onClick={reset}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.75rem 1.5rem",
                backgroundColor: "#3b82f6",
                color: "white",
                border: "none",
                borderRadius: "0.5rem",
                fontSize: "1rem",
                fontWeight: "500",
                cursor: "pointer",
              }}
            >
              <RefreshCw style={{ width: "16px", height: "16px" }} />
              Try again
            </button>

            {error?.digest && (
              <p style={{ marginTop: "1rem", fontSize: "0.75rem", color: "#9ca3af" }}>
                Error ID: {error.digest}
              </p>
            )}
          </div>
        </div>
      </body>
    </html>
  );
}
