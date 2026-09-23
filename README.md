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
- C/Shift: esquiva
- Esc/Start: pausa

Os 20 arquivos de fases ficam em `fases/`; interface em `ui/`; motor modular em `js/`; recursos em `assets/`.
