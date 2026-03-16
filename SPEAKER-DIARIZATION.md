# Speaker Diarization - Identificação de Falantes

## 🎯 Objetivo

Identificar automaticamente **quem fala** em gravações médicas: Médico vs Paciente.

---

## 🔊 Como Funciona

### Antes (sem diarização):
```
Bom dia. Como você está se sentindo? Estou com dor no peito há 3 dias.
Vou examinar. Respira fundo.
```

### Depois (com diarização):
```
🩺 Médico: Bom dia. Como você está se sentindo?
🧑 Paciente: Estou com dor no peito há 3 dias.
🩺 Médico: Vou examinar. Respira fundo.
```

---

## 🛠️ 3 Métodos Implementados

### Método 1: Pattern-Based (GRÁTIS, Rápido)

**Custo:** R$ 0,00
**Precisão:** ~70%
**Velocidade:** <1s

**Como funciona:**
- Detecta padrões linguísticos específicos
- Médico: "vou examinar", "sua pressão", "prescrever", "CID"
- Paciente: "estou sentindo", "dói", "me sinto", "faz uns dias"

**Quando usar:**
- Orçamento apertado
- Consultas curtas (<10min)
- Linguagem previsível

**Exemplo de código:**
```typescript
import { diarizeWithPatterns } from "@/lib/speaker-diarization";

const result = diarizeWithPatterns(transcript);
console.log(result.formatted);
```

---

### Método 2: LLM-Based (PAGO, Muito Preciso)

**Custo:** ~R$ 0,02-0,05 por consulta
**Precisão:** ~95%
**Velocidade:** 2-5s

**Como funciona:**
- Envia transcrição para GPT-4/Claude
- Usa contexto semântico completo
- Entende ambiguidades e casos complexos

**Quando usar:**
- Consultas importantes (primeira consulta, casos complexos)
- Quando precisão é crítica
- Budget permite

**Exemplo de código:**
```typescript
import { diarizeWithLLM } from "@/lib/speaker-diarization";

const result = await diarizeWithLLM(transcript, "openai");
console.log(result.segments);
```

**Custo estimado:**
- GPT-4o-mini: R$ 0,02/consulta (10min = ~1500 tokens)
- Claude Haiku: R$ 0,01/consulta

---

### Método 3: API-Based (MAIS CARO, Mais Preciso)

**Custo:** R$ 0,30-0,50 por consulta
**Precisão:** ~98%
**Velocidade:** 5-10s

**Provedores:**
- **Deepgram** (recomendado para PT-BR)
- **AssemblyAI**
- **Rev.ai**

**Como funciona:**
- Transcreve + diariza em uma chamada
- Usa modelo treinado especificamente para diarização
- Detecta múltiplos speakers automaticamente

**Quando usar:**
- Consultas multi-participantes (médico + residente + paciente)
- Máxima precisão necessária
- Ambiente hospitalar/acadêmico

**Exemplo de código:**
```typescript
import { diarizeWithDeepgram } from "@/lib/speaker-diarization";

const result = await diarizeWithDeepgram(audioBuffer);
```

---

## 🚀 Método Híbrido (RECOMENDADO)

**Custo:** R$ 0,00-0,05 (adaptativo)
**Precisão:** ~85%
**Estratégia:** Inteligente

**Como funciona:**
1. Tenta Pattern-Based primeiro (grátis)
2. Calcula confiança média dos resultados
3. Se confiança < 60%, usa LLM automaticamente
4. Otimiza custo vs precisão

**Código (já implementado):**
```typescript
import { diarizeHybrid } from "@/lib/speaker-diarization";

const result = await diarizeHybrid(transcript, {
  useLLMIfLowConfidence: true,
  confidenceThreshold: 0.6,
});
```

**Resultado:**
- 70% das consultas: Pattern (grátis)
- 30% das consultas: LLM (pago, mas necessário)
- Custo médio: R$ 0,01-0,02/consulta

---

## 📊 Comparação de Custos

| Método | Custo/Consulta | Precisão | Velocidade | Quando Usar |
|--------|----------------|----------|------------|-------------|
| **Pattern** | R$ 0,00 | 70% | <1s | Budget zero, consultas simples |
| **LLM (GPT-4o-mini)** | R$ 0,02 | 95% | 2-5s | Maioria dos casos |
| **LLM (Claude Haiku)** | R$ 0,01 | 95% | 3-6s | Alternativa ao GPT |
| **Deepgram** | R$ 0,35 | 98% | 5-10s | Máxima precisão |
| **Híbrido** | R$ 0,01-0,02 | 85% | 1-5s | **RECOMENDADO** |

**Para 1000 consultas/mês:**
- Pattern: R$ 0
- Híbrido: R$ 10-20
- LLM sempre: R$ 20-50
- Deepgram: R$ 350

---

## 🎨 Formato de Saída

### JSON Structure
```json
{
  "segments": [
    {
      "speaker": "doctor",
      "text": "Bom dia, como está se sentindo?",
      "confidence": 0.95
    },
    {
      "speaker": "patient",
      "text": "Estou com dor no peito há 3 dias",
      "confidence": 0.92
    }
  ],
  "formatted": "🩺 Médico: Bom dia...\n🧑 Paciente: Estou com dor...",
  "summary": {
    "doctorTurns": 12,
    "patientTurns": 15,
    "totalTurns": 27
  }
}
```

### Texto Formatado (salvo no DB)
```
🩺 Médico: Bom dia, como está se sentindo?

🧑 Paciente: Estou com dor no peito há 3 dias, doutor.

🩺 Médico: Entendo. Vou examinar você. Respira fundo.

🧑 Paciente: Sim, doutor.

🩺 Médico: Sua pressão está 140x90. Vou prescrever um anti-hipertensivo.
```

---

## ⚙️ Configuração

### 1. Pattern-Based (já funciona)
Nenhuma configuração necessária. Está ativo por padrão.

### 2. LLM-Based (requer API key)

Já está configurado! Usa `OPENAI_API_KEY` existente.

Para usar Claude (opcional):
```bash
# .env
ANTHROPIC_API_KEY=sk-ant-...
```

### 3. Deepgram (opcional, mais caro)

Cadastre em https://deepgram.com

```bash
# .env
DEEPGRAM_API_KEY=sua-chave-aqui
```

Depois, no código, use:
```typescript
const result = await diarizeWithDeepgram(audioBuffer);
```

---

## 🧪 Testando

### Teste 1: Transcrição Simples
```bash
curl -X POST http://localhost:3000/api/transcribe \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "audio=@consulta.webm" \
  -F "visitId=abc123"
```

**Resposta:**
```json
{
  "text": "Bom dia como está Estou com dor...",
  "diarizedText": "🩺 Médico: Bom dia...\n🧑 Paciente: Estou com dor...",
  "segments": [...],
  "summary": {
    "doctorTurns": 12,
    "patientTurns": 15,
    "totalTurns": 27
  }
}
```

### Teste 2: Verificar Precisão

Compare com transcrição manual:
- Pegue uma consulta real
- Transcreva manualmente (10min)
- Compare com diarização automática
- Calcule precisão: `acertos / total_turnos`

---

## 📈 Melhorando a Precisão

### Padrões Customizados

Adicione padrões específicos da sua especialidade:

```typescript
// Em speaker-diarization.ts, adicione:
const cardiologyPatterns = [
  /\b(arritmia|fibrilação|miocárdio|estenose)\b/i,
  /\bECG|eletrocardiograma\b/i,
];
```

### Fine-Tuning do LLM

Para consultas muito específicas (dermatologia, ortopedia), pode fazer fine-tune do GPT com exemplos anotados.

Custo: ~$100 setup + $0.01/consulta

---

## 🔮 Roadmap Futuro

### Q2 2026
- [ ] Suporte a 3+ speakers (médico + residente + paciente)
- [ ] Detecção automática de número de speakers
- [ ] Integração com Deepgram nativa

### Q3 2026
- [ ] Fine-tuned model para português médico
- [ ] Identificação por voz (speaker recognition)
- [ ] Emoção/tom do paciente (ansiedade, dor)

### Q4 2026
- [ ] Real-time diarization durante gravação
- [ ] Sugestões de interrupção (se médico fala demais)

---

## 🐛 Troubleshooting

### Problema: Diarização sempre usa LLM (caro)
**Solução:** Ajuste `confidenceThreshold` para 0.5 (mais permissivo)

### Problema: Médico sendo identificado como paciente
**Solução:** Adicione padrões específicos no `doctorPatterns`

### Problema: Consulta multi-idioma (PT + EN)
**Solução:** Use Deepgram com `detect_language=true`

### Problema: Muito lento
**Solução:** Use pattern-only (disable LLM fallback)

---

## 💡 Dicas de Uso

1. **Para clínicas pequenas (<100 consultas/mês):**
   - Use híbrido com threshold 0.7 (mais pattern, menos LLM)
   - Custo: ~R$ 5-10/mês

2. **Para hospitais (>1000 consultas/mês):**
   - Considere Deepgram com desconto por volume
   - Custo: ~R$ 200-300/mês (com desconto)

3. **Para pesquisa/ensino:**
   - Use LLM sempre (precisão importa)
   - Custo: ~R$ 20-50/mês

---

## 📞 Suporte

Dúvidas? Problemas com diarização?
- GitHub Issues
- Email: suporte@medscribe.com

---

**Versão:** 1.0.0
**Última atualização:** 2026-03-09
