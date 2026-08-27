# manometry-front

Interface para o classificador de manometria esofágica de alta resolução. O
médico arrasta o laudo e a página devolve a classificação do exame pela
**Classificação de Chicago v4.0** junto do raciocínio: a distribuição entre as
oito classes, os critérios da v4.0 com o número que abriu cada um, o resumo do
estudo e as dez deglutições uma a uma.

Fala com [`manometry-back`](../manometry-back). Nenhum fato clínico é codificado
aqui. O texto das doenças, os rótulos das métricas, o desempenho por classe e as
imagens de referência vêm da API, para que interface e modelo não possam
divergir.

## Rodando

```bash
npm install
npm run dev        # http://localhost:5173
```

O servidor de desenvolvimento repassa `/api` para `http://127.0.0.1:8000`, então
o navegador fica numa origem só e o upload nunca negocia CORS. Para apontar
para outro backend, veja `.env.example`.

## Comandos

| comando | o que faz |
|---|---|
| `npm run dev` | servidor de desenvolvimento |
| `npm run build` | typecheck e build de produção em `dist/` |
| `npm run preview` | serve o build, com o mesmo proxy |
| `npm test` | suíte de unidade e integração (jsdom, sem servidor) |
| `npm run typecheck` | só o TypeScript |
| `npm run smoke` | end-to-end num navegador real, com os dois servidores no ar |

`npm test` roda numa checkout limpa: tudo que toca a rede é dublado. O
`npm run smoke` exige API, checkpoint e corpus. Ele carrega a página, percorre
as oito entradas do atlas, envia um laudo de exemplo, confere o diagnóstico que
volta e falha se o console registrar qualquer erro ou se a página rolar na
horizontal a 360 px.

## Deploy no Vercel

`vercel.json` já traz o build. O que precisa ser configurado:

**`VITE_API_BASE`** com a URL pública do backend, como variável de ambiente do
projeto. Ela é lida em tempo de build, então uma mudança exige novo deploy. Sem
ela a página chama `/api` na própria origem do Vercel, onde não há backend.

**CORS do lado do backend.** A página passa a chamar outro domínio, então o
Render precisa de `MANOMETRY_ALLOWED_ORIGINS` com o domínio de produção e de
`MANOMETRY_ALLOWED_ORIGIN_REGEX=https://.*\.vercel\.app` para os previews.

**Tempo de resposta.** Numa API sem GPU a análise leva dezenas de segundos e a
primeira do dia ainda espera o serviço acordar. O `fetch` do upload não tem
timeout próprio e o painel de progresso avisa o leitor quando passa de vinte
segundos. O Vercel não entra nesse caminho: a chamada vai do navegador direto
para o backend, sem passar por função serverless, então o limite de execução do
Vercel não se aplica.

**Imagens de referência e laudos de exemplo** vêm da API. Numa instância sem o
corpus montado elas respondem 404, o atlas cai para os esquemas em SVG e o botão
de laudo de exemplo não aparece. A página continua inteira.

## Como é feito

- **React, TypeScript e Vite**, com Tailwind v4 para os tokens de cor e
  tipografia.
- **Fundo em WebGL** (`TopographyField`): um shader de fragmento desenha uma
  topografia de pressão sintética, com uma frente peristáltica descendo o corpo
  esofágico, a banda parada da junção e um bloom que segue o ponteiro. É um
  triângulo de tela cheia, sem geometria e sem bibliotecas 3D. O campo é
  renderizado abaixo da grade de pixels e reescalado pelo compositor, e se o
  primeiro segundo de quadros não alcança 24 fps ele cai de resolução mais uma
  vez em vez de engasgar. Sem WebGL o elemento não pinta e o gradiente CSS atrás
  dele sustenta a página.
- **A cor do diagnóstico contamina a página.** Cada classe tem um acento; ao fim
  de uma análise ele passa a tingir o shader, o medidor de confiança e as
  barras.
- **Rolagem suave com Lenis**, carregada sob demanda, desligada quando o leitor
  pediu movimento reduzido, e com as âncoras da página passando por ela para que
  as duas não animem a mesma posição ao mesmo tempo.
- **Revelação por `IntersectionObserver`** com transição em CSS, e não uma
  biblioteca de animação: menos JavaScript no caminho crítico e nada a
  sincronizar.
- **Imagens de referência reais.** Cada classe do atlas mostra uma deglutição da
  partição de teste, servida pela API, com um esquema em SVG no lugar quando ela
  não está disponível.

## Acessibilidade e resiliência

- Navegação por teclado com atalho para pular direto à análise, `aria-pressed`
  nas deglutições, `aria-current` no atlas e `role="status"` ou `role="alert"`
  no progresso e nos erros.
- `prefers-reduced-motion` desliga o loop do shader, a rolagem suave e as
  transições de revelação.
- Com a API fora do ar a página continua legível e diz o que está acontecendo.
  Com a API no ar mas sem checkpoint, o upload é bloqueado e a mensagem explica
  qual variável de ambiente resolve.
