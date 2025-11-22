"use client"; 

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation"; 

// Tipleri tanımlayalım
type Availability = {
  id: number;
  date: string;
  startTime: string;
  endTime: string;
};

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
  services: Service[];
  availability: Availability[]; 
};

export default function ShopDetailPage() {
  const params = useParams(); 
  const router = useRouter(); // Yönlendirme için
  const id = params.id; 
  
  const [shop, setShop] = useState<Shop | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Randevu seçimi için state'ler
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedAvailability, setSelectedAvailability] = useState<Availability | null>(null);

  useEffect(() => {
    if (id) {
      const fetchShopDetails = async () => {
        try {
          setIsLoading(true);
          const res = await fetch(`/api/shops/${id}`); 
          if (res.status === 404) throw new Error("Dükkan bulunamadı");
          if (!res.ok) throw new Error("Dükkan bilgileri yüklenemedi");
          const data: Shop = await res.json();
          setShop(data);
        } catch (err: any) {
          setError(err.message);
        } finally {
          setIsLoading(false);
        }
      };
      fetchShopDetails();
    }
  }, [id]); 

  // === YENİ: RANDEVU ALMA FONKSİYONU ===
  const handleBookAppointment = async () => {
    // 1. Gerekli bilgiler seçildi mi?
    if (!selectedService) {
      alert("Lütfen önce bir hizmet seçin.");
      return;
    }
    if (!selectedAvailability) {
      alert("Lütfen bir müsaitlik zamanı seçin.");
      return;
    }

    try {
      // 2. Randevu bitiş saatini hesapla
      // (Müsaitlik başlangıç saatine hizmet süresini ekle)
      const startTime = new Date(selectedAvailability.startTime);
      const endTime = new Date(startTime.getTime() + selectedService.durationMinutes * 60000);

      // 3. Müsaitlik aralığını aşıyor mu?
      const availabilityEndTime = new Date(selectedAvailability.endTime);
      if (endTime > availabilityEndTime) {
        alert("Seçtiğiniz hizmet bu müsaitlik zaman aralığına sığmıyor.");
        return;
      }

      // 4. API'ye göndereceğimiz veriyi hazırla
      const appointmentData = {
        shopId: shop?.id,
        serviceId: selectedService.id,
        date: selectedAvailability.date.split('T')[0], // Sadece YYYY-MM-DD kısmı
        startTime: startTime.toTimeString().split(' ')[0].substring(0, 5), // Sadece HH:MM
        endTime: endTime.toTimeString().split(' ')[0].substring(0, 5),     // Sadece HH:MM
      };

      // 5. Randevu API'sini çağır
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(appointmentData),
      });

      const result = await res.json();

      if (!res.ok) {
        // API'dan gelen hatayı göster (örn: "Giriş yapmalısınız", "Zaman dolu")
        throw new Error(result.error || "Randevu alınamadı");
      }

      alert("Randevunuz başarıyla oluşturuldu!");
      // İsteğe bağlı: Kullanıcıyı "Randevularım" sayfasına yönlendir
      // router.push("/my-appointments"); 

    } catch (err: any) {
      console.error(err);
      alert(`Hata: ${err.message}`);
      // Giriş yapmamışsa (401 Yetkisiz hatası) giriş sayfasına yönlendir
      if (err.message.includes("giriş yapmalısınız")) {
        router.push("/login");
      }
    }
  };
  // ======================================


  if (isLoading) {
    return <div style={styles.container}><p>Dükkan bilgileri yükleniyor...</p></div>;
  }
  if (error) {
    return <div style={styles.container}><p style={{ color: "red" }}>Hata: {error}</p></div>;
  }
  if (!shop) {
    return <div style={styles.container}><p>Dükkan bulunamadı.</p></div>;
  }

  // == Yardımcı Formatlama Fonksiyonları ==
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const formatTime = (timeString: string) => new Date(timeString).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>{shop.name}</h1>
      <p style={styles.subtitle}>{shop.description || "Açıklama yok"}</p>
      
      {/* HİZMETLER BÖLÜMÜ */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>1. Hizmet Seçin</h2>
        {shop.services.length > 0 ? (
          <ul style={styles.serviceList}>
            {shop.services.map(service => (
              <li key={service.id} style={styles.serviceItem}>
                <div style={styles.serviceInfo}>
                  <strong>{service.name}</strong> ({service.durationMinutes} dakika)
                  <br />
                  <span>Fiyat Aralığı: {service.minPrice}₺ - {service.maxPrice}₺</span>
                </div>
                <button 
                  onClick={() => setSelectedService(service)}
                  style={selectedService?.id === service.id ? styles.buttonSelected : styles.button}
                >
                  {selectedService?.id === service.id ? "✓ Seçildi" : "Seç"}
                </button>
              </li>
            ))}
          </ul>
        ) : ( <p>Bu dükkan henüz hizmet eklememiş.</p> )}
      </div>

      {/* MÜSAİTLİK TAKVİMİ BÖLÜMÜ */}
      <div id="availability" style={styles.section}>
        <h2 style={styles.sectionTitle}>2. Müsait Zaman Seçin</h2>
        {shop.availability.length > 0 ? (
          <ul style={styles.serviceList}>
            {shop.availability.map(avail => (
              <li key={avail.id} style={styles.serviceItem}>
                <div style={styles.serviceInfo}>
                  <strong>{formatDate(avail.date)}</strong>
                  <br />
                  <span>Müsait Aralığı: {formatTime(avail.startTime)} - {formatTime(avail.endTime)}</span>
                </div>
                <button 
                  onClick={() => setSelectedAvailability(avail)}
                  style={selectedAvailability?.id === avail.id ? styles.buttonSelected : styles.button}
                >
                  {selectedAvailability?.id === avail.id ? "✓ Seçildi" : "Seç"}
                </button>
              </li>
            ))}
          </ul>
        ) : ( <p>Bu dükkan henüz müsaitlik durumu girmemiş.</p> )}
      </div>

      {/* RANDEVU AL BÖLÜMÜ */}
      <div style={styles.bookSection}>
        <h3>3. Randevuyu Onayla</h3>
        {selectedService && <p>Seçilen Hizmet: <strong>{selectedService.name}</strong></p>}
        {selectedAvailability && <p>Seçilen Zaman: <strong>{formatDate(selectedAvailability.date)} {formatTime(selectedAvailability.startTime)}</strong></p>}
        
        <button 
          onClick={handleBookAppointment} 
          style={styles.bookButton}
          disabled={!selectedService || !selectedAvailability} // İkisi de seçilmeden buton aktif olmaz
        >
          Randevu Al
        </button>
      </div>
    </div>
  );
}

// Stiller
const styles = {
  container: { padding: "2rem", fontFamily: "Arial, sans-serif", maxWidth: "800px", margin: "0 auto", backgroundColor: "#f9f9f9" },
  title: { color: "#222", textAlign: "center" as const, fontSize: "2.5rem" },
  subtitle: { color: "#555", textAlign: "center" as const, fontSize: "1.1rem", marginTop: "-1rem" },
  section: { backgroundColor: "#fff", padding: "1.5rem 2rem", borderRadius: "8px", boxShadow: "0 4px 8px rgba(0,0,0,0.1)", margin: "1rem 0" },
  sectionTitle: { color: "#333", borderBottom: "2px solid #eee", paddingBottom: "0.5rem", marginTop: 0 },
  serviceList: { listStyleType: "none", padding: 0 },
  serviceItem: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem 0", borderBottom: "1px solid #f0f0f0" },
  serviceInfo: { flex: 1 },
  button: { 
    display: "inline-block", textAlign: "center" as const, padding: "0.75rem 1.5rem", 
    border: "1px solid #007bff", borderRadius: "4px", backgroundColor: "#fff", 
    color: "#007bff", fontSize: "0.9rem", cursor: "pointer", textDecoration: "none", marginLeft: "1rem"
  },
  buttonSelected: { // Seçildiğinde
    display: "inline-block", textAlign: "center" as const, padding: "0.75rem 1.5rem", 
    border: "1px solid #28a745", borderRadius: "4px", backgroundColor: "#28a745", 
    color: "white", fontSize: "0.9rem", cursor: "pointer", textDecoration: "none", marginLeft: "1rem"
  },
  bookSection: { 
    backgroundColor: "#fff", padding: "1.5rem 2rem", borderRadius: "8px", 
    boxShadow: "0 4px 8px rgba(0,0,0,0.1)", margin: "2rem 0", textAlign: "center" as const 
  },
  bookButton: {
    padding: "1rem 2rem", border: "none", borderRadius: "4px", backgroundColor: "#28a745", // Yeşil renk
    color: "white", fontSize: "1.2rem", cursor: "pointer", fontWeight: "bold"
  }
};