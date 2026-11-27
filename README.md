# CIMATEC jr | Aniversários do NPCP BOPE

Landing page do Núcleo de Projetos de Computação da CIMATEC jr para acompanhar os aniversários de Arthur Cunha e Duda Lombardi.

## Como funciona

- Os contadores mostram dias, horas, minutos e segundos no horário de Brasília.
- No dia do aniversário, o cartão exibe uma mensagem de parabéns. No dia seguinte, o contador passa para o próximo ano.
- As animações respeitam a preferência de movimento reduzido do navegador.
- O HTML inclui nomes, datas e metadados para busca e compartilhamento. O JavaScript atualiza apenas os contadores e o estado dos cartões.

## Executar localmente

Abra `dist/index.html` no navegador ou sirva a pasta `dist` com um servidor estático. A lógica dos contadores fica em `src/app.ts`. Após editá-la, rode `node build.mjs` com Node.js 24 para gerar `dist/app.js`.

## Armazenamento

A página usa a chave `npcpbope:birthday-records:v1` do `localStorage`. Em um navegador novo, a versão publicada grava apenas dia e mês. Registros locais já existentes com a data completa são preservados. O arquivo `aniversarios.local.json`, quando presente no workspace original, fica fora do Git e da pasta publicada.

## Publicação

Importe o repositório na Vercel. O arquivo `vercel.json` aponta para a pasta estática `dist`.
