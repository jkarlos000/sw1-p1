/**
 * Servicio de Transcripción Multi-Provider
 * Soporta: OpenAI Whisper, AssemblyAI, Deepgram, Google Cloud, Whisper Local
 */

import fs from 'fs';
import FormData from 'form-data';
import axios from 'axios';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface TranscriptionResult {
    texto: string;
    duracionSegundos?: number;
    idioma?: string;
    confianza?: number;
    metadata?: any;
}

export type TranscriptionProvider = 'openai' | 'assemblyai' | 'deepgram' | 'google' | 'whisper-local';

export class TranscriptionService {
    
    private provider: TranscriptionProvider;
    private apiKey?: string;
    
    constructor() {
        // Determinar provider basado en variables de entorno
        this.provider = this.detectProvider();
        this.apiKey = this.getApiKey();
    }
    
    /**
     * Detecta qué servicio usar basado en API keys disponibles
     */
    private detectProvider(): TranscriptionProvider {
        const preference = process.env.TRANSCRIPTION_PROVIDER as TranscriptionProvider;
        
        if (preference && this.isProviderAvailable(preference)) {
            return preference;
        }
        
        // Fallback automático
        if (process.env.OPENAI_API_KEY) return 'openai';
        if (process.env.ASSEMBLYAI_API_KEY) return 'assemblyai';
        if (process.env.DEEPGRAM_API_KEY) return 'deepgram';
        if (process.env.GOOGLE_CLOUD_KEY_PATH) return 'google';
        
        // Si no hay API keys, intentar Whisper local
        return 'whisper-local';
    }
    
    private isProviderAvailable(provider: TranscriptionProvider): boolean {
        switch (provider) {
            case 'openai': return !!process.env.OPENAI_API_KEY;
            case 'assemblyai': return !!process.env.ASSEMBLYAI_API_KEY;
            case 'deepgram': return !!process.env.DEEPGRAM_API_KEY;
            case 'google': return !!process.env.GOOGLE_CLOUD_KEY_PATH;
            case 'whisper-local': return true; // Siempre disponible si está instalado
            default: return false;
        }
    }
    
    private getApiKey(): string | undefined {
        switch (this.provider) {
            case 'openai': return process.env.OPENAI_API_KEY;
            case 'assemblyai': return process.env.ASSEMBLYAI_API_KEY;
            case 'deepgram': return process.env.DEEPGRAM_API_KEY;
            default: return undefined;
        }
    }
    
    /**
     * Transcribir audio usando el provider configurado
     */
    async transcribe(audioPath: string): Promise<TranscriptionResult> {
        console.log(`🎤 Transcribiendo con ${this.provider}...`);
        
        try {
            switch (this.provider) {
                case 'openai':
                    return await this.transcribeWithOpenAI(audioPath);
                case 'assemblyai':
                    return await this.transcribeWithAssemblyAI(audioPath);
                case 'deepgram':
                    return await this.transcribeWithDeepgram(audioPath);
                case 'google':
                    return await this.transcribeWithGoogle(audioPath);
                case 'whisper-local':
                    return await this.transcribeWithWhisperLocal(audioPath);
                default:
                    throw new Error(`Provider ${this.provider} no soportado`);
            }
        } catch (error: any) {
            console.error(`❌ Error transcribiendo con ${this.provider}:`, error.message);
            throw error;
        }
    }
    
    // ==================== OpenAI Whisper ====================
    
    private async transcribeWithOpenAI(audioPath: string): Promise<TranscriptionResult> {
        const formData = new FormData();
        formData.append('file', fs.createReadStream(audioPath));
        formData.append('model', 'whisper-1');
        formData.append('language', 'es'); // Español
        
        const response = await axios.post(
            'https://api.openai.com/v1/audio/transcriptions',
            formData,
            {
                headers: {
                    ...formData.getHeaders(),
                    'Authorization': `Bearer ${this.apiKey}`
                }
            }
        );
        
        return {
            texto: response.data.text,
            idioma: response.data.language,
            duracionSegundos: response.data.duration
        };
    }
    
    // ==================== AssemblyAI ====================
    
    private async transcribeWithAssemblyAI(audioPath: string): Promise<TranscriptionResult> {
        // 1. Subir archivo
        const uploadResponse = await axios.post(
            'https://api.assemblyai.com/v2/upload',
            fs.createReadStream(audioPath),
            {
                headers: {
                    'authorization': this.apiKey!,
                    'content-type': 'application/octet-stream'
                }
            }
        );
        
        const audioUrl = uploadResponse.data.upload_url;
        
        // 2. Solicitar transcripción
        const transcriptResponse = await axios.post(
            'https://api.assemblyai.com/v2/transcript',
            {
                audio_url: audioUrl,
                language_code: 'es' // Español
            },
            {
                headers: {
                    'authorization': this.apiKey!,
                    'content-type': 'application/json'
                }
            }
        );
        
        const transcriptId = transcriptResponse.data.id;
        
        // 3. Polling hasta que termine
        let transcript: any;
        while (true) {
            const statusResponse = await axios.get(
                `https://api.assemblyai.com/v2/transcript/${transcriptId}`,
                {
                    headers: { 'authorization': this.apiKey! }
                }
            );
            
            transcript = statusResponse.data;
            
            if (transcript.status === 'completed') break;
            if (transcript.status === 'error') throw new Error(transcript.error);
            
            await new Promise(resolve => setTimeout(resolve, 1000)); // Esperar 1s
        }
        
        return {
            texto: transcript.text,
            duracionSegundos: transcript.audio_duration,
            confianza: transcript.confidence,
            metadata: { words: transcript.words }
        };
    }
    
    // ==================== Deepgram ====================
    
    private async transcribeWithDeepgram(audioPath: string): Promise<TranscriptionResult> {
        const audioBuffer = fs.readFileSync(audioPath);
        
        const response = await axios.post(
            'https://api.deepgram.com/v1/listen?language=es&punctuate=true',
            audioBuffer,
            {
                headers: {
                    'Authorization': `Token ${this.apiKey}`,
                    'Content-Type': 'audio/wav' // Ajustar según formato
                }
            }
        );
        
        const result = response.data.results.channels[0].alternatives[0];
        
        return {
            texto: result.transcript,
            duracionSegundos: response.data.metadata.duration,
            confianza: result.confidence
        };
    }
    
    // ==================== Google Cloud Speech-to-Text ====================
    
    private async transcribeWithGoogle(audioPath: string): Promise<TranscriptionResult> {
        // Requiere: npm install @google-cloud/speech
        const speech = require('@google-cloud/speech');
        const client = new speech.SpeechClient({
            keyFilename: process.env.GOOGLE_CLOUD_KEY_PATH
        });
        
        const audioBytes = fs.readFileSync(audioPath).toString('base64');
        
        const [response] = await client.recognize({
            audio: { content: audioBytes },
            config: {
                encoding: 'LINEAR16',
                sampleRateHertz: 16000,
                languageCode: 'es-ES',
            }
        });
        
        const transcription = response.results
            .map((result: any) => result.alternatives[0].transcript)
            .join('\n');
        
        return {
            texto: transcription,
            confianza: response.results[0]?.alternatives[0]?.confidence
        };
    }
    
    // ==================== Whisper Local (CLI) ====================
    
    private async transcribeWithWhisperLocal(audioPath: string): Promise<TranscriptionResult> {
        try {
            // Requiere: pip install openai-whisper
            // O usar whisper.cpp (más rápido)
            const { stdout } = await execAsync(
                `whisper "${audioPath}" --language Spanish --output_format txt --model base`
            );
            
            // Leer el archivo .txt generado
            const txtPath = audioPath.replace(/\.[^.]+$/, '.txt');
            const texto = fs.readFileSync(txtPath, 'utf-8');
            fs.unlinkSync(txtPath); // Limpiar
            
            return {
                texto: texto.trim()
            };
        } catch (error: any) {
            // Si whisper no está instalado, devolver mock
            console.warn('⚠️  Whisper local no disponible, usando modo simulación');
            return {
                texto: '[Transcripción simulada: Whisper no está instalado localmente]'
            };
        }
    }
    
    /**
     * Obtener información del provider actual
     */
    getProviderInfo(): { provider: TranscriptionProvider; available: boolean } {
        return {
            provider: this.provider,
            available: this.isProviderAvailable(this.provider)
        };
    }
}

export default new TranscriptionService();
