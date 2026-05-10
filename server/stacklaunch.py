import os
import json
from typing import Optional

import anthropic
import google.generativeai as genai
import requests
from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel

from .shared import verify_firebase_token

router = APIRouter(prefix="/api/stacklaunch")


def fetch_app_context(app_url: str, app_description: str) -> str:
    """Try to fetch llms.txt from the app URL. Fall back to provided description."""
    if not app_url:
        return app_description

    url = app_url if app_url.startswith("http") else f"https://{app_url}"

    for path in ["/llms.txt", "/llms-full.txt"]:
        try:
            resp = requests.get(f"{url}{path}", timeout=6, headers={"User-Agent": "StackLaunch/1.0"})
            if resp.status_code == 200 and len(resp.text.strip()) > 100:
                print(f"Fetched {path} from {url} ({len(resp.text)} chars)")
                return resp.text[:12000]
        except Exception:
            continue

    return app_description


def fetch_app_html(app_url: str) -> dict:
    """Fetch live page HTML and check for key SEO elements."""
    if not app_url:
        return {}

    url = app_url if app_url.startswith("http") else f"https://{app_url}"
    result = {
        "homepage_html": "",
        "has_json_ld": False,
        "has_meta_description": False,
        "has_sitemap": False,
        "has_robots_txt": False,
        "meta_description": "",
        "title": "",
    }

    try:
        resp = requests.get(url, timeout=8, headers={"User-Agent": "StackLaunch/1.0"})
        if resp.status_code == 200:
            html = resp.text[:20000]
            result["homepage_html"] = html[:5000]
            result["has_json_ld"] = 'application/ld+json' in html
            result["has_meta_description"] = 'name="description"' in html or "name='description'" in html
            import re
            meta_match = re.search(r'<meta[^>]+name=["\']description["\'][^>]+content=["\']([^"\']+)["\']', html, re.IGNORECASE)
            if not meta_match:
                meta_match = re.search(r'<meta[^>]+content=["\']([^"\']+)["\'][^>]+name=["\']description["\']', html, re.IGNORECASE)
            if meta_match:
                result["meta_description"] = meta_match.group(1)
            title_match = re.search(r'<title[^>]*>([^<]+)</title>', html, re.IGNORECASE)
            if title_match:
                result["title"] = title_match.group(1).strip()
    except Exception as e:
        print(f"fetch_app_html error for {url}: {e}")

    try:
        sitemap_resp = requests.get(f"{url}/sitemap.xml", timeout=4, headers={"User-Agent": "StackLaunch/1.0"})
        result["has_sitemap"] = sitemap_resp.status_code == 200
    except Exception:
        pass

    try:
        robots_resp = requests.get(f"{url}/robots.txt", timeout=4, headers={"User-Agent": "StackLaunch/1.0"})
        result["has_robots_txt"] = robots_resp.status_code == 200
    except Exception:
        pass

    return result


# ===== Models =====

class GenerateRequest(BaseModel):
    appName: str
    appUrl: str
    appDescription: str
    task: str
    channel: Optional[str] = None

class ResearchRequest(BaseModel):
    appName: str
    appUrl: str
    appDescription: str
    targetAudience: Optional[str] = None

class MarketAnalysisRequest(BaseModel):
    appName: str
    appUrl: str
    appDescription: str
    targetAudience: Optional[str] = None


# ===== Content Generation (Claude) =====

GENERATE_PROMPTS = {
    "meta_description": """Write a compelling meta description for this app. It must be under 155 characters, factual, and clearly state what the app does and who it's for. No marketing fluff.

App: {appName}
URL: {appUrl}
Description: {appDescription}

Respond with only the meta description text, nothing else.""",

    "answer_first": """Write an "answer-first" description for this app. Follow these rules:
- Exactly 2 sentences
- First sentence: what the app is and what it does (factual, no fluff)
- Second sentence: who it's for and the key benefit
- Write as if an AI engine will cite this as the definitive answer to "what is {appName}?"

App: {appName}
URL: {appUrl}
Description: {appDescription}

Respond with only the 2-sentence description, nothing else.""",

    "faq": """Generate 5 FAQ items for this app in Q&A format. Questions should be phrased exactly as a user would type them into a search engine or AI. Answers should be 1-3 sentences, factual and direct.

App: {appName}
URL: {appUrl}
Description: {appDescription}

Format as:
Q: [question]
A: [answer]

Repeat for all 5 items.""",

    "json_ld": """Generate complete JSON-LD structured data (SoftwareApplication schema) for this app. Include: name, description, applicationCategory, operatingSystem (Web), offers (price: 0, priceCurrency: USD), url. Keep the description under 160 characters.

App: {appName}
URL: {appUrl}
Description: {appDescription}

Respond with only the JSON-LD script tag, nothing else.""",

    "social_post": """Write a promotional social media post for this app for {channel}. Make it natural and engaging — not like an ad. Lead with the problem it solves, not the app name. Include a call to action.

App: {appName}
URL: {appUrl}
Description: {appDescription}
Platform: {channel}

Respond with only the post text, ready to copy-paste.""",
}

@router.post("/generate")
async def stacklaunch_generate(request: GenerateRequest, authorization: Optional[str] = Header(None)):
    user = verify_firebase_token(authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Unauthorized")

    if request.task not in GENERATE_PROMPTS:
        raise HTTPException(status_code=400, detail=f"Unknown task: {request.task}")

    anthropic_key = os.environ.get("ANTHROPIC_API_KEY")
    if not anthropic_key:
        raise HTTPException(status_code=503, detail="AI generation not configured")

    try:
        client = anthropic.Anthropic(api_key=anthropic_key)
        prompt = GENERATE_PROMPTS[request.task].format(
            appName=request.appName,
            appUrl=request.appUrl,
            appDescription=fetch_app_context(request.appUrl, request.appDescription),
            channel=request.channel or "",
        )
        message = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=1024,
            messages=[{"role": "user", "content": prompt}],
        )
        return {"result": message.content[0].text.strip()}

    except Exception as e:
        print(f"StackLaunch generate error: {e}")
        raise HTTPException(status_code=500, detail="Generation failed")


# ===== SEO/AIEO/GEO Research (Gemini) =====

SEO_RESEARCH_PROMPT = """You are an expert in SEO and AIEO/GEO (AI Engine Optimization / Generative Engine Optimization) for indie SaaS apps in 2026.

Analyze this app and provide specific, prioritized promotion and SEO/AIEO/GEO recommendations.

App Name: {appName}
App URL: {appUrl}
Target Audience: {targetAudience}

--- llms.txt / App Context ---
{appContext}

--- Live Site Data ---
Page Title: {pageTitle}
Meta Description found on site: {metaDescription}
JSON-LD Structured Data present: {hasJsonLd}
Meta description tag present: {hasMetaDesc}
Sitemap.xml present: {hasSitemap}
Robots.txt present: {hasRobotsTxt}
Homepage HTML snippet:
{homepageHtml}

--- Consistency & Quality Check Instructions ---
Cross-check the llms.txt content against the live site data above and flag any issues:
- Inconsistencies between what llms.txt claims and what the live site shows
- Missing SEO elements that llms.txt mentions but are not present on site
- Typos, vague language, or weak answer-first framing in llms.txt
- Features or benefits mentioned in llms.txt that are not reflected in the meta description or title
- Any misleading or inaccurate claims

Return a JSON object with these fields:
{{
  "summary": "2-3 sentence strategic overview for this specific app",
  "topPriorities": ["list of 3-5 most important actions for THIS app specifically"],
  "consistencyIssues": [
    {{
      "issue": "clear description of the inconsistency or problem",
      "severity": "low" | "medium" | "high",
      "fix": "specific actionable fix"
    }}
  ],
  "channelRatings": {{
    "reddit": 1-5,
    "x": 1-5,
    "linkedin": 1-5,
    "instagram": 1-5,
    "tiktok": 1-5,
    "youtube": 1-5,
    "producthunt": 1-5,
    "hackernews": 1-5,
    "indiehackers": 1-5,
    "alternativeto": 1-5,
    "devto": 1-5
  }},
  "seoImportance": {{
    "json_ld_schema": 1-5,
    "answer_first": 1-5,
    "faq_page": 1-5,
    "video_transcript": 1-5,
    "reddit_mentions": 1-5,
    "producthunt_listing": 1-5,
    "alternativeto_listing": 1-5,
    "blog_article": 1-5,
    "reviews": 1-5,
    "perplexity_index": 1-5
  }},
  "insight": "One specific, actionable insight unique to this app that most developers miss"
}}

Respond with only valid JSON, no markdown."""


@router.post("/research")
async def stacklaunch_research(request: ResearchRequest, authorization: Optional[str] = Header(None)):
    user = verify_firebase_token(authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Unauthorized")

    gemini_key = os.environ.get("GOOGLEAI_API_KEY")
    if not gemini_key:
        raise HTTPException(status_code=503, detail="Research AI not configured")

    try:
        genai.configure(api_key=gemini_key)
        model = genai.GenerativeModel("gemini-3.1-pro-preview")

        app_context = fetch_app_context(request.appUrl, request.appDescription)
        site_data = fetch_app_html(request.appUrl)

        prompt = SEO_RESEARCH_PROMPT.format(
            appName=request.appName,
            appUrl=request.appUrl,
            targetAudience=request.targetAudience or "small businesses and freelancers",
            appContext=app_context,
            pageTitle=site_data.get("title", "not found"),
            metaDescription=site_data.get("meta_description", "not found"),
            hasJsonLd=site_data.get("has_json_ld", False),
            hasMetaDesc=site_data.get("has_meta_description", False),
            hasSitemap=site_data.get("has_sitemap", False),
            hasRobotsTxt=site_data.get("has_robots_txt", False),
            homepageHtml=site_data.get("homepage_html", "")[:3000],
        )

        response = model.generate_content(prompt)
        return parse_json_response(response.text)

    except Exception as e:
        print(f"StackLaunch research error: {e}")
        raise HTTPException(status_code=500, detail="Research failed")


@router.post("/research/opinions")
async def stacklaunch_research_opinions(request: ResearchRequest, authorization: Optional[str] = Header(None)):
    user = verify_firebase_token(authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Unauthorized")

    openrouter_key = os.environ.get("OPENROUTER_API_KEY")
    if not openrouter_key:
        raise HTTPException(status_code=503, detail="OpenRouter not configured")

    app_context = fetch_app_context(request.appUrl, request.appDescription)
    site_data = fetch_app_html(request.appUrl)

    prompt = SEO_RESEARCH_PROMPT.format(
        appName=request.appName,
        appUrl=request.appUrl,
        targetAudience=request.targetAudience or "small businesses and freelancers",
        appContext=app_context,
        pageTitle=site_data.get("title", "not found"),
        metaDescription=site_data.get("meta_description", "not found"),
        hasJsonLd=site_data.get("has_json_ld", False),
        hasMetaDesc=site_data.get("has_meta_description", False),
        hasSitemap=site_data.get("has_sitemap", False),
        hasRobotsTxt=site_data.get("has_robots_txt", False),
        homepageHtml=site_data.get("homepage_html", "")[:3000],
    )

    results = {}
    for name, model_id in OPENROUTER_MODELS.items():
        try:
            resp = requests.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {openrouter_key}",
                    "Content-Type": "application/json",
                    "HTTP-Referer": "https://stacklaunch.web.app",
                    "X-Title": "StackLaunch",
                },
                json={"model": model_id, "messages": [{"role": "user", "content": prompt}]},
                timeout=60,
            )
            resp.raise_for_status()
            content = resp.json()["choices"][0]["message"]["content"]
            results[name] = parse_json_response(content)
        except Exception as e:
            print(f"OpenRouter research {name} error: {e}")
            results[name] = {"error": str(e)}

    return results


MARKET_ANALYSIS_PROMPT = """You are a brutally honest market analyst for indie software products. Your job is to tell developers whether their app is worth promoting or if they're wasting their time.

Analyze the market viability of this app. Use your knowledge of app stores, SaaS directories, Reddit, Product Hunt, and search trends to give an honest assessment.

App Name: {appName}
App URL: {appUrl}
App Context (from llms.txt or description):
{appContext}
Target Audience: {targetAudience}

Return a JSON object with exactly these fields:
{{
  "demandScore": 1-5,
  "saturationScore": 1-5,
  "monetizationScore": 1-5,
  "nicheScore": 1-5,
  "overallScore": 1-5,
  "verdict": "go" | "differentiate" | "pivot",
  "verdictReason": "2-3 sentence plain-language explanation of the verdict",
  "competitors": [
    {{"name": "competitor name", "type": "indie" | "saas" | "enterprise" | "free-tool", "strength": 1-5, "weakness": "one key weakness you can exploit"}}
  ],
  "nicheOpportunities": ["specific underserved segment or angle this app could own"],
  "demandEvidence": ["specific evidence that real people want this — Reddit threads, search patterns, forum discussions"],
  "redFlags": ["honest concerns or risks — be direct"],
  "winningAngle": "The single most defensible position this app can own in its market",
  "globalOpportunities": [
    {{
      "language": "language name (e.g. Spanish, Korean, Portuguese, Arabic, French)",
      "market": "specific country or region (e.g. Mexico, South Korea, Brazil)",
      "demandScore": 1-5,
      "saturationScore": 1-5,
      "reasoning": "why this market is an opportunity — be specific about local competitors, regulations, or cultural factors",
      "monetizationAngle": "how you would actually make money here — compliance requirements, lack of local tools, willingness to pay"
    }}
  ]
}}

Scoring guide:
- demandScore: 1=nobody wants this, 5=massive proven demand
- saturationScore: 1=wide open, 5=extremely crowded (lower is better)
- monetizationScore: 1=people expect free forever, 5=clear willingness to pay
- nicheScore: 1=no clear niche to own, 5=strong defensible niche available
- overallScore: your honest overall viability rating

Verdict guide:
- "go": real demand, ownable niche, worth full promotion effort
- "differentiate": market exists but you need a specific angle to stand out
- "pivot": market is too saturated or demand is too low — consider repositioning

For globalOpportunities: identify 2-4 non-English language markets where demand exists but English-language tools dominate and local alternatives are weak. Consider compliance requirements (tax systems, invoice regulations, government mandates) that force users to pay. Be specific about why each market is underserved.

Be specific. Name real competitors. Reference real communities. Do not be encouraging for its own sake — honesty is more valuable.

Respond with only valid JSON, no markdown."""


def parse_json_response(text: str) -> dict:
    text = text.strip()
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
    return json.loads(text.strip())


# ===== Market Viability Analysis (Gemini) =====

@router.post("/market-analysis")
async def stacklaunch_market_analysis(request: MarketAnalysisRequest, authorization: Optional[str] = Header(None)):
    user = verify_firebase_token(authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Unauthorized")

    gemini_key = os.environ.get("GOOGLEAI_API_KEY")
    if not gemini_key:
        raise HTTPException(status_code=503, detail="Research AI not configured")

    try:
        genai.configure(api_key=gemini_key)
        model = genai.GenerativeModel("gemini-3.1-pro-preview")
        app_context = fetch_app_context(request.appUrl, request.appDescription)
        prompt = MARKET_ANALYSIS_PROMPT.format(
            appName=request.appName,
            appUrl=request.appUrl,
            appContext=app_context,
            targetAudience=request.targetAudience or "small businesses and freelancers",
        )
        response = model.generate_content(prompt)
        return parse_json_response(response.text)

    except Exception as e:
        print(f"StackLaunch market analysis error: {e}")
        raise HTTPException(status_code=500, detail="Market analysis failed")


# ===== Market Viability Analysis (OpenRouter — Grok, Claude, GPT-4o) =====

OPENROUTER_MODELS = {
    "grok": "x-ai/grok-3:online",
    "claude": "anthropic/claude-sonnet-4-6:online",
    "gpt4o": "openai/gpt-4o:online",
}

class MarketAnalysisSecondOpinionRequest(BaseModel):
    appName: str
    appUrl: str
    appDescription: str
    targetAudience: Optional[str] = None
    models: Optional[list[str]] = None


@router.post("/market-analysis/opinions")
async def stacklaunch_market_opinions(request: MarketAnalysisSecondOpinionRequest, authorization: Optional[str] = Header(None)):
    user = verify_firebase_token(authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Unauthorized")

    openrouter_key = os.environ.get("OPENROUTER_API_KEY")
    if not openrouter_key:
        raise HTTPException(status_code=503, detail="OpenRouter not configured")

    models_to_run = request.models or list(OPENROUTER_MODELS.keys())
    app_context = fetch_app_context(request.appUrl, request.appDescription)
    prompt = MARKET_ANALYSIS_PROMPT.format(
        appName=request.appName,
        appUrl=request.appUrl,
        appContext=app_context,
        targetAudience=request.targetAudience or "small businesses and freelancers",
    )

    results = {}
    for name in models_to_run:
        model_id = OPENROUTER_MODELS.get(name)
        if not model_id:
            continue
        try:
            resp = requests.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {openrouter_key}",
                    "Content-Type": "application/json",
                    "HTTP-Referer": "https://stacklaunch.web.app",
                    "X-Title": "StackLaunch",
                },
                json={
                    "model": model_id,
                    "messages": [{"role": "user", "content": prompt}],
                },
                timeout=60,
            )
            resp.raise_for_status()
            content = resp.json()["choices"][0]["message"]["content"]
            results[name] = parse_json_response(content)
        except Exception as e:
            print(f"OpenRouter {name} error: {e}")
            results[name] = {"error": str(e)}

    return results
