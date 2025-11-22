"use client"; // Bu satır önemlidir! Tarayıcıda çalışacak bir bileşen olduğunu belirtir.

import { useForm, SubmitHandler } from "react-hook-form";
import { useRouter } from "next/navigation"; // Yönlendirme yapmak için

// Formdaki alanların tiplerini belirliyoruz
type FormInputs = {
  name: string;
  email: string;
  password: string;
  role: "customer" | "owner"; // Rolü seçebilmeli
};

export default function RegisterPage() {
  const router = useRouter();
  const { register, handleSubmit, formState: { errors } } = useForm<FormInputs>();

  // Form gönderildiğinde çalışacak fonksiyon
  const onSubmit: SubmitHandler<FormInputs> = async (data) => {
    try {
      // Oluşturduğumuz /api/auth/register endpoint'ine istek gönder
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        // Kayıt başarılıysa
        alert("Kayıt başarılı! Lütfen giriş yapın.");
        router.push("/login"); // Kullanıcıyı giriş sayfasına yönlendir
      } else {
        // API'dan hata dönerse (örn: "Email zaten kullanılıyor")
        alert(`Kayıt başarısız: ${result.error}`);
      }
    } catch (error) {
      console.error("Kayıt sırasında bir hata oluştu:", error);
      alert("Beklenmedik bir hata oluştu. Lütfen tekrar deneyin.");
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Sanayicim'e Kayıt Ol</h1>
      <form onSubmit={handleSubmit(onSubmit)} style={styles.form}>
        <div style={styles.inputGroup}>
          <label htmlFor="name" style={styles.label}>İsim</label>
          <input
            id="name"
            {...register("name", { required: "İsim zorunludur" })}
            style={styles.input}
          />
          {errors.name && <p style={styles.error}>{errors.name.message}</p>}
        </div>

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

        <div style={styles.inputGroup}>
          <label htmlFor="role" style={styles.label}>Kayıt Tipi</label>
          <select id="role" {...register("role")} style={styles.input}>
            <option value="customer">Müşteriyim</option>
            <option value="owner">Dükkan Sahibiyim</option>
          </select>
        </div>

        <button type="submit" style={styles.button}>
          Kayıt Ol
        </button>
      </form>
    </div>
  );
}

// Basit stil tanımlamaları (Tailwind yerine)
// Tailwind'i henüz ayarlamadığımız için geçici olarak inline-style kullanıyoruz.
const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
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
    boxSizing: "border-box", // Önemli
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