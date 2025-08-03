import { Request, Response } from 'express';
import OpenAI from 'openai';

const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
}) : null;

export const handleChat = async (req: Request, res: Response) => {
  try {
    const { message, language = 'ar' } = req.body;

    if (!message) {
      return res.status(400).json({ 
        error: language === 'ar' ? 'الرسالة مطلوبة' : 'Message is required' 
      });
    }

    if (!openai) {
      console.error('OpenAI API key not found');
      return res.status(500).json({
        error: 'OpenAI API key not configured',
        response: language === 'ar' 
          ? 'عذراً، الخدمة غير متوفرة حالياً. يرجى المحاولة لاح��اً.'
          : 'Sorry, the service is not available right now. Please try again later.'
      });
    }

    const systemPrompt = language === 'ar' ? `
أنت مساعد ذكي متخصص في الأخبار الاقتصادية والمالية للموقع الإخباري "ليرات". يمكنك مساعدة المستخدمين في:

1. تحليل الأحداث الاقتصادية والمالية
2. شرح المؤشرات الاقتصادية
3. تقديم نظرة عامة على الأسواق المالية
4. توضيح تأثير الأخبار على الأسواق
5. الإجابة على الأسئلة المتعلقة بالاقتصاد والمال

يجب أن تكون إجاباتك:
- باللغة العربية بوضوح ودقة
- مفيدة وتعليمية
- محدثة ومبنية على المعرفة الاقتصادية
- مهنية ومناسبة لجمهور متنوع

تذكر: هذا للأغراض التعليمية والإعلامية فقط، وليس نصيحة استثمارية.
` : `
You are an intelligent assistant specialized in economic and financial news for the "Liirat" news website. You can help users with:

1. Analyzing economic and financial events
2. Explaining economic indicators
3. Providing market overviews
4. Clarifying the impact of news on markets
5. Answering questions related to economics and finance

Your responses should be:
- In English, clear and accurate
- Helpful and educational
- Up-to-date and based on economic knowledge
- Professional and suitable for a diverse audience

Remember: This is for educational and informational purposes only, not investment advice.
`;

    console.log('Sending request to OpenAI with message:', message);

    const completion = await openai!.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message }
      ],
      max_tokens: 1000,
      temperature: 0.7,
    });

    const response = completion.choices[0]?.message?.content || 
      (language === 'ar' ? 'عذراً، لم أستطع إنشاء رد.' : 'Sorry, I could not generate a response.');

    console.log('OpenAI response received:', response.substring(0, 100) + '...');

    res.json({
      response,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Chat Error:', error);
    
    let errorMessage = language === 'ar' 
      ? 'عذراً، أواجه صعوبات تقنية. يرجى المحاولة مرة أخرى.' 
      : 'Sorry, I\'m experiencing technical difficulties. Please try again.';
    
    if (error instanceof Error) {
      if (error.message.includes('401')) {
        errorMessage = language === 'ar' 
          ? 'خطأ في المصادقة مع خدمة الذكاء الاصطناعي.'
          : 'Authentication error with AI service.';
      } else if (error.message.includes('429')) {
        errorMessage = language === 'ar' 
          ? 'تم تجاوز الحد المسموح. يرجى الانتظار والمحاولة مرة أخرى.'
          : 'Rate limit exceeded. Please wait and try again.';
      } else if (error.message.includes('500')) {
        errorMessage = language === 'ar' 
          ? 'الخدمة غير متوفرة مؤقتاً. يرجى المحاولة لاحقاً.'
          : 'Service is temporarily unavailable. Please try again later.';
      }
    }
    
    res.status(500).json({
      error: 'Failed to process chat request',
      response: errorMessage
    });
  }
};
