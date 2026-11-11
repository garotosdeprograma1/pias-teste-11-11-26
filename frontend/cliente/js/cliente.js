/* ============================================================
   DaFix — Área do Cliente
   script.js — Vanilla JavaScript (ES6+)

   Módulos:
   1. I18N        — dicionário PT-BR / EN
   2. DADOS       — registros carregados da API
   3. UTILS       — helpers (formatação, DOM, storage)
   4. THEME       — alternância claro/escuro
   5. LANGUAGE    — alternância de idioma
   6. NAVIGATION  — troca de views + sidebar mobile
   7. AVATAR      — renderização de avatar (foto/preset/iniciais)
   8. OVERVIEW    — dashboard (hero, métricas, recentes)
   9. NOTIFS      — dropdown de notificações no topbar
   10. PROFILE    — formulário de perfil + validação
   11. PHOTO      — modal de alterar foto (upload + presets)
   12. ORDERS     — accordion de pedidos + filtros + ações
   13. SERVICES   — busca, filtros, favoritos, denúncia
   14. REPORTS    — denúncias de serviço/profissional
   15. RATING     — modal de avaliação por estrelas
   16. TOASTS     — feedback visual
   17. MODAIS     — helpers genéricos de abertura/fechamento
   18. INIT
   ============================================================ */

   'use strict';

   const account = window.DafixAccount;
   const session = account.requireProfile('cliente');

   /* ============================================================
      1. I18N
      ============================================================ */
   const I18N = {
     pt: {
       'a11y.skip': 'Pular para o conteúdo',
       'brand.area': 'Área do Cliente',
       'nav.label': 'Menu',
       'nav.account': 'Minha Conta',
       'nav.orders': 'Pedidos',
       'nav.services': 'Serviços',
       'nav.logout': 'Sair da conta',
       'sidebar.plan': 'Cliente',
       'promo.title': 'Indique e ganhe',
       'promo.text': 'Convide amigos e ganhe R$ 30 de desconto no próximo serviço.',
       'promo.btn': 'Convidar amigos',
       'title.account': 'Minha Conta',
       'title.orders': 'Pedidos',
       'title.services': 'Serviços',
       'tabs.overview': 'Visão Geral',
       'tabs.profile': 'Perfil',
       'overview.greetingMorning': 'Bom dia',
       'overview.greetingAfternoon': 'Boa tarde',
       'overview.greetingEvening': 'Boa noite',
       'overview.greetingSub': 'Aqui está um resumo da sua conta hoje. Acompanhe seus pedidos e descubra novos serviços.',
       'overview.newRequest': 'Ver catálogo',
       'overview.recentOrders': 'Pedidos recentes',
       'overview.recentSub': 'Seus últimos pedidos e status atuais.',
       'overview.seeAll': 'Ver todos',
       'overview.notifications': 'Notificações',
       'overview.notifSub': 'Atualizações importantes da sua conta.',
       'overview.quickActions': 'Ações rápidas',
       'overview.quickSub': 'Atalhos para o que você mais usa.',
       'stats.active': 'Pedidos ativos',
       'stats.hired': 'Serviços contratados',
       'stats.favorites': 'Favoritos',
       'stats.pendingReviews': 'Avaliações pendentes',
       'quick.request': 'Consultar serviços',
       'quick.orders': 'Ver meus pedidos',
       'quick.profile': 'Editar meu perfil',
       'quick.review': 'Avaliar serviço',
       'notif.title': 'Notificações',
       'notif.markAll': 'Marcar todas como lidas',
       'notif.newCount': 'Você tem %s novas',
       'notif.noneNew': 'Tudo em dia por aqui',
       'notif.timeAgoH': 'há %s h',
       'notif.timeAgoD': 'há %s dias',
       'profile.title': 'Dados pessoais',
       'profile.fullName': 'Nome completo',
       'profile.email': 'E-mail',
       'profile.phone': 'Telefone',
       'profile.address': 'Endereço',
       'profile.prefs': 'Preferências da conta',
       'profile.prefEmail': 'Notificações por e-mail',
       'profile.prefEmailSub': 'Status de pedidos e mensagens importantes.',
       'profile.prefSms': 'Lembretes por SMS',
       'profile.prefSmsSub': 'Avisos de visitas agendadas.',
       'profile.prefNews': 'Ofertas e novidades',
       'profile.prefNewsSub': 'Promoções exclusivas para você.',
       'profile.edit': 'Editar perfil',
       'profile.save': 'Salvar alterações',
       'profile.cancel': 'Cancelar',
       'profile.changePhoto': 'Alterar foto',
       'profile.verified': 'Conta conectada',
       'profile.memberSince': 'Conta de cliente',
       'profile.notProvided': 'Não informado',
       'profile.localNotice': 'As alterações deste perfil ficam salvas neste navegador. Os dados de acesso continuam sendo os do cadastro.',
       'profile.ordersChip': '%s pedidos registrados',
       'profile.security': 'Segurança da conta',
       'profile.lastAccess': 'Último acesso',
       'profile.twoFactor': 'Verificação em 2 etapas',
       'profile.active': 'Não configurada',
       'profile.device': 'Dispositivo',
       'profile.deviceValue': 'Navegador Web',
       'err.nameRequired': 'Informe seu nome completo (mín. 3 letras).',
       'err.emailInvalid': 'Informe um e-mail válido.',
       'err.phoneInvalid': 'Informe um telefone válido (mín. 10 dígitos).',
       'err.addressRequired': 'Informe seu endereço.',
       'photo.title': 'Alterar foto de perfil',
       'photo.subtitle': 'Envie uma imagem ou escolha um avatar para personalizar sua conta.',
       'photo.uploadTitle': 'Enviar do dispositivo',
       'photo.uploadMeta': 'JPG, PNG ou WebP · máx. 5 MB · recomendado 400×400px',
       'photo.upload': 'Escolher imagem',
       'photo.remove': 'Remover foto',
       'photo.presets': 'Ou escolha um avatar',
       'photo.save': 'Salvar foto',
       'photo.cancel': 'Cancelar',
       'toast.photoSaved': 'Foto de perfil atualizada!',
       'toast.photoTooBig': 'Imagem muito grande. O limite é 5 MB.',
       'toast.photoInvalid': 'Arquivo inválido. Envie uma imagem JPG, PNG ou WebP.',
       'toast.photoRemoved': 'Foto removida. Usando avatar com suas iniciais.',
       'orders.subtitle': 'Acompanhe e gerencie todos os seus pedidos em um só lugar.',
       'orders.filterAll': 'Todos',
       'orders.empty': 'Nenhum pedido encontrado para este filtro.',
       'orders.emptyTitle': 'Nada por aqui',
       'order.requestedOn': 'Solicitado em',
       'order.description': 'Descrição do serviço',
       'order.history': 'Histórico do pedido',
       'order.professional': 'Profissional responsável',
       'order.payment': 'Pagamento',
       'order.subtotal': 'Subtotal',
       'order.fee': 'Taxa de serviço',
       'order.total': 'Total',
       'order.cancel': 'Cancelar pedido',
       'order.contact': 'Entrar em contato',
       'order.support': 'Solicitar suporte',
       'order.review': 'Avaliar serviço',
       'order.reviewed': 'Avaliado',
       'order.reportPro': 'Denunciar profissional',
       'status.pending': 'Pendente',
       'status.in_progress': 'Em andamento',
       'status.completed': 'Concluído',
       'status.cancelled': 'Cancelado',
       'pay.credit': 'Cartão de crédito',
       'pay.pix': 'Pix',
       'pay.cash': 'Dinheiro',
       'hist.created': 'Pedido criado',
       'hist.confirmed': 'Profissional confirmado',
       'hist.scheduled': 'Visita agendada',
       'hist.started': 'Serviço iniciado',
       'hist.completed': 'Serviço concluído',
       'hist.cancelled': 'Pedido cancelado',
       'services.catalog': 'Catálogo',
       'services.favorites': 'Favoritos',
       'services.searchPlaceholder': 'Buscar serviços...',
       'services.request': 'Solicitar serviço',
       'services.from': 'a partir de',
       'services.reviews': 'avaliações',
       'services.report': 'Denunciar serviço',
       'services.fav': 'Favoritar',
       'services.emptyTitle': 'Nenhum resultado',
       'services.emptySearch': 'Nenhum serviço encontrado. Tente ajustar sua busca ou filtros.',
       'services.emptyFavs': 'Você ainda não tem favoritos. Toque no coração de um serviço para salvá-lo aqui.',
       'cat.all': 'Todas as categorias',
       'cat.repairs': 'Reparos',
       'cat.cleaning': 'Limpeza',
       'cat.installation': 'Instalação',
       'cat.outdoor': 'Áreas externas',
       'price.all': 'Qualquer preço',
       'price.low': 'Até R$ 150',
       'price.mid': 'R$ 150 – R$ 300',
       'price.high': 'Acima de R$ 300',
       'sort.popular': 'Mais populares',
       'sort.rating': 'Melhor avaliados',
       'sort.priceAsc': 'Menor preço',
       'sort.priceDesc': 'Maior preço',
       'modal.title': 'Como foi o serviço?',
       'modal.with': 'com',
       'modal.commentLabel': 'Comentário (opcional)',
       'modal.commentPlaceholder': 'Conte como foi sua experiência...',
       'modal.submit': 'Enviar avaliação',
       'modal.starsError': 'Selecione uma nota de 1 a 5 estrelas.',
       'modal.star1': 'Muito ruim',
       'modal.star2': 'Ruim',
       'modal.star3': 'Regular',
       'modal.star4': 'Bom',
       'modal.star5': 'Excelente!',
       'report.service': 'Denunciar serviço',
       'report.pro': 'Denunciar profissional',
       'report.titleService': 'Denunciar serviço',
       'report.titlePro': 'Denunciar profissional',
       'report.subtitle': 'Sua denúncia é confidencial e será analisada pela nossa equipe de segurança em até 48h úteis.',
       'report.target': 'Você está denunciando',
       'report.reason': 'Motivo da denúncia',
       'report.reasonPlaceholder': 'Selecione um motivo',
       'report.r.billing': 'Cobrança indevida ou valor abusivo',
       'report.r.conduct': 'Conduta inadequada ou desrespeito',
       'report.r.noshow': 'Serviço não realizado / não compareceu',
       'report.r.quality': 'Qualidade muito abaixo do prometido',
       'report.r.misleading': 'Anúncio enganoso ou informação falsa',
       'report.r.safety': 'Risco à segurança ou dano ao imóvel',
       'report.r.other': 'Outro motivo',
       'report.details': 'Descreva o ocorrido',
       'report.detailsPlaceholder': 'Conte com detalhes o que aconteceu (mínimo de 20 caracteres)...',
       'report.anonymous': 'Denúncia anônima',
       'report.anonymousSub': 'Seu nome não será exibido ao denunciado.',
       'report.cancel': 'Cancelar',
       'report.submit': 'Enviar denúncia',
       'report.successTitle': 'Denúncia enviada!',
       'report.successText': 'Protocolo %s gerado. Nossa equipe de segurança vai analisar o caso em até 48h úteis e você será notificado sobre o resultado.',
       'report.done': 'Entendi',
       'err.reasonRequired': 'Selecione um motivo para a denúncia.',
       'err.detailsMin': 'Descreva o ocorrido com pelo menos 20 caracteres.',
       'reports.title': 'Minhas denúncias',
       'reports.subtitle': 'Acompanhe o andamento das denúncias enviadas à nossa equipe.',
       'reports.empty': 'Você não possui denúncias registradas.',
       'reports.status.open': 'Em análise',
       'reports.typeService': 'Serviço',
       'reports.typePro': 'Profissional',
       'reports.anonTag': 'Anônima',
       'foot.rights': 'Todos os direitos reservados',
       'foot.help': 'Central de ajuda',
       'foot.terms': 'Termos',
       'foot.privacy': 'Privacidade',
       'toast.profileSaved': 'Perfil salvo neste navegador.',
       'toast.profileError': 'Não foi possível salvar o perfil. Tente novamente.',
       'toast.formError': 'Verifique os campos destacados.',
       'toast.favAdded': 'adicionado aos favoritos.',
       'toast.favRemoved': 'removido dos favoritos.',
       'toast.orderCancelled': 'Pedido cancelado com sucesso.',
       'toast.reviewSent': 'Avaliação enviada. Obrigado!',
       'toast.requestSent': 'Solicitação enviada! Em breve um profissional entrará em contato.',
       'toast.contact': 'Abrindo conversa com o profissional...',
       'toast.support': 'Chamado de suporte aberto. Retornaremos em breve.',
       'toast.reportSent': 'Denúncia registrada com sucesso.',
       'toast.noPending': 'Nenhum serviço aguardando avaliação.',
       'toast.notifRead': 'Todas as notificações foram lidas.',
       'toast.promo': 'Link de convite copiado! Compartilhe com seus amigos.',
     },
     en: {
       'a11y.skip': 'Skip to content',
       'brand.area': 'Client Area',
       'nav.label': 'Menu',
       'nav.account': 'My Account',
       'nav.orders': 'Orders',
       'nav.services': 'Services',
       'nav.logout': 'Sign out',
       'sidebar.plan': 'Client',
       'promo.title': 'Refer & earn',
       'promo.text': 'Invite friends and get R$ 30 off your next service.',
       'promo.btn': 'Invite friends',
       'title.account': 'My Account',
       'title.orders': 'Orders',
       'title.services': 'Services',
       'tabs.overview': 'Overview',
       'tabs.profile': 'Profile',
       'overview.greetingMorning': 'Good morning',
       'overview.greetingAfternoon': 'Good afternoon',
       'overview.greetingEvening': 'Good evening',
       'overview.greetingSub': "Here's a summary of your account today. Track your orders and discover new services.",
       'overview.newRequest': 'New request',
       'overview.recentOrders': 'Recent orders',
       'overview.recentSub': 'Your latest orders and current status.',
       'overview.seeAll': 'See all',
       'overview.notifications': 'Notifications',
       'overview.notifSub': 'Important updates about your account.',
       'overview.quickActions': 'Quick actions',
       'overview.quickSub': 'Shortcuts to what you use the most.',
       'stats.active': 'Active orders',
       'stats.hired': 'Services hired',
       'stats.favorites': 'Favorites',
       'stats.pendingReviews': 'Pending reviews',
       'quick.request': 'Request a service',
       'quick.orders': 'View my orders',
       'quick.profile': 'Edit my profile',
       'quick.review': 'Review a service',
       'notif.title': 'Notifications',
       'notif.markAll': 'Mark all as read',
       'notif.newCount': 'You have %s new',
       'notif.noneNew': 'You are all caught up',
       'notif.timeAgoH': '%s h ago',
       'notif.timeAgoD': '%s days ago',
       'profile.title': 'Personal information',
       'profile.fullName': 'Full name',
       'profile.email': 'Email',
       'profile.phone': 'Phone',
       'profile.address': 'Address',
       'profile.prefs': 'Account preferences',
       'profile.prefEmail': 'Email notifications',
       'profile.prefEmailSub': 'Order status and important messages.',
       'profile.prefSms': 'SMS reminders',
       'profile.prefSmsSub': 'Scheduled visit alerts.',
       'profile.prefNews': 'Offers and news',
       'profile.prefNewsSub': 'Exclusive deals for you.',
       'profile.edit': 'Edit profile',
       'profile.save': 'Save changes',
       'profile.cancel': 'Cancel',
       'profile.changePhoto': 'Change photo',
       'profile.verified': 'Signed in',
       'profile.memberSince': 'Client account',
       'profile.notProvided': 'Not provided',
       'profile.localNotice': 'Profile changes are saved in this browser. Your sign-in details remain the ones from registration.',
       'profile.ordersChip': '%s registered orders',
       'profile.security': 'Account security',
       'profile.lastAccess': 'Last access',
       'profile.twoFactor': 'Two-step verification',
       'profile.active': 'Not configured',
       'profile.device': 'Device',
       'profile.deviceValue': 'Web Browser',
       'err.nameRequired': 'Enter your full name (min. 3 letters).',
       'err.emailInvalid': 'Enter a valid email address.',
       'err.phoneInvalid': 'Enter a valid phone number (min. 10 digits).',
       'err.addressRequired': 'Enter your address.',
       'photo.title': 'Change profile photo',
       'photo.subtitle': 'Upload an image or pick an avatar to personalize your account.',
       'photo.uploadTitle': 'Upload from device',
       'photo.uploadMeta': 'JPG, PNG or WebP · max 5 MB · recommended 400×400px',
       'photo.upload': 'Choose image',
       'photo.remove': 'Remove photo',
       'photo.presets': 'Or pick an avatar',
       'photo.save': 'Save photo',
       'photo.cancel': 'Cancel',
       'toast.photoSaved': 'Profile photo updated!',
       'toast.photoTooBig': 'Image too large. The limit is 5 MB.',
       'toast.photoInvalid': 'Invalid file. Upload a JPG, PNG or WebP image.',
       'toast.photoRemoved': 'Photo removed. Using your initials avatar.',
       'orders.subtitle': 'Track and manage all your orders in one place.',
       'orders.filterAll': 'All',
       'orders.empty': 'No orders found for this filter.',
       'orders.emptyTitle': 'Nothing here',
       'order.requestedOn': 'Requested on',
       'order.description': 'Service description',
       'order.history': 'Order history',
       'order.professional': 'Assigned professional',
       'order.payment': 'Payment',
       'order.subtotal': 'Subtotal',
       'order.fee': 'Service fee',
       'order.total': 'Total',
       'order.cancel': 'Cancel order',
       'order.contact': 'Contact professional',
       'order.support': 'Request support',
       'order.review': 'Review service',
       'order.reviewed': 'Reviewed',
       'order.reportPro': 'Report professional',
       'status.pending': 'Pending',
       'status.in_progress': 'In progress',
       'status.completed': 'Completed',
       'status.cancelled': 'Cancelled',
       'pay.credit': 'Credit card',
       'pay.pix': 'Pix',
       'pay.cash': 'Cash',
       'hist.created': 'Order created',
       'hist.confirmed': 'Professional confirmed',
       'hist.scheduled': 'Visit scheduled',
       'hist.started': 'Service started',
       'hist.completed': 'Service completed',
       'hist.cancelled': 'Order cancelled',
       'services.catalog': 'Catalog',
       'services.favorites': 'Favorites',
       'services.searchPlaceholder': 'Search services...',
       'services.request': 'Request service',
       'services.from': 'from',
       'services.reviews': 'reviews',
       'services.report': 'Report service',
       'services.fav': 'Favorite',
       'services.emptyTitle': 'No results',
       'services.emptySearch': 'No services found. Try adjusting your search or filters.',
       'services.emptyFavs': "You don't have favorites yet. Tap the heart on a service to save it here.",
       'cat.all': 'All categories',
       'cat.repairs': 'Repairs',
       'cat.cleaning': 'Cleaning',
       'cat.installation': 'Installation',
       'cat.outdoor': 'Outdoor',
       'price.all': 'Any price',
       'price.low': 'Up to R$ 150',
       'price.mid': 'R$ 150 – R$ 300',
       'price.high': 'Above R$ 300',
       'sort.popular': 'Most popular',
       'sort.rating': 'Top rated',
       'sort.priceAsc': 'Lowest price',
       'sort.priceDesc': 'Highest price',
       'modal.title': 'How was the service?',
       'modal.with': 'with',
       'modal.commentLabel': 'Comment (optional)',
       'modal.commentPlaceholder': 'Tell us about your experience...',
       'modal.submit': 'Submit review',
       'modal.starsError': 'Please select a rating from 1 to 5 stars.',
       'modal.star1': 'Very bad',
       'modal.star2': 'Bad',
       'modal.star3': 'Average',
       'modal.star4': 'Good',
       'modal.star5': 'Excellent!',
       'report.service': 'Report service',
       'report.pro': 'Report professional',
       'report.titleService': 'Report service',
       'report.titlePro': 'Report professional',
       'report.subtitle': 'Your report is confidential and will be reviewed by our safety team within 48 business hours.',
       'report.target': 'You are reporting',
       'report.reason': 'Report reason',
       'report.reasonPlaceholder': 'Select a reason',
       'report.r.billing': 'Improper or abusive charge',
       'report.r.conduct': 'Inappropriate conduct or disrespect',
       'report.r.noshow': 'Service not performed / no-show',
       'report.r.quality': 'Quality far below promised',
       'report.r.misleading': 'Misleading ad or false information',
       'report.r.safety': 'Safety risk or property damage',
       'report.r.other': 'Other reason',
       'report.details': 'Describe what happened',
       'report.detailsPlaceholder': 'Tell us in detail what happened (minimum 20 characters)...',
       'report.anonymous': 'Anonymous report',
       'report.anonymousSub': 'Your name will not be shown to the reported party.',
       'report.cancel': 'Cancel',
       'report.submit': 'Submit report',
       'report.successTitle': 'Report submitted!',
       'report.successText': 'Protocol %s generated. Our safety team will review the case within 48 business hours and you will be notified of the outcome.',
       'report.done': 'Got it',
       'err.reasonRequired': 'Select a reason for the report.',
       'err.detailsMin': 'Describe what happened with at least 20 characters.',
       'reports.title': 'My reports',
       'reports.subtitle': 'Track the progress of reports sent to our team.',
       'reports.empty': 'You have no registered reports.',
       'reports.status.open': 'Under review',
       'reports.typeService': 'Service',
       'reports.typePro': 'Professional',
       'reports.anonTag': 'Anonymous',
       'foot.rights': 'All rights reserved',
       'foot.help': 'Help center',
       'foot.terms': 'Terms',
       'foot.privacy': 'Privacy',
       'toast.profileSaved': 'Profile saved in this browser.',
       'toast.profileError': 'Could not save your profile. Please try again.',
       'toast.formError': 'Please check the highlighted fields.',
       'toast.favAdded': 'added to favorites.',
       'toast.favRemoved': 'removed from favorites.',
       'toast.orderCancelled': 'Order cancelled successfully.',
       'toast.reviewSent': 'Review submitted. Thank you!',
       'toast.requestSent': 'Request sent! A professional will contact you soon.',
       'toast.contact': 'Opening chat with the professional...',
       'toast.support': 'Support ticket opened. We will get back to you soon.',
       'toast.reportSent': 'Report registered successfully.',
       'toast.noPending': 'No services awaiting review.',
       'toast.notifRead': 'All notifications marked as read.',
       'toast.promo': 'Invite link copied! Share it with your friends.',
     },
   };

   /* ============================================================
      2. ÍCONES E DADOS DA API
      ============================================================ */
   const ICONS = {
     bolt: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>',
     wrench: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>',
     sparkles: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.9 5.7L19.6 10l-5.7 1.9L12 17.6l-1.9-5.7L4.4 10l5.7-1.9z"/><path d="M19 15l.9 2.6L22.5 18l-2.6.9L19 21.5l-.9-2.6L15.5 18l2.6-.9z"/></svg>',
     brush: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 2l4 4-10 10H8v-4z"/><path d="M8 16c-2.5 0-4 1.5-4 4 0 .5-.5 1-1 1h7c1.5 0 2-1.5 2-3"/></svg>',
     leaf: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 20A7 7 0 0 1 4 13c0-5 4-9 16-9-1 1-1 4-2 6-1.5 3-3 5-7 5 3 0 4 1 4 3"/><path d="M4 21c3-3 5-5 9-6"/></svg>',
     furniture: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="10" rx="2"/><path d="M6 14v5M18 14v5M4 9h16"/></svg>',
     snowflake: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M4 6l16 12M20 6L4 18M8 4l4 3 4-3M8 20l4-3 4 3"/></svg>',
     key: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="7.5" cy="15.5" r="4.5"/><path d="M10.85 12.15L19 4M18 5l3 3M15 8l2 2"/></svg>',
     bug: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="6" width="8" height="14" rx="4"/><path d="M19 7l-3 2M5 7l3 2M19 19l-3-2M5 19l3-2M12 20v-8M2 13h6M16 13h6"/></svg>',
     star: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>',
     heart: '<svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>',
     flag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1zM4 22v-7"/></svg>',
     clipboard: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/></svg>',
     check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>',
     alert: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>',
     user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
     search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>',
     chevron: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>',
   };

   // Presets de avatar na paleta da marca
   const AVATAR_PRESETS = {
     g1: '#203b30',
     g2: '#b95d43',
     g3: '#3f6550',
     g4: '#80644c',
     g5: '#9b7635',
     g6: '#596f60',
   };

   let SERVICES = [];
   const NOTIFICATIONS = [];

   const REPORT_REASONS = ['report.r.billing', 'report.r.conduct', 'report.r.noshow', 'report.r.quality', 'report.r.misleading', 'report.r.safety', 'report.r.other'];

   /* ============================================================
      3. UTILS & STATE
      ============================================================ */
   const $ = (sel, ctx = document) => ctx.querySelector(sel);
   const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

   const storage = {
     get(key, fallback) {
       try { const v = localStorage.getItem(storage.key(key)); return v === null ? fallback : JSON.parse(v); }
       catch { return fallback; }
     },
     set(key, value) {
       try { localStorage.setItem(storage.key(key), JSON.stringify(value)); }
       catch { /* quota excedida — ignora */ }
     },
     raw(key, fallback) {
       try { return localStorage.getItem(key) || fallback; }
       catch { return fallback; }
     },
     key(key) {
       return ['sh_lang', 'sh_theme'].includes(key) ? key : account.key(key);
     },
   };

   const profile = session ? account.loadProfile() : {};

   const state = {
     lang: storage.get('sh_lang', 'pt'),
     theme: storage.raw('dafix_theme', storage.get('sh_theme', window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')),
     user: {
       name: '', email: '', phone: '', address: '', avatar: null,
       ...profile,
       prefs: { email: false, sms: false, news: false, ...profile.prefs },
     },
     orders: [],
     favorites: storage.get('favorites.v2', []),
     reports: [],
     notifRead: storage.get('sh_notif_read', false),
     view: 'account',
     orderFilter: 'all',
     serviceTab: 'catalog',
     search: '',
     category: 'all',
     priceRange: 'all',
     sort: 'popular',
     ratingOrder: null,
     ratingStars: 0,
     photoDraft: null,
     reportCtx: null, // { type:'service'|'pro', targetId }
   };

   const t = (key) => (I18N[state.lang] && I18N[state.lang][key]) || I18N.pt[key] || key;

   const fmtMoney = (v) => new Intl.NumberFormat(state.lang === 'pt' ? 'pt-BR' : 'en-US', { style: 'currency', currency: 'BRL' }).format(v);

   const fmtDate = (iso, withTime = false) => {
     if (!iso) return '—';
     const d = new Date(iso);
     const locale = state.lang === 'pt' ? 'pt-BR' : 'en-US';
     const opts = withTime
       ? { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }
       : { day: '2-digit', month: 'short', year: 'numeric' };
     return new Intl.DateTimeFormat(locale, opts).format(d);
   };

   const serviceById = (id) => SERVICES.find((s) => s.id === id);
   const initials = (name) => String(name || '').trim().split(/\s+/).filter(Boolean).map((p) => p[0]).slice(0, 2).join('').toUpperCase();
   const escapeHtml = (str) => String(str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

   const STATUS_BADGE = { pending: 'badge--amber', in_progress: 'badge--blue', completed: 'badge--green', cancelled: 'badge--red' };

   /* ============================================================
      4. THEME
      ============================================================ */
   const Theme = {
     apply() { document.documentElement.setAttribute('data-theme', state.theme); },
     toggle() {
       state.theme = state.theme === 'light' ? 'dark' : 'light';
       storage.set('sh_theme', state.theme);
       try { localStorage.setItem('dafix_theme', state.theme); } catch { /* preferência opcional */ }
       Theme.apply();
     },
     init() {
       Theme.apply();
       $('#theme-toggle').addEventListener('click', Theme.toggle);
     },
   };

   /* ============================================================
      5. LANGUAGE
      ============================================================ */
   const Language = {
     applyStatic() {
       $$('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
       $('#service-search').placeholder = t('services.searchPlaceholder');
       document.documentElement.lang = state.lang === 'pt' ? 'pt-BR' : 'en';
       $('#lang-label').textContent = state.lang === 'pt' ? 'EN' : 'PT';
     },
     rerenderAll() {
       Language.applyStatic();
       Navigation.updateTitle();
       Overview.render();
       NotifPanel.render();
       Profile.fill();
       Reports.render();
       Orders.render();
       Services.renderFilters();
       Services.render();
       Tabs.placeAll();
     },
     toggle() {
       state.lang = state.lang === 'pt' ? 'en' : 'pt';
       storage.set('sh_lang', state.lang);
       Language.rerenderAll();
     },
     init() {
       $('#lang-toggle').addEventListener('click', Language.toggle);
       Language.applyStatic();
     },
   };

   /* ============================================================
      6. NAVIGATION + TABS
      ============================================================ */
   const Navigation = {
     go(view) {
       state.view = view;
       $$('.nav__item').forEach((b) => b.classList.toggle('is-active', b.dataset.view === view));
       $$('.view').forEach((v) => v.classList.toggle('is-active', v.id === `view-${view}`));
       Navigation.updateTitle();
       Navigation.closeSidebar();
       window.scrollTo({ top: 0 });
       Tabs.placeAll(); // recalcula indicadores das tabs visíveis
     },
     updateTitle() {
       $('#topbar-title').textContent = t(`title.${state.view}`);
       $('#breadcrumb-page').textContent = t(`title.${state.view}`);
     },
     openSidebar() { if (window.innerWidth > 1024) return; $('#app-shell').classList.add('is-mobile-open'); $('#menu-btn').setAttribute('aria-expanded', 'true'); },
     closeSidebar() { $('#app-shell').classList.remove('is-mobile-open'); $('#menu-btn').setAttribute('aria-expanded', 'false'); },
     init() {
       $$('.nav__item[data-view]').forEach((btn) => btn.addEventListener('click', () => Navigation.go(btn.dataset.view)));
       $$('[data-action="logout"]').forEach((btn) => btn.addEventListener('click', (event) => {
         event.preventDefault();
         window.DafixAccount.logout().catch(error => alert(error.message));
       }));
       $('#menu-btn').addEventListener('click', Navigation.openSidebar);
       window.addEventListener('resize', () => { if (window.innerWidth > 1024) Navigation.closeSidebar(); });
       document.addEventListener('keydown', event => { if (event.key === 'Escape') Navigation.closeSidebar(); });
       $('#sidebar-overlay').addEventListener('click', Navigation.closeSidebar);
       $('#topbar-avatar').addEventListener('click', () => { Navigation.go('account'); Tabs.goAccount('profile'); });
       $('#sidebar-avatar').addEventListener('click', () => { Navigation.go('account'); Tabs.goAccount('profile'); });
     },
   };

   const Tabs = {
     place(tabsEl) {
       const ind = $('.tabs__indicator', tabsEl);
       const active = $('.tab.is-active', tabsEl);
       if (!ind || !active || active.offsetWidth === 0) return;
       ind.style.width = active.offsetWidth + 'px';
       ind.style.transform = `translateX(${active.offsetLeft - 6}px)`;
     },
     placeAll() { requestAnimationFrame(() => $$('.tabs').forEach(Tabs.place)); },
     goAccount(tab) {
       $$('#view-account .tab').forEach((b) => {
         const on = b.dataset.tab === tab;
         b.classList.toggle('is-active', on);
         b.setAttribute('aria-selected', on);
       });
       $$('#view-account .tab-panel').forEach((p) => p.classList.toggle('is-active', p.id === `panel-${tab}`));
       Tabs.placeAll();
     },
     init() {
       $$('#view-account .tab').forEach((btn) => btn.addEventListener('click', () => Tabs.goAccount(btn.dataset.tab)));
       window.addEventListener('resize', Tabs.placeAll);
       Tabs.placeAll();
     },
   };

   /* ============================================================
      7. AVATAR — foto, preset ou iniciais
      ============================================================ */
   const Avatar = {
     paint(el, value, name) {
       const ini = $('.avatar__initials', el);
       if (ini) ini.textContent = initials(name || state.user.name);
       if (typeof value === 'string' && (/^https?:\/\//.test(value) || /^data:image\/(png|jpeg|webp);base64,/.test(value))) {
         el.style.backgroundImage = `url("${value}")`;
         el.classList.add('has-photo');
       } else {
         el.style.backgroundImage = '';
         el.style.background = AVATAR_PRESETS[(typeof value === 'string' ? value : '').replace('preset:', '')] || AVATAR_PRESETS.g1;
         el.classList.remove('has-photo');
       }
     },
     renderAll() {
       $$('.js-avatar').forEach((el) => Avatar.paint(el, state.user.avatar));
     },
   };

   /* ============================================================
      8. OVERVIEW
      ============================================================ */
   const Overview = {
     greeting() {
       const h = new Date().getHours();
       if (h < 12) return t('overview.greetingMorning');
       if (h < 18) return t('overview.greetingAfternoon');
       return t('overview.greetingEvening');
     },

     renderStats() {
       $('#stats-grid').innerHTML = [
         ['Pedidos registrados', state.orders.length], ['Serviços no catálogo', SERVICES.length], ['Favoritos', state.favorites.length]
       ].map(([label,value]) => `<div class="metric"><div class="metric__value">${value}</div><div class="metric__label">${label}</div></div>`).join('');
     },

     renderRecent() {
       $('#recent-orders').innerHTML = state.orders.length ? state.orders.slice(0,3).map(o=>`<li class="recent-item"><div class="recent-info"><strong>${window.DafixData.escape(o.servico)}</strong><span>#${o.id} · ${window.DafixData.date(o.data)}</span></div></li>`).join('') : '<li class="data-empty">Nenhum pedido cadastrado.</li>';
     },

     renderNotifsCard() {
       $('#notif-list').innerHTML = NOTIFICATIONS.map((n) => {
         const ago = n.hoursAgo < 24
           ? t('notif.timeAgoH').replace('%s', n.hoursAgo)
           : t('notif.timeAgoD').replace('%s', Math.round(n.hoursAgo / 24));
         return `
         <li class="notif-item ${state.notifRead ? '' : 'notif-item--new'}">
           <span class="notif-dot notif-dot--${n.type}"></span>
           <p>${n.text[state.lang]}<span class="notif-meta">${ago}</span></p>
         </li>`;
       }).join('');
     },

     renderQuickActions() {
       const actions = [
         { icon: ICONS.search, label: t('quick.request'), testid: 'qa-request', fn: () => Navigation.go('services') },
         { icon: ICONS.clipboard, label: t('quick.orders'), testid: 'qa-orders', fn: () => Navigation.go('orders') },
         { icon: ICONS.user, label: t('quick.profile'), testid: 'qa-profile', fn: () => { Navigation.go('account'); Tabs.goAccount('profile'); } },
       ];
       const wrap = $('#quick-actions');
       wrap.innerHTML = '';
       actions.forEach((a) => {
         const btn = document.createElement('button');
         btn.className = 'quick-action';
         btn.dataset.testid = a.testid;
         btn.innerHTML = `<span class="quick-action__icon">${a.icon}</span><span>${a.label}</span>`;
         btn.addEventListener('click', a.fn);
         wrap.appendChild(btn);
       });
     },

     render() {
       const firstName = state.user.name.trim().split(/\s+/)[0];
       $('#greeting-title').textContent = firstName ? `${Overview.greeting()}, ${firstName}!` : `${Overview.greeting()}!`;
       $('#hero-date').textContent = new Intl.DateTimeFormat(state.lang === 'pt' ? 'pt-BR' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());
       $('#sidebar-username').textContent = state.user.name || t('profile.notProvided');
       $('#nav-orders-badge').textContent = state.orders.length;
       Avatar.renderAll();
       Overview.renderStats();
       Overview.renderRecent();
       Overview.renderNotifsCard();
       Overview.renderQuickActions();
     },

     init() {
       $('#greeting-cta').addEventListener('click', () => Navigation.go('services'));
       $('#hero-orders-btn').addEventListener('click', () => Navigation.go('orders'));
       $('#see-all-orders').addEventListener('click', () => Navigation.go('orders'));
       Overview.render();
     },
   };

   /* ============================================================
      9. NOTIFS — dropdown do topbar
      ============================================================ */
   const NotifPanel = {
     open: false,

     render() {
       const unread = state.notifRead ? 0 : NOTIFICATIONS.length;
       const badge = $('#notif-badge');
       badge.textContent = unread;
       badge.hidden = unread === 0;
       $('#notif-sub').textContent = unread > 0 ? t('notif.newCount').replace('%s', unread) : t('notif.noneNew');

       $('#notif-dropdown-list').innerHTML = NOTIFICATIONS.map((n) => {
         const ago = n.hoursAgo < 24
           ? t('notif.timeAgoH').replace('%s', n.hoursAgo)
           : t('notif.timeAgoD').replace('%s', Math.round(n.hoursAgo / 24));
         return `
         <li class="notif-item ${state.notifRead ? '' : 'notif-item--new'}">
           <span class="notif-dot notif-dot--${n.type}"></span>
           <p>${n.text[state.lang]}<span class="notif-meta">${ago}</span></p>
         </li>`;
       }).join('');
     },

     toggle(force) {
       NotifPanel.open = force !== undefined ? force : !NotifPanel.open;
       $('#notif-dropdown').classList.toggle('is-open', NotifPanel.open);
       $('#notif-btn').setAttribute('aria-expanded', NotifPanel.open);
     },

     markAll() {
       state.notifRead = true;
       storage.set('sh_notif_read', true);
       NotifPanel.render();
       Overview.renderNotifsCard();
       Toast.show(t('toast.notifRead'), 'success');
     },

     init() {
       NotifPanel.render();
       $('#notif-btn').addEventListener('click', (e) => { e.stopPropagation(); NotifPanel.toggle(); });
       $('#notif-mark-all').addEventListener('click', NotifPanel.markAll);
       document.addEventListener('click', (e) => {
         if (NotifPanel.open && !e.target.closest('.notifications')) NotifPanel.toggle(false);
       });
     },
   };

   /* ============================================================
      10. PROFILE
      ============================================================ */
   const Profile = {
     editing: false,
     saving: false,
     fields: ['name', 'email', 'phone', 'address'],

     fill() {
       $('#f-name').value = state.user.name;
       $('#f-email').value = state.user.email;
       $('#f-phone').value = state.user.phone;
       $('#f-address').value = state.user.address;
       $('#pref-email').checked = state.user.prefs.email;
       $('#pref-sms').checked = state.user.prefs.sms;
       $('#pref-news').checked = state.user.prefs.news;
       Profile.fields.forEach((field) => { $(`#f-${field}`).placeholder = t('profile.notProvided'); });
       $('#profile-display-name').textContent = state.user.name || t('profile.notProvided');
       $('#profile-display-email').textContent = state.user.email || t('profile.notProvided');
       const hired = state.orders.filter((o) => o.status !== 'cancelled').length;
       $('#profile-orders-chip').textContent = t('profile.ordersChip').replace('%s', hired);
       const accessDate = session && session.loginAt ? new Date(session.loginAt) : null;
       $('#last-access').textContent = accessDate && !Number.isNaN(accessDate.getTime()) ? fmtDate(accessDate.toISOString(), true) : t('profile.notProvided');
     },

     setEditing(on) {
       Profile.editing = on;
       Profile.fields.forEach((f) => { $(`#f-${f}`).disabled = !on; });
       ['pref-email', 'pref-sms', 'pref-news'].forEach((id) => { $('#' + id).disabled = !on; });
       $('#profile-actions').hidden = !on;
       $('#edit-profile-btn').hidden = on;
       if (on) $('#f-name').focus();
       else Profile.clearErrors();
     },

     clearErrors() {
       Profile.fields.forEach((f) => {
         $(`#err-${f}`).classList.remove('show');
         $(`#f-${f}`).closest('.field').classList.remove('is-invalid');
       });
     },

     setError(field, msg) {
       const el = $(`#err-${field}`);
       el.textContent = msg;
       el.classList.add('show');
       $(`#f-${field}`).closest('.field').classList.add('is-invalid');
     },

     validate() {
       Profile.clearErrors();
       let ok = true;
       if ($('#f-name').value.trim().replace(/\s/g, '').length < 3) { Profile.setError('name', t('err.nameRequired')); ok = false; }
       if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test($('#f-email').value.trim())) { Profile.setError('email', t('err.emailInvalid')); ok = false; }
       if ($('#f-phone').value.trim() && $('#f-phone').value.replace(/\D/g, '').length < 10) { Profile.setError('phone', t('err.phoneInvalid')); ok = false; }
       if ($('#f-address').value.trim() && $('#f-address').value.trim().length < 5) { Profile.setError('address', t('err.addressRequired')); ok = false; }
       return ok;
     },

     async save(e) {
       e.preventDefault();
       if (Profile.saving) return;
       if (!Profile.validate()) { Toast.show(t('toast.formError'), 'error'); return; }
       const updated = {
         ...state.user,
         name: $('#f-name').value.trim(),
         email: $('#f-email').value.trim(),
         phone: $('#f-phone').value.trim(),
         address: $('#f-address').value.trim(),
         prefs: { email: $('#pref-email').checked, sms: $('#pref-sms').checked, news: $('#pref-news').checked },
       };
       Profile.saving = true;
       const button = $('#save-profile-btn');
       button.disabled = true;
       button.classList.add('is-loading');
       try {
         await account.saveProfile(updated);
         state.user = updated;
         Profile.setEditing(false);
         Profile.fill();
         Overview.render();
         Toast.show(t('toast.profileSaved'), 'success');
       } catch {
         Toast.show(t('toast.profileError'), 'error');
       } finally {
         Profile.saving = false;
         button.disabled = false;
         button.classList.remove('is-loading');
       }
     },

     init() {
       Profile.fill();
       $('#edit-profile-btn').addEventListener('click', () => Profile.setEditing(true));
       $('#cancel-profile-btn').addEventListener('click', () => { Profile.fill(); Profile.setEditing(false); });
       $('#profile-form').addEventListener('submit', Profile.save);
     },
   };

   /* ============================================================
      11. PHOTO — modal de alterar foto (FUNCIONAL)
      ============================================================ */
   const Photo = {
     MAX_BYTES: 5 * 1024 * 1024,

     open() {
       state.photoDraft = state.user.avatar;
       Photo.paintPreview();
       Photo.renderPresets();
       Modals.open('photo-modal');
     },

     paintPreview() {
       Avatar.paint($('#photo-preview'), state.photoDraft, state.user.name);
       // marca preset selecionado
       $$('.photo-preset').forEach((b) => {
         b.classList.toggle('is-selected', state.photoDraft === `preset:${b.dataset.preset}`);
       });
     },

     renderPresets() {
       const wrap = $('#photo-presets');
       wrap.innerHTML = '';
       Object.entries(AVATAR_PRESETS).forEach(([key, grad]) => {
         const btn = document.createElement('button');
         btn.className = 'photo-preset';
         btn.dataset.preset = key;
         btn.dataset.testid = `photo-preset-${key}`;
         btn.style.background = grad;
         btn.textContent = initials(state.user.name);
         btn.setAttribute('aria-label', `Avatar ${key}`);
         btn.addEventListener('click', () => {
           state.photoDraft = `preset:${key}`;
           Photo.paintPreview();
         });
         wrap.appendChild(btn);
       });
     },

     // Lê o arquivo, valida, redimensiona via canvas (256px) e gera dataURL leve
     handleFile(file) {
       if (!file) return;
       if (!/^image\/(png|jpe?g|webp)$/.test(file.type)) { Toast.show(t('toast.photoInvalid'), 'error'); return; }
       if (file.size > Photo.MAX_BYTES) { Toast.show(t('toast.photoTooBig'), 'error'); return; }

       const reader = new FileReader();
       reader.onload = () => {
         const img = new Image();
         img.onload = () => {
           const SIZE = 256;
           const canvas = document.createElement('canvas');
           canvas.width = SIZE; canvas.height = SIZE;
           const ctx = canvas.getContext('2d');
           // recorte central quadrado (cover)
           const side = Math.min(img.width, img.height);
           const sx = (img.width - side) / 2;
           const sy = (img.height - side) / 2;
           ctx.drawImage(img, sx, sy, side, side, 0, 0, SIZE, SIZE);
           state.photoDraft = canvas.toDataURL('image/jpeg', 0.85);
           Photo.paintPreview();
         };
         img.onerror = () => Toast.show(t('toast.photoInvalid'), 'error');
         img.src = reader.result;
       };
       reader.readAsDataURL(file);
     },

     remove() {
       state.photoDraft = 'preset:g1';
       Photo.paintPreview();
       Toast.show(t('toast.photoRemoved'));
     },

     async save() {
       const btn = $('#photo-save-btn');
       if (btn.disabled) return;
       btn.classList.add('is-loading');
       btn.disabled = true;
       try {
         const updated = { ...state.user, avatar: state.photoDraft };
         await account.saveProfile(updated);
         state.user = updated;
         Avatar.renderAll();
         Modals.close('photo-modal');
         Toast.show(t('toast.photoSaved'), 'success');
       } catch {
         Toast.show(t('toast.profileError'), 'error');
       } finally {
         btn.classList.remove('is-loading');
         btn.disabled = false;
       }
     },

     init() {
       $('#change-photo-btn').addEventListener('click', Photo.open);
       $('#profile-avatar').addEventListener('click', Photo.open);
       $('#photo-upload-btn').addEventListener('click', () => $('#photo-file-input').click());
       $('#photo-file-input').addEventListener('change', (e) => { Photo.handleFile(e.target.files[0]); e.target.value = ''; });
       $('#photo-remove-btn').addEventListener('click', Photo.remove);
       $('#photo-save-btn').addEventListener('click', Photo.save);
     },
   };

   /* ============================================================
      12. ORDERS
      ============================================================ */
   const Orders = {
     render() {
       const D = window.DafixData;
       $('#orders-empty').hidden = true;
       $('#orders-list').innerHTML = D.table(['Pedido','Serviço','Funcionário','Data','Local','Valor registrado'], state.orders.map(o=>['#'+o.id,o.servico,o.funcionario || 'Aguardando aceite',D.date(o.data),o.local,D.money(o.preco_unitario)]), 'Nenhum pedido cadastrado para esta conta.');
     },
     expand() { Navigation.go('orders'); },
     init() { this.render(); }
   };

   const Services = {
     renderFilters() {
       const cats = [{ v: 'all', l: 'Todos os serviços' }];
       const prices = [
         { v: 'all', l: t('price.all') }, { v: 'low', l: t('price.low') }, { v: 'mid', l: t('price.mid') }, { v: 'high', l: t('price.high') },
       ];
       const sorts = [
         { v: 'popular', l: 'Nome' },
         { v: 'priceAsc', l: t('sort.priceAsc') }, { v: 'priceDesc', l: t('sort.priceDesc') },
       ];
       const fill = (sel, opts, current) => {
         sel.innerHTML = opts.map((o) => `<option value="${o.v}" ${o.v === current ? 'selected' : ''}>${o.l}</option>`).join('');
       };
       fill($('#filter-category'), cats, state.category);
       fill($('#filter-price'), prices, state.priceRange);
       fill($('#filter-sort'), sorts, state.sort);
     },

     filtered() {
       let items = [...SERVICES];
       if (state.serviceTab === 'favorites') items = items.filter((s) => state.favorites.includes(s.id));

       const q = state.search.toLowerCase().trim();
       if (q) {
         items = items.filter((s) =>
           s.name.pt.toLowerCase().includes(q) || s.name.en.toLowerCase().includes(q) ||
           s.desc.pt.toLowerCase().includes(q) || s.desc.en.toLowerCase().includes(q));
       }
       if (state.category !== 'all') items = items.filter((s) => s.category === state.category);
       if (state.priceRange === 'low') items = items.filter((s) => s.priceMin <= 150);
       if (state.priceRange === 'mid') items = items.filter((s) => s.priceMin > 150 && s.priceMin <= 300);
       if (state.priceRange === 'high') items = items.filter((s) => s.priceMin > 300);

       const sorters = {
         popular: (a, b) => a.name.pt.localeCompare(b.name.pt),
         rating: (a, b) => b.rating - a.rating,
         priceAsc: (a, b) => a.priceMin - b.priceMin,
         priceDesc: (a, b) => b.priceMin - a.priceMin,
       };
       items.sort(sorters[state.sort]);
       return items;
     },

     render() {
       const D=window.DafixData;
       const items=Services.filtered();
       $('#services-empty').hidden=items.length>0;
       $('#services-empty-text').textContent='Nenhum serviço encontrado.';
       $('#fav-count').textContent=state.favorites.length;
       $('#services-grid').innerHTML=items.map(service=>`<article class="service-card"><h3>${D.escape(service.name[state.lang])}</h3><p>${D.escape(service.desc[state.lang])}</p><strong>${D.money(service.priceMin)}</strong><button class="btn btn--primary" data-request-service="${service.id}">Solicitar serviço</button><button class="btn btn--ghost" data-favorite="${service.id}">${state.favorites.includes(service.id)?'Remover dos favoritos':'Favoritar'}</button></article>`).join('');
       $$('[data-favorite]').forEach(button=>button.addEventListener('click',()=>Services.toggleFav(button.dataset.favorite)));
     },

     toggleFav(id) {
       const svc = serviceById(id);
       const wasFav = state.favorites.includes(id);
       state.favorites = wasFav ? state.favorites.filter((f) => f !== id) : [...state.favorites, id];
       storage.set('favorites.v2', state.favorites);
       Services.render();
       Overview.renderStats();
       Toast.show(`${svc.name[state.lang]} ${wasFav ? t('toast.favRemoved') : t('toast.favAdded')}`, wasFav ? 'info' : 'success');
     },

     goTab(tab) {
       state.serviceTab = tab;
       $$('#view-services .tab').forEach((b) => {
         const on = b.dataset.subtab === tab;
         b.classList.toggle('is-active', on);
         b.setAttribute('aria-selected', on);
       });
       Services.render();
       Tabs.placeAll();
     },

     init() {
       Services.renderFilters();
       $$('#view-services .tab').forEach((btn) => btn.addEventListener('click', () => Services.goTab(btn.dataset.subtab)));

       let debounce;
       $('#service-search').addEventListener('input', (e) => {
         clearTimeout(debounce);
         debounce = setTimeout(() => { state.search = e.target.value; Services.render(); }, 150);
       });
       $('#filter-category').addEventListener('change', (e) => { state.category = e.target.value; Services.render(); });
       $('#filter-price').addEventListener('change', (e) => { state.priceRange = e.target.value; Services.render(); });
       $('#filter-sort').addEventListener('change', (e) => { state.sort = e.target.value; Services.render(); });

       Services.render();
     },
   };

   /* ============================================================
      14. REPORTS — denúncia de serviço/profissional
      ============================================================ */
   const Reports = {
     render() { $('#reports-list').replaceChildren(); $('#reports-empty').hidden=false; },
   };
   const Rating = { openForPending() { Toast.show('Nenhuma avaliação disponível.'); } };

   const Toast = {
     show(message, type = 'info') {
       const container = $('#toast-container');
       const toast = document.createElement('div');
       toast.className = `toast toast--${type}`;
       toast.dataset.testid = 'toast';
       const icon = type === 'success' ? ICONS.check : ICONS.alert;
       toast.innerHTML = `<span class="toast__ic">${icon}</span><span class="toast__body">${escapeHtml(message)}</span>`;
       container.appendChild(toast);
       setTimeout(() => {
         toast.classList.add('is-out');
         toast.addEventListener('animationend', () => toast.remove(), { once: true });
       }, 3500);
     },
   };

   /* ============================================================
      17. MODAIS — helpers genéricos
      ============================================================ */
   const Modals = {
     open(id) {
       $('#' + id).classList.add('is-open');
       document.body.style.overflow = 'hidden';
     },
     close(id) {
       $('#' + id).classList.remove('is-open');
       if (!$$('.modal.is-open').length) document.body.style.overflow = '';
     },
     closeTop() {
       const open = $$('.modal.is-open');
       if (open.length) Modals.close(open[open.length - 1].id);
     },
     trapFocus(e) {
       const open = $$('.modal.is-open');
       if (!open.length) return;
       if (e.key === 'Escape') { Modals.closeTop(); return; }
       if (e.key !== 'Tab') return;
       const modal = open[open.length - 1];
       const focusables = $$('button, textarea, input, select', modal).filter((el) => !el.hidden && !el.disabled && el.offsetParent !== null);
       if (!focusables.length) return;
       const first = focusables[0];
       const last = focusables[focusables.length - 1];
       if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
       else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
     },
     init() {
       // Qualquer elemento com data-close fecha o modal correspondente
       $$('[data-close]').forEach((el) => el.addEventListener('click', () => Modals.close(el.dataset.close)));
       document.addEventListener('keydown', Modals.trapFocus);
     },
   };

   /* ============================================================
      18. INIT
      ============================================================ */
   document.addEventListener('DOMContentLoaded', () => {
     if (!session) return;
     Theme.init();
     Navigation.init();
     Tabs.init();
     Modals.init();
     Overview.init();
     NotifPanel.init();
     Profile.init();
     Photo.init();
     Orders.init();
     Services.init();
     document.addEventListener('dafix:order-created', async event => { await loadRegisteredData(); Navigation.go('orders'); Toast.show('Pedido #'+event.detail.id+' registrado.', 'success'); });
     Reports.render();

     Language.init();
     Language.rerenderAll();
     window.addEventListener('focus',loadRegisteredData);
     loadRegisteredData();
   });

   async function loadRegisteredData() {
     const D=window.DafixData;
     try {
       const [catalog, orders]=await Promise.all([D.list('/api/servicos'),D.orders(session)]);
       SERVICES=catalog.map(s=>({id:'service-'+s.id, name:{pt:s.nome_servico,en:s.nome_servico},desc:{pt:s.descricao || '',en:s.descricao || ''},priceMin:Number(s.preco_base),category:'all'}));
       state.orders=orders;
       state.favorites=state.favorites.filter(id=>SERVICES.some(s=>s.id===id));
       Overview.render();Orders.render();Services.render();Profile.fill();
       $('#notif-list').innerHTML='<li class="data-empty">Nenhuma notificação registrada.</li>';
       $('#notif-dropdown-list').innerHTML='<li class="data-empty">Nenhuma notificação registrada.</li>';
     } catch(error) {
       ['#recent-orders','#orders-list','#services-grid'].forEach(selector=>$(selector).innerHTML=D.empty(error.message));
       $('#stats-grid').innerHTML=D.empty('Resumo indisponível.');
       $('#services-empty').hidden=true;$('#orders-empty').hidden=true;
     }
   }
