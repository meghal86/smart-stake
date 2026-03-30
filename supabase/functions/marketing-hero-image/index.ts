import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const DEFAULT_PROMPT =
  'Create a cinematic luxury private wealth command center background for a premium crypto operating system. Dark obsidian interior, blue-hour skyline glow, soft brass reflections, editorial lighting, refined architecture, abstract desk atmosphere, no people, no text, no logos, no UI, ultra-premium, minimal, elegant, wide composition.';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const geminiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiKey) {
      return new Response(
        JSON.stringify({
          imageDataUrl: null,
          provider: 'gemini',
          reason: 'missing_gemini_key',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    const body = await req.json().catch(() => ({}));
    const prompt = typeof body?.prompt === 'string' && body.prompt.trim() ? body.prompt : DEFAULT_PROMPT;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent?key=${geminiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.8,
          },
        }),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      return new Response(
        JSON.stringify({
          imageDataUrl: null,
          provider: 'gemini',
          reason: `generation_failed:${response.status}`,
          error: errorText,
        }),
        {
          status: 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    const data = await response.json();
    const parts = data?.candidates?.[0]?.content?.parts ?? [];
    const imagePart =
      parts.find((part: Record<string, unknown>) => part?.inlineData) ??
      parts.find((part: Record<string, unknown>) => part?.inline_data);

    const inlineData = imagePart?.inlineData ?? imagePart?.inline_data;
    const base64 = inlineData?.data;
    const mimeType = inlineData?.mimeType ?? inlineData?.mime_type ?? 'image/png';

    if (!base64) {
      return new Response(
        JSON.stringify({
          imageDataUrl: null,
          provider: 'gemini',
          reason: 'no_image_in_response',
          raw: data,
        }),
        {
          status: 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    return new Response(
      JSON.stringify({
        imageDataUrl: `data:${mimeType};base64,${base64}`,
        provider: 'gemini',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        imageDataUrl: null,
        reason: 'unexpected_error',
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});
