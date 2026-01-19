# Instalación de Dependencias para Soporte Multimodal

## Backend (Node.js + TypeScript)

### Dependencias Requeridas

```bash
cd backend-p1sw1

# Multer - Para manejo de uploads multipart/form-data
npm install multer
npm install --save-dev @types/multer

# Form-Data - Para enviar archivos a APIs externas
npm install form-data

# Axios - Para llamadas HTTP a servicios de transcripción (si no está)
npm install axios

# (Opcional) Google Cloud Speech - Solo si usas Google
npm install @google-cloud/speech

# (Opcional) Sharp - Para procesar imágenes (dimensiones, compresión)
npm install sharp
```

### Verificar package.json

Asegúrate que `package.json` tenga estas dependencias:

```json
{
  "dependencies": {
    "express": "^4.18.2",
    "multer": "^1.4.5-lts.1",
    "form-data": "^4.0.0",
    "axios": "^1.6.0",
    "sharp": "^0.33.0"
  },
  "devDependencies": {
    "@types/multer": "^1.4.11",
    "@types/express": "^4.17.21"
  }
}
```

## Frontend (Angular 18)

No requiere dependencias adicionales. Usa APIs nativas del navegador:
- `MediaRecorder` - Grabación de audio
- `FileReader` / `FormData` - Manejo de archivos
- `HttpClient` - Upload multipart

## Servicios de Transcripción

### OpenAI Whisper

```bash
# Ya incluido en llamadas axios
# Solo necesitas OPENAI_API_KEY en .env
```

### AssemblyAI (Recomendado)

```bash
# Ya incluido en llamadas axios
# Solo necesitas ASSEMBLYAI_API_KEY en .env
```

### Deepgram

```bash
# Ya incluido en llamadas axios
# Solo necesitas DEEPGRAM_API_KEY en .env
```

### Google Cloud Speech-to-Text

```bash
npm install @google-cloud/speech

# Descargar service account JSON de Google Cloud Console
# Configurar GOOGLE_CLOUD_KEY_PATH en .env
```

### Whisper Local (Sin API, gratis)

Opción 1 - Python (más lento pero completo):
```bash
pip install openai-whisper
# Requiere: ffmpeg, Python 3.8+
```

Opción 2 - whisper.cpp (más rápido):
```bash
# Linux/Mac
git clone https://github.com/ggerganov/whisper.cpp
cd whisper.cpp
make

# Descargar modelo
bash ./models/download-ggml-model.sh base

# Usar desde Node.js via child_process
```

## Instalación Completa

```bash
# Backend
cd backend-p1sw1
npm install

# Frontend
cd ../official-sw1p1
npm install

# Iniciar servicios
docker-compose up -d  # PostgreSQL
cd backend-p1sw1 && npm start
cd ../official-sw1p1 && npm start
```

## Configuración de Variables de Entorno

Crea `backend-p1sw1/.env`:

```env
# Base de datos
DB_HOST=localhost
DB_PORT=5432
DB_NAME=parcial1sw1
DB_USER=postgres
DB_PASSWORD=your_password

# IA Principal (obligatorio para análisis de imágenes)
ANTHROPIC_API_KEY=sk-ant-xxxxx

# Transcripción (elige UNO)
ASSEMBLYAI_API_KEY=xxxxx           # Recomendado
# O
OPENAI_API_KEY=sk-xxxxx            # Alternativa
# O
DEEPGRAM_API_KEY=xxxxx             # Más rápida
# O
GOOGLE_CLOUD_KEY_PATH=/path/to/service-account.json  # 60min gratis/mes
# O deja vacío para usar Whisper local

# (Opcional) Especificar provider
TRANSCRIPTION_PROVIDER=assemblyai  # 'openai', 'deepgram', 'google', 'whisper-local'
```

## Verificar Instalación

```bash
# Backend
cd backend-p1sw1
npm run dev

# Deberías ver:
# ✅ Servidor corriendo en puerto 3000
# 🎤 Transcripción configurada: [tu-servicio]
# ✅ PostgreSQL conectado

# Frontend
cd official-sw1p1
npm start

# Abrir http://localhost:4200
```

## Costos Estimados

### Por mensaje multimodal (audio 1min + imagen):

| Servicio | Transcripción | Análisis IA | Total |
|----------|---------------|-------------|-------|
| AssemblyAI + Claude | $0.015 | $0.003 | **$0.018** |
| Whisper + Claude | $0.006 | $0.003 | **$0.009** |
| Deepgram + Claude | $0.004 | $0.003 | **$0.007** |
| Whisper Local + Claude | $0 | $0.003 | **$0.003** |

**1000 mensajes con audio+imagen = $3-18 USD**

## Troubleshooting

### Error: "Module 'multer' not found"
```bash
cd backend-p1sw1
npm install multer @types/multer
```

### Error: "Cannot find module 'form-data'"
```bash
npm install form-data
```

### Error: "whisper: command not found"
```bash
# Instalar Whisper local (Python)
pip install openai-whisper

# O usar otro servicio en .env
TRANSCRIPTION_PROVIDER=assemblyai
```

### Error: "ENOENT: no such file or directory, open '/uploads/...'"
```bash
# El directorio se crea automáticamente al iniciar el servidor
# Verificar permisos de escritura
mkdir -p backend-p1sw1/uploads
chmod 755 backend-p1sw1/uploads
```
