const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const allowedHosts = new Set(['canvas.tongji.edu.cn']);

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...corsHeaders,
    },
  });
}

function validateTargetUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') {
    throw new Error('URL不能为空');
  }

  let parsed;
  try {
    parsed = new URL(rawUrl.trim());
  } catch {
    throw new Error('无效的URL格式');
  }

  if (parsed.protocol !== 'https:') {
    throw new Error('只支持HTTPS链接');
  }

  if (!allowedHosts.has(parsed.hostname)) {
    throw new Error('只允许访问同济 Canvas 签到链接');
  }

  return parsed.toString();
}

export async function onRequest({ request }) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return jsonResponse({ success: false, error: '只允许POST请求' }, 405);
  }

  try {
    let input;
    try {
      input = await request.json();
    } catch {
      throw new Error('无效的JSON输入');
    }

    if (!input || typeof input !== 'object') {
      throw new Error('空的输入数据');
    }

    const targetUrl = validateTargetUrl(input.url);
    const cookies = typeof input.cookies === 'string' ? input.cookies.trim() : '';
    const clientHeaders = input.headers && typeof input.headers === 'object' ? input.headers : {};

    const outboundHeaders = new Headers({
      'User-Agent':
        clientHeaders['User-Agent'] ||
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      Accept:
        clientHeaders.Accept ||
        'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': clientHeaders['Accept-Language'] || 'zh-CN,zh;q=0.9,en;q=0.8',
      'Upgrade-Insecure-Requests': '1',
    });

    if (cookies) {
      outboundHeaders.set('Cookie', cookies);
    }

    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: outboundHeaders,
      redirect: 'follow',
    });

    const data = await response.text();

    if (response.status >= 400) {
      throw new Error(`HTTP错误: ${response.status}`);
    }

    return jsonResponse({
      success: true,
      data,
      http_code: response.status,
      url: targetUrl,
      cookies_used: Boolean(cookies),
    });
  } catch (error) {
    return jsonResponse(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Worker错误',
      },
      500,
    );
  }
}
