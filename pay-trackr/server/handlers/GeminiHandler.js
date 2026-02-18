import * as Sentry from '@sentry/node';

class GeminiHandler {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.model = 'gemini-2.5-flash-lite';
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models';
  }

  async generateContent(prompt, { maxOutputTokens = 500, temperature = 0.7, parts = null } = {}) {
    try {
      const contents = parts
        ? [{ parts }]
        : [{ parts: [{ text: prompt }] }];

      const response = await fetch(
        `${this.baseUrl}/${this.model}:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents,
            generationConfig: { maxOutputTokens, temperature }
          })
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[ERROR] Gemini API ${response.status}: ${errorText.slice(0, 150)}`);
        Sentry.captureMessage('Gemini API error', { level: 'error', extra: { status: response.status, body: errorText } });
        return null;
      }

      const result = await response.json();
      return result.candidates?.[0]?.content?.parts?.[0]?.text || null;
    } catch (error) {
      console.error(`[ERROR] Gemini request failed: ${error.message}`);
      Sentry.captureException(error);
      return null;
    }
  }

  async transcribeAudio(base64, mimeType, userCategories = []) {
    const categoriesList = userCategories.length > 0
      ? `Categorias del usuario: ${userCategories.join(', ')}`
      : '';

    const parts = [
      {
        inlineData: {
          mimeType,
          data: base64
        }
      },
      {
        text: `Transcribi este audio en español argentino. El audio describe un gasto o compra.
Hoy es ${new Date().toISOString().slice(0, 10)} (año ${new Date().getFullYear()}).

Extrae la siguiente informacion y devolvela SOLO como JSON valido, sin markdown ni texto extra:
{
  "transcription": "texto completo transcrito",
  "title": "titulo corto del gasto (max 30 chars)",
  "items": ["item1", "item2"],
  "totalAmount": 0,
  "description": "descripcion breve si la hay",
  "category": "categoria sugerida",
  "date": "fecha en formato YYYY-MM-DD o null"
}

${categoriesList}

Si no podes determinar el monto, usa 0.
Si no podes determinar la categoria, usa "Otros".
El titulo debe ser conciso y descriptivo.
Si el audio menciona una fecha (ej: "ayer", "el martes", "el 5"), convertila a YYYY-MM-DD usando la fecha de hoy como referencia. Si no menciona fecha, usa null.`
      }
    ];

    const text = await this.generateContent(null, {
      maxOutputTokens: 1000,
      temperature: 0.3,
      parts
    });

    if (!text) return null;

    try {
      const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      return JSON.parse(cleaned);
    } catch (error) {
      console.error(`[ERROR] transcribeAudio JSON parse failed: ${error.message} | raw: ${text.slice(0, 100)}`);
      Sentry.captureException(error, { extra: { rawText: text, context: 'transcribeAudio' } });
      return null;
    }
  }

  async parseTransferImage(base64, mimeType) {
    const parts = [
      {
        inlineData: {
          mimeType,
          data: base64
        }
      },
      {
        text: `Analiza este comprobante de pago o transferencia bancaria argentina.
Hoy es ${new Date().toISOString().slice(0, 10)}.

Extrae la siguiente informacion y devolvela SOLO como JSON valido, sin markdown ni texto extra:
{
  "amount": 0,
  "recipientName": "nombre del destinatario o comercio",
  "recipientCBU": "CBU o CVU si aparece",
  "recipientAlias": "alias si aparece",
  "recipientBank": "banco del destinatario",
  "senderBank": "banco del emisor",
  "date": "fecha en formato YYYY-MM-DD",
  "reference": "numero de referencia o comprobante",
  "concept": "concepto o categoria si aparece"
}

IMPORTANTE sobre montos argentinos:
- Los montos usan punto como separador de miles: $67.506 = sesenta y siete mil quinientos seis
- Los decimales a veces aparecen en tamaño chico/superindice al lado del monto principal. Ej: "$67.506⁰⁸" o "$67.506,08" significa 67506.08 (sesenta y siete mil quinientos seis con 08 centavos)
- NUNCA interpretes los puntos como decimales. En Argentina el punto es separador de miles.
- El monto debe ser un numero con decimales si los hay (ej: 67506.08), sin signos ni separadores de miles.

Si la fecha no muestra año, asumi ${new Date().getFullYear()}.
Si algun campo no esta visible o no se puede determinar, usa null.`
      }
    ];

    const text = await this.generateContent(null, {
      maxOutputTokens: 1000,
      temperature: 0.3,
      parts
    });

    if (!text) return null;

    try {
      const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      return JSON.parse(cleaned);
    } catch (error) {
      console.error(`[ERROR] parseTransferImage JSON parse failed: ${error.message} | raw: ${text.slice(0, 100)}`);
      Sentry.captureException(error, { extra: { rawText: text, context: 'parseTransferImage' } });
      return null;
    }
  }

  async parseTransferPDF(base64, mimeType) {
    const parts = [
      {
        inlineData: {
          mimeType: mimeType || 'application/pdf',
          data: base64
        }
      },
      {
        text: `Analiza este comprobante de pago o transferencia bancaria argentina en PDF.
Hoy es ${new Date().toISOString().slice(0, 10)}.

Extrae la siguiente informacion y devolvela SOLO como JSON valido, sin markdown ni texto extra:
{
  "amount": 0,
  "recipientName": "nombre del destinatario o comercio",
  "recipientCBU": "CBU o CVU si aparece",
  "recipientAlias": "alias si aparece",
  "recipientBank": "banco del destinatario",
  "senderBank": "banco del emisor",
  "date": "fecha en formato YYYY-MM-DD",
  "reference": "numero de referencia o comprobante",
  "concept": "concepto o categoria si aparece"
}

IMPORTANTE sobre montos argentinos:
- Los montos usan punto como separador de miles: $67.506 = sesenta y siete mil quinientos seis
- Los decimales a veces aparecen en tamaño chico/superindice al lado del monto principal. Ej: "$67.506⁰⁸" o "$67.506,08" significa 67506.08 (sesenta y siete mil quinientos seis con 08 centavos)
- NUNCA interpretes los puntos como decimales. En Argentina el punto es separador de miles.
- El monto debe ser un numero con decimales si los hay (ej: 67506.08), sin signos ni separadores de miles.

Si la fecha no muestra año, asumi ${new Date().getFullYear()}.
Si algun campo no esta visible o no se puede determinar, usa null.`
      }
    ];

    const text = await this.generateContent(null, {
      maxOutputTokens: 1000,
      temperature: 0.3,
      parts
    });

    if (!text) return null;

    try {
      const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      return JSON.parse(cleaned);
    } catch (error) {
      console.error(`[ERROR] parseTransferPDF JSON parse failed: ${error.message} | raw: ${text.slice(0, 100)}`);
      Sentry.captureException(error, { extra: { rawText: text, context: 'parseTransferPDF' } });
      return null;
    }
  }

  async categorizeExpense(title, description, userCategories = []) {
    if (userCategories.length === 0) return 'Otros';

    const prompt = `Clasifica este gasto en una de las categorias del usuario.

Gasto: "${title}"${description ? ` - ${description}` : ''}

Categorias disponibles: ${userCategories.join(', ')}

Responde SOLO con el nombre exacto de la categoria que mejor aplique. Si ninguna aplica, responde "Otros".`;

    const text = await this.generateContent(prompt, {
      maxOutputTokens: 50,
      temperature: 0.2
    });

    if (!text) return 'Otros';

    const result = text.trim();
    const match = userCategories.find(c => c.toLowerCase() === result.toLowerCase());
    return match || 'Otros';
  }

  async getFinancialAnalysis(dataSummary) {
    const prompt = `Eres un asesor financiero personal amigable. Analiza los siguientes datos de gastos de un usuario argentino y proporciona feedback conciso sobre su salud financiera.

DATOS DEL USUARIO:
- Meses analizados: ${dataSummary.months.join(', ')}
- Total de pagos registrados: ${dataSummary.totalPayments}
- Gastos fijos mensuales: $${dataSummary.totalRecurrent} (${dataSummary.recurrentCount} fijos)

GASTOS POR MES:
${Object.entries(dataSummary.monthlyData).map(([month, info]) =>
  `${month}: $${info.total.toLocaleString('es-AR')} (${info.count} pagos)
   Categorias: ${Object.entries(info.byCategory).map(([cat, amt]) => `${cat}: $${amt.toLocaleString('es-AR')}`).join(', ')}`
).join('\n\n')}

GASTOS FIJOS PRINCIPALES:
${dataSummary.recurrents.map(r => `- ${r.title}: $${r.amount.toLocaleString('es-AR')} (${r.category})`).join('\n')}

INSTRUCCIONES:
1. Analiza tendencias de gasto (subiendo, bajando, estable)
2. Identifica categorias con mayor gasto. Identifica posible gastos irresponsables, evitables o anomalos
3. Evalua la proporcion de gastos fijos vs variables
4. Da 2-3 consejos practicos y especificos
5. Usa un tono amigable y motivador. No marques errores ni juzgues los habitos. Sos el aliado que quiere ayudar.
6. NO uses emojis
7. Responde en espanol argentino
8. Manten la respuesta CORTA (max 800 caracteres) para WhatsApp
9. Usa *asteriscos* para negritas
10. Si aplica, haz notar algun patron interesante en los datos

Responde directamente con el analisis, sin introduccion.`;

    const text = await this.generateContent(prompt, { maxOutputTokens: 500, temperature: 0.7 });
    return text || 'No se pudo completar el analisis. Intenta nuevamente.';
  }

  async getWeeklyInsight(weeklyStats) {
    const pastWeek = weeklyStats.pastWeek;
    const nextWeek = weeklyStats.nextWeek;

    const prompt = `Sos un asesor financiero personal amigable. Analizá los datos semanales de un usuario argentino y armá un resumen breve con dos partes:

1. RESUMEN: En 2-3 oraciones contá qué pasó la semana pasada y qué se viene. Mencioná qué fue lo más pesado, qué estuvo tranquilo, si viene bien o atrasado con los pagos.
2. TIPS: 1-2 comentarios genéricos, amigables y motivadores. NO sugieras acciones concretas (no "pagá tal cosa", "revisá tal otra"). Solo observaciones positivas o datos curiosos sobre sus finanzas.

DATOS:
- Semana pasada: ${pastWeek.count} pagos por $${pastWeek.amount.toLocaleString('es-AR')} (${pastWeek.paidCount} pagados, ${pastWeek.unpaidCount} pendientes por $${pastWeek.unpaidAmount.toLocaleString('es-AR')})
- Semana entrante: ${nextWeek.count} pagos por $${nextWeek.amount.toLocaleString('es-AR')} (${nextWeek.paidCount} pagados, ${nextWeek.unpaidCount} pendientes por $${nextWeek.unpaidAmount.toLocaleString('es-AR')})
- Total pendiente ambas semanas: $${weeklyStats.totalUnpaidAmount.toLocaleString('es-AR')}
- Pagados este mes: ${weeklyStats.paidThisMonth}
- Pendientes este mes: ${weeklyStats.unpaidThisMonth}
- Total pagado este mes: $${weeklyStats.totalPaidAmount.toLocaleString('es-AR')}
- Gastos únicos este mes: ${weeklyStats.oneTimeCount} por $${weeklyStats.oneTimeAmount.toLocaleString('es-AR')}

REGLAS:
- Español argentino, tono amigable y cercano
- Sin emojis
- No uses encabezados ni listas, escribí todo como texto corrido
- Separá el resumen de los tips con un salto de línea
- Máximo 600 caracteres en total
- Respondé directamente, sin introducción`;

    return await this.generateContent(prompt, { maxOutputTokens: 350, temperature: 0.8 });
  }
}

export default GeminiHandler;
