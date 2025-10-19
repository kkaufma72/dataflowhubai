// File: src/lib/langchain.ts
import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";

// Debug: Check if API key is loaded
const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
console.log('=== LangChain Debug ===');
console.log('API Key exists:', !!apiKey);
console.log('API Key starts with sk-:', apiKey?.startsWith('sk-'));
console.log('All env vars:', import.meta.env);

if (!apiKey) {
  console.error('❌ VITE_OPENAI_API_KEY is not set! Check your .env file');
}

// Initialize the model
const model = new ChatOpenAI({ 
  temperature: 0.7,
  openAIApiKey: apiKey,
  modelName: "gpt-3.5-turbo"
});

// Create the prompt template
const promptTemplate = ChatPromptTemplate.fromMessages([
  ["system", "You are a helpful chatbot that understands datasets and can answer questions about them."],
  ["user", "Dataset Information:\n{datasetInfo}\n\nQuestion: {question}"]
]);

// Create the chain using the modern LCEL (LangChain Expression Language) approach
const outputParser = new StringOutputParser();
export const conversationChain = promptTemplate.pipe(model).pipe(outputParser);

// Helper function to query the chatbot
export const queryChatbot = async (question: string, datasetInfo: any) => {
  if (!apiKey) {
    throw new Error('OpenAI API key is not configured. Please add VITE_OPENAI_API_KEY to your .env file');
  }
  
  try {
    const response = await conversationChain.invoke({ 
      datasetInfo: JSON.stringify(datasetInfo, null, 2), 
      question 
    });
    return response;
  } catch (error) {
    console.error('Chatbot query error:', error);
    throw error;
  }
};

// Alternative: Create a simple function without chains if you prefer
export const simpleQuery = async (question: string, datasetInfo: any) => {
  if (!apiKey) {
    throw new Error('OpenAI API key is not configured. Please add VITE_OPENAI_API_KEY to your .env file');
  }
  
  try {
    const prompt = `You are a helpful assistant that understands datasets.

Dataset Information:
${JSON.stringify(datasetInfo, null, 2)}

Question: ${question}

Answer:`;

    const response = await model.invoke(prompt);
    return response.content;
  } catch (error) {
    console.error('Simple query error:', error);
    throw error;
  }
};