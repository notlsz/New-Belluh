// The footers' link columns (the landing page's and the company pages'), the share bar and the hiring line at the
// end of every company page. Labels are kept short in every language so a narrow column wraps them at most once.
import type { UiTable } from '../ui';

const en = {
  index: 'Index', resources: 'Resources',
  newsroom: 'Newsroom', stories: 'Success stories', contact: 'Contact', safetyTips: 'Safety tips', trust: 'Trust & Safety',
  press: 'Press resources', howItWorks: 'How Belluh works', nfaq: 'NFAQ', security: 'Security', cookies: 'Cookie policy',
  healthData: 'Consumer health data', privacyChoices: 'Your privacy choices', accessibility: 'Accessibility',
  home: 'Belluh home', copyright: '© {year} Belluh',
  hiringEyebrow: 'Our job openings', hiringLine: 'Want to build this with us?', hiringCta: 'We’re hiring',
  share: 'Share this page:', shareX: 'Share on X', shareFacebook: 'Share on Facebook', copyLink: 'Copy link', copied: 'Link copied!',
};

const t: UiTable<typeof en> = {
  en,
  ja: {
    index: 'インデックス', resources: 'リソース',
    newsroom: 'ニュース', stories: 'カップルの声', contact: 'お問い合わせ', safetyTips: '安全のために', trust: '信頼と安全',
    press: 'プレス向け情報', howItWorks: 'Belluhのしくみ', nfaq: 'めったにない質問', security: 'セキュリティ', cookies: 'Cookieポリシー',
    healthData: '健康データ', privacyChoices: 'プライバシーの選択', accessibility: 'アクセシビリティ',
    home: 'Belluhホーム', copyright: '© {year} Belluh',
    hiringEyebrow: '採用情報', hiringLine: '一緒につくりませんか？', hiringCta: '仲間を募集中',
    share: 'このページをシェア：', shareX: 'Xでシェア', shareFacebook: 'Facebookでシェア', copyLink: 'リンクをコピー', copied: 'リンクをコピーしました',
  },
  fr: {
    index: 'Index', resources: 'Ressources',
    newsroom: 'Actualités', stories: 'Vos histoires', contact: 'Contact', safetyTips: 'Conseils de sécurité', trust: 'Confiance et sécurité',
    press: 'Espace presse', howItWorks: 'Comment ça marche', nfaq: 'Questions insolites', security: 'Sécurité', cookies: 'Cookies',
    healthData: 'Données de santé', privacyChoices: 'Vos choix de confidentialité', accessibility: 'Accessibilité',
    home: 'Accueil Belluh', copyright: '© {year} Belluh',
    hiringEyebrow: 'Nos offres d’emploi', hiringLine: 'Envie de construire ça avec nous ?', hiringCta: 'On recrute',
    share: 'Partager cette page :', shareX: 'Partager sur X', shareFacebook: 'Partager sur Facebook', copyLink: 'Copier le lien', copied: 'Lien copié !',
  },
  it: {
    index: 'Indice', resources: 'Risorse',
    newsroom: 'Notizie', stories: 'Storie di coppia', contact: 'Contatti', safetyTips: 'Consigli di sicurezza', trust: 'Fiducia e sicurezza',
    press: 'Area stampa', howItWorks: 'Come funziona Belluh', nfaq: 'Domande insolite', security: 'Sicurezza', cookies: 'Cookie',
    healthData: 'Dati sulla salute', privacyChoices: 'Scelte sulla privacy', accessibility: 'Accessibilità',
    home: 'Home di Belluh', copyright: '© {year} Belluh',
    hiringEyebrow: 'Posizioni aperte', hiringLine: 'Vuoi costruirlo con noi?', hiringCta: 'Stiamo assumendo',
    share: 'Condividi questa pagina:', shareX: 'Condividi su X', shareFacebook: 'Condividi su Facebook', copyLink: 'Copia link', copied: 'Link copiato!',
  },
  pt: {
    index: 'Índice', resources: 'Recursos',
    newsroom: 'Novidades', stories: 'Histórias de casais', contact: 'Contato', safetyTips: 'Dicas de segurança', trust: 'Confiança e segurança',
    press: 'Imprensa', howItWorks: 'Como o Belluh funciona', nfaq: 'Perguntas inusitadas', security: 'Segurança', cookies: 'Cookies',
    healthData: 'Dados de saúde', privacyChoices: 'Suas escolhas de privacidade', accessibility: 'Acessibilidade',
    home: 'Início do Belluh', copyright: '© {year} Belluh',
    hiringEyebrow: 'Nossas vagas', hiringLine: 'Quer construir isso com a gente?', hiringCta: 'Estamos contratando',
    share: 'Compartilhe esta página:', shareX: 'Compartilhar no X', shareFacebook: 'Compartilhar no Facebook', copyLink: 'Copiar link', copied: 'Link copiado!',
  },
  zh: {
    index: '导航', resources: '资源',
    newsroom: '新闻中心', stories: '情侣故事', contact: '联系我们', safetyTips: '安全提示', trust: '信任与安全',
    press: '媒体资源', howItWorks: 'Belluh 如何运作', nfaq: '冷门问题', security: '数据安全', cookies: 'Cookie 政策',
    healthData: '健康数据', privacyChoices: '隐私选择', accessibility: '无障碍',
    home: 'Belluh 首页', copyright: '© {year} Belluh',
    hiringEyebrow: '招聘职位', hiringLine: '想和我们一起做这件事吗？', hiringCta: '我们在招人',
    share: '分享此页：', shareX: '分享到 X', shareFacebook: '分享到 Facebook', copyLink: '复制链接', copied: '链接已复制！',
  },
  de: {
    index: 'Übersicht', resources: 'Ressourcen',
    newsroom: 'Neuigkeiten', stories: 'Erfolgsgeschichten', contact: 'Kontakt', safetyTips: 'Sicherheitstipps', trust: 'Vertrauen & Sicherheit',
    press: 'Presse', howItWorks: 'So funktioniert Belluh', nfaq: 'Seltene Fragen', security: 'Sicherheit', cookies: 'Cookies',
    healthData: 'Gesundheitsdaten', privacyChoices: 'Datenschutz-Optionen', accessibility: 'Barrierefreiheit',
    home: 'Belluh Startseite', copyright: '© {year} Belluh',
    hiringEyebrow: 'Offene Stellen', hiringLine: 'Lust, das mit uns zu bauen?', hiringCta: 'Wir stellen ein',
    share: 'Seite teilen:', shareX: 'Auf X teilen', shareFacebook: 'Auf Facebook teilen', copyLink: 'Link kopieren', copied: 'Link kopiert!',
  },
  es: {
    index: 'Índice', resources: 'Recursos',
    newsroom: 'Noticias', stories: 'Historias de parejas', contact: 'Contacto', safetyTips: 'Consejos de seguridad', trust: 'Confianza y seguridad',
    press: 'Prensa', howItWorks: 'Cómo funciona Belluh', nfaq: 'Preguntas insólitas', security: 'Seguridad', cookies: 'Cookies',
    healthData: 'Datos de salud', privacyChoices: 'Opciones de privacidad', accessibility: 'Accesibilidad',
    home: 'Inicio de Belluh', copyright: '© {year} Belluh',
    hiringEyebrow: 'Ofertas de empleo', hiringLine: '¿Quieres construir esto con nosotros?', hiringCta: 'Estamos contratando',
    share: 'Comparte esta página:', shareX: 'Compartir en X', shareFacebook: 'Compartir en Facebook', copyLink: 'Copiar enlace', copied: '¡Enlace copiado!',
  },
  'es-MX': { hiringEyebrow: 'Vacantes', stories: 'Historias de parejas', safetyTips: 'Tips de seguridad' },
  'pt-PT': {
    contact: 'Contacto', privacyChoices: 'As suas escolhas de privacidade', home: 'Página inicial do Belluh',
    hiringEyebrow: 'As nossas vagas', hiringLine: 'Quer construir isto connosco?', hiringCta: 'Estamos a contratar',
    share: 'Partilhe esta página:', shareX: 'Partilhar no X', shareFacebook: 'Partilhar no Facebook', copyLink: 'Copiar ligação', copied: 'Ligação copiada!',
  },
};
export default t;
