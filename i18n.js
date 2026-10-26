/*
   CLARITY, interface translation (i18n)

   Translates the app's own buttons, labels and
   navigation. The worksheet a student scans stays
   in its own language (that's the material); this
   is about making the *app* usable for a family
   who doesn't read English.

   Elements opt in with data-i18n="key". Dynamic
   strings (greetings, toasts) go through t().
*/
window.Clarity = window.Clarity || {};

Clarity.i18n = (function () {

  /* languages offered in the switcher, most-common US ELL languages first */
  const LANGS = [
    { code:'en', name:'English',    flag:'🇺🇸' },
    { code:'es', name:'Español',    flag:'🇪🇸' },
    { code:'zh', name:'中文',        flag:'🇨🇳' },
    { code:'vi', name:'Tiếng Việt', flag:'🇻🇳' },
    { code:'ar', name:'العربية',    flag:'🇸🇦' },
    { code:'tl', name:'Tagalog',    flag:'🇵🇭' },
    { code:'fr', name:'Français',   flag:'🇫🇷' },
    { code:'pt', name:'Português',  flag:'🇧🇷' },
    { code:'ko', name:'한국어',      flag:'🇰🇷' },
    { code:'hi', name:'हिन्दी',      flag:'🇮🇳' },
    { code:'ru', name:'Русский',    flag:'🇷🇺' },
    { code:'bn', name:'বাংলা',       flag:'🇧🇩' }
  ];

  const RTL = new Set(['ar']);

  /* strings, grouped by language. Missing keys fall back to English. */
  const S = {
    en: {
      'nav.home':'Home', 'nav.library':'Library', 'nav.profiles':'Profiles', 'nav.support':'Support', 'nav.settings':'Settings',
      'home.q':'What are we reading today?', 'home.scan':'Scan a page', 'home.scanSub':'Take a photo, get clear steps',
      'home.type':'Type or paste', 'home.sample':'Try a sample', 'home.recent':'Recent', 'home.seeAll':'See all',
      'greet.morning':'Good morning', 'greet.afternoon':'Good afternoon', 'greet.evening':'Good evening',
      'reader.steps':'Steps', 'reader.paragraph':'Paragraph', 'reader.original':'Original',
      'reader.explain':'Explain differently', 'reader.hardWords':'Hard words in this page',
      'reader.hint':'Tap any word to hear it. Press play to read the whole page.',
      'capture.title':'Add a page', 'capture.photo':'Take a photo', 'capture.choose':'Choose photo',
      'lib.sub':"Every page you've made clear.", 'lang.title':'Language',
      'lang.sub':'Translate the app into your language.',
      'home.tagline':'Take a photo of any worksheet and Clarity turns it into clear, numbered steps you can actually follow. It reads them out loud too.',
      'how.title':'How it works',
      'how.1t':'Snap or paste a page', 'how.1s':'A worksheet, a book page, any wall of text.',
      'how.2t':'Read it your way', 'how.2s':'Clear steps, read out loud, tricky words made easy.',
      'how.3t':'A profile for each reader', 'how.3s':'Dyslexia, focus, your own reading level. It remembers.'
    },
    es: {
      'nav.home':'Inicio', 'nav.library':'Biblioteca', 'nav.profiles':'Perfiles', 'nav.support':'Apoyo', 'nav.settings':'Ajustes',
      'home.q':'¿Qué leemos hoy?', 'home.scan':'Escanear una página', 'home.scanSub':'Toma una foto y obtén pasos claros',
      'home.type':'Escribir o pegar', 'home.sample':'Probar un ejemplo', 'home.recent':'Recientes', 'home.seeAll':'Ver todo',
      'greet.morning':'Buenos días', 'greet.afternoon':'Buenas tardes', 'greet.evening':'Buenas noches',
      'reader.steps':'Pasos', 'reader.paragraph':'Párrafo', 'reader.original':'Original',
      'reader.explain':'Explicar de otra forma', 'reader.hardWords':'Palabras difíciles de esta página',
      'reader.hint':'Toca una palabra para oírla. Pulsa play para leer toda la página.',
      'capture.title':'Añadir una página', 'capture.photo':'Tomar una foto', 'capture.choose':'Elegir una foto',
      'lib.sub':'Cada página que has aclarado.', 'lang.title':'Idioma',
      'lang.sub':'Traduce la aplicación a tu idioma.',
      'home.tagline':'Apunta la cámara a cualquier hoja de trabajo. Clarity la convierte en pasos claros y numerados que puedes leer, escuchar y entender.',
      'how.title':'Cómo funciona',
      'how.1t':'Escanea o pega una página', 'how.1s':'Una hoja, una página de libro, cualquier texto denso.',
      'how.2t':'Léela a tu manera', 'how.2s':'Pasos numerados claros, en voz alta, palabras difíciles explicadas.',
      'how.3t':'Configura un perfil una vez', 'how.3s':'Dislexia, aprendiz de inglés o enfoque. Lo recuerda por ti.'
    },
    zh: {
      'nav.home':'主页', 'nav.library':'图书库', 'nav.profiles':'档案', 'nav.settings':'设置',
      'home.q':'今天读什么？', 'home.scan':'扫描页面', 'home.scanSub':'拍照 → 清晰步骤',
      'home.type':'输入或粘贴', 'home.sample':'试用示例', 'home.recent':'最近', 'home.seeAll':'查看全部',
      'greet.morning':'早上好', 'greet.afternoon':'下午好', 'greet.evening':'晚上好',
      'reader.steps':'步骤', 'reader.paragraph':'段落', 'reader.original':'原文',
      'reader.explain':'换种方式解释', 'reader.hardWords':'本页的难词',
      'reader.hint':'点按单词即可朗读。按播放键朗读整页。',
      'capture.title':'添加页面', 'capture.photo':'拍照', 'capture.choose':'选择照片',
      'lib.sub':'你整理清楚的每一页。', 'lang.title':'语言',
      'lang.sub':'将应用翻译成你的语言。'
    },
    vi: {
      'nav.home':'Trang chủ', 'nav.library':'Thư viện', 'nav.profiles':'Hồ sơ', 'nav.settings':'Cài đặt',
      'home.q':'Hôm nay đọc gì?', 'home.scan':'Quét một trang', 'home.scanSub':'Ảnh → các bước rõ ràng',
      'home.type':'Nhập hoặc dán', 'home.sample':'Thử mẫu', 'home.recent':'Gần đây', 'home.seeAll':'Xem tất cả',
      'greet.morning':'Chào buổi sáng', 'greet.afternoon':'Chào buổi chiều', 'greet.evening':'Chào buổi tối',
      'reader.steps':'Các bước', 'reader.paragraph':'Đoạn văn', 'reader.original':'Bản gốc',
      'reader.explain':'Giải thích cách khác', 'reader.hardWords':'Từ khó trong trang này',
      'reader.hint':'Chạm vào từ để nghe. Nhấn phát để đọc cả trang.',
      'capture.title':'Thêm trang', 'capture.photo':'Chụp ảnh', 'capture.choose':'Chọn ảnh',
      'lib.sub':'Mọi trang bạn đã làm rõ.', 'lang.title':'Ngôn ngữ',
      'lang.sub':'Dịch ứng dụng sang ngôn ngữ của bạn.'
    },
    ar: {
      'nav.home':'الرئيسية', 'nav.library':'المكتبة', 'nav.profiles':'الملفات', 'nav.settings':'الإعدادات',
      'home.q':'ماذا نقرأ اليوم؟', 'home.scan':'امسح صفحة', 'home.scanSub':'صورة ← خطوات واضحة',
      'home.type':'اكتب أو الصق', 'home.sample':'جرّب مثالاً', 'home.recent':'الأخيرة', 'home.seeAll':'عرض الكل',
      'greet.morning':'صباح الخير', 'greet.afternoon':'مساء الخير', 'greet.evening':'مساء الخير',
      'reader.steps':'خطوات', 'reader.paragraph':'فقرة', 'reader.original':'الأصل',
      'reader.explain':'اشرح بطريقة أخرى', 'reader.hardWords':'الكلمات الصعبة في الصفحة',
      'reader.hint':'انقر أي كلمة لسماعها. اضغط تشغيل لقراءة الصفحة كاملة.',
      'capture.title':'أضف صفحة', 'capture.photo':'التقط صورة', 'capture.choose':'اختر صورة',
      'lib.sub':'كل صفحة وضّحتها.', 'lang.title':'اللغة',
      'lang.sub':'ترجم التطبيق إلى لغتك.'
    },
    tl: {
      'nav.home':'Tahanan', 'nav.library':'Aklatan', 'nav.profiles':'Mga Profile', 'nav.settings':'Mga Setting',
      'home.q':'Ano ang babasahin natin ngayon?', 'home.scan':'Mag-scan ng pahina', 'home.scanSub':'Larawan → malinaw na hakbang',
      'home.type':'I-type o i-paste', 'home.sample':'Sumubok ng halimbawa', 'home.recent':'Kamakailan', 'home.seeAll':'Tingnan lahat',
      'greet.morning':'Magandang umaga', 'greet.afternoon':'Magandang hapon', 'greet.evening':'Magandang gabi',
      'reader.steps':'Mga Hakbang', 'reader.paragraph':'Talata', 'reader.original':'Orihinal',
      'reader.explain':'Ipaliwanag nang iba', 'reader.hardWords':'Mahihirap na salita sa pahina',
      'reader.hint':'Pindutin ang salita para marinig. Pindutin ang play para basahin lahat.',
      'capture.title':'Magdagdag ng pahina', 'capture.photo':'Kumuha ng larawan', 'capture.choose':'Pumili ng larawan',
      'lib.sub':'Bawat pahinang nilinaw mo.', 'lang.title':'Wika',
      'lang.sub':'Isalin ang app sa iyong wika.'
    },
    fr: {
      'nav.home':'Accueil', 'nav.library':'Bibliothèque', 'nav.profiles':'Profils', 'nav.settings':'Réglages',
      'home.q':"Que lisons-nous aujourd'hui ?", 'home.scan':'Scanner une page', 'home.scanSub':'Photo → étapes claires',
      'home.type':'Saisir ou coller', 'home.sample':'Essayer un exemple', 'home.recent':'Récents', 'home.seeAll':'Tout voir',
      'greet.morning':'Bonjour', 'greet.afternoon':'Bon après-midi', 'greet.evening':'Bonsoir',
      'reader.steps':'Étapes', 'reader.paragraph':'Paragraphe', 'reader.original':'Original',
      'reader.explain':'Expliquer autrement', 'reader.hardWords':'Mots difficiles de cette page',
      'reader.hint':"Touchez un mot pour l'entendre. Appuyez sur lecture pour toute la page.",
      'capture.title':'Ajouter une page', 'capture.photo':'Prendre une photo', 'capture.choose':'Choisir une photo',
      'lib.sub':'Chaque page que vous avez clarifiée.', 'lang.title':'Langue',
      'lang.sub':"Traduisez l'application dans votre langue."
    },
    pt: {
      'nav.home':'Início', 'nav.library':'Biblioteca', 'nav.profiles':'Perfis', 'nav.settings':'Ajustes',
      'home.q':'O que vamos ler hoje?', 'home.scan':'Digitalizar página', 'home.scanSub':'Foto → passos claros',
      'home.type':'Digitar ou colar', 'home.sample':'Testar exemplo', 'home.recent':'Recentes', 'home.seeAll':'Ver tudo',
      'greet.morning':'Bom dia', 'greet.afternoon':'Boa tarde', 'greet.evening':'Boa noite',
      'reader.steps':'Passos', 'reader.paragraph':'Parágrafo', 'reader.original':'Original',
      'reader.explain':'Explicar de outro jeito', 'reader.hardWords':'Palavras difíceis desta página',
      'reader.hint':'Toque numa palavra para ouvi-la. Toque em play para ler a página toda.',
      'capture.title':'Adicionar página', 'capture.photo':'Tirar foto', 'capture.choose':'Escolher foto',
      'lib.sub':'Cada página que você deixou clara.', 'lang.title':'Idioma',
      'lang.sub':'Traduza o aplicativo para o seu idioma.'
    },
    ko: {
      'nav.home':'홈', 'nav.library':'도서관', 'nav.profiles':'프로필', 'nav.settings':'설정',
      'home.q':'오늘 무엇을 읽을까요?', 'home.scan':'페이지 스캔', 'home.scanSub':'사진 → 명확한 단계',
      'home.type':'입력 또는 붙여넣기', 'home.sample':'예시 보기', 'home.recent':'최근', 'home.seeAll':'전체 보기',
      'greet.morning':'좋은 아침이에요', 'greet.afternoon':'좋은 오후예요', 'greet.evening':'좋은 저녁이에요',
      'reader.steps':'단계', 'reader.paragraph':'문단', 'reader.original':'원본',
      'reader.explain':'다르게 설명하기', 'reader.hardWords':'이 페이지의 어려운 단어',
      'reader.hint':'단어를 누르면 들려줘요. 재생을 누르면 전체를 읽어줘요.',
      'capture.title':'페이지 추가', 'capture.photo':'사진 찍기', 'capture.choose':'사진 선택',
      'lib.sub':'당신이 정리한 모든 페이지.', 'lang.title':'언어',
      'lang.sub':'앱을 당신의 언어로 번역합니다.'
    },
    hi: {
      'nav.home':'होम', 'nav.library':'लाइब्रेरी', 'nav.profiles':'प्रोफ़ाइल', 'nav.settings':'सेटिंग्स',
      'home.q':'आज हम क्या पढ़ेंगे?', 'home.scan':'पेज स्कैन करें', 'home.scanSub':'फ़ोटो → स्पष्ट चरण',
      'home.type':'टाइप या पेस्ट करें', 'home.sample':'नमूना आज़माएँ', 'home.recent':'हाल के', 'home.seeAll':'सभी देखें',
      'greet.morning':'सुप्रभात', 'greet.afternoon':'नमस्कार', 'greet.evening':'शुभ संध्या',
      'reader.steps':'चरण', 'reader.paragraph':'अनुच्छेद', 'reader.original':'मूल',
      'reader.explain':'अलग तरीके से समझाएँ', 'reader.hardWords':'इस पेज के कठिन शब्द',
      'reader.hint':'सुनने के लिए किसी शब्द पर टैप करें। पूरा पेज सुनने के लिए प्ले दबाएँ।',
      'capture.title':'पेज जोड़ें', 'capture.photo':'फ़ोटो लें', 'capture.choose':'फ़ोटो चुनें',
      'lib.sub':'आपके द्वारा स्पष्ट किया हर पेज।', 'lang.title':'भाषा',
      'lang.sub':'ऐप को अपनी भाषा में अनुवाद करें।'
    },
    ru: {
      'nav.home':'Главная', 'nav.library':'Библиотека', 'nav.profiles':'Профили', 'nav.settings':'Настройки',
      'home.q':'Что читаем сегодня?', 'home.scan':'Сканировать страницу', 'home.scanSub':'Фото → чёткие шаги',
      'home.type':'Ввести или вставить', 'home.sample':'Пример', 'home.recent':'Недавние', 'home.seeAll':'Всё',
      'greet.morning':'Доброе утро', 'greet.afternoon':'Добрый день', 'greet.evening':'Добрый вечер',
      'reader.steps':'Шаги', 'reader.paragraph':'Абзац', 'reader.original':'Оригинал',
      'reader.explain':'Объяснить иначе', 'reader.hardWords':'Трудные слова на странице',
      'reader.hint':'Нажмите на слово, чтобы услышать его. Нажмите play, чтобы прочитать всю страницу.',
      'capture.title':'Добавить страницу', 'capture.photo':'Сделать фото', 'capture.choose':'Выбрать фото',
      'lib.sub':'Каждая страница, которую вы прояснили.', 'lang.title':'Язык',
      'lang.sub':'Переведите приложение на ваш язык.'
    },
    bn: {
      'nav.home':'হোম', 'nav.library':'লাইব্রেরি', 'nav.profiles':'প্রোফাইল', 'nav.settings':'সেটিংস',
      'home.q':'আজ আমরা কী পড়ব?', 'home.scan':'পেজ স্ক্যান করুন', 'home.scanSub':'ছবি → পরিষ্কার ধাপ',
      'home.type':'টাইপ বা পেস্ট করুন', 'home.sample':'নমুনা দেখুন', 'home.recent':'সাম্প্রতিক', 'home.seeAll':'সব দেখুন',
      'greet.morning':'সুপ্রভাত', 'greet.afternoon':'শুভ অপরাহ্ন', 'greet.evening':'শুভ সন্ধ্যা',
      'reader.steps':'ধাপ', 'reader.paragraph':'অনুচ্ছেদ', 'reader.original':'মূল',
      'reader.explain':'ভিন্নভাবে বোঝান', 'reader.hardWords':'এই পেজের কঠিন শব্দ',
      'reader.hint':'যেকোনো শব্দে ট্যাপ করে শুনুন। পুরো পেজ শুনতে প্লে চাপুন।',
      'capture.title':'পেজ যোগ করুন', 'capture.photo':'ছবি তুলুন', 'capture.choose':'ছবি বেছে নিন',
      'lib.sub':'আপনার পরিষ্কার করা প্রতিটি পেজ।', 'lang.title':'ভাষা',
      'lang.sub':'অ্যাপটি আপনার ভাষায় অনুবাদ করুন।'
    }
  };

  let cur = 'en';

  function t(key) {
    return (S[cur] && S[cur][key]) || S.en[key] || key;
  }

  function has(code) { return !!S[code]; }
  function current() { return cur; }
  function langs() { return LANGS; }
  function meta(code) { return LANGS.find(l => l.code === (code || cur)); }
  function isRTL(code) { return RTL.has(code || cur); }

  function setLang(code) {
    cur = S[code] ? code : 'en';
    return cur;
  }

  /** Translate every element carrying data-i18n / data-i18n-ph within root. */
  function apply(root) {
    const scope = root || document;
    scope.querySelectorAll('[data-i18n]').forEach(el => {
      el.textContent = t(el.getAttribute('data-i18n'));
    });
    scope.querySelectorAll('[data-i18n-ph]').forEach(el => {
      el.setAttribute('placeholder', t(el.getAttribute('data-i18n-ph')));
    });
    scope.querySelectorAll('[data-i18n-aria]').forEach(el => {
      el.setAttribute('aria-label', t(el.getAttribute('data-i18n-aria')));
    });
    // document direction, Arabic and other RTL scripts flow right-to-left
    const app = document.getElementById('app');
    const dir = isRTL() ? 'rtl' : 'ltr';
    document.documentElement.setAttribute('lang', cur);
    document.documentElement.setAttribute('dir', dir);
    if (app) app.setAttribute('dir', dir);
  }

  return { t, has, current, langs, meta, isRTL, setLang, apply };
})();
