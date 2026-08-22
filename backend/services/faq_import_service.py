import json
import re
from typing import List, Dict, Any

class ParsedFaqItem:
    def __init__(self, question: str, answer: str, metadata: str = "", category: str = "FAQ"):
        self.question = question.strip()
        self.answer = answer.strip()
        self.metadata = metadata.strip() if metadata else ""
        self.category = "FAQ"

    def to_dict(self) -> Dict[str, str]:
        return {
            "question": self.question,
            "answer": self.answer,
            "metadata": self.metadata,
            "category": self.category
        }

def parse_txt(content: str) -> List[Dict[str, str]]:
    """
    Parseia conteúdo de texto contendo FAQs delimitados por 48 hifens (ou 10+ hifens).
    Formato esperado por bloco:
    [Classificação Temática]
    Q: Pergunta...
    A: Resposta...
    (Frequência: 42)
    """
    if not content:
        return []

    # Normalizar quebras de linha
    content = content.replace("\r\n", "\n").replace("\r", "\n")

    # Separar blocos por linhas compostas majoritariamente por hifens (mínimo 10 hifens)
    blocks = re.split(r'\n\s*-{10,}\s*\n', content)
    
    parsed_items = []
    
    for raw_block in blocks:
        block = raw_block.strip()
        if not block:
            continue

        lines = block.split('\n')
        metadata = ""
        question_lines = []
        answer_lines = []
        current_mode = None  # 'Q' or 'A'

        for line in lines:
            trimmed = line.strip()
            
            # Ignorar campo (Frequência: N)
            if re.match(r'^\(Frequência\s*:\s*\d+\)$', trimmed, re.IGNORECASE):
                continue
                
            # Extrair [Classificação Temática]
            meta_match = re.match(r'^\[(.*?)\]$', trimmed)
            if meta_match and current_mode is None:
                metadata = meta_match.group(1).strip()
                continue
                
            # Detectar Q:
            if re.match(r'^Q\s*:\s*', trimmed, re.IGNORECASE):
                current_mode = 'Q'
                q_text = re.sub(r'^Q\s*:\s*', '', line, flags=re.IGNORECASE)
                question_lines.append(q_text)
                continue
                
            # Detectar A:
            if re.match(r'^A\s*:\s*', trimmed, re.IGNORECASE):
                current_mode = 'A'
                a_text = re.sub(r'^A\s*:\s*', '', line, flags=re.IGNORECASE)
                answer_lines.append(a_text)
                continue

            # Continuação da pergunta ou resposta em múltiplas linhas
            if current_mode == 'Q':
                question_lines.append(line)
            elif current_mode == 'A':
                answer_lines.append(line)

        question = "\n".join(question_lines).strip()
        answer = "\n".join(answer_lines).strip()

        if question and answer:
            item = ParsedFaqItem(question=question, answer=answer, metadata=metadata, category="FAQ")
            parsed_items.append(item.to_dict())

    return parsed_items

def parse_json(content: str) -> List[Dict[str, str]]:
    """
    Parseia conteúdo JSON contendo um array de objetos FAQ.
    Formato esperado:
    [
      { "question": "...", "answer": "...", "metadata": "...", "category": "FAQ" }
    ]
    """
    if not content or not content.strip():
        return []

    try:
        data = json.loads(content)
    except Exception as e:
        raise ValueError(f"JSON inválido: {str(e)}")

    if isinstance(data, dict):
        if "faqs" in data and isinstance(data["faqs"], list):
            data = data["faqs"]
        elif "items" in data and isinstance(data["items"], list):
            data = data["items"]
        else:
            data = [data]

    if not isinstance(data, list):
        raise ValueError("O JSON deve ser uma lista de objetos FAQ.")

    parsed_items = []
    for index, obj in enumerate(data):
        if not isinstance(obj, dict):
            continue

        q = str(obj.get("question") or obj.get("pergunta") or "").strip()
        a = str(obj.get("answer") or obj.get("resposta") or "").strip()
        m = str(obj.get("metadata") or obj.get("metadata_val") or obj.get("classificacao") or "").strip()

        if q and a:
            item = ParsedFaqItem(question=q, answer=a, metadata=m, category="FAQ")
            parsed_items.append(item.to_dict())

    return parsed_items

def parse_file(content_bytes: bytes, filename: str) -> List[Dict[str, str]]:
    """
    Identifica a extensão do arquivo (.txt ou .json) e realiza o parse correspondente.
    """
    ext = filename.lower().split('.')[-1] if '.' in filename else ''
    
    # Tentar decodificar UTF-8 com fallback para Latin-1
    try:
        content_str = content_bytes.decode('utf-8')
    except UnicodeDecodeError:
        content_str = content_bytes.decode('latin-1')

    if ext == 'json':
        return parse_json(content_str)
    elif ext == 'txt':
        return parse_txt(content_str)
    else:
        # Tentar JSON primeiro, se falhar tentar TXT
        try:
            return parse_json(content_str)
        except Exception:
            return parse_txt(content_str)
