# Operação Parabéns | Aniversários do NPCP

Agenda de aniversários do Núcleo de Projetos de Computação da CIMATEC jr.

[Site em produção](https://contagem-de-aniversario-bope.vercel.app/) · [Código no GitHub](https://github.com/arthurcunha88/contagem-de-aniversario-bope)

## A agenda

- A contagem regressiva usa o horário de Brasília. No dia do aniversário, o cartão mostra uma mensagem comemorativa. No dia seguinte, começa a contagem para a próxima ocorrência.
- O próximo aniversário recebe destaque. A agenda pode ser ordenada por proximidade ou por nome. Arthur Cunha, criador do site e CEO da operação, tem um cartão fixo no topo. André Rangel e Pedro Mascarenhas têm cartões de destaque da gerência.
- Cada cartão abre um perfil com avatar ilustrado, nome completo quando confirmado e dia e mês do aniversário. O perfil pode ser fechado pelo botão, pela tecla Esc ou por um clique no fundo.
- A interface inclui paletas verde-oliva e noturna, um rádio-robô interativo e três emblemas que filtram a agenda por todos os perfis, próximos 30 dias ou destaques. As animações respeitam a preferência de movimento reduzido do navegador.

## Desenvolvimento local

Use Node.js 24. O projeto é estático e o script de build usa apenas APIs do Node.js.

```sh
node build.mjs
node --check dist/app.js
```

Abra `dist/index.html` no navegador ou sirva a pasta `dist` com um servidor estático.

| Arquivo | Função |
| --- | --- |
| `dist/index.html` | Agenda, marcação dos perfis e metadados para busca e compartilhamento |
| `dist/style.css` | Layout, paletas e animações |
| `src/app.ts` | Contagem, ordenação, preferências e abertura dos perfis |
| `build.mjs` | Gera `dist/app.js` a partir do TypeScript |
| `vercel.json` | Define `dist` como pasta publicada |

## Atualizar a agenda

Edite ou adicione um cartão em `dist/index.html`. Use um identificador único em `data-member`, informe o nome de exibição no título e use `data-full-name` quando o nome completo estiver confirmado. Preencha o elemento `time` com o dia e o mês visíveis e com `datetime="MM-DD"`. O TypeScript lê a data diretamente do cartão.

A agenda combina os membros confirmados no cruzamento das duas planilhas com as inclusões e exclusões solicitadas. O site e o repositório público guardam apenas dia e mês das datas de nascimento. O arquivo local `aniversarios.local.json`, quando presente, é ignorado pelo Git e fica fora da pasta publicada. O navegador usa `localStorage` para a preferência de paleta e os registros locais de aniversário.

## Publicação na Vercel

Se houver mudanças no TypeScript, gere e inclua o `dist/app.js` no commit. Envie as alterações para a branch `main` do GitHub e use o commit como origem do deploy de produção na Vercel. Confira se o deploy ficou pronto e se aponta para o SHA esperado.
