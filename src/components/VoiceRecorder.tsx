import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Mic, Square, Check, RotateCcw, AlertTriangle, Loader2 } from 'lucide-react';

type RecordingState = 'idle' | 'recording' | 'processing' | 'completed' | 'error';

interface VoiceRecorderProps {
  onTranscriptComplete: (transcript: string) => void;
}

const WEBHOOK_URL = import.meta.env.VITE_N8N_TRANSCRIBE_WEBHOOK_URL || "https://n8n.crozier-pierre.fr/webhook/transcribe-voice";
const MAX_DURATION_MS = 4 * 60 * 1000; // 4 minutes
const WARNING_DURATION_MS = 3 * 60 * 1000; // 3 minutes

// Get supported audio format
const getSupportedMimeType = (): { mimeType: string; format: string } => {
  const types = [
    { mimeType: 'audio/wav', format: 'wav' },
    { mimeType: 'audio/mp4', format: 'mp4' },
    { mimeType: 'audio/mpeg', format: 'mpeg' },
    { mimeType: 'audio/webm;codecs=opus', format: 'webm' }
  ];
  
  const supported = types.find(type => MediaRecorder.isTypeSupported(type.mimeType));
  return supported || { mimeType: 'audio/webm', format: 'webm' };
};

export const VoiceRecorder = ({ onTranscriptComplete }: VoiceRecorderProps) => {
  const [state, setState] = useState<RecordingState>('idle');
  const [transcript, setTranscript] = useState('');
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const { toast } = useToast();
  const { user } = useAuth();

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const formatDuration = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const startRecording = async () => {
    try {
      setError(null);
      
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      streamRef.current = stream;
      chunksRef.current = [];

      const supportedFormat = getSupportedMimeType();
      console.log('📼 Format audio supporté:', supportedFormat);

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: supportedFormat.mimeType
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const supportedFormat = getSupportedMimeType();
        const audioBlob = new Blob(chunksRef.current, { type: supportedFormat.mimeType });
        await processAudio(audioBlob);
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(100); // Capture data every 100ms
      
      setState('recording');
      setDuration(0);

      // Start duration timer
      let startTime = Date.now();
      timerRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime;
        setDuration(elapsed);

        // Warning at 3 minutes
        if (elapsed >= WARNING_DURATION_MS && elapsed < WARNING_DURATION_MS + 1000) {
          toast({
            title: "⚠️ Attention",
            description: "Il reste 1 minute d'enregistrement",
            duration: 3000,
          });
        }

        // Auto-stop at 4 minutes
        if (elapsed >= MAX_DURATION_MS) {
          stopRecording();
        }
      }, 100);

      toast({
        title: "🎤 Enregistrement démarré",
        description: "Parlez clairement et à un rythme naturel",
      });

    } catch (error) {
      console.error('Error starting recording:', error);
      setState('error');
      setError("Impossible d'accéder au microphone. Veuillez autoriser l'accès dans les paramètres de votre navigateur.");
      toast({
        title: "Erreur microphone",
        description: "Veuillez autoriser l'accès au microphone",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const processAudio = async (audioBlob: Blob) => {
    setState('processing');
    setError(null);

    try {
      // Check file size (50MB limit)
      const maxSize = 50 * 1024 * 1024;
      if (audioBlob.size > maxSize) {
        throw new Error("L'enregistrement est trop volumineux (max 50MB)");
      }

      if (!user?.id) {
        throw new Error("Utilisateur non authentifié");
      }

      // Convert blob to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const base64String = reader.result as string;
          // Remove data:audio/webm;base64, prefix
          const base64Data = base64String.split(',')[1];
          resolve(base64Data);
        };
        reader.onerror = reject;
      });
      
      reader.readAsDataURL(audioBlob);
      const audioBase64 = await base64Promise;

      const supportedFormat = getSupportedMimeType();
      console.log('📤 Envoi audio pour transcription...', { format: supportedFormat.format });

      // Send to n8n webhook
      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          audioBase64,
          userId: user.id,
          format: supportedFormat.format
        }),
      });

      if (!response.ok) {
        throw new Error(`Erreur serveur: ${response.status}`);
      }

      const result = await response.json();
      console.log('📥 Transcription reçue:', result);

      if (!result.success || !result.transcript) {
        throw new Error(result.message || "Échec de la transcription");
      }

      setTranscript(result.transcript);
      setState('completed');

      // Show warning if low quality
      if (result.warning) {
        toast({
          title: "⚠️ Qualité faible",
          description: "Veuillez vérifier le texte transcrit",
          variant: "destructive",
          duration: 5000,
        });
      } else {
        toast({
          title: "✅ Transcription réussie",
          description: "Vérifiez et validez le texte ci-dessous",
        });
      }

    } catch (error) {
      console.error('Error processing audio:', error);
      setState('error');
      const errorMessage = error instanceof Error ? error.message : "Erreur lors de la transcription";
      setError(errorMessage);
      
      toast({
        title: "Erreur de transcription",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleTranscriptEdit = (text: string) => {
    setTranscript(text);
  };

  const handleValidate = () => {
    if (transcript.trim()) {
      onTranscriptComplete(transcript);
      toast({
        title: "✅ Texte validé",
        description: "Le texte a été ajouté au formulaire",
      });
    }
  };

  const handleRetry = () => {
    setTranscript('');
    setDuration(0);
    setError(null);
    setState('idle');
  };

  // Idle state
  if (state === 'idle') {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center gap-4">
            <Button
              size="lg"
              onClick={startRecording}
              className="w-full md:w-auto"
              aria-label="Démarrer l'enregistrement vocal"
            >
              <Mic className="mr-2 h-5 w-5" />
              🎤 Dicter mon bilan
            </Button>
            <p className="text-sm text-muted-foreground text-center">
              Cliquez pour commencer l'enregistrement vocal (max 4 minutes)
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Recording state
  if (state === 'recording') {
    return (
      <Card className="border-destructive">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="h-12 w-12 rounded-full bg-destructive/20 animate-pulse" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Mic className="h-6 w-6 text-destructive" />
                </div>
              </div>
              <div className="text-left">
                <p className="font-semibold text-destructive">🔴 Enregistrement en cours...</p>
                <p className="text-2xl font-mono">{formatDuration(duration)}</p>
              </div>
            </div>
            
            <Progress 
              value={(duration / MAX_DURATION_MS) * 100} 
              className="w-full"
            />
            
            <Button
              size="lg"
              variant="destructive"
              onClick={stopRecording}
              className="w-full md:w-auto"
              aria-label="Arrêter l'enregistrement"
            >
              <Square className="mr-2 h-5 w-5" />
              ⏹️ Arrêter et transcrire
            </Button>

            <p className="text-sm text-muted-foreground text-center">
              Parlez clairement. L'enregistrement s'arrêtera automatiquement après 4 minutes.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Processing state
  if (state === 'processing') {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center gap-4 py-8">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <div className="text-center">
              <p className="font-semibold text-lg">⏳ Transcription en cours...</p>
              <p className="text-sm text-muted-foreground mt-2">
                Veuillez patienter pendant que nous convertissons votre audio en texte
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (state === 'error') {
    return (
      <Card className="border-destructive">
        <CardContent className="pt-6">
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="whitespace-pre-line">
              {error}
            </AlertDescription>
          </Alert>
          <Button
            onClick={handleRetry}
            variant="outline"
            className="w-full"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            🔄 Réessayer
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Completed state
  if (state === 'completed') {
    return (
      <Card className="border-green-500">
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-green-700">
              ✅ Transcription terminée
            </h3>
            <Button
              onClick={handleRetry}
              variant="ghost"
              size="sm"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Recommencer
            </Button>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">
              Texte transcrit (modifiable)
            </label>
            <Textarea
              value={transcript}
              onChange={(e) => handleTranscriptEdit(e.target.value)}
              rows={8}
              className="w-full"
              placeholder="Texte transcrit..."
            />
          </div>

          <Button
            onClick={handleValidate}
            size="lg"
            className="w-full bg-green-600 hover:bg-green-700"
            disabled={!transcript.trim()}
          >
            <Check className="mr-2 h-5 w-5" />
            ✅ Valider et utiliser ce texte
          </Button>

          <p className="text-sm text-muted-foreground text-center">
            Vérifiez le texte et corrigez si nécessaire avant de valider
          </p>
        </CardContent>
      </Card>
    );
  }

  return null;
};
