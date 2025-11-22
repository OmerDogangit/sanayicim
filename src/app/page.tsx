import Image from "next/image"; // Next.js'in resim bileşeni (varsayılan)

export default function HomePage() {
  return (
    <main style={styles.main}>
      <div style={styles.container}>
        <h1 style={styles.title}>
          Sanayicim.com'a Hoş Geldiniz
        </h1>
        <p style={styles.subtitle}>
          Oto sanayi randevu sisteminiz.
        </p>

        <div style={styles.buttonContainer}>
          <a href="/shops" style={styles.buttonPrimary}>
            Dükkanlara Gözat (Müşteri)
          </a>
          <a href="/login" style={styles.buttonSecondary}>
            Dükkan Sahibi Girişi
          </a>
          <a href="/register" style={styles.buttonSecondary}>
            Kayıt Ol
          </a>
        </div>
      </div>
    </main>
  );
}

// Stiller
const styles = {
  main: {
    display: "flex",
    flexDirection: "column" as const,
    justifyContent: "center",
    alignItems: "center",
    padding: "6rem",
    minHeight: "100vh",
    backgroundColor: "#f4f4f4",
    fontFamily: "Arial, sans-serif",
  },
  container: {
    textAlign: "center" as const,
    backgroundColor: "#fff",
    padding: "3rem 4rem",
    borderRadius: "12px",
    boxShadow: "0 8px 16px rgba(0,0,0,0.1)",
  },
  title: {
    fontSize: "2.5rem",
    color: "#222",
    marginBottom: "0.5rem",
  },
  subtitle: {
    fontSize: "1.2rem",
    color: "#555",
  },
  buttonContainer: {
    marginTop: "2.5rem",
    display: "flex",
    flexDirection: "column" as const,
    gap: "1rem",
  },
  buttonPrimary: {
    display: "inline-block",
    padding: "1rem 2rem",
    fontSize: "1.1rem",
    color: "#fff",
    backgroundColor: "#007bff",
    borderRadius: "8px",
    textDecoration: "none",
    fontWeight: "bold",
  },
  buttonSecondary: {
    display: "inline-block",
    padding: "0.75rem 1.5rem",
    fontSize: "1rem",
    color: "#007bff",
    backgroundColor: "#fff",
    border: "2px solid #007bff",
    borderRadius: "8px",
    textDecoration: "none",
  }
};