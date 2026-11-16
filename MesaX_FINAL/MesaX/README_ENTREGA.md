# MesaX System — Pacote de entrega

Este pacote reúne **a versão funcional do MesaX System, preservada e congelada**, mais toda
a **documentação acadêmica e de apresentação** organizada na pasta [`docs/`](docs/).

> ⚠️ **Importante:** o código do Front-end, do Back-end e o banco de dados **não foram
> alterados**. Esta entrega apenas **acrescenta** documentação. Os 76 arquivos originais do
> sistema permanecem exatamente como na versão aprovada (verificado por checksum SHA-256).

## Como instalar e executar

Pré-requisitos: **Python 3.10+** e **Node.js 20+**.

```bash
# 1) dependências do back-end (Python + FastAPI)
pip install -r Back-end/requirements.txt

# 2) dependências do front-end e execução
cd Front-end
npm install
npm run dev
```

- Site (interface React): http://127.0.0.1:43123
- API (FastAPI): http://127.0.0.1:43124
- Login da equipe em `/equipe` — usuários: `cozinha`, `garcom`, `caixa`, `gerente`
- Senha de demonstração (todos): `caseirao` — **troque antes de um uso real**.

O banco SQLite (`Back-end/data/caseirao.db`) é criado e populado automaticamente na
primeira execução (15 produtos, 8 mesas, 4 usuários). O arquivo já acompanha o pacote.

Mais detalhes no [`README.md`](README.md) original do projeto.

## Organização do pacote

```
MesaX/
├── Back-end/            API Python + FastAPI, classes OO e banco SQLite   (original, intacto)
├── Front-end/           Interface React + Vite                            (original, intacto)
├── README.md            README original (execução)                        (original, intacto)
├── RELATORIO.md         Relatório técnico da equipe                       (original, intacto)
├── iniciar.sh           Script de inicialização                           (original, intacto)
├── .gitignore           Ignora node_modules, __pycache__, .venv, logs…    (original, intacto)
├── README_ENTREGA.md    Este arquivo (novo)
└── docs/                Documentação (novo)
    ├── README.md
    ├── Documentacao_Academica/   Documento acadêmico ABNT (.docx + .pdf)
    ├── Manual_de_Utilizacao/      Manual por perfil (.docx + .pdf)
    ├── Relatorio_Uso_IA/          Relatório de uso de IA (.docx + .pdf)
    ├── Apresentacao/              Slides (.pptx + .pdf), roteiro, guia, Q&A e glossário
    └── Diagramas/                 Figuras em alta resolução
```

## Para a apresentação
1. Slides: `docs/Apresentacao/APRESENTACAO_MESAX.pptx` (com notas do apresentador).
2. Roteiro por slide: `docs/Apresentacao/ROTEIRO_SLIDES_MESAX.docx`.
3. Estudo: `GUIA_APRESENTACAO_MESAX.pdf`, `PERGUNTAS_E_RESPOSTAS_MESAX.docx` e `GLOSSARIO_MESAX.docx`.

## Observações
- O projeto já inclui um `.gitignore` adequado; não há `node_modules`, caches ou `.env` com
  segredos no pacote (apenas `Front-end/.env.example`).
- Este pacote foi preparado para **upload manual** no GitHub pela própria equipe.
- Nenhum commit, push ou envio ao GitHub foi realizado.
