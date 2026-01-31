// src/firebase/config.ts

// IMPORTANTE: A falha de login ('auth/api-key-not-valid') acontece porque os valores abaixo estão incorretos.
// Por segurança, EU NÃO TENHO ACESSO às suas chaves secretas. É necessário que você, como dono do projeto,
// copie e cole os valores corretos do seu painel Firebase.

// SIGA ESTES PASSOS:
// 1. Acesse o Firebase Console: https://console.firebase.google.com/
// 2. Selecione seu projeto: 'engear---depto-comercial-v3'
// 3. Clique no ícone de engrenagem (Configurações do projeto) ao lado de 'Visão geral do projeto'.
// 4. Na aba "Geral", role para baixo até a seção "Seus apps".
// 5. Selecione o seu aplicativo da Web (ícone </ >).
// 6. Você verá um objeto de configuração `firebaseConfig`. Copie e cole os valores nos campos abaixo.

export const firebaseConfig = {
  // Cole o valor de 'apiKey' do seu projeto Firebase aqui.
  apiKey: "COLE_SUA_API_KEY_AQUI",

  // O Auth Domain deve estar correto.
  authDomain: "engear---depto-comercial-v3.firebaseapp.com",

  // O Project ID deve estar correto.
  projectId: "engear---depto-comercial-v3",

  // O Storage Bucket deve estar correto.
  storageBucket: "engear---depto-comercial-v3.appspot.com",

  // Cole o valor de 'messagingSenderId' do seu projeto Firebase aqui.
  messagingSenderId: "COLE_SEU_MESSAGING_SENDER_ID_AQUI",

  // Cole o valor de 'appId' do seu projeto Firebase aqui.
  appId: "COLE_SEU_APP_ID_AQUI",

  // Cole o valor de 'measurementId' do seu projeto Firebase aqui (opcional, mas recomendado).
  measurementId: "COLE_SEU_MEASUREMENT_ID_AQUI"
};
