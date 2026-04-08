import json
from typing import Optional

import httpx
from bs4 import BeautifulSoup

from models.recipe import ParsedRecipe
from services.gemini_service import parse_recipe


async def fetch_recipe_from_url(url: str) -> ParsedRecipe:
    """
    Fetch a recipe from a URL and extract structured data.
    
    Attempts to extract recipe data in this order:
    1. JSON-LD schema (most reliable)
    2. Microdata schema
    3. Plain text extraction + Gemini parsing (fallback)
    """
    async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
        response = await client.get(
            url,
            headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            },
        )
        response.raise_for_status()
        html_content = response.text

    soup = BeautifulSoup(html_content, "lxml")

    # Try JSON-LD first (most common for recipe sites)
    recipe_data = extract_json_ld_recipe(soup)
    if recipe_data:
        return recipe_data

    # Try Microdata
    recipe_data = extract_microdata_recipe(soup)
    if recipe_data:
        return recipe_data

    # Fallback: extract plain text and use Gemini
    recipe_text = extract_plain_text_recipe(soup)
    if recipe_text:
        parsed = parse_recipe(recipe_text)
        return parsed.recipe

    raise ValueError("Could not extract recipe data from the provided URL")


def extract_json_ld_recipe(soup: BeautifulSoup) -> Optional[ParsedRecipe]:
    """Extract recipe from JSON-LD schema markup."""
    scripts = soup.find_all("script", type="application/ld+json")
    
    for script in scripts:
        try:
            data = json.loads(script.string)
            
            # Handle @graph structure
            if isinstance(data, dict) and "@graph" in data:
                for item in data["@graph"]:
                    if item.get("@type") == "Recipe":
                        return parse_json_ld_recipe(item)
            
            # Handle direct Recipe type
            if isinstance(data, dict) and data.get("@type") == "Recipe":
                return parse_json_ld_recipe(data)
            
            # Handle array of items
            if isinstance(data, list):
                for item in data:
                    if isinstance(item, dict) and item.get("@type") == "Recipe":
                        return parse_json_ld_recipe(item)
        except (json.JSONDecodeError, KeyError, TypeError):
            continue
    
    return None


def parse_json_ld_recipe(data: dict) -> ParsedRecipe:
    """Parse JSON-LD recipe data into ParsedRecipe model."""
    # Extract ingredients
    ingredients = []
    raw_ingredients = data.get("recipeIngredient", [])
    if isinstance(raw_ingredients, str):
        raw_ingredients = [raw_ingredients]
    
    for idx, ing in enumerate(raw_ingredients, 1):
        if isinstance(ing, str):
            # Simple parsing: try to extract quantity, unit, item
            parts = ing.strip().split(None, 2)
            if len(parts) >= 2:
                ingredients.append({
                    "quantity": parts[0],
                    "unit": parts[1] if len(parts) > 2 else None,
                    "item": parts[2] if len(parts) > 2 else parts[1],
                })
            else:
                ingredients.append({
                    "quantity": "1",
                    "unit": None,
                    "item": ing.strip(),
                })
    
    # Extract steps
    steps = []
    raw_instructions = data.get("recipeInstructions", [])
    
    if isinstance(raw_instructions, str):
        # Single string instruction
        steps.append({"order": 1, "instruction": raw_instructions.strip()})
    elif isinstance(raw_instructions, list):
        for idx, instruction in enumerate(raw_instructions, 1):
            if isinstance(instruction, str):
                steps.append({"order": idx, "instruction": instruction.strip()})
            elif isinstance(instruction, dict):
                text = instruction.get("text", "")
                if text:
                    steps.append({"order": idx, "instruction": text.strip()})
    
    # Extract servings
    servings = 4  # default
    yield_value = data.get("recipeYield")
    if yield_value:
        if isinstance(yield_value, (int, float)):
            servings = int(yield_value)
        elif isinstance(yield_value, str):
            # Try to extract number from string like "4 servings"
            import re
            match = re.search(r"\d+", yield_value)
            if match:
                servings = int(match.group())
    
    # Extract tags/keywords
    tags = []
    keywords = data.get("keywords", "")
    if isinstance(keywords, str):
        tags = [k.strip() for k in keywords.split(",") if k.strip()]
    elif isinstance(keywords, list):
        tags = [str(k).strip() for k in keywords if k]
    
    # Add recipe category as tag
    category = data.get("recipeCategory")
    if category and isinstance(category, str):
        tags.append(category.lower())
    
    return ParsedRecipe(
        title=data.get("name", "Imported Recipe"),
        description=data.get("description", ""),
        ingredients=ingredients,
        steps=steps,
        servings=servings,
        tags=tags[:5] if tags else ["imported"],
    )


def extract_microdata_recipe(soup: BeautifulSoup) -> Optional[ParsedRecipe]:
    """Extract recipe from Microdata schema markup."""
    recipe_div = soup.find(attrs={"itemtype": lambda x: x and "Recipe" in x})
    
    if not recipe_div:
        return None
    
    try:
        title = ""
        title_elem = recipe_div.find(attrs={"itemprop": "name"})
        if title_elem:
            title = title_elem.get_text(strip=True)
        
        description = ""
        desc_elem = recipe_div.find(attrs={"itemprop": "description"})
        if desc_elem:
            description = desc_elem.get_text(strip=True)
        
        ingredients = []
        for idx, ing_elem in enumerate(recipe_div.find_all(attrs={"itemprop": "recipeIngredient"}), 1):
            ing_text = ing_elem.get_text(strip=True)
            parts = ing_text.split(None, 2)
            if len(parts) >= 2:
                ingredients.append({
                    "quantity": parts[0],
                    "unit": parts[1] if len(parts) > 2 else None,
                    "item": parts[2] if len(parts) > 2 else parts[1],
                })
            else:
                ingredients.append({
                    "quantity": "1",
                    "unit": None,
                    "item": ing_text,
                })
        
        steps = []
        for idx, step_elem in enumerate(recipe_div.find_all(attrs={"itemprop": "recipeInstructions"}), 1):
            step_text = step_elem.get_text(strip=True)
            if step_text:
                steps.append({"order": idx, "instruction": step_text})
        
        servings = 4
        yield_elem = recipe_div.find(attrs={"itemprop": "recipeYield"})
        if yield_elem:
            import re
            match = re.search(r"\d+", yield_elem.get_text(strip=True))
            if match:
                servings = int(match.group())
        
        if title and ingredients and steps:
            return ParsedRecipe(
                title=title,
                description=description or None,
                ingredients=ingredients,
                steps=steps,
                servings=servings,
                tags=["imported"],
            )
    except (AttributeError, ValueError):
        pass
    
    return None


def extract_plain_text_recipe(soup: BeautifulSoup) -> Optional[str]:
    """Extract plain text recipe content as fallback."""
    # Remove script and style elements
    for script in soup(["script", "style", "nav", "header", "footer"]):
        script.decompose()
    
    # Look for common recipe containers
    recipe_containers = soup.find_all(
        ["article", "div"],
        class_=lambda x: x and any(
            keyword in x.lower()
            for keyword in ["recipe", "ingredients", "instructions", "directions"]
        ),
    )
    
    if recipe_containers:
        text_parts = []
        for container in recipe_containers[:3]:  # Limit to first 3 matches
            text = container.get_text(separator="\n", strip=True)
            if len(text) > 100:  # Only include substantial content
                text_parts.append(text)
        
        if text_parts:
            return "\n\n".join(text_parts)
    
    # Fallback: get main content
    main = soup.find("main") or soup.find("article") or soup.find("body")
    if main:
        text = main.get_text(separator="\n", strip=True)
        if len(text) > 200:
            return text[:5000]  # Limit to 5000 chars
    
    return None
