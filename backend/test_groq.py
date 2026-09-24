from dotenv import load_dotenv
load_dotenv()
import os
from openai import OpenAI

api_key = os.environ.get('GROQ_API_KEY')
model = os.environ.get('GROQ_MODEL')
print('Using model:', model)
print('API key present:', bool(api_key))
client = OpenAI(api_key=api_key, base_url='https://api.groq.com/openai/v1')
try:
    resp = client.chat.completions.create(model=model, messages=[{"role":"user","content":"hello"}], temperature=0.1)
    print('Success:', resp.choices[0].message.content)
except Exception as e:
    print('Error from provider:', e)
    raise