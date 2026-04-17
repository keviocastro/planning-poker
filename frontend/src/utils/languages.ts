import * as Localization from 'expo-localization';

export const translations = {
  en: {
    "home.title": "Planning Poker",
    "home.subtitle": "Estimate stories & bugs together",
    "home.namePlaceholder": "Your Name",
    "home.roomPlaceholder": "Room ID (Optional)",
    "home.joinButton": "Join or Create Room",
    "home.nameError": "Please enter your name",
    "room.roomId": "ROOM ID",
    "room.participants": "Participants",
    "room.castVote": "Cast your vote",
    "room.resultsIn": "Results are in!",
    "room.reset": "Reset",
    "room.reveal": "Reveal Votes",
    "room.connecting": "Connecting...",
    "room.you": "(You)",
    "room.average": "Average",
    "room.voteCount": "vote",
    "room.voteCount_plural": "votes",
    "room.storyTitle": "Story Title or ID",
    "room.confirm": "Confirm & Save",
    "room.history": "Session History",
    "room.noHistory": "No stories estimated yet",
    "room.close": "Close",
    "room.leave": "Leave Room",
    "splash.title": "Planning Poker",
    "splash.subtitle": "Let's get estimating!"
  },
  pt: {
    "home.title": "Planning Poker",
    "home.subtitle": "Estime histórias e bugs juntos",
    "home.namePlaceholder": "Seu Nome",
    "home.roomPlaceholder": "ID da Sala (Opcional)",
    "home.joinButton": "Entrar ou Criar Sala",
    "home.nameError": "Por favor, digite seu nome",
    "room.roomId": "ID DA SALA",
    "room.participants": "Participantes",
    "room.castVote": "Dê seu voto",
    "room.resultsIn": "Resultados liberados!",
    "room.reset": "Reiniciar",
    "room.reveal": "Revelar Votos",
    "room.connecting": "Conectando...",
    "room.you": "(Você)",
    "room.average": "Média",
    "room.voteCount": "voto",
    "room.voteCount_plural": "votos",
    "room.storyTitle": "Título ou ID da História",
    "room.confirm": "Confirmar e Gravar",
    "room.history": "Histórico da Sessão",
    "room.noHistory": "Nenhuma história estimada ainda",
    "room.close": "Fechar",
    "room.leave": "Sair / Nova Sala",
    "splash.title": "Planning Poker",
    "splash.subtitle": "Bora estimar!"
  }
};

export const deviceLanguage = Localization.getLocales()[0].languageCode ?? 'en';
export const selectedMessages = translations[deviceLanguage as keyof typeof translations] || translations.en;
