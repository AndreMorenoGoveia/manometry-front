# manometry-front

Interface para o classificador de manometria esofágica de alta resolução: o
médico arrasta o laudo, e a página devolve a classificação do exame pela
**Classificação de Chicago v4.0** junto do raciocínio — a distribuição entre as
oito classes, as portas da árvore de decisão com o número que abriu cada uma, o
resumo do estudo e as dez deglutições uma a uma.

Fala com [`manometry-back`](../manometry-back). Nenhum fato clínico é
codificado aqui: o texto das doenças, os rótulos das métricas e o desempenho do
modelo vêm da API, para que interface e modelo não possam divergir.

## Rodando

```bash
npm install
npm run dev        # http://localhost:5173
```

O servidor de desenvolvimento repassa `/api` para `http://127.0.0.1:8000`, então
o navegador fica numa origem só e o upload nunca negocia CORS. Para apontar
para outro backend:

```bash
VITE_API_TARGET=http://192.168.0.10:8000 npm run dev   # dev, via proxy
VITE_API_BASE=https://api.exemplo.org npm run build    # build, chamada direta
```

## Comandos

| comando | o que faz |
|---|---|
| `npm run dev` | servidor de desenvolvimento |
| `npm run build` | typecheck + build de produção em `dist/` |
| `npm run preview` | serve o build, com o mesmo proxy |
| `npm test` | suíte de unidade e integração (jsdom, sem servidor) |
| `npm run typecheck` | só o TypeScript |
| `npm run smoke` | end-to-end num navegador real, com os dois servidores no ar |

`npm test` roda numa checkout limpa: tudo que toca a rede é dublado. O
`npm run smoke` é que exige API, checkpoint e corpus — ele carrega a página,
percorre as oito entradas do atlas, envia um laudo de exemplo, confere o
diagnóstico que volta e falha se o console registrar qualquer erro ou se a
página rolar na horizontal a 360 px.

## Como é feito

- **React + TypeScript + Vite**, Tailwind v4 para os tokens de cor e tipografia.
- **Fundo em WebGL** (`TopographyField`): um shader de fragmento desenha uma
  topografia de pressão sintética — uma frente peristáltica descendo o corpo
  esofágico, a banda parada da junção, um bloom que segue o ponteiro. É um
  triângulo de tela cheia, sem geometria e sem bibliotecas 3D. O campo é
  renderizado abaixo da grade de pixels e reescalado pelo compositor, e se o
  primeiro segundo de quadros não alcança 24 fps ele cai de resolução mais uma
  vez em vez de engasgar. Sem WebGL, o elemento simplesmente não pinta e o
  gradiente CSS atrás dele sustenta a página.
- **A cor do diagnóstico contamina a página.** Cada classe tem um acento; ao
  fim de uma análise ele passa a tingir o shader, o medidor de confiança e as
  barras — a página inteira assume a cor daquele diagnóstico.
- **Rolagem suave com Lenis**, carregada sob demanda, desligada quando o leitor
  pediu movimento reduzido, e com os âncoras da página passando por ela para
  que os dois não animem a mesma posição ao mesmo tempo.
- **Revelação por `IntersectionObserver`** com transição em CSS, e não uma
  biblioteca de animação: menos JavaScript no caminho crítico e nada a
  sincronizar.
- **Imagens de referência reais.** Cada classe do atlas mostra uma deglutição
  da partição de teste, servida pela API. Quando o corpus não está montado, a
  API responde 404 e um esquema desenhado em SVG toma o lugar, de modo que a
  página nunca fica com imagem quebrada.

## Acessibilidade e resiliência

- Navegação por teclado com atalho para pular direto à análise, `aria-pressed`
  nas deglutições, `aria-current` no atlas, e `role="status"`/`role="alert"` no
  progresso e nos erros.
- `prefers-reduced-motion` desliga o loop do shader, a rolagem suave e as
  transições de revelação.
- Com a API fora do ar a página continua legível e diz o que está acontecendo;
  com a API no ar mas sem checkpoint, o upload é bloqueado e a mensagem explica
  qual variável de ambiente resolve.
