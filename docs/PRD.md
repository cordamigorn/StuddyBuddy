# Pomodoro Timer Uygulaması PRD

## Genel Bakış
Bu uygulama, kullanıcıların Pomodoro tekniğini kullanarak odaklanmalarına yardımcı olmak için tasarlanmıştır. Özelleştirilebilir zamanlayıcı, görev yönetimi, performans takibi ve kullanıcı profilleri gibi temel özellikler sunacaktır. Uygulama İngilizce dilinde geliştirilecektir.

### Teknoloji Yığını
- **Dil:** TypeScript
- **Frontend:** React Native, Expo Go
- **Backend:** Supabase

## Özellikler

### 1. Ana Sayfa
- **Pomodoro Zamanlayıcısı:**
  - Varsayılan 25 dakikalık çalışma süresi ve 5 dakikalık mola
  - Başlat, duraklat ve sıfırlama kontrolleri
- **Özelleştirilebilir Zamanlayıcı Ayarları:**
  - Pomodoro süresi ve mola süresi ayarlama seçenekleri

### 2. İstatistik Sayfası
- **Tamamlanan Pomodorolar:** Günlük, haftalık bazında
- **Odaklanma Süresi:** Toplam verimli çalışma süresi
- **Mola Süresi:** Molalarda geçirilen toplam süre
- **Performans Grafiği:** Kullanıcının verimlilik trendini gösteren görsel grafikler
- **İstatistik Sıfırlama:** Verileri sıfırlama seçeneği

### 3. Görevler Sayfası
- **Görev Listesi:** Ekleme, düzenleme ve silme işlevleri
- **Görev Önceliği:** Yüksek, orta veya düşük olarak işaretleme
- **Görev İlerlemesi:** Tamamlanan görevleri işaretleme
- **Görev Süresi:** Her görev için gereken tahmini Pomodoro sayısını belirleme

### 4. Profil Sayfası
- **Kullanıcı Profili:** Ad ve e-posta bilgileri
- **Ayarlar:** Bildirim tercihleri ve uygulama ayarları
- **Çıkış Yap:** Kullanıcı oturumunu sonlandırma

### 5. Kimlik Doğrulama
- **Kayıt/Giriş:** Kullanıcı hesabı oluşturma ve giriş yapma
- **Supabase Entegrasyonu:** Güvenli veri depolama ve senkronizasyon

## Veritabanı Şeması

### Users Tablosu
| Alan | Tip | Açıklama |
|------|-----|----------|
| id | uuid | Benzersiz kullanıcı kimliği (Supabase Auth) |
| email | text | Kullanıcı e-posta adresi |
| created_at | timestamp | Hesap oluşturma tarihi |
| name | text | Kullanıcı adı |
| avatar_url | text | Profil resmi URL'si (opsiyonel) |

### Tasks Tablosu
| Alan | Tip | Açıklama |
|------|-----|----------|
| id | uuid | Benzersiz görev kimliği |
| user_id | uuid | Kullanıcı referansı |
| title | text | Görev başlığı |
| description | text | Görev açıklaması (opsiyonel) |
| priority | integer | Öncelik seviyesi (1: Düşük, 2: Orta, 3: Yüksek) |
| estimated_pomodoros | integer | Tahmini gereken Pomodoro sayısı |
| completed_pomodoros | integer | Tamamlanan Pomodoro sayısı |
| completed | boolean | Tamamlanma durumu |
| created_at | timestamp | Oluşturma tarihi |
| updated_at | timestamp | Son güncelleme tarihi |

### PomodoroSessions Tablosu
| Alan | Tip | Açıklama |
|------|-----|----------|
| id | uuid | Benzersiz oturum kimliği |
| user_id | uuid | Kullanıcı referansı |
| task_id | uuid | İlişkili görev (opsiyonel) |
| start_time | timestamp | Başlangıç zamanı |
| end_time | timestamp | Bitiş zamanı |
| duration | integer | Süre (dakika) |
| type | text | Oturum tipi ('work' veya 'break') |
| completed | boolean | Tamamlandı mı? |

### Settings Tablosu
| Alan | Tip | Açıklama |
|------|-----|----------|
| user_id | uuid | Kullanıcı referansı (Primary Key) |
| work_duration | integer | Çalışma süresi (dk) |
| short_break_duration | integer | Kısa mola süresi (dk) |
| long_break_duration | integer | Uzun mola süresi (dk) |
| long_break_interval | integer | Uzun mola aralığı (Pomodoro sayısı) |
| notifications_enabled | boolean | Bildirimler açık mı? |
| dark_mode | boolean | Karanlık mod tercihi |

## Klasör Yapısı

```
project-root/
├── assets/                  # Statik dosyalar (görseller, fontlar)
├── src/
│   ├── components/          # Yeniden kullanılabilir bileşenler
│   │   ├── common/          # Genel bileşenler (butonlar, inputlar, vb.)
│   │   ├── timer/           # Zamanlayıcı ile ilgili bileşenler
│   │   ├── tasks/           # Görev yönetimi bileşenleri
│   │   └── stats/           # İstatistik bileşenleri
│   ├── screens/             # Uygulama ekranları
│   │   ├── auth/            # Kimlik doğrulama ekranları
│   │   ├── home/            # Ana sayfa ve zamanlayıcı
│   │   ├── tasks/           # Görev yönetimi
│   │   ├── stats/           # İstatistikler
│   │   └── profile/         # Profil ve ayarlar
│   ├── navigation/          # React Navigation yapılandırması
│   ├── services/            # API ve veritabanı işlemleri
│   │   ├── supabase.ts      # Supabase istemci konfigürasyonu
│   │   ├── auth.ts          # Kimlik doğrulama servisleri
│   │   ├── tasks.ts         # Görev servisleri
│   │   └── stats.ts         # İstatistik servisleri
│   ├── hooks/               # Özel React Hooks
│   ├── context/             # Context API ile durum yönetimi
│   ├── utils/               # Yardımcı fonksiyonlar
│   ├── constants/           # Sabitler ve konfigürasyon
│   ├── types/               # TypeScript tip tanımlamaları
│   └── App.tsx              # Ana uygulama bileşeni
├── app.json                 # Expo konfigürasyonu
├── babel.config.js          # Babel konfigürasyonu
├── tsconfig.json            # TypeScript konfigürasyonu
├── package.json             # Bağımlılıklar
└── README.md                # Proje dokümantasyonu
```

## Uygulama Akışı

1. Kullanıcı uygulamayı açar ve Ana Sayfa ile karşılaşır
2. Zamanlayıcıyı kullanarak çalışmaya başlar veya ayarlar
3. Görevler sayfasına giderek yapılacakları ekler ve yönetir
4. Pomodoro oturumlarını tamamlar ve molalar verir
5. İstatistikler sayfasından ilerlemeyi takip eder
6. Profil sayfasından hesap bilgilerini yönetir

## Veri Akışı (Supabase Entegrasyonu)

### Kimlik Doğrulama Akışı
- Kullanıcı kaydı ve girişi Supabase kimlik doğrulama sistemi ile sağlanır
- Kullanıcı verileri güvenli bir şekilde saklanır

### Görev ve İstatistik Yönetimi
- **Görevler:** Ad, öncelik, Pomodoro hedefi gibi bilgilerle veritabanında saklanır
- **İstatistikler:** Tamamlanan Pomodoro sayıları, odaklanma ve mola süreleri kaydedilir

## Sonuç

Bu uygulama, kullanıcıların Pomodoro tekniğini günlük iş rutinlerine entegre etmelerini sağlayacak basit ve etkili bir araç sunacaktır. Özelleştirilebilir zamanlayıcı ayarları, görev yönetimi ve detaylı istatistikler ile kullanıcılar, verimliliklerini izleyebilir ve odaklanmalarını optimize edebilirler. 