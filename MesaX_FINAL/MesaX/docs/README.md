# Documentação acadêmica — MesaX System

Esta pasta reúne os materiais acadêmicos e de apresentação do projeto. **Ela não faz
parte da execução do sistema**: é apenas documentação. Nenhum arquivo do sistema
(Front-end, Back-end ou banco de dados) foi alterado para incluí-la.

## Estrutura

### 📄 Documentacao_Academica/
Documento acadêmico completo (ABNT), em `.docx` (editável) e `.pdf`. Conta a evolução
real do projeto em três fases, a modelagem, a arquitetura, o banco, as funcionalidades,
os testes e a Seção 17 (contingência para falha no banco — Roleta do Caos).

### 📘 Manual_de_Utilizacao/
Passo a passo por perfil (Cliente, Cozinha, Garçom, Caixa e Gerente), em `.docx` e `.pdf`.

### 🤖 Relatorio_Uso_IA/
Relatório formal de utilização de inteligência artificial (ChatGPT e Claude), em `.docx`
e `.pdf`, com o papel real de cada ferramenta e a participação humana.

### 🎤 Apresentacao/
- `APRESENTACAO_MESAX.pptx` / `.pdf` — **apresentação visual** (9 slides, pouco texto,
  para guiar a fala). Cada slide tem **notas do apresentador**.
- `ROTEIRO_SLIDES_MESAX.docx` — roteiro slide a slide (quem explica, o que entender e uma
  fala de referência).
- `GUIA_APRESENTACAO_MESAX.docx` / `.pdf` — material de estudo aprofundado: explicações
  técnicas aplicadas, Vibe Coding e roteiro oral detalhado.
- `PERGUNTAS_E_RESPOSTAS_MESAX.docx` — 32 perguntas e respostas.
- `GLOSSARIO_MESAX.docx` — glossário técnico (25 termos).

### 🖼️ Diagramas/
Figuras em alta resolução: evolução, arquitetura, casos de uso, classes, modelo ER,
estados, contingência, fluxo do pedido (vertical e horizontal) e trio tecnológico.

## Observações importantes (honestidade técnica)
- **Implementado**: pedido pela mesa, cozinha, garçom, caixa e relatórios do gerente.
- **Apenas proposto** (não implementado): o plano de contingência do banco (backup,
  recuperação e testes de falha), decorrente da Roleta do Caos.
- Os números de teste (54 de API + 13 HTTP) são os **relatados pelo Claude**, não testes
  executados manualmente pela equipe. A equipe executou o projeto no Replit e confirmou
  o funcionamento.
- No fluxo real, **quem registra o pedido é o cliente**, pela mesa — não o garçom.
