def _similarity(a: str, b: str) -> float:
    a_words = set(a.lower().split())
    b_words = set(b.lower().split())
    if not a_words or not b_words:
        return 0.0
    return len(a_words & b_words) / len(a_words | b_words)


def deduplicate_ideas(ideas: list[dict], threshold: float = 0.6) -> list[dict]:
    unique: list[dict] = []
    for idea in ideas:
        title = idea.get("title", "")
        is_dup = any(_similarity(title, u.get("title", "")) >= threshold for u in unique)
        if not is_dup:
            unique.append(idea)
    return unique
