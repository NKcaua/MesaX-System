#!/bin/bash
# Roda uma vez, quando o Codespace é criado: instala as dependências.
set -e
cd "$(dirname "$0")/.."

echo "== Instalando dependências do back-end (Python) =="
pip install -r Back-end/requirements.txt

echo "== Instalando dependências do front-end (Node) =="
cd Front-end
npm install

echo "== Pronto =="
