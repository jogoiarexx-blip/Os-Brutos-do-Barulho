# Os Brutus do Barulho

Run-and-gun 2D completo, original e bem-humorado. Explodir primeiro, perguntar depois! Abra por um servidor local (módulos ES precisam de HTTP):

```bash
python -m http.server 8080
```

Depois acesse a pasta do projeto pelo endereço exibido no servidor local.

## Conteúdo

- 20 fases em 5 capítulos, 20 chefes, objetivos, checkpoints e seleção de missão
- 6 personagens: 2 iniciais, 2 liberados ao zerar com os iniciais e 2 finais liberados ao zerar com o segundo grupo
- Progresso individual por personagem, visuais próprios e vantagens exclusivas
- Duas sprite sheets WebP por personagem: locomoção (30 quadros) e armas (25 quadros)
- Quadros recortados e centralizados individualmente, com margem segura e pés alinhados
- Atlas animado com 6 classes de inimigos: soldado, metralhador, drone, escudeiro, mutante e elite
- Sprites para jipe, tanque, mecha, refém, caixas de armas, vida, projéteis, granada e explosões
- Fase 1 com cenário próprio em WebP: porto em chamas, parallax, piso industrial e 12 tipos de objetos ambientais
- Chefe Colosso Ferroviário com 8 quadros, duas fases de combate, dano, explosão e carcaça
- Objetivos reais na fase 1: posto avançado com vida e torre, três resgates obrigatórios e arena final bloqueada
- Posto avançado com atlas próprio de 8 quadros, checkpoints com bandeiras, trilhos e destroços físicos
- Entrada cinematográfica do trem e teste automatizado do fluxo completo da primeira fase
- Fase 2 completa com selva tempestuosa em parallax, chuva, relâmpagos e piso próprio
- Três torres de rádio destrutíveis, escolta do Dr. Trovão com vida própria e portões por objetivo
- Mamute Ômega com atlas exclusivo de 8 quadros, ataque de plasma, dano, explosão e carcaça
- Fase 3 completa com cidadela em guerra, cinzas, holofotes, ruínas e piso fortificado
- Portão blindado destrutível e emboscada imperial com arena fechada e contagem real de alvos
- General Voss com atlas exclusivo de 8 quadros e padrões alternados de tiros em leque e ataques rasteiros
- Fase 4 no deserto com parallax, poeira, piso e adereços próprios; três depósitos sabotáveis e comboio blindado que exige imobilização e aproximação para captura
- Escorpião de Aço com atlas exclusivo de 4 poses (repouso, carga, ferrão e garras), ferrão de plasma e rajada rasteira
- Chefes das fases 1–4: preparo visível, quadro de impacto sincronizado ao projétil e recuperação; teste automatizado dos quatro atlas e dos disparos
- Fase 5 Cânion da Morte com parallax, piso e sprites próprios; três ninhos armados destrutíveis e escolta dos demolidores com vida própria
- Fortaleza Móvel Goliath com quatro poses em atlas WebP, ataques alternados de canhão e mísseis sincronizados com o sprite e teste de progressão até a fase 6
- Caixas e barris destrutíveis; barris vermelhos causam dano em área e caixas podem liberar armas ou vida
- Introdução protegida, ondas iniciais menores e disparos do chefe apontados para a posição do jogador
- Caminhada, corrida com Shift, pulo em etapas, agachar, dano, queda, levantar e vitória
- Rifle, metralhadora, escopeta, laser e lança-foguetes em pé e agachado
- Espelhamento em tempo real para olhar à esquerda sem duplicar imagens
- 6 classes inimigas, reféns, veículos e drops
- Rifle, metralhadora, escopeta, laser, lança-foguetes e granadas
- Pulo, esquiva, combo, partículas, screen shake e áudio sintetizado
- 4 dificuldades, upgrades permanentes e salvamento local
- Teclado, gamepad e controles de toque

## Controles

- A/D ou setas: mover
- W, seta para cima ou Espaço: pular
- Z/J: disparar
- X/K: granada
- Shift: correr
- C: esquiva
- Esc/Start: pausa

Os 20 arquivos de fases ficam em `fases/`; interface em `ui/`; motor modular em `js/`; recursos em `assets/`.
