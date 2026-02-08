import { NextPageContext } from "next";

interface ErrorProps {
  statusCode: number;
}

function Error({ statusCode }: ErrorProps) {
  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <h1 style={{ fontSize: "4rem", fontWeight: "bold", margin: 0 }}>
          {statusCode}
        </h1>
        <p style={{ color: "#666", marginTop: "0.5rem" }}>
          {statusCode === 404
            ? "This page could not be found"
            : "An error occurred"}
        </p>
        <a
          href="/"
          style={{
            display: "inline-block",
            marginTop: "1rem",
            padding: "0.5rem 1rem",
            backgroundColor: "#0070f3",
            color: "white",
            textDecoration: "none",
            borderRadius: "0.25rem",
          }}
        >
          Go Home
        </a>
      </div>
    </div>
  );
}

Error.getInitialProps = ({ res, err }: NextPageContext) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode };
};

export default Error;
