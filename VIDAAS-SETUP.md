# Integração VIDaaS - Assinatura Digital ICP-Brasil

## O que é VIDaaS?

VIDaaS (Validation Identity Digital as a Service) é a solução de **assinatura digital em nuvem** homologada pelo ITI (Instituto Nacional de Tecnologia da Informação) para certificados ICP-Brasil.

- ✅ **Validade jurídica** para prescrições, atestados, laudos
- ✅ **Biometria facial** no celular (sem token físico)
- ✅ **Compatível com CFM** (Conselho Federal de Medicina)
- ✅ **LGPD compliant**

---

## Passo 1: Escolher Provedor VIDaaS

Escolha um dos provedores homologados ICP-Brasil:

### Opção A: BRy/SafeID (Recomendado)
- ✅ SDK Node.js gratuito
- ✅ Sandbox para testes
- 💰 R$ 150/ano por médico
- 🔗 https://bry.com.br/vidaas
- 📦 SDK: `npm install @bry/assinador-digital`

### Opção B: Soluti (Certisign)
- ✅ API REST bem documentada
- 💰 R$ 180/ano por médico
- 🔗 https://www.soluti.com.br/vidaas

### Opção C: Valid Certificadora
- 💰 R$ 200/ano por médico
- 🔗 https://www.validcertificadora.com.br/

### Opção D: D4Sign
- ✅ Plataforma completa de workflow de documentos
- 💰 R$ 29/mês + R$ 0,50/assinatura
- 🔗 https://d4sign.com.br/

---

## Passo 2: Contratar e Configurar

### 2.1. Contratação (para cada médico)

1. Acesse o site do provedor escolhido
2. Contrate o **certificado A1 em nuvem (VIDaaS)**
3. Agende validação presencial ou por videoconferência
4. Apresente: RG, CPF, CRM, comprovante de endereço
5. Após validação (1-2 dias úteis), receba credenciais

### 2.2. Configurar no Servidor (.env)

Adicione no `.env` do MedScribe:

```bash
# VIDaaS Configuration
VIDAAS_PROVIDER=bry  # ou "soluti", "valid", "d4sign"
VIDAAS_API_KEY=sua-chave-api-aqui
VIDAAS_ENVIRONMENT=production  # ou "sandbox" para testes
```

### 2.3. Instalar SDK (se usar BRy)

```bash
cd /Users/carlosfilho/Desktop/medscribe
npm install @bry/assinador-digital
```

### 2.4. Implementar no código

Edite `src/lib/vidaas.ts` e descomente o provider escolhido. Exemplo para BRy:

```typescript
// Descomentar em src/lib/vidaas.ts linha ~60
import { BryAssinador } from '@bry/assinador-digital';

const assinador = new BryAssinador({
  apiKey: this.config.apiKey,
  sandbox: this.config.environment === 'sandbox'
});

const result = await assinador.assinarPDF({
  documento: req.documentContent,
  cpf: req.signerCPF,
  motivo: req.reason,
  localizacao: req.location || 'Brasil',
});
```

---

## Passo 3: Migração do Banco de Dados

Rode a migration para adicionar campos CPF/CRM/VIDaaS ao User:

```bash
cd /Users/carlosfilho/Desktop/medscribe
npx prisma db push
```

Isso adiciona ao modelo `User`:
- `cpf` (CPF do médico)
- `crm` (número do CRM)
- `crmUf` (UF do CRM, ex: "SP")
- `vidaasActive` (boolean, se VIDaaS está ativo)

---

## Passo 4: Configurar Perfil do Médico

Cada médico precisa completar seu perfil:

1. Acessar **Configurações > Perfil**
2. Preencher:
   - CPF: `123.456.789-00`
   - CRM: `123456`
   - UF do CRM: `SP`
3. Ativar checkbox **"Assinatura Digital (VIDaaS)"**

Após isso, o botão "Assinar Digitalmente" aparece nos documentos.

---

## Passo 5: Usar no Frontend

Exemplo em uma página de prescrição:

```tsx
import { SignatureButton } from "@/components/signature-button";

export default function PrescriptionPage() {
  const [pdfBase64, setPdfBase64] = useState("");

  // Gere o PDF (usando jspdf ou outra lib)
  const generatePDF = () => {
    const doc = new jsPDF();
    doc.text("Prescrição Médica", 10, 10);
    // ... adicionar conteúdo
    const base64 = doc.output('datauristring').split(',')[1];
    setPdfBase64(base64);
  };

  return (
    <div>
      <button onClick={generatePDF}>Gerar PDF</button>

      {pdfBase64 && (
        <SignatureButton
          visitId="visit-123"
          documentType="prescription"
          documentPdfBase64={pdfBase64}
          onSigned={(url) => {
            console.log("PDF assinado disponível em:", url);
          }}
        />
      )}
    </div>
  );
}
```

---

## Passo 6: Fluxo de Assinatura (Como Funciona)

1. **Médico clica** em "Assinar Digitalmente"
2. **Frontend** envia PDF base64 para `/api/signature/sign-document`
3. **Backend** envia para API do provedor VIDaaS (BRy, Soluti, etc.)
4. **Provedor** envia **push notification** para celular do médico
5. **Médico** abre app, autentica com **biometria facial**
6. **Provedor** assina o PDF com certificado ICP-Brasil
7. **Backend** recebe PDF assinado e retorna pro frontend
8. **Frontend** faz download automático do PDF assinado

---

## Custos Estimados

### Setup Inicial (uma vez)
- Desenvolvimento: **GRÁTIS** (código open-source)
- Homologação sandbox: **GRÁTIS**

### Recorrente (por médico/ano)
| Provedor | Custo Anual | Assinaturas Incluídas |
|----------|-------------|----------------------|
| BRy      | R$ 150      | Ilimitadas           |
| Soluti   | R$ 180      | Ilimitadas           |
| Valid    | R$ 200      | Ilimitadas           |
| D4Sign   | R$ 348*     | 700/ano (R$ 0,50 cada extra) |

*D4Sign: R$ 29/mês × 12 = R$ 348

### Modelo de Negócio Sugerido

**Plano MedScribe Premium:**
- R$ 99/mês por médico
- Inclui VIDaaS (você paga R$ 12-15/mês, lucra R$ 84-87/mês)
- Ou cobre R$ 20/mês extra sobre plano básico

---

## Sandbox vs Produção

### Sandbox (Testes)
- **Gratuito** para desenvolvimento
- Assinaturas não têm validade jurídica
- Use para testar integração

```bash
VIDAAS_ENVIRONMENT=sandbox
```

### Produção (Real)
- **Pago** (R$ 150-200/médico/ano)
- Assinaturas com validade jurídica
- CFM/ANS aceita

```bash
VIDAAS_ENVIRONMENT=production
```

---

## Troubleshooting

### Erro: "VIDaaS não ativo"
✅ **Solução:** Médico precisa ativar VIDaaS no perfil e preencher CPF/CRM

### Erro: "CPF e CRM são necessários"
✅ **Solução:** Médico precisa completar perfil em Configurações

### Erro: "VIDaaS não configurado no servidor"
✅ **Solução:** Adicionar `VIDAAS_API_KEY` no `.env` do Vercel

### Erro: "SDK not installed"
✅ **Solução:** Rodar `npm install @bry/assinador-digital`

### Push não chega no celular
✅ **Solução:**
1. Médico instalou app do provedor? (BRy, Soluti, etc.)
2. Fez login no app com CPF usado no certificado?
3. Ativou notificações push?

---

## Compliance e Legal

### CFM (Conselho Federal de Medicina)
✅ VIDaaS atende Resolução CFM 1.821/2007 (prontuário eletrônico)

### LGPD
✅ Assinatura digital garante autenticidade e não-repúdio
✅ Audit log registra todas as assinaturas (campo `action: "signed_document"`)

### ANS (Planos de Saúde)
✅ Guias TISS assinadas digitalmente são aceitas

### Receita Controlada (Portaria 344/98)
✅ VIDaaS ICP-Brasil é aceito para prescrição de psicotrópicos

---

## Próximos Passos

1. ✅ Escolher provedor VIDaaS
2. ✅ Contratar certificado para 1 médico (teste)
3. ✅ Configurar `.env` com credenciais
4. ✅ Rodar `npx prisma db push`
5. ✅ Instalar SDK do provedor
6. ✅ Implementar código específico do provedor em `vidaas.ts`
7. ✅ Testar em sandbox
8. ✅ Validar PDF assinado em https://verificador.iti.gov.br
9. ✅ Migrar para produção
10. ✅ Oferecer como plano premium

---

## Suporte

- **BRy:** suporte@bry.com.br
- **Soluti:** 4000-1007
- **Valid:** 3004-8440
- **ITI (Governo):** https://www.gov.br/iti
