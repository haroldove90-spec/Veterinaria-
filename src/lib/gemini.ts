import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY || '';
export const ai = new GoogleGenAI({ apiKey });

export const analyzeClinicalCase = async (petInfo: any, symptoms: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analiza el siguiente caso clínico veterinario:
      Mascota: ${petInfo.name} (${petInfo.species}, ${petInfo.breed}, ${petInfo.age} años)
      Síntomas: ${symptoms}
      
      Proporciona un análisis en formato JSON con los siguientes campos:
      - summary: Resumen breve.
      - risk_level: Nivel de riesgo (Bajo, Medio, Alto).
      - ai_observations: Lista de observaciones clave.
      - recommended_tests: Pruebas recomendadas.
      - differential_diagnoses: Diagnósticos diferenciales.
      - urgency: Nivel de urgencia.`,
      config: {
        responseMimeType: "application/json",
      }
    });

    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Error analyzing clinical case:", error);
    return null;
  }
};

export const analyzeDiagnosticImage = async (base64Image: string, mimeType: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          inlineData: {
            data: base64Image,
            mimeType: mimeType,
          },
        },
        {
          text: `Actúa como un Especialista en Diagnóstico Veterinario por Imagen y Laboratorio. 
          Analiza la imagen proporcionada (radiografía, ultrasonido o resultados de laboratorio).
          
          Tu tarea es:
          1. Identificar el tipo de estudio.
          2. Detectar anomalías (valores fuera de rango H/L en labs, o hallazgos visuales en imágenes).
          3. Formatear la salida en JSON con:
             - tipo_estudio: string
             - hallazgos_clave: array de strings
             - sugerencia_diagnostica: string
             - gravedad: (Baja, Media, Alta, Crítica)
          
          IMPORTANTE: Si la imagen no es médica o no está relacionada con veterinaria, devuelve un JSON con un campo "error". No inventes datos que no sean visibles.`,
        },
      ],
      config: {
        responseMimeType: "application/json",
      },
    });

    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Error analyzing diagnostic image:", error);
    return { error: "Error al procesar la imagen de diagnóstico." };
  }
};

export const generateCXMessages = async (consultationData: any) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Actúa como un experto en Customer Experience (CX) para clínicas veterinarias.
      Basado en los siguientes datos de la consulta, genera tres tipos de mensajes para el dueño de la mascota.
      
      Datos de la consulta:
      ${JSON.stringify(consultationData, null, 2)}
      
      Reglas:
      1. Usa el nombre de la mascota y del dueño.
      2. El tono debe variar: si la gravedad es 'Alta', el tono debe ser urgente y compasivo. Si es 'Baja', debe ser ligero y preventivo.
      3. Devuelve un objeto JSON con las llaves:
         - whatsapp_inmediato: Resumen amigable + instrucciones clave + enlace a receta digital.
         - seguimiento_48h: Mensaje corto preguntando por la evolución.
         - proxima_cita: Mensaje profesional para agendar la siguiente visita.`,
      config: {
        responseMimeType: "application/json",
      },
    });

    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Error generating CX messages:", error);
    return null;
  }
};

export const generatePreventiveReport = async (petData: { species: string, breed: string, age: number, weight: number }) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Actúa como un consultor de salud preventiva veterinaria. 
      Genera un Informe de Riesgos y Cuidados Preventivos para la siguiente mascota:
      Especie: ${petData.species}
      Raza: ${petData.breed}
      Edad: ${petData.age} años
      Peso: ${petData.weight} kg
      
      Tu informe debe ser un objeto JSON puro con las siguientes llaves:
      - riesgos_predispuestos: Lista de enfermedades comunes para esta raza y edad.
      - plan_nutricion_sugerido: Objeto con (tipo_dieta, proteina_sugerida, suplementos_recomendados).
      - calendario_screening: Lista de estudios recomendados cada 6-12 meses.
      - consejos_estilo_vida: Recomendaciones de ejercicio y manejo ambiental.`,
      config: {
        responseMimeType: "application/json",
      },
    });

    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Error generating preventive report:", error);
    return null;
  }
};

export const classifyTriage = async (description: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Actúa como un Asistente de Triaje Veterinario de Emergencia. 
      Analiza la descripción del dueño sobre el estado de su mascota y clasifica el caso según el sistema de colores de triaje:
      
      - ROJO (Emergencia Inmediata): Riesgo de muerte. (Ej: No respira, sangrado masivo, convulsiones activas, ingesta de veneno, hinchazón abdominal súbita).
      - NARANJA (Urgencia): Debe verse hoy mismo. (Ej: Heridas profundas, vómitos repetitivos, incapacidad para orinar, dolor intenso).
      - AMARILLO (Prioritario): Cita en las próximas 24-48 horas. (Ej: Cojera leve, pérdida de apetito, diarrea sin sangre).
      - VERDE (No urgente): Manejo en consulta externa. (Ej: Comezón, revisión de vacunas, limpieza de oídos).
      
      Descripción del dueño: "${description}"
      
      Responde en un objeto JSON puro con:
      - nivel_urgencia: (Rojo, Naranja, Amarillo, Verde)
      - accion_inmediata: (Qué debe hacer el dueño ahora mismo)
      - justificacion: (Por qué es ese nivel de urgencia)
      - preguntas_clave: (2 preguntas extra que el veterinario debería hacer al llegar)`,
      config: {
        responseMimeType: "application/json",
      },
    });

    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Error classifying triage:", error);
    return null;
  }
};

export const generateSocialContent = async (caseData: { patient: string, problem: string, learnings: string }) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Actúa como un experto en Marketing Digital para veterinarias. 
      Basado en el siguiente 'Caso de Éxito', genera un paquete de contenido para redes sociales:
      
      Datos del caso:
      Paciente: ${caseData.patient}
      Problema: ${caseData.problem}
      Qué aprendemos: ${caseData.learnings}
      
      Tu respuesta debe ser un objeto JSON puro con las siguientes llaves:
      - instagram_caption: Caption con gancho, 3 puntos clave y CTA.
      - tiktok_script: Guion de 60 seg (Intro, Problema, Solución, Cierre).
      - story_idea: Idea para historia de interacción (encuesta o pregunta).
      - hashtags_sugeridos: Lista de hashtags relevantes.`,
      config: {
        responseMimeType: "application/json",
      },
    });

    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Error generating social content:", error);
    return null;
  }
};

export const analyzeFinancials = async (financialData: any) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Actúa como un Consultor de Negocios experto en clínicas veterinarias y Revenue Management.
      Analiza el siguiente conjunto de datos financieros mensuales y genera un informe de rentabilidad:
      
      Datos:
      ${JSON.stringify(financialData, null, 2)}
      
      Tu informe debe ser un objeto JSON puro con las siguientes llaves:
      - balance_general: Objeto con (ingresos_totales, egresos_totales, utilidad_neta).
      - indicadores_clave: Objeto con (margen_utilidad_neta_porcentaje, servicio_estrella, ticket_promedio_estimado).
      - analisis_de_fuga: Evaluación de la relación insumos/ventas y detección de gastos excesivos.
      - plan_de_accion: Estrategia concreta para el próximo mes para subir ventas o reducir costos.`,
      config: {
        responseMimeType: "application/json",
      },
    });

    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Error analyzing financials:", error);
    return null;
  }
};

export const auditClinicalRecord = async (recordText: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Actúa como un Auditor de Calidad y experto en normatividad de salud veterinaria (LFPDPPP en México). 
      Revisa el siguiente borrador de expediente clínico y detecta si falta información crítica o si hay riesgos de privacidad.
      
      Borrador a revisar: "${recordText}"
      
      Campos a revisar:
      - Identificación completa: (Nombre del dueño, datos de contacto, descripción detallada del paciente).
      - Historia Clínica: (Antecedentes, sintomatología, diagnóstico presuntivo).
      - Tratamiento: (Dosis exactas, vía de administración y firma/cédula del médico).
      - Privacidad: (Asegurar que no se expongan datos sensibles innecesarios en documentos públicos).
      
      Responde con un objeto JSON puro que contenga:
      - estado_cumplimiento: (Aprobado, Pendiente, Crítico)
      - faltantes_detectados: Lista de campos obligatorios vacíos o incompletos.
      - sugerencia_legal: Consejo para proteger la responsabilidad civil del veterinario.
      - nota_de_privacidad: Verificación de que los datos del dueño están protegidos.`,
      config: {
        responseMimeType: "application/json",
      },
    });

    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Error auditing clinical record:", error);
    return null;
  }
};
