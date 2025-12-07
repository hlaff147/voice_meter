# 🎤 Medidor de Voz

Aplicação para treinamento de apresentações e análise de fala utilizando inteligência artificial.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Docker](https://img.shields.io/badge/docker-ready-blue)

## 📋 Visão Geral

O **Medidor de Voz** é uma ferramenta que ajuda você a melhorar suas habilidades de apresentação. Você digita o texto que pretende falar, grava sua apresentação, e o sistema compara sua fala com o texto esperado utilizando a API Whisper da OpenAI.

### ✨ Funcionalidades

- 📝 **Entrada de Texto** - Digite o texto que você pretende falar
- 🎙️ **Gravação de Áudio** - Grave sua apresentação diretamente no navegador
- 🤖 **Transcrição com IA** - Transcrição automática usando OpenAI Whisper
- 📊 **Comparação Git-Diff** - Visualização lado a lado com cores verde/vermelho
- 🔊 **Gráfico de Volume** - Visualização do volume do áudio ao longo do tempo
- 📈 **Métricas de Fala** - Velocidade (PPM), pausas detectadas, duração
- 💬 **Feedback Inteligente** - Recomendações personalizadas baseadas na análise
- 📜 **Histórico** - Acompanhe sua evolução ao longo do tempo
- 📊 **Estatísticas** - Visualize seu progresso com gráficos

## 🏗️ Arquitetura

![Arquitetura do Voice Meter](docs/diagrams/architecture.png)

## 🛠️ Tecnologias

### Backend
- **Python 3.11** - Linguagem principal
- **FastAPI** - Framework web assíncrono
- **Librosa** - Análise de áudio (volume, pausas, velocidade)
- **OpenAI Whisper API** - Transcrição de fala
- **SQLAlchemy** - ORM para banco de dados
- **SQLite** - Banco de dados local
- **Pydub** - Conversão de formatos de áudio

### Frontend
- **React Native** - Framework mobile/web
- **Expo** - Plataforma de desenvolvimento
- **Expo Router** - Navegação baseada em arquivos
- **Expo AV** - Gravação de áudio
- **TypeScript** - Tipagem estática

### DevOps
- **Docker** - Containerização
- **Docker Compose** - Orquestração de serviços

## 🚀 Instalação

### Pré-requisitos

- [Docker](https://www.docker.com/) e [Docker Compose](https://docs.docker.com/compose/)
- [Node.js 18+](https://nodejs.org/) (para desenvolvimento local)
- Chave de API da OpenAI

### Usando Docker (Recomendado)

1. **Clone o repositório**
```bash
git clone https://github.com/hlaff147/voice_meter.git
cd voice_meter
```

2. **Configure as variáveis de ambiente**
```bash
cp .env.example .env
# Edite o arquivo .env e adicione sua OPENAI_API_KEY
```

3. **Inicie os containers**
```bash
docker-compose up --build -d
```

4. **Acesse a aplicação**
- Frontend: http://localhost:8081
- Backend API: http://localhost:8000
- Documentação API: http://localhost:8000/docs

### Desenvolvimento Local

#### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Linux/Mac
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

#### Frontend
```bash
cd mobile
npm install
npm run web
```

## 📱 Uso

### 1. Tela Inicial
- Clique em **"Iniciar Treinamento"** para começar

### 2. Digite seu Texto
- Escreva o texto que você pretende falar na apresentação
- Clique em **"Continuar para Gravação"**

### 3. Grave seu Áudio
- Clique no botão de microfone para iniciar a gravação
- Leia o texto em voz alta
- Clique novamente para parar a gravação

### 4. Analise os Resultados
- **Comparação de Textos**: Veja lado a lado o texto esperado e o transcrito
  - 🟢 Verde: palavras corretas
  - 🔴 Vermelho: palavras diferentes ou não detectadas
- **Gráfico de Volume**: Visualize a intensidade do áudio
- **Métricas**: Velocidade (PPM), pausas, duração
- **Feedback**: Mensagem personalizada com recomendações

### 5. Ver Detalhes
- Clique em **"Ver Detalhes Completos"** para mais informações
- Acesse o **Histórico** para ver gravações anteriores

## 🔌 API Endpoints

### Análise de Fala
```http
POST /api/v1/speech/analyze
Content-Type: multipart/form-data

file: <arquivo de áudio>
category: presentation|pitch|conversation|other
expected_text: <texto esperado>
```

**Resposta:**
```json
{
  "recording_id": 1,
  "transcribed_text": "...",
  "expected_text": "...",
  "similarity_ratio": 0.95,
  "words_per_minute": 145,
  "pause_count": 5,
  "duration_seconds": 30.5,
  "volume_data": [65.2, 70.1, ...],
  "missing_words": ["palavra1", "palavra2"],
  "feedback": "Excelente pronúncia!"
}
```

### Gravações
```http
GET /api/v1/recordings/recordings
GET /api/v1/recordings/recordings/{id}
GET /api/v1/recordings/statistics
```

### Categorias
```http
GET /api/v1/speech/categories
```

## 📁 Estrutura do Projeto

```
voice_meter/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── endpoints/
│   │   │       ├── health.py
│   │   │       ├── recordings.py
│   │   │       └── speech.py
│   │   ├── core/
│   │   │   └── config.py
│   │   ├── db/
│   │   │   ├── base.py
│   │   │   └── init_db.py
│   │   ├── models/
│   │   │   ├── recording.py
│   │   │   └── speech.py
│   │   ├── schemas/
│   │   │   └── speech.py
│   │   └── services/
│   │       ├── speech_analyzer.py
│   │       ├── speech_analysis_service.py
│   │       └── transcription_service.py
│   ├── Dockerfile
│   ├── main.py
│   └── requirements.txt
├── mobile/
│   ├── app/
│   │   ├── _layout.tsx
│   │   ├── index.tsx
│   │   ├── recording.tsx
│   │   ├── recording-detail.tsx
│   │   ├── history.tsx
│   │   └── statistics.tsx
│   ├── src/
│   │   ├── config/
│   │   │   └── index.ts
│   │   └── services/
│   │       └── api.ts
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
├── docker-compose.yml
├── Makefile
└── README.md
```

## ⚙️ Configuração

### Variáveis de Ambiente

| Variável | Descrição | Padrão |
|----------|-----------|--------|
| `OPENAI_API_KEY` | Chave da API OpenAI | (obrigatório) |
| `DATABASE_URL` | URL do banco de dados | `sqlite:///./voice_meter.db` |
| `BACKEND_PORT` | Porta do backend | `8000` |
| `FRONTEND_PORT` | Porta do frontend | `8081` |

### Categorias de Fala

| Categoria | Velocidade Ideal (PPM) |
|-----------|------------------------|
| Apresentação | 140-160 |
| Pitch | 120-150 |
| Conversação | 100-130 |

## 🧪 Testes

```bash
# Backend
cd backend
pytest tests/

# Frontend
cd mobile
npm test
```

## 🐳 Comandos Docker

```bash
# Iniciar serviços
docker-compose up -d

# Ver logs
docker-compose logs -f

# Parar serviços
docker-compose down

# Reconstruir
docker-compose up --build -d

# Limpar volumes
docker-compose down -v
```

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 🤝 Contribuindo

1. Faça um Fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📞 Suporte

- Abra uma [Issue](https://github.com/hlaff147/voice_meter/issues)

---

Feito com ❤️ para melhorar suas apresentações!
