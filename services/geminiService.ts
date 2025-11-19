import { GoogleGenAI, Modality } from "@google/genai";
import { GroundingSource, Product } from '../types';
import { translations } from "../i18n/translations";

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

type Language = 'pt-BR' | 'en';

export async function* getFormulaSuggestionsStream(
    diseaseName: string, 
    products: Product[] = [], 
    currentIngredients: string[] = [], 
    isLactoseIntolerant: boolean = false, 
    isAllergicToDye: boolean = false, 
    treatmentType: 'topical' | 'internal' | 'all' = 'all',
    language: Language = 'pt-BR'
): AsyncGenerator<{ text?: string, sources?: GroundingSource[] }> {
    try {
        const model = 'gemini-2.5-flash';

        const promptStrings = translations[language].prompts;

        let productsPromptPart = '';
        if (products && products.length > 0) {
            const productList = products.map(p => `- ${p.name}${p.description ? `: ${p.description}` : ''}`).join('\n');
            productsPromptPart = promptStrings.productsHeader.replace('{productList}', productList);
        }

        let incompatibilityCheckPart = '';
        if (currentIngredients && currentIngredients.length > 0) {
            const ingredientList = currentIngredients.join(', ');
            incompatibilityCheckPart = promptStrings.incompatibilityCheckHeader.replace('{ingredientList}', ingredientList);
        }
        
        let treatmentTypePart = '';
        if (treatmentType === 'topical') {
            treatmentTypePart = promptStrings.topicalTreatmentPrompt;
        } else if (treatmentType === 'internal') {
            treatmentTypePart = promptStrings.internalTreatmentPrompt;
        }

        const lactoseIntolerancePart = isLactoseIntolerant ? promptStrings.lactoseIntoleranceWarning : '';
        const dyeAllergyPart = isAllergicToDye ? promptStrings.dyeAllergyWarning : '';

        const prompt = promptStrings.main
            .replace('{diseaseName}', diseaseName)
            .replace('{treatmentTypePart}', treatmentTypePart)
            .replace('{lactoseIntolerancePart}', lactoseIntolerancePart)
            .replace('{dyeAllergyWarning}', dyeAllergyPart)
            .replace('{incompatibilityCheckPart}', incompatibilityCheckPart)
            .replace('{productsPromptPart}', productsPromptPart);

        const responseStream = await ai.models.generateContentStream({
            model: model,
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
            },
        });

        let sourcesExtracted = false;

        for await (const chunk of responseStream) {
            const text = chunk.text;

            if (!sourcesExtracted && chunk.candidates?.[0]?.groundingMetadata?.groundingChunks) {
                const groundingChunks = chunk.candidates[0].groundingMetadata.groundingChunks;
                const sources: GroundingSource[] = groundingChunks
                    .filter((c: any) => c.web && c.web.uri && c.web.title)
                    .map((c: any) => ({
                        uri: c.web.uri,
                        title: c.web.title,
                        snippet: c.web.snippet,
                    }));
                
                if (sources.length > 0) {
                    yield { sources };
                    sourcesExtracted = true;
                }
            }
            
            if (text) {
                yield { text };
            }
        }

    } catch (error) {
        console.error("Error calling Gemini API:", error);
        throw new Error("Não foi possível obter sugestões. Verifique o console para mais detalhes.");
    }
}


export async function generateFormulaIcon(formulaName: string, language: Language = 'pt-BR'): Promise<string> {
    try {
        const model = 'gemini-2.5-flash-image';
        
        const prompt = translations[language].prompts.icon.replace('{formulaName}', formulaName);

        const response = await ai.models.generateContent({
            model: model,
            contents: {
                parts: [{ text: prompt }],
            },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });

        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                const base64ImageBytes: string = part.inlineData.data;
                return `data:image/png;base64,${base64ImageBytes}`;
            }
        }

        throw new Error("No image data found in the response.");

    } catch (error) {
        console.error(`Error generating icon for "${formulaName}":`, error);
        throw new Error(`Não foi possível gerar o ícone para "${formulaName}".`);
    }
}

export async function readPrescription(base64Image: string, mimeType: string, language: Language = 'pt-BR'): Promise<string> {
    try {
        const model = 'gemini-2.5-flash';
        const prompt = translations[language].prompts.prescriptionReader;

        const imagePart = {
            inlineData: {
                mimeType: mimeType,
                data: base64Image,
            },
        };

        const response = await ai.models.generateContent({
            model: model,
            contents: { parts: [imagePart, { text: prompt }] },
        });

        return response.text;

    } catch (error) {
        console.error("Error reading prescription with Gemini API:", error);
        const errorMsg = language === 'pt-BR' 
            ? "Não foi possível ler a receita. Verifique o console para mais detalhes."
            : "Could not read the prescription. Check the console for more details.";
        throw new Error(errorMsg);
    }
}