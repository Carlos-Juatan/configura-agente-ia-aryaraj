import os
import assemblyai as aai

def transcribe_video(file_path: str, config_params: dict = None) -> dict:
    """
    Transcreve um arquivo de áudio ou vídeo usando AssemblyAI com configurações personalizadas.

    Parâmetros aceitos em config_params:
        - language (str): Código de idioma ("auto", "pt", "en", "es"). Padrão: "auto".
        - autoLanguage (bool): Legacy — se True (ou language == "auto"), usa detecção automática.
        - speakerLabels (bool): Identificação de múltiplos falantes.
        - profanityFilter (bool): Filtro de palavrões.
        - summarization (bool): Gerar resumo automático.

    NOTA: O parâmetro `speech_model="best"` foi REMOVIDO pois foi descontinuado pelo AssemblyAI.
    """
    api_key = os.getenv("ASSEMBLYAI_API_KEY")
    if not api_key or api_key == "YOUR_ASSEMBLY_API_KEY_HERE":
        raise ValueError("ASSEMBLYAI_API_KEY não configurada corretamente no .env")

    aai.settings.api_key = api_key

    params = config_params or {}

    # Resolve language selection:
    # New-style: params["language"] == "auto" | "pt" | "en" | "es"
    # Legacy: params["autoLanguage"] == True/False
    language = params.get("language", "auto")
    auto_detect = (language == "auto") or params.get("autoLanguage", True)

    # Build TranscriptionConfig WITHOUT deprecated speech_model parameter
    trans_config = aai.TranscriptionConfig(
        language_detection=auto_detect,
        language_code=None if auto_detect else language,
        speaker_labels=params.get("speakerLabels", False),
        filter_profanity=params.get("profanityFilter", False),
        summarization=params.get("summarization", False),
        summary_model=aai.SummarizationModel.informative if params.get("summarization") else None,
        summary_type=aai.SummarizationType.bullets if params.get("summarization") else None,
    )

    transcriber = aai.Transcriber()

    # Faz o upload e solicita a transcrição
    transcript = transcriber.transcribe(file_path, config=trans_config)

    if transcript.status == aai.TranscriptStatus.error:
        raise Exception(f"Erro na transcrição: {transcript.error}")

    return {
        "text": transcript.text,
        "duration": transcript.audio_duration,  # Duração em segundos
    }
