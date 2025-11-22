"use client"; 

import { useState, useEffect } from "react";

// Tipleri tanımlayalım
type Service = {
  id: number;
  name: string;
  minPrice: number;
  maxPrice: number;
  durationMinutes: number;
};

type Shop = {
  id: number;
  name: string;
  description?: string | null;
  location?: string | null;
  services: Service[]; // API'mız zaten bu bilgiyi gönderiyordu
};

export default function ShopsPage() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Sayfa yüklendiğinde, /api/shops adresinden TÜM dükkanları çek
  useEffect(() => {
    const fetchShops = async () => {
      try {
        const res = await fetch("/api/shops"); // API dosyamızın doğru yeri burası
        if (!res.ok) {
          throw new Error("Dükkanlar yüklenemedi");
        }
        const data: Shop[] = await res.json();
        setShops(data);
      } catch (error) {
        console.error(error);
        alert("Dükkanlar yüklenirken bir hata oluştu.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchShops();
  }, []); 

  if (isLoading) {
    return <div style={styles.container}><p>Dükkanlar yükleniyor...</p></div>;
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Tüm Sanayi Dükkanları</h1>
      <p style={styles.subtitle}>Randevu almak için bir dükkan seçin.</p>

      {shops.length === 0 ? (
        <p>Gösterilecek dükkan bulunamadı.</p>
      ) : (
        <div style={styles.shopList}>
          {shops.map((shop) => (
            <div key={shop.id} style={styles.shopCard}>
              <h2 style={styles.shopTitle}>{shop.name}</h2>
              <p style={styles.shopDescription}>{shop.description || "Açıklama yok"}</p>
              
              <div style={styles.servicesContainer}>
                <strong>Sunulan Hizmetler:</strong>
                {shop.services.length > 0 ? (
                  <ul style={styles.serviceList}>
                    {shop.services.map(service => (
                      <li key={service.id}>
                        {service.name} ({service.minPrice}₺ - {service.maxPrice}₺)
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p style={{ color: "#888", fontSize: "0.9rem" }}>Henüz hizmet eklenmemiş.</p>
                )}
              </div>

              <p style={styles.shopLocation}>{shop.location || "Konum belirtilmemiş"}</p>
              
              <a href={`/shops/${shop.id}`} style={styles.button}>Dükkanı Görüntüle ve Randevu Al</a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Stiller
const styles = {
  container: { padding: "2rem", fontFamily: "Arial, sans-serif", backgroundColor: "#f9f9f9", minHeight: "100vh" },
  title: { color: "#222", textAlign: "center" as const },
  subtitle: { color: "#555", textAlign: "center" as const, marginTop: "-1rem", marginBottom: "2rem" },
  shopList: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1.5rem", maxWidth: "1200px", margin: "0 auto" },
  shopCard: { backgroundColor: "#fff", padding: "1.5rem", borderRadius: "8px", boxShadow: "0 4px 8px rgba(0,0,0,0.1)", border: "1px solid #eee", display: "flex", flexDirection: "column" as const, justifyContent: "space-between" },
  shopTitle: { marginTop: 0, color: "#007bff" },
  shopDescription: { color: "#444" },
  shopLocation: { color: "#666", fontSize: "0.9rem", fontStyle: "italic", marginTop: "1rem" },
  servicesContainer: { marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid #f0f0f0" },
  serviceList: { listStyleType: "disc", paddingLeft: "1.5rem", margin: "0.5rem 0" },
  button: { 
    display: "inline-block",
    textAlign: "center" as const,
    padding: "0.75rem", 
    border: "none", 
    borderRadius: "4px", 
    backgroundColor: "#28a745", // Yeşil renk
    color: "white", 
    fontSize: "0.9rem", 
    cursor: "pointer", 
    textDecoration: "none",
    marginTop: "1rem" 
  }
};