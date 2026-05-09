import os
import json
import openai


def grade_post(title: str, body: str, upvotes: int, source: str) -> dict:
    client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

    prompt = f"""You are an expert startup idea evaluator. Analyze the following post and return a JSON object.

Source: {source}
Upvotes: {upvotes}
Title: {title}
Body: {body[:1500]}

Return ONLY valid JSON with this exact shape:
{{
  "title": "concise idea title (max 80 chars)",
  "summary": "one sentence describing the opportunity",
  "evidence": "the strongest quote or signal from the post proving demand",
  "is_valid_idea": true or false,
  "grade": "A", "B", "C", or "D",
  "score_demand": 0-100,
  "score_mobile_fit": 0-100,
  "score_monetization": 0-100,
  "score_buildability": 0-100,
  "score_competition": 0-100
}}

Grading:
- A: strong demand signal, clear monetization, high buildability, low competition
- B: good idea, some gaps in one area
- C: weak signal or crowded market
- D: not a viable startup idea

Set is_valid_idea=false for rants, questions, or posts with no buildable product implied."""

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.2,
        response_format={"type": "json_object"},
    )

    return json.loads(response.choices[0].message.content)
