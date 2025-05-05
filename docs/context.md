Forste AI - Beyaz Tema Uygulama Geliştirme Planı 💟

✨ 1. Giriş Animasyonu & Karşılama

Uygulama ilk açıldığında metin animasyonu görünür.

Metin örnekleri:

"Nefes al."

"Sakinleş."

"Her şey hızlı gidiyor olabilir... ama burada yavaşlayabilirsin."

Bu animasyon modal pencerelerde ve sayfa geçişlerinde de tekrar eder.

Anlatım süssüz, sade, beyaz temaya uygun fade-in/fade-out veya slide up/down tarzında olur.

📅 2. Kıllanıcı Kayıt / Giriş Ekranı

"Kaydol" ekranında aşağıdaki alanlar yer alır:

Ad

Doğum tarihi (date picker)

E-posta

Şifre

Alt kısımda: "Hesabın var mı? Giriş yap" linki bulunur.

Giriş ekranında da aynı alanlar şık ve sade şekilde yer alır.

Geçiş animasyonları soft slide ve blur arka plan kullanır.

💰 3. Bilgi Toplama Aşaması (KAYIT SONRASI)

Uygun animasyonlarla adım adım bilgi alma ekranları:

Boy / Kilo bilgisi

Hareketlilik durumu / aktivite seviyesi

İlgi alanları (etiketler)

Her kutu fade-in animasyonla açılır, seçim yapıldıktan sonra kapanır.

Son ekranda: "Bilgileriniz kaydediliyor..." animasyonu görünür ve Supabase'e veri gönderilir.

🌎 4. Ana Sayfa Tasarımı (Safe Area Uyumlu)

Sol üst köşede karşılama mesajı ve kullanıcı adı ("Hoşgeldin, Ayşe")

Altında: "Planların" başlığı ve iki yandan çizgi

Yatay 4 kutucuk:

Sol ikon, ortada başlık, sağda "+" butonu

Kutular: Su Hatırlatıcısı, Notlar, Günlük, Proje

Her kutunun stroke rengi farklı, ikon ve başlık aynı renkte

Safe area uyumlu padding / spacing kuralları uygulanır.

🌐 5. Navigation Bar (Her Sayfada Sabit)

Alt menü sırası:

Ana Sayfa

Takvim

AI Chat (beyin ikonu)

Focus

Profil

Her sayfa bu navigasyona sahip olur ve aktif olan ikon renkle belirtilir.

🗓️ 6. Takvim Sayfası

Yatay scroll edilebilir takvim (haftalık görünüm)

Altında o güne ait:

Etkinlikler listesi

Yapılacaklar listesi

"+" butonuna basılınca 2 buton çıkar:

"Yapılacak Ekle"

"Etkinlik Ekle"

Tüm veriler Supabase + local storage'a kaydedilir

Bildirim sistemi zamanına göre tetiklenir (Push notification / Local notif.)

⌚️ 7. Focus (Odaklanma) Sayfası

Kullanıcı 6 ses kategorisinden birini seçer

Odaklanma süre sini seçer (25dk, 45dk, özel vs)

"Odaklan" butonuna basılır:

Sayaç + Müzik başlar

Sayaç durunca müzik de durur

Sayaç devam ederse müzik de devam eder

👤 8. Profil Sayfası

Kullanıcının adı ve profil fotoğrafları

Ayarlar, Kültür, Tema gibi sekmeler

AI tarafından tanınma oranı gösterimi

🧠 9. AI Chat Ekranı

Kullanıcı ile sohbet alanı

Altta 2 kutu:

Rüya Yorumu ekranına gönderir

Görsel Üretme ekranına gönderir

Chat ekranı sade, modern, beyaz temaya uygun olmalı

🎨 10. Tasarım ve UI Kuralları

Beyaz arka plan

Yuvarlatılmış kartlar ve kutular

Stroke ve ikon renkleri dengeli kullanılmalı

Tüm ekranlar safe area uyumlu

Auto layout desteği olmalı (responsive padding / spacing)

Animasyonlar: Fade, slide, pop-up animasyonlar heryerde uygulanmalı

1. Frontend:
Expo Go + React Native (iOS öncelikli)
✔️ Hızlı prototipleme ve native görünüm için ideal
✔️ expo-notifications, expo-calendar, expo-secure-store gibi paketlerle takvim, bildirim ve local veri işlevleri rahatça entegre edilebilir
✔️ Beyaz temaya uygun UI için Tailwind + NativeWind veya shadcn/ui tarzı bileşen kütüphaneleri kullanılabilir

2. Backend:
Supabase
✔️ Auth (kayıt, login, token doğrulama)
✔️ Realtime database + row-level security
✔️ Storage (fotoğraflar, avatarlar vs.)
✔️ API üzerinden veriye erişim çok kolay

3. AI Entegrasyonu:
OpenAI API (GPT-4o / Vision)
✔️ Chat, görsel üretim, öneri sistemi, planlama için ideal
✔️ Vision API ile yemek fotoğraflarını analiz etme, rüya yorumu vs.

