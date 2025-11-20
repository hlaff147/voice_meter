# 🚀 PRIMEIROS PASSOS - Voice Meter

## ⚠️ IMPORTANTE: Instale as Dependências Primeiro!

Os erros que você está vendo no VS Code são normais - as bibliotecas ainda não foram instaladas. Siga os passos abaixo:

---

## 🔥 Setup Rápido (3 Opções)

### Opção 1: Docker (MAIS FÁCIL) 🐳

**Vantagem**: Tudo funciona sem instalar nada além do Docker.

```bash
# 1. Verifique se Docker está instalado
docker --version
docker-compose --version

# 2. Inicie tudo
docker-compose up

# 3. Pronto! Acesse:
# - Backend: http://localhost:8000/docs
# - Mobile: http://localhost:19006
```

**Nota**: Os erros do VS Code continuarão aparecendo, mas o código funcionará perfeitamente dentro do container!

---

### Opção 2: Scripts Automáticos 🤖

**Vantagem**: Scripts fazem todo o trabalho.

```bash
# 1. Setup completo (cria ambientes conda + instala tudo)
cd scripts
./setup_all.sh  # Mac/Linux

# 2. Inicia backend + mobile
./start_all.sh  # Mac/Linux

# 3. Pronto!
```

---

### Opção 3: Manual (Passo a Passo) 👨‍💻

**Vantagem**: Você entende cada passo.

#### Backend

```bash
# 1. Navegue para o backend
cd backend

# 2. Crie ambiente conda (se não existir)
conda env create -f environment.yml

# 3. Ative o ambiente
conda activate voice_meter_backend

# 4. Instale dependências
pip install -r requirements.txt

# 5. Inicie o backend
python main.py
```

Acesse: http://localhost:8000/docs

#### Mobile

**Em outro terminal:**

```bash
# 1. Navegue para o mobile
cd mobile

# 2. Crie ambiente conda (se não existir)
conda env create -f environment.yml

# 3. Ative o ambiente
conda activate voice_meter_mobile

# 4. Instale dependências
npm install

# 5. Inicie o app
npm start
```

Acesse: http://localhost:19006

---

## 📱 Como Usar o App

### 1. Abra o App Mobile

**No navegador:**
- Acesse http://localhost:19006
- Pressione "w" para abrir no navegador

**No celular:**
- Instale "Expo Go" (iOS/Android)
- Escaneie o QR code que aparece no terminal

### 2. Teste o Fluxo Completo

1. **Selecione uma categoria** (ex: "Apresentação")
2. **Toque no botão verde** de gravação
3. **Fale por 10-20 segundos** (exemplo: leia um texto em voz alta)
4. **Toque novamente** para parar
5. **Aguarde a análise** (alguns segundos)
6. **Veja seu resultado!**

### 3. Interprete os Resultados

**Exemplo de resultado:**
```
Velocidade: 145 PPM
Duração: 15.2s
Confiança: 87.5%
Feedback: ✅ Excelente! Sua velocidade está ideal...
```

**O que significa:**
- **PPM**: Palavras por minuto
- **Confiança**: Qualidade do áudio (> 70% é bom)
- **Feedback**: Se você está rápido, lento ou ideal

---

## 🎯 Dicas para Melhor Análise

### ✅ Faça

- Grave em lugar silencioso
- Fale claramente
- Grave pelo menos 15 segundos
- Segure o telefone próximo à boca
- Fale naturalmente (como faria na situação real)

### ❌ Evite

- Ambientes barulhentos
- Gravações muito curtas (< 10s)
- Pausas longas durante a gravação
- Falar muito longe do microfone
- Sussurrar ou gritar

---

## 🧪 Teste a API Diretamente

### Usando o Swagger UI

1. Acesse http://localhost:8000/docs
2. Teste o endpoint `GET /api/v1/speech/categories`
3. Teste o endpoint `POST /api/v1/speech/analyze` com um arquivo de áudio

### Usando cURL

```bash
# Listar categorias
curl http://localhost:8000/api/v1/speech/categories

# Analisar áudio (substitua pelo caminho do seu arquivo)
curl -X POST http://localhost:8000/api/v1/speech/analyze \
  -F "audio_file=@meu_audio.wav" \
  -F "category=presentation"
```

### Usando o Script de Teste

```bash
./test-api.sh
```

---

## 🐛 Problemas Comuns

### "Cannot find module 'expo-av'"

**Solução**:
```bash
cd mobile
npm install
```

### "Cannot import librosa"

**Solução**:
```bash
conda activate voice_meter_backend
pip install -r backend/requirements.txt
```

### Backend não inicia (porta 8000 ocupada)

**Solução**:
```bash
# Encontre o processo
lsof -i :8000  # Mac/Linux

# Mate o processo
kill -9 <PID>

# Ou use outra porta
uvicorn main:app --port 8001
```

### Mobile não conecta ao backend

**Solução**:
1. Verifique se backend está rodando: http://localhost:8000/health
2. No celular, use o IP da máquina ao invés de localhost
3. Edite `/mobile/src/config/index.ts`:
   ```typescript
   apiUrl: 'http://192.168.1.X:8000'  // Seu IP local
   ```

### Permissão de microfone negada

**Solução**:
- **iOS**: Settings > App > Microphone
- **Android**: Aceite quando solicitado
- **Web**: Permita no navegador (ícone de cadeado)

---

## 📊 Entendendo as Categorias

### 🎤 Apresentação (140-160 PPM)

**Quando usar**: Palestras, conferências, seminários

**Características**:
- Velocidade mais rápida
- Transmite autoridade
- Mantém atenção da audiência

**Exemplo**: Steve Jobs, TED Talks

### 💼 Pitch (120-150 PPM)

**Quando usar**: Vendas, propostas de negócio, entrevistas

**Características**:
- Equilíbrio entre persuasão e clareza
- Velocidade moderada
- Tempo para ênfases

**Exemplo**: Shark Tank, apresentações de startups

### 💬 Conversação Diária (100-130 PPM)

**Quando usar**: Conversas informais, podcasts, tutoriais

**Características**:
- Natural e relaxado
- Fácil de seguir
- Conversacional

**Exemplo**: Conversas entre amigos, vlogs

### ✨ Outros (110-140 PPM)

**Quando usar**: Contextos variados

**Características**:
- Versátil
- Para situações que não se encaixam nas outras

---

## 🎓 Aprenda Mais

### Sobre Velocidade de Fala

- **Muito devagar** (< 100 PPM): Pode parecer monótono ou inseguro
- **Ideal** (100-160 PPM): Depende do contexto
- **Muito rápido** (> 180 PPM): Difícil de acompanhar, perde clareza

### Sobre o Algoritmo

O Voice Meter usa:
1. **Librosa** para processar o áudio
2. **Onset Detection** para detectar sílabas
3. **Estimativa** de palavras (sílabas ÷ 2.7)
4. **Cálculo de PPM** baseado na duração

### Recursos

- [Librosa Documentation](https://librosa.org/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Expo Audio](https://docs.expo.dev/versions/latest/sdk/audio/)

---

## 🎯 Próximos Passos

### Para Usuários

1. Grave várias vezes em cada categoria
2. Compare seus resultados
3. Pratique atingir a faixa ideal
4. Use em situações reais (antes de apresentações, etc.)

### Para Desenvolvedores

1. Adicione banco de dados para histórico
2. Implemente autenticação
3. Crie gráficos de progresso
4. Adicione mais métricas (tom, pausas, etc.)

**Veja**: `IMPLEMENTATION_SUMMARY.md` para ideias completas

---

## 📞 Ajuda

Se encontrar problemas:

1. Verifique se as dependências foram instaladas
2. Veja a seção "Problemas Comuns" acima
3. Confira os logs do terminal
4. Leia os READMEs:
   - `README_VOICE_METER.md` - Overview completo
   - `VOICE_METER_GUIDE.md` - Guia detalhado
   - `IMPLEMENTATION_SUMMARY.md` - Detalhes técnicos

---

## ✅ Checklist de Setup

- [ ] Docker instalado (Opção 1) OU Conda + Node instalados (Opção 2/3)
- [ ] Dependências do backend instaladas (`pip install -r requirements.txt`)
- [ ] Dependências do mobile instaladas (`npm install`)
- [ ] Backend rodando em http://localhost:8000
- [ ] Mobile rodando em http://localhost:19006
- [ ] Testado fluxo completo (selecionar categoria → gravar → receber análise)

---

**🎉 Pronto! Agora você tem um analisador de fala completo e funcional!**

Divirta-se melhorando suas habilidades de comunicação! 🚀
