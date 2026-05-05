import httpx

class Sarvam:
    def __init__(self, api_key: str, base_url: str = "https://api.sarvam.ai/v1"):
        self.api_key = api_key
        self.base_url = base_url
        self.headers = {"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"}

    async def chat(self, messages, model="sarvam-m", temperature=0.3, max_tokens=2000):
        url = f"{self.base_url}/chat/completions"
        payload = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens
        }
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                print(f"Calling Sarvam API: {url}")
                print(f"Payload: {payload}")
                
                response = await client.post(url, headers=self.headers, json=payload)
                
                print(f"Sarvam response status: {response.status_code}")
                print(f"Sarvam response headers: {dict(response.headers)}")
                
                if response.status_code != 200:
                    error_text = await response.atext() if hasattr(response, 'atext') else response.text
                    print(f"Sarvam API error: {response.status_code} - {error_text}")
                    raise Exception(f"Sarvam API returned {response.status_code}: {error_text}")
                
                result = response.json()
                print(f"Sarvam response: {result}")
                return result
                
        except httpx.TimeoutException:
            raise Exception("Sarvam API request timed out")
        except httpx.RequestError as e:
            raise Exception(f"Sarvam API request failed: {str(e)}")
        except Exception as e:
            raise Exception(f"Sarvam API error: {str(e)}")
