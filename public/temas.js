const TEMAS = [
  {
    tema: "Desafios para o combate à desinformação nas redes sociais no Brasil",
    textos: [
      "Pesquisas recentes apontam que boa parte dos brasileiros já compartilhou, ao menos uma vez, uma notícia falsa sem verificar a fonte antes. O ritmo acelerado das redes sociais favorece a viralização de conteúdos antes mesmo de sua veracidade ser checada.",
      "Iniciativas de checagem de fatos (fact-checking) têm crescido no país, mas ainda esbarram na velocidade com que boatos se espalham e na dificuldade de alcançar quem mais consome esse tipo de conteúdo.",
    ],
  },
  {
    tema: "Caminhos para a valorização da saúde mental no ambiente escolar",
    textos: [
      "O aumento de casos de ansiedade e depressão entre adolescentes tem levado escolas a repensar seu papel no cuidado emocional dos estudantes, para além do ensino de conteúdos formais.",
      "Especialistas apontam que a ausência de espaços de escuta e de profissionais de psicologia na rede pública dificulta a identificação precoce de sofrimento psíquico entre jovens.",
    ],
  },
  {
    tema: "O problema da mobilidade urbana nas grandes cidades brasileiras",
    textos: [
      "O tempo médio gasto no trajeto casa-trabalho nas grandes metrópoles brasileiras está entre os maiores do mundo, afetando a qualidade de vida e a produtividade da população.",
      "A dependência do transporte individual motorizado, aliada à baixa qualidade do transporte público, agrava os congestionamentos e a poluição do ar nos centros urbanos.",
    ],
  },
  {
    tema: "Desafios para o descarte adequado de lixo eletrônico no Brasil",
    textos: [
      "O Brasil está entre os maiores geradores de lixo eletrônico do mundo, mas ainda carece de pontos de coleta acessíveis à maior parte da população.",
      "Componentes de aparelhos eletrônicos descartados de forma incorreta podem liberar metais pesados no solo e na água, representando risco à saúde pública e ao meio ambiente.",
    ],
  },
  {
    tema: "A invisibilidade da pessoa com deficiência no mercado de trabalho brasileiro",
    textos: [
      "Ainda que a legislação brasileira preveja cotas para pessoas com deficiência em empresas de médio e grande porte, muitas vagas seguem não preenchidas por falta de acessibilidade e de qualificação direcionada.",
      "Barreiras arquitetônicas, atitudinais e de comunicação continuam limitando o acesso pleno de pessoas com deficiência a oportunidades profissionais no país.",
    ],
  },
  {
    tema: "Desafios para a valorização do professor na educação básica brasileira",
    textos: [
      "Levantamentos mostram que a carreira docente tem perdido atratividade entre os jovens, muitas vezes associada a salários baixos e condições de trabalho desgastantes.",
      "Países com melhor desempenho em avaliações educacionais internacionais costumam investir fortemente na formação continuada e na valorização salarial de seus professores.",
    ],
  },
  {
    tema: "O envelhecimento populacional e os desafios para o cuidado com idosos no Brasil",
    textos: [
      "O Brasil caminha para se tornar um país com proporção significativa de idosos na população total nas próximas décadas, exigindo adaptações em políticas públicas de saúde e assistência social.",
      "A solidão e o abandono afetivo estão entre os principais problemas enfrentados por parte da população idosa, mesmo quando suas necessidades materiais básicas estão atendidas.",
    ],
  },
  {
    tema: "Desafios para a democratização do acesso à cultura no Brasil",
    textos: [
      "Grande parte dos municípios brasileiros não possui equipamentos culturais básicos, como bibliotecas públicas, cinemas ou teatros, concentrando a oferta cultural nos grandes centros urbanos.",
      "O acesso à internet ampliou o consumo de conteúdo cultural digital, mas também evidenciou desigualdades relacionadas ao custo de conectividade e de dispositivos entre diferentes classes sociais.",
    ],
  },
  {
    tema: "O combate ao preconceito linguístico no Brasil",
    textos: [
      "Variações linguísticas regionais e populares são frequentemente associadas, de forma equivocada, à falta de instrução, o que reforça estigmas sociais contra quem as utiliza.",
      "Linguistas defendem que não existe uma forma de falar 'errada', mas sim variedades adequadas a diferentes contextos sociais, e que a valorização exclusiva da norma culta pode reforçar desigualdades.",
    ],
  },
  {
    tema: "Desafios para a segurança alimentar da população brasileira",
    textos: [
      "Mesmo em um país reconhecido como grande produtor agrícola, parte significativa da população brasileira ainda enfrenta insegurança alimentar em algum grau.",
      "O acesso a alimentos saudáveis e nutritivos é desigual entre regiões e classes sociais, favorecendo o consumo de produtos ultraprocessados nas periferias urbanas.",
    ],
  },
  {
    tema: "A dependência excessiva de telas entre crianças e adolescentes",
    textos: [
      "O tempo médio de exposição a telas entre crianças e adolescentes brasileiros tem crescido nos últimos anos, levantando preocupações sobre os efeitos no desenvolvimento cognitivo e social.",
      "Especialistas em desenvolvimento infantil recomendam limites de uso de telas por faixa etária, mas famílias enfrentam dificuldades práticas para fazer cumprir essas recomendações no dia a dia.",
    ],
  },
  {
    tema: "Desafios para a preservação do patrimônio histórico e cultural no Brasil",
    textos: [
      "Incêndios e desabamentos em prédios históricos nos últimos anos escancararam a fragilidade da política de conservação do patrimônio no país.",
      "A falta de recursos destinados à manutenção de museus, arquivos e sítios históricos compromete a preservação da memória coletiva das próximas gerações.",
    ],
  },
];

function romano(n) {
  return ["I", "II", "III", "IV", "V"][n - 1] || String(n);
}

function indiceTemaAleatorio(indiceAtual) {
  if (TEMAS.length <= 1) return 0;
  let novo = indiceAtual;
  while (novo === indiceAtual) {
    novo = Math.floor(Math.random() * TEMAS.length);
  }
  return novo;
}
