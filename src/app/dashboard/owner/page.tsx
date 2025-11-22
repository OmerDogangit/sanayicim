"use client"; 

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

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
  ownerId: number;
  services: Service[];
  availability: Availability[]; // Müsaitlikleri de içerecek şekilde güncelledik
};

type User = {
  id: number;
  name: string;
  email: string;
  role: string;
};

export default function OwnerDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [myShops, setMyShops] = useState<Shop[]>([]); 
  const [isLoading, setIsLoading] = useState(true);
  const [selectedShopId, setSelectedShopId] = useState<number | null>(null); // Ortak seçili dükkan ID'si

  // Form state'leri
  const [shopName, setShopName] = useState("");
  const [shopDesc, setShopDesc] = useState("");
  const [shopLocation, setShopLocation] = useState("");

  const [serviceName, setServiceName] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [duration, setDuration] = useState("");

  // Yeni Müsaitlik Formu state'leri
  const [availDate, setAvailDate] = useState("");
  const [availStartTime, setAvailStartTime] = useState(""); //örn: "09:00"
  const [availEndTime, setAvailEndTime] = useState("");   //örn: "17:00"

  // Sayfa yüklendiğinde kullanıcıyı ve dükkanlarını (müsaitlik dahil) çek
  useEffect(() => {
    const fetchUserAndShops = async () => {
      try {
        const userRes = await fetch("/api/auth/me");
        if (!userRes.ok) throw new Error("Kullanıcı bulunamadı");
        const userData: User = await userRes.json();
        setUser(userData);

        // /api/shops artık 'services' VE 'availability' getiriyor olmalı
        // (Prisma include'ları sayesinde)
        const shopsRes = await fetch("/api/shops"); 
        if (!shopsRes.ok) throw new Error("Dükkanlar çekilemedi");
        const allShopsData: Shop[] = await shopsRes.json();

        const userShops = allShopsData.filter(shop => shop.ownerId === userData.id);
        setMyShops(userShops);

      } catch (error) {
        console.error(error);
        alert("Veri çekilirken hata oluştu. Lütfen tekrar giriş yapın.");
        router.push("/login");
      } finally {
        setIsLoading(false);
      }
    };
    fetchUserAndShops();
  }, [router]);

  // Yeni dükkan oluşturma
  const handleCreateShop = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/shops", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: shopName, description: shopDesc, location: shopLocation }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Dükkan oluşturulamadı");

      const newShop: Shop = await res.json();
      alert("Dükkan başarıyla oluşturuldu!");
      setShopName(""); setShopDesc(""); setShopLocation("");
      setMyShops(prev => [{...newShop, services: [], availability: []}, ...prev]); // Yeni dükkanı listeye ekle
    } catch (error: any) {
      alert(`Hata: ${error.message}`);
    }
  };

  // Yeni hizmet oluşturma
  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShopId) {
      alert("Lütfen önce bir dükkan seçin.");
      return;
    }
    try {
      const res = await fetch("/api/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shopId: selectedShopId, name: serviceName, minPrice, maxPrice, durationMinutes: duration }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Hizmet oluşturulamadı");
      const newService: Service = await res.json();
      alert("Hizmet başarıyla eklendi!");
      setServiceName(""); setMinPrice(""); setMaxPrice(""); setDuration("");
      setMyShops(prev => prev.map(s => s.id === selectedShopId ? { ...s, services: [...s.services, newService] } : s));
    } catch (error: any) {
      alert(`Hata: ${error.message}`);
    }
  };

  // YENİ: Müsaitlik Ekleme Fonksiyonu
  const handleCreateAvailability = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShopId) {
      alert("Lütfen önce bir dükkan seçin.");
      return;
    }
    try {
      const res = await fetch("/api/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopId: selectedShopId,
          date: availDate,
          startTime: availStartTime,
          endTime: availEndTime,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Müsaitlik oluşturulamadı");
      
      const newAvail: Availability = await res.json();
      alert("Müsaitlik başarıyla eklendi!");
      setAvailDate(""); setAvailStartTime(""); setAvailEndTime("");

      // Arayüzü güncelle
      setMyShops(prev => prev.map(s => s.id === selectedShopId ? { ...s, availability: [...s.availability, newAvail] } : s));
    } catch (error: any) {
      alert(`Hata: ${error.message}`);
    }
  };


  if (isLoading) {
    return <div style={styles.container}><p>Yükleniyor...</p></div>;
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Hoş Geldin, {user?.name}!</h1>
      <p style={styles.subtitle}>Dükkan Sahibi Paneli</p>

      {/* DÜKKAN OLUŞTURMA */}
      <div style={styles.formContainer}>
        <h2 style={styles.sectionTitle}>1. Yeni Dükkan Oluştur</h2>
        <form onSubmit={handleCreateShop} style={styles.form}>
          {/* ... Dükkan formu ... */}
          <div style={styles.inputGroup}><label htmlFor="shopName" style={styles.label}>Dükkan Adı *</label><input id="shopName" value={shopName} onChange={(e) => setShopName(e.target.value)} style={styles.input} required /></div>
          <div style={styles.inputGroup}><label htmlFor="shopDesc" style={styles.label}>Açıklama</label><input id="shopDesc" value={shopDesc} onChange={(e) => setShopDesc(e.target.value)} style={styles.input} /></div>
          <div style={styles.inputGroup}><label htmlFor="shopLocation" style={styles.label}>Konum (Adres)</label><input id="shopLocation" value={shopLocation} onChange={(e) => setShopLocation(e.target.value)} style={styles.input} /></div>
          <button type="submit" style={styles.button}>Dükkan Oluştur</button>
        </form>
      </div>

      <hr style={styles.hr} />

      {/* ORTAK DÜKKAN SEÇİMİ */}
      <div style={styles.formContainer}>
        <h2 style={styles.sectionTitle}>2. Hizmet ve Müsaitlik Ekle</h2>
        <div style={styles.inputGroup}>
            <label htmlFor="shopSelect" style={styles.label}>Hangi Dükkan İçin İşlem Yapılacak? *</label>
            <select id="shopSelect" onChange={(e) => setSelectedShopId(Number(e.target.value))} style={styles.input} defaultValue="">
              <option value="" disabled>-- Bir dükkan seçin --</option>
              {myShops.map(shop => (
                <option key={shop.id} value={shop.id}>{shop.name}</option>
              ))}
            </select>
          </div>
      </div>


      {/* HİZMET EKLEME */}
      <div style={styles.formContainer}>
        <h2 style={styles.sectionTitle}>Hizmet Ekle</h2>
        <form onSubmit={handleCreateService} style={styles.form}>
          {/* ... Hizmet formu ... */}
          <div style={styles.inputGroup}><label htmlFor="serviceName" style={styles.label}>Hizmet Adı *</label><input id="serviceName" value={serviceName} onChange={(e) => setServiceName(e.target.value)} style={styles.input} required /></div>
          <div style={styles.inputGroup}><label htmlFor="minPrice" style={styles.label}>Min Fiyat (₺) *</label><input id="minPrice" type="number" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} style={styles.input} required /></div>
          <div style={styles.inputGroup}><label htmlFor="maxPrice" style={styles.label}>Max Fiyat (₺) *</label><input id="maxPrice" type="number" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} style={styles.input} required /></div>
          <div style={styles.inputGroup}><label htmlFor="duration" style={styles.label}>Süre (dakika) *</label><input id="duration" type="number" value={duration} onChange={(e) => setDuration(e.target.value)} style={styles.input} required /></div>
          <button type="submit" style={styles.button} disabled={!selectedShopId}>Hizmet Ekle</button>
        </form>
      </div>

      {/* YENİ: MÜSAİTLİK EKLEME FORMU */}
      <div style={styles.formContainer}>
        <h2 style={styles.sectionTitle}>Müsaitlik Ekle</h2>
        <form onSubmit={handleCreateAvailability} style={styles.form}>
          <div style={styles.inputGroup}>
            <label htmlFor="availDate" style={styles.label}>Tarih *</label>
            <input id="availDate" type="date" value={availDate} onChange={(e) => setAvailDate(e.target.value)} style={styles.input} required />
          </div>
          <div style={styles.inputGroup}>
            <label htmlFor="availStartTime" style={styles.label}>Başlangıç Saati *</label>
            <input id="availStartTime" type="time" value={availStartTime} onChange={(e) => setAvailStartTime(e.target.value)} style={styles.input} required />
          </div>
          
          {/* === DÜZELTME BURADA === */}
          <div style={styles.inputGroup}>
            <label htmlFor="availEndTime" style={styles.label}>Bitiş Saati *</label> 
            <input id="availEndTime" type="time" value={availEndTime} onChange={(e) => setAvailEndTime(e.target.value)} style={styles.input} required />
          </div>
          {/* === DÜZELTME BİTTİ === */}

          <button type="submit" style={styles.button} disabled={!selectedShopId}>Müsaitlik Ekle</button>
        </form>
      </div>


      {/* MEVCUT DÜKKANLAR LİSTESİ */}
      <div style={styles.listContainer}>
        <h2 style={styles.sectionTitle}>Dükkanlarım / Hizmetlerim / Müsaitlik Durumum ({myShops.length})</h2>
        {myShops.length === 0 ? (<p>Henüz dükkan oluşturmamışsınız.</p>) : (
          <ul style={styles.shopList}>
            {myShops.map((shop) => (
              <li key={shop.id} style={styles.shopListItem}>
                <strong>{shop.name}</strong>
                {/* Hizmetleri Listele */}
                <ul style={styles.serviceList}>
                  <strong>Hizmetler:</strong>
                  {shop.services.length > 0 ? (
                    shop.services.map(s => <li key={s.id}>{s.name} ({s.minPrice}₺ - {s.maxPrice}₺)</li>)
                  ) : ( <li>Henüz hizmet eklenmemiş.</li> )}
                </ul>
                {/* Müsaitlikleri Listele */}
                <ul style={styles.serviceList}>
                  <strong>Müsait Günler:</strong>
                  {shop.availability.length > 0 ? (
                    shop.availability.map(a => (
                      <li key={a.id}>
                        {new Date(a.date).toLocaleDateString()}
                        ({new Date(a.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        - 
                        {new Date(a.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})})
                      </li>
                    ))
                  ) : ( <li>Henüz müsaitlik eklenmemiş.</li> )}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// Stiller
const styles = {
  container: { padding: "2rem", fontFamily: "Arial, sans-serif", backgroundColor: "#f9f9f9", minHeight: "100vh" },
  title: { color: "#222", textAlign: "center" as const },
  subtitle: { color: "#555", textAlign: "center" as const, marginTop: "-1rem", marginBottom: "2rem" },
  sectionTitle: { color: "#333", borderBottom: "2px solid #eee", paddingBottom: "0.5rem" },
  formContainer: { backgroundColor: "#fff", padding: "2rem", borderRadius: "8px", boxShadow: "0 4px 8px rgba(0,0,0,0.1)", maxWidth: "600px", margin: "1rem auto" },
  listContainer: { backgroundColor: "#fff", padding: "2rem", borderRadius: "8px", boxShadow: "0 4px 8px rgba(0,0,0,0.1)", maxWidth: "600px", margin: "2rem auto" },
  form: { display: "flex", flexDirection: "column" as const },
  inputGroup: { marginBottom: "1rem" },
  label: { display: "block", marginBottom: "0.5rem", color: "#555", fontWeight: "bold" },
  input: { width: "100%", padding: "0.75rem", border: "1px solid #ddd", borderRadius: "4px", boxSizing: "border-box" as const },
  button: { padding: "0.75rem", border: "none", borderRadius: "4px", backgroundColor: "#007bff", color: "white", fontSize: "1rem", cursor: "pointer", marginTop: "1rem" },
  shopList: { listStyleType: "none", padding: 0 },
  shopListItem: { padding: "1rem", borderBottom: "1px solid #eee" },
  serviceList: { listStyleType: "disc", paddingLeft: "2rem", margin: "0.5rem 0" },
  hr: { border: "none", borderTop: "2px solid #eee", margin: "2rem 0" }
};