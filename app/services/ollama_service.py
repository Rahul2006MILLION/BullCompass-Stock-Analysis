from ollama import Client
from app.config import settings


class OllamaService:
    def __init__(self):
        self.client = Client(host=settings.OLLAMA_HOST)
        self.model = settings.MODEL_NAME

    def chat(self, prompt: str) -> str:
        """
        Send a prompt to the configured Ollama model
        and return the generated response.
        """
        try:
            response = self.client.chat(
                model=self.model,
                messages=[
                    {
                        "role": "user",
                        "content": prompt,
                    }
                ],
            )

            return response["message"]["content"].strip()

        except Exception as e:
            raise RuntimeError(f"Ollama request failed: {e}")
    