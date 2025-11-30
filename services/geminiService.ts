
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Appointment, Kpis, Service } from '../types';

export async function getAIAnalytics(
    prompt: string,
    kpis: Kpis,
    services: Service[],
    appointments: Appointment[]
): Promise<string> {
    // FIX: Removed unnecessary API key check as per guidelines.
    // The API key is assumed to be available in the execution context.
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

        // FIX: Corrected locale from 'pt--BR' to 'pt-BR'.
        const servicesText = services.map(s => `- ${s.name}: ${s.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`).join('\n');
        
        const appointmentsText = appointments.slice(0, 10).map(a => {
            const serviceNames = a.services.map(s => s.name).join(', ');
            const finalPriceText = a.finalPrice ? a.finalPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'N/A';
            return `- Cliente: ${a.clientName}, Status: ${a.status}, Serviços: ${serviceNames}, Preço Final: ${finalPriceText}`;
        }).join('\n');

        const fullPrompt = `
You are EffiSync Manager AI, an expert business analyst for a high performance business.
Analyze the following business data to answer the user's question.
Provide a concise, insightful, and helpful response in Portuguese.
**Important Formatting Rule: To highlight key ideas and suggestions, wrap them in double asterisks for bolding (e.g., **sua sugestão aqui**). Do not use single asterisks for lists; use hyphens instead.**

When providing analysis, offer actionable advice. Here are some examples of valuable suggestions you could make if they are relevant to the user's question:
- To build customer loyalty, suggest specific promotions based on visit frequency. For example: "Offer a free eyebrow service or an extra haircut after every 5 completed appointments."
- To improve online visibility, recommend incentivizing customer reviews. For example, suggest running a monthly raffle for a free haircut for all clients who leave a review on Google, or offer a 10% discount on their next visit.
- Identify less popular services and suggest ways to promote them, perhaps by bundling them with top-sellers.
- Recommend creating combo deals if you notice clients often book certain services separately.

**Current Data Snapshot:**

-   **Indicadores Chave de Desempenho (KPIs):**
    -   Faturamento Total: ${kpis.totalRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
    -   Clientes Atendidos: ${kpis.clientsServed}
    -   Ticket Médio: ${kpis.averageTicket.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}

-   **Serviços Disponíveis:**
    ${servicesText}

-   **Histórico de Agendamentos Recentes:**
    ${appointmentsText}
    (Showing up to 10 recent appointments for context)

---

**User's Question:** "${prompt}"

**Sua Análise:**
`;

        // Add type annotation for the response object.
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: fullPrompt,
        });
        
        // Per @google/genai guidelines, access the text response directly via the .text property.
        return response.text;
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        return "An error occurred while analyzing the data. Please check the console for more details.";
    }
}