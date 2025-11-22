"use client"; 

import { useForm, SubmitHandler } from "react-hook-form";
import { useRouter } from "next/navigation";

// Formdaki alanların tipleri
type FormInputs = {
  email: string;
  password: string;
};

export default function LoginPage() {
  const router = useRouter();
  const { register, handleSubmit, formState: { errors } } = useForm<FormInputs>();

  const onSubmit: SubmitHandler<FormInputs> = async (data) => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json(); // API'dan dönen kullanıcı verisi (id, name, role içerir)

      // === DÜZELTME BURADA BAŞLIYOR ===
      if (response.ok) {
        // 'result' artık kullanıcı verilerini içeriyor
        const user = result; 

        if (user.role === 'owner') {
          // Dükkan sahibiyse panele yönlendir
          alert("Giriş başarılı! Dükkan sahibi paneline yönlendiriliyorsunuz.");
          router.push("/dashboard/owner");
        } else {
          // Müşteriyse dükkan listesine yönlendir
          alert("Giriş başarılı! Dükkan listesine yönlendiriliyorsunuz.");
          router.push("/shops");
        }
        
        router.refresh(); // Sayfanın yenilenmesini sağla (yeni cookie'yi alması için)
      // === DÜZELTME BURADA BİTTİ ===

      } else {
        alert(`Giriş başarısız: ${result.error || "Bilinmeyen hata"}`);
      }
    } catch (error) {
      console.error("Giriş sırasında bir hata oluştu:", error);
      alert("Beklenmedik bir hata oluştu. Lütfen tekrar deneyin.");
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Sanayicim'e Giriş Yap</h1>
      <form onSubmit={handleSubmit(onSubmit)} style={styles.form}>
        <div style={styles.inputGroup}>
          <label htmlFor="email" style={styles.label}>Email</label>
          <input
            id="email"
            type="email"
            {...register("email", { required: "Email zorunludur" })}
            style={styles.input}
          />
          {errors.email && <p style={styles.error}>{errors.email.message}</p>}
        </div>

        <div style={styles.inputGroup}>
          <label htmlFor="password" style={styles.label}>Şifre</label>
          <input
            id="password"
            type="password"
            {...register("password", { required: "Şifre zorunludur" })}
            style={styles.input}
          />
          {errors.password && <p style={styles.error}>{errors.password.message}</p>}
        </div>

        <button type="submit" style={styles.button}>
          Giriş Yap
        </button>
      </form>
      <div style={{ marginTop: "1rem" }}>
        <p>Hesabınız yok mu? <a href="/register" style={{ color: "#007bff" }}>Kayıt Olun</a></p>
      </div>
    </div>
  );
}

// Stiller (Aynı)
const styles = {
  container: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    backgroundColor: "#f4f4f4",
    fontFamily: "Arial, sans-serif",
  },
  title: {
    color: "#333",
  },
  form: {
    backgroundColor: "#fff",
    padding: "2rem",
    borderRadius: "8px",
    boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
    width: "100%",
    maxWidth: "400px",
  },
  inputGroup: {
    marginBottom: "1rem",
  },
  label: {
    display: "block",
    marginBottom: "0.5rem",
    color: "#555",
  },
  input: {
    width: "100%",
    padding: "0.75rem",
    border: "1px solid #ddd",
    borderRadius: "4px",
    boxSizing: "border-box" as const,
  },
  error: {
    color: "red",
    fontSize: "0.875rem",
    marginTop: "0.25rem",
  },
  button: {
    width: "100%",
    padding: "0.75rem",
    border: "none",
    borderRadius: "4px",
    backgroundColor: "#007bff",
    color: "white",
    fontSize: "1rem",
    cursor: "pointer",
  },
};